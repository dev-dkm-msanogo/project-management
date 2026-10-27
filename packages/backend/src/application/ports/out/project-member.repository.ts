import type { ProjectMember, ProjectTeam } from '@domain/entities/project-team';
import type { ProjectScopedStore } from '@application/ports/out/project-document.repository';

/** Port SORTANT : membres de chaque projet et leur rôle. */
export interface ProjectMemberRepository extends ProjectScopedStore {
  /** Membres du projet (aucun : seuls les administrateurs y ont accès). */
  listByProject(projectId: string): Promise<ProjectMember[]>;
  /** Projets dont le compte est membre, avec son rôle. */
  listByUser(userId: string): Promise<{ projectId: string; role: ProjectMember['role'] }[]>;
  /** Remplace l'équipe du projet. */
  replace(team: ProjectTeam): Promise<void>;
}
