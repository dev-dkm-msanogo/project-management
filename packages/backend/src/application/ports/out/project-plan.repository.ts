import type { ProjectPlan } from '@domain/entities/project-plan';

/**
 * Port SORTANT : accès à la persistance des plans de projet.
 */
export interface ProjectPlanRepository {
  findByProjectId(projectId: string): Promise<ProjectPlan | null>;
  save(plan: ProjectPlan): Promise<void>;
  delete(projectId: string): Promise<void>;
}
