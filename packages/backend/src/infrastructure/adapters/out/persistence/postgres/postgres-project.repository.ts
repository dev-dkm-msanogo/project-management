import type { Pool } from 'pg';
import { ProjectRecord } from '@domain/entities/project-record';
import type { ProjectStatus } from '@domain/value-objects/project-status';
import type { ProjectRepository } from '@application/ports/out/project.repository';

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: Date;
}

const SELECT = 'SELECT id, name, description, status, created_at FROM projects';

/** Adaptateur SORTANT PostgreSQL du registre des projets (requêtes paramétrées). */
export class PostgresProjectRepository implements ProjectRepository {
  constructor(private readonly pool: Pool) {}

  private toRecord(row: ProjectRow): ProjectRecord {
    return ProjectRecord.create({
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status as ProjectStatus,
      createdAt: row.created_at,
    });
  }

  async list(): Promise<ProjectRecord[]> {
    const result = await this.pool.query<ProjectRow>(`${SELECT} ORDER BY created_at ASC`);
    return result.rows.map((row) => this.toRecord(row));
  }

  async findById(id: string): Promise<ProjectRecord | null> {
    const result = await this.pool.query<ProjectRow>(`${SELECT} WHERE id = $1`, [id]);
    const row = result.rows[0];
    return row ? this.toRecord(row) : null;
  }

  async save(record: ProjectRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO projects (id, name, description, status, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name, description = EXCLUDED.description, status = EXCLUDED.status`,
      [record.id, record.name, record.description, record.status, record.createdAt],
    );
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM projects WHERE id = $1', [id]);
  }
}
