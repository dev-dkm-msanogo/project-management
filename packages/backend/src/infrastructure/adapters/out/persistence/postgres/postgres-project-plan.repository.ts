import type { Pool } from 'pg';
import { readRow, writeRow } from '@infrastructure/adapters/out/persistence/postgres/versioned-rows';
import { inputToPlan } from '@application/mappers/input-to-plan.mapper';
import { planToInput } from '@application/mappers/plan-to-input.mapper';
import type { ProjectPlanRepository } from '@application/ports/out/project-plan.repository';
import type { ProjectPlan } from '@domain/entities/project-plan';
import type { ProjectPlanInput } from '@shared/index';

/**
 * Adaptateur SORTANT PostgreSQL du port de persistance des plans.
 * Stockage JSONB (forme de saisie) ; reconstruction via `inputToPlan`. Requêtes paramétrées.
 */
export class PostgresProjectPlanRepository implements ProjectPlanRepository {
  constructor(private readonly pool: Pool) {}

  async findByProjectId(projectId: string): Promise<ProjectPlan | null> {
    const data = await readRow<ProjectPlanInput>(this.pool, 'project_plans', projectId);
    return data ? inputToPlan(projectId, data) : null;
  }

  async save(plan: ProjectPlan): Promise<void> {
    await writeRow(this.pool, 'project_plans', plan.project.id, planToInput(plan));
  }

  async delete(projectId: string): Promise<void> {
    await this.pool.query('DELETE FROM project_plans WHERE project_id = $1', [projectId]);
  }
}
