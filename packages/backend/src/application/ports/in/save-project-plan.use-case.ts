import type { ProjectPlanDto, ProjectPlanInput } from '@shared/index';

export interface SaveProjectPlanCommand {
  projectId: string;
  input: ProjectPlanInput;
}

/** Port ENTRANT : créer ou mettre à jour le plan de projet d'un projet. */
export interface SaveProjectPlanUseCase {
  execute(command: SaveProjectPlanCommand): Promise<ProjectPlanDto>;
}
