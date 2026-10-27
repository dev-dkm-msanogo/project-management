import type { ProjectPlanDto } from '@shared/index';

export interface GetProjectPlanQuery {
  projectId: string;
}

/** Port ENTRANT : obtenir le plan de projet (WBS) d'un projet. */
export interface GetProjectPlanUseCase {
  execute(query: GetProjectPlanQuery): Promise<ProjectPlanDto>;
}
