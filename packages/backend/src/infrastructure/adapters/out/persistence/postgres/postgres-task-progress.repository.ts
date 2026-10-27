import type { Pool } from 'pg';
import type { TaskProgress } from '@domain/entities/task-progress';
import {
  storedToTaskProgress,
  toTaskProgressDto,
  type StoredTaskProgress,
} from '@application/mappers/performance.mappers';
import type { TaskProgressRepository } from '@application/ports/out/task-progress.repository';

/** Adaptateur SORTANT PostgreSQL : une mesure par (projet, tâche), en JSONB (requêtes paramétrées). */
export class PostgresTaskProgressRepository implements TaskProgressRepository {
  constructor(private readonly pool: Pool) {}

  async listByProject(projectId: string): Promise<TaskProgress[]> {
    const result = await this.pool.query<{ wbs: string; data: StoredTaskProgress }>(
      'SELECT wbs, data FROM task_progress WHERE project_id = $1',
      [projectId],
    );
    return result.rows.map((row) => storedToTaskProgress(projectId, row.wbs, row.data));
  }

  async save(progress: TaskProgress): Promise<void> {
    const { wbs, ...data } = toTaskProgressDto(progress);
    await this.pool.query(
      `INSERT INTO task_progress (project_id, wbs, data, updated_at) VALUES ($1, $2, $3, now())
       ON CONFLICT (project_id, wbs) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [progress.props.projectId, wbs, data],
    );
  }

  async delete(projectId: string): Promise<void> {
    await this.pool.query('DELETE FROM task_progress WHERE project_id = $1', [projectId]);
  }
}
