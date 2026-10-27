import type { Pool } from 'pg';
import type { ProjectMember, ProjectTeam } from '@domain/entities/project-team';
import type { ProjectRole } from '@domain/value-objects/project-role';
import type { ProjectMemberRepository } from '@application/ports/out/project-member.repository';

/** Adaptateur SORTANT PostgreSQL : membres des projets (requêtes paramétrées). */
export class PostgresProjectMemberRepository implements ProjectMemberRepository {
  constructor(private readonly pool: Pool) {}

  async listByProject(projectId: string): Promise<ProjectMember[]> {
    const result = await this.pool.query<{ user_id: string; role: ProjectRole; product_owner: boolean }>(
      'SELECT user_id, role, product_owner FROM project_members WHERE project_id = $1 ORDER BY user_id',
      [projectId],
    );
    return result.rows.map((row) => ({ userId: row.user_id, role: row.role, productOwner: row.product_owner }));
  }

  async listByUser(userId: string): Promise<{ projectId: string; role: ProjectRole }[]> {
    const result = await this.pool.query<{ project_id: string; role: ProjectRole }>(
      'SELECT project_id, role FROM project_members WHERE user_id = $1 ORDER BY project_id',
      [userId],
    );
    return result.rows.map((row) => ({ projectId: row.project_id, role: row.role }));
  }

  /** Remplacement atomique de l'équipe. */
  async replace(team: ProjectTeam): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM project_members WHERE project_id = $1', [team.projectId]);
      for (const member of team.members) {
        await client.query(
          'INSERT INTO project_members (project_id, user_id, role, product_owner) VALUES ($1, $2, $3, $4)',
          [team.projectId, member.userId, member.role, member.productOwner],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(projectId: string): Promise<void> {
    await this.pool.query('DELETE FROM project_members WHERE project_id = $1', [projectId]);
  }
}
