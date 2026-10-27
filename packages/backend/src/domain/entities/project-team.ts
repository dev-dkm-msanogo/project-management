import { DomainError } from '@domain/errors/domain-errors';
import { isProjectRole, type ProjectRole } from '@domain/value-objects/project-role';

export interface ProjectMember {
  readonly userId: string;
  readonly role: ProjectRole;
}

/**
 * Équipe d'un projet : les comptes qui y ont accès et leur rôle. Un compte n'y figure qu'une fois et
 * l'équipe garde toujours un chef de projet pour la gérer.
 */
export class ProjectTeam {
  private constructor(
    public readonly projectId: string,
    public readonly members: readonly ProjectMember[],
  ) {}

  static create(projectId: string, members: readonly { userId: string; role: string }[]): ProjectTeam {
    const seen = new Set<string>();
    for (const member of members) {
      if (!isProjectRole(member.role)) throw new DomainError(`Rôle de projet inconnu : "${member.role}".`);
      if (seen.has(member.userId)) throw new DomainError("Un compte figure deux fois dans l'équipe.");
      seen.add(member.userId);
    }
    if (!members.some((member) => member.role === 'MANAGER')) {
      throw new DomainError("L'équipe doit compter au moins un chef de projet.");
    }
    return new ProjectTeam(
      projectId,
      members.map(({ userId, role }) => ({ userId, role: role as ProjectRole })),
    );
  }
}
