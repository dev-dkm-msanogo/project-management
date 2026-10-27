import type { Pool } from 'pg';
import { costEstimatesToInput, inputToCostEstimates } from '@application/mappers/cost-estimates.mappers';
import { inputToPlan } from '@application/mappers/input-to-plan.mapper';
import { planToInput } from '@application/mappers/plan-to-input.mapper';
import type { ApprovedBaseline, BaselineRepository } from '@application/ports/out/baseline.repository';
import type { CostEstimatesInput, ProjectPlanInput } from '@shared/index';

/** Références de base approuvées (table `project_baselines`, formes de saisie en JSONB, ajout seul). */
export class PostgresBaselineRepository implements BaselineRepository {
  constructor(private readonly pool: Pool) {}

  async latest(projectId: string): Promise<ApprovedBaseline | null> {
    const result = await this.pool.query<{
      revision: number;
      approved_at: Date;
      plan: ProjectPlanInput;
      estimates: CostEstimatesInput | null;
    }>(
      `SELECT revision, approved_at, plan, estimates FROM project_baselines
       WHERE project_id = $1 ORDER BY revision DESC LIMIT 1`,
      [projectId],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      projectId,
      revision: row.revision,
      approvedAt: row.approved_at,
      plan: inputToPlan(projectId, row.plan),
      estimates: row.estimates ? inputToCostEstimates(projectId, row.estimates) : null,
    };
  }

  async save(baseline: ApprovedBaseline): Promise<void> {
    await this.pool.query(
      `INSERT INTO project_baselines (project_id, revision, approved_at, plan, estimates)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (project_id, revision) DO NOTHING`,
      [
        baseline.projectId,
        baseline.revision,
        baseline.approvedAt,
        planToInput(baseline.plan),
        baseline.estimates ? costEstimatesToInput(baseline.estimates) : null,
      ],
    );
  }

  async delete(projectId: string): Promise<void> {
    await this.pool.query('DELETE FROM project_baselines WHERE project_id = $1', [projectId]);
  }
}
