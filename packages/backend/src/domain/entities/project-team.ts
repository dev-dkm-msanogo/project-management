import { DomainError } from '@domain/errors/domain-errors';
import { isProjectRole, type ProjectRole } from '@domain/value-objects/project-role';

export interface ProjectMember {
  readonly userId: string;
  readonly role: ProjectRole;
  /** Product Owner du projet : il ordonne le carnet et accepte les éléments. */
  readonly productOwner: boolean;
}

/**
 * Équipe d'un projet : les comptes qui y ont accès et leur rôle. Un compte n'y figure qu'une fois et
 * l'équipe garde toujours un chef de projet pour la gérer. Un membre au plus est Product Owner, et il
 * doit pouvoir rédiger (chef de projet ou contributeur).
 */
export class ProjectTeam {
  private constructor(
    public readonly projectId: string,
    public readonly members: readonly ProjectMember[],
  ) {}

  static create(
    projectId: string,
    members: readonly { userId: string; role: string; productOwner?: boolean }[],
  ): ProjectTeam {
    const seen = new Set<string>();
    for (const member of members) {
      if (!isProjectRole(member.role)) throw new DomainError(`Rôle de projet inconnu : "${member.role}".`);
      if (seen.has(member.userId)) throw new DomainError("Un compte figure deux fois dans l'équipe.");
      seen.add(member.userId);
    }
    if (!members.some((member) => member.role === 'MANAGER')) {
      throw new DomainError("L'équipe doit compter au moins un chef de projet.");
    }
    const owners = members.filter((member) => member.productOwner);
    if (owners.length > 1) throw new DomainError("L'équipe ne compte qu'un Product Owner.");
    if (owners[0] && owners[0].role === 'READER') {
      throw new DomainError('Le Product Owner doit pouvoir rédiger : chef de projet ou contributeur.');
    }
    return new ProjectTeam(
      projectId,
      members.map(({ userId, role, productOwner }) => ({ userId, role: role as ProjectRole, productOwner: productOwner ?? false })),
    );
  }

  get productOwnerId(): string | null {
    return this.members.find((member) => member.productOwner)?.userId ?? null;
  }
}
