import type { Pool } from 'pg';
import type { DirectoryResource } from '@domain/entities/directory-resource';
import type { ResourceDirectoryRepository } from '@application/ports/out/resource-directory.repository';
import { inputToDirectoryResource } from '@application/mappers/directory-resource.mappers';
import type { DirectoryResourceInput } from '@shared/index';

/** Adaptateur SORTANT PostgreSQL : une ressource par ligne, stockée en JSONB (requêtes paramétrées). */
export class PostgresResourceDirectoryRepository implements ResourceDirectoryRepository {
  constructor(private readonly pool: Pool) {}

  async list(): Promise<DirectoryResource[]> {
    const result = await this.pool.query<{ id: string; data: DirectoryResourceInput }>(
      'SELECT id, data FROM directory_resources',
    );
    return result.rows.map((row) => inputToDirectoryResource(row.id, row.data));
  }

  async findById(id: string): Promise<DirectoryResource | null> {
    const result = await this.pool.query<{ data: DirectoryResourceInput }>(
      'SELECT data FROM directory_resources WHERE id = $1',
      [id],
    );
    const row = result.rows[0];
    return row ? inputToDirectoryResource(id, row.data) : null;
  }

  async save(resource: DirectoryResource): Promise<void> {
    const { id, ...data } = resource.props;
    await this.pool.query(
      `INSERT INTO directory_resources (id, data, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [id, data],
    );
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM directory_resources WHERE id = $1', [id]);
  }
}
