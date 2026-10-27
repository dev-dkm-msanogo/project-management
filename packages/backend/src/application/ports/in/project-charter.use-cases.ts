import type { ProjectCharterDto, ProjectCharterInput } from '@shared/index';

/** Port ENTRANT : obtenir la charte d'un projet (introuvable si elle n'a jamais été rédigée). */
export interface GetProjectCharterUseCase {
  execute(query: { projectId: string }): Promise<ProjectCharterDto>;
}

export interface SaveProjectCharterCommand {
  projectId: string;
  input: ProjectCharterInput;
}

/** Port ENTRANT : créer ou remplacer la charte d'un projet. */
export interface SaveProjectCharterUseCase {
  execute(command: SaveProjectCharterCommand): Promise<ProjectCharterDto>;
}
