import type { ProjectRecord } from '@domain/entities/project-record';
import { ProjectTeam } from '@domain/entities/project-team';
import { DomainError } from '@domain/errors/domain-errors';
import type { ProjectRole } from '@domain/value-objects/project-role';
import { canAdminister } from '@domain/value-objects/role';
import { ProjectNotFoundError } from '@application/errors/application-errors';
import type {
  GetProjectTeamUseCase,
  Requester,
  ResolveProjectAccessUseCase,
  SaveProjectTeamUseCase,
} from '@application/ports/in/project.use-cases';
import type { ProjectApproverRepository } from '@application/ports/out/approval.repository';
import type { ProjectMemberRepository } from '@application/ports/out/project-member.repository';
import type { ProjectRepository } from '@application/ports/out/project.repository';
import type { UserRepository } from '@application/ports/out/user.repository';
import type { ProjectTeamDto, ProjectTeamInput } from '@shared/index';

/**
 * Accès aux projets : un projet n'est visible que de ses membres, avec leur rôle, et des
 * administrateurs (droits d'un chef de projet sur tous les projets). Un valideur désigné qui n'est
 * pas membre consulte le projet (il doit lire ce qu'il approuve).
 */
export class ProjectAccess implements ResolveProjectAccessUseCase {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly members: ProjectMemberRepository,
    private readonly approvers: ProjectApproverRepository,
  ) {}

  /** Rôle du compte sur le projet ; `null` : aucun accès. */
  async roleOn(requester: Requester, projectId: string): Promise<ProjectRole | null> {
    if (canAdminister(requester.role)) return 'MANAGER';
    const member = (await this.members.listByProject(projectId)).find((item) => item.userId === requester.id);
    if (member) return member.role;
    return (await this.approvers.listByProject(projectId)).includes(requester.id) ? 'READER' : null;
  }

  /** Projet inexistant ou invisible pour le compte : même réponse (on ne révèle pas son existence). */
  async execute(query: { projectId: string; requester: Requester }): Promise<ProjectRole> {
    const [project, role] = await Promise.all([
      this.projects.findById(query.projectId),
      this.roleOn(query.requester, query.projectId),
    ]);
    if (!project || !role) throw new ProjectNotFoundError(query.projectId);
    return role;
  }

  /** Projets visibles du compte, avec ses droits sur chacun. */
  async visibleProjects(requester: Requester): Promise<{ project: ProjectRecord; access: ProjectRole }[]> {
    const projects = await this.projects.list();
    if (canAdminister(requester.role)) return projects.map((project) => ({ project, access: 'MANAGER' }));
    const [memberships, approverOf] = await Promise.all([
      this.members.listByUser(requester.id),
      this.approvers.listProjectsOf(requester.id),
    ]);
    const roles = new Map<string, ProjectRole>(approverOf.map((projectId) => [projectId, 'READER']));
    for (const { projectId, role } of memberships) roles.set(projectId, role);
    return projects.flatMap((project) => {
      const access = roles.get(project.id);
      return access ? [{ project, access }] : [];
    });
  }
}

/** Équipe d'un projet ; les comptes proposés à l'ajout ne sont fournis qu'à qui la gère. */
export class GetProjectTeamService implements GetProjectTeamUseCase {
  constructor(
    private readonly members: ProjectMemberRepository,
    private readonly users: UserRepository,
  ) {}

  async execute(query: { projectId: string; manages: boolean }): Promise<ProjectTeamDto> {
    const [members, users] = await Promise.all([this.members.listByProject(query.projectId), this.users.list()]);
    const byId = new Map(users.map((user) => [user.id, user]));
    const memberIds = new Set(members.map((member) => member.userId));
    return {
      projectId: query.projectId,
      members: members
        .flatMap(({ userId, role }) => {
          const user = byId.get(userId);
          return user ? [{ userId, name: user.name, email: user.email, role, active: user.active }] : [];
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
      candidates: query.manages
        ? users
            .filter((user) => user.active && !memberIds.has(user.id))
            .map((user) => ({ userId: user.id, name: user.name, email: user.email }))
            .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
        : [],
    };
  }
}

/** Remplace l'équipe : comptes existants, un nouveau membre doit être actif. */
export class SaveProjectTeamService implements SaveProjectTeamUseCase {
  constructor(
    private readonly members: ProjectMemberRepository,
    private readonly users: UserRepository,
    private readonly team: GetProjectTeamService,
  ) {}

  async execute(command: { projectId: string; input: ProjectTeamInput }): Promise<ProjectTeamDto> {
    const team = ProjectTeam.create(command.projectId, command.input.members);
    const [current, users] = await Promise.all([this.members.listByProject(command.projectId), this.users.list()]);
    const byId = new Map(users.map((user) => [user.id, user]));
    const already = new Set(current.map((member) => member.userId));
    const unknown = team.members.filter((member) => !byId.has(member.userId));
    if (unknown.length > 0) {
      throw new DomainError(`Compte inconnu : ${unknown.map((member) => member.userId).join(', ')}.`);
    }
    const inactive = team.members.filter((member) => !already.has(member.userId) && !byId.get(member.userId)!.active);
    if (inactive.length > 0) {
      throw new DomainError(`Compte désactivé : ${inactive.map((member) => byId.get(member.userId)!.name).join(', ')}.`);
    }
    await this.members.replace(team);
    return this.team.execute({ projectId: command.projectId, manages: true });
  }
}
