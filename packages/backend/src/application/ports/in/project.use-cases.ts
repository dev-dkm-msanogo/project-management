import type { ProjectRole } from '@domain/value-objects/project-role';
import type { Role } from '@domain/value-objects/role';
import type {
  CreateProjectInput,
  ProjectRecordDto,
  ProjectTeamDto,
  ProjectTeamInput,
  UpdateProjectInput,
} from '@shared/index';

/** Ports ENTRANTS du registre de projets et de leurs équipes. */

/** Compte à l'origine de la requête : son identifiant et son rôle de compte. */
export interface Requester {
  id: string;
  role: Role;
}

export interface ListProjectsUseCase {
  execute(query: { requester: Requester }): Promise<ProjectRecordDto[]>;
}

export interface CreateProjectUseCase {
  execute(command: { input: CreateProjectInput; requester: Requester }): Promise<ProjectRecordDto>;
}

export interface UpdateProjectUseCase {
  execute(command: { projectId: string; input: UpdateProjectInput }): Promise<ProjectRecordDto>;
}

export interface DeleteProjectCommand {
  projectId: string;
}

export interface DeleteProjectUseCase {
  execute(command: DeleteProjectCommand): Promise<void>;
}

/** Garde des routes d'un projet : son existence et le rôle du compte sur lui (404 sans accès). */
export interface ResolveProjectAccessUseCase {
  execute(query: { projectId: string; requester: Requester }): Promise<ProjectRole>;
}

export interface GetProjectTeamUseCase {
  execute(query: { projectId: string; manages: boolean }): Promise<ProjectTeamDto>;
}

export interface SaveProjectTeamUseCase {
  execute(command: { projectId: string; input: ProjectTeamInput }): Promise<ProjectTeamDto>;
}
