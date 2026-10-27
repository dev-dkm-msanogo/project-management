import type { ProjectPlan } from '@domain/entities/project-plan';
import type { ProjectPlanRepository } from '@application/ports/out/project-plan.repository';

/** Adaptateur SORTANT : implémentation en mémoire du port de persistance des plans. */
export class InMemoryProjectPlanRepository implements ProjectPlanRepository {
  private readonly plansByProjectId = new Map<string, ProjectPlan>();

  constructor(seed: readonly ProjectPlan[] = []) {
    for (const plan of seed) {
      this.plansByProjectId.set(plan.project.id, plan);
    }
  }

  async findByProjectId(projectId: string): Promise<ProjectPlan | null> {
    return this.plansByProjectId.get(projectId) ?? null;
  }

  async save(plan: ProjectPlan): Promise<void> {
    this.plansByProjectId.set(plan.project.id, plan);
  }

  async delete(projectId: string): Promise<void> {
    this.plansByProjectId.delete(projectId);
  }
}
