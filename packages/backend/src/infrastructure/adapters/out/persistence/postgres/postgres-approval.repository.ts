import type { Pool } from 'pg';
import { DocumentApproval, type ApprovalSubject } from '@domain/entities/document-approval';
import { ConflictError } from '@application/errors/application-errors';
import {
  approvalEventToDto,
  storedToApprovalEvent,
  type StoredApprovalEvent,
} from '@application/mappers/approval.mappers';
import type {
  ApprovalRepository,
  ApprovalSnapshot,
  ApprovalSnapshotRepository,
  ProjectApproverRepository,
} from '@application/ports/out/approval.repository';

const CONCURRENT_CHANGE =
  "Quelqu'un vient de faire avancer la validation de ce document : rechargez la page pour voir son état.";

/** Adaptateur SORTANT PostgreSQL : historique de validation (événements en JSONB, requêtes paramétrées). */
export class PostgresApprovalRepository implements ApprovalRepository {
  constructor(private readonly pool: Pool) {}

  private toApproval(row: { project_id: string; subject: string; events: StoredApprovalEvent[] }): DocumentApproval {
    return DocumentApproval.fromEvents(row.project_id, row.subject as ApprovalSubject, row.events.map(storedToApprovalEvent));
  }

  async find(projectId: string, subject: ApprovalSubject): Promise<DocumentApproval | null> {
    const result = await this.pool.query(
      'SELECT project_id, subject, events FROM document_approvals WHERE project_id = $1 AND subject = $2',
      [projectId, subject],
    );
    return result.rows[0] ? this.toApproval(result.rows[0]) : null;
  }

  async listByProject(projectId: string): Promise<DocumentApproval[]> {
    const result = await this.pool.query(
      'SELECT project_id, subject, events FROM document_approvals WHERE project_id = $1',
      [projectId],
    );
    return result.rows.map((row) => this.toApproval(row));
  }

  /** Concurrence optimiste : l'écriture n'aboutit que si l'historique n'a pas bougé depuis la lecture. */
  async save(approval: DocumentApproval, expectedEvents: number): Promise<void> {
    const events = JSON.stringify(approval.events.map(approvalEventToDto));
    const result =
      expectedEvents === 0
        ? await this.pool.query(
            `INSERT INTO document_approvals (project_id, subject, events) VALUES ($1, $2, $3)
             ON CONFLICT (project_id, subject) DO NOTHING`,
            [approval.projectId, approval.subject, events],
          )
        : await this.pool.query(
            `UPDATE document_approvals SET events = $3, updated_at = now()
             WHERE project_id = $1 AND subject = $2 AND jsonb_array_length(events) = $4`,
            [approval.projectId, approval.subject, events, expectedEvents],
          );
    if (result.rowCount !== 1) {
      throw new ConflictError(CONCURRENT_CHANGE);
    }
  }

  async delete(projectId: string): Promise<void> {
    await this.pool.query('DELETE FROM document_approvals WHERE project_id = $1', [projectId]);
  }
}

/** Adaptateur SORTANT PostgreSQL : versions approuvées archivées (jamais réécrites). */
export class PostgresApprovalSnapshotRepository implements ApprovalSnapshotRepository {
  constructor(private readonly pool: Pool) {}

  async find(projectId: string, subject: ApprovalSubject, revision: number): Promise<ApprovalSnapshot | null> {
    const result = await this.pool.query<{ documents: Record<string, unknown> }>(
      'SELECT documents FROM approval_snapshots WHERE project_id = $1 AND subject = $2 AND revision = $3',
      [projectId, subject, revision],
    );
    const row = result.rows[0];
    return row ? { projectId, subject, revision, documents: row.documents } : null;
  }

  async revisions(projectId: string, subject: ApprovalSubject): Promise<number[]> {
    const result = await this.pool.query<{ revision: number }>(
      'SELECT revision FROM approval_snapshots WHERE project_id = $1 AND subject = $2 ORDER BY revision',
      [projectId, subject],
    );
    return result.rows.map((row) => row.revision);
  }

  async save(snapshot: ApprovalSnapshot): Promise<void> {
    await this.pool.query(
      `INSERT INTO approval_snapshots (project_id, subject, revision, documents) VALUES ($1, $2, $3, $4)
       ON CONFLICT (project_id, subject, revision) DO NOTHING`,
      [snapshot.projectId, snapshot.subject, snapshot.revision, JSON.stringify(snapshot.documents)],
    );
  }

  async delete(projectId: string): Promise<void> {
    await this.pool.query('DELETE FROM approval_snapshots WHERE project_id = $1', [projectId]);
  }
}

/** Adaptateur SORTANT PostgreSQL : valideurs désignés par projet (table relationnelle). */
export class PostgresProjectApproverRepository implements ProjectApproverRepository {
  constructor(private readonly pool: Pool) {}

  async listByProject(projectId: string): Promise<string[]> {
    const result = await this.pool.query<{ user_id: string }>(
      'SELECT user_id FROM project_approvers WHERE project_id = $1 ORDER BY user_id',
      [projectId],
    );
    return result.rows.map((row) => row.user_id);
  }

  async listProjectsOf(userId: string): Promise<string[]> {
    const result = await this.pool.query<{ project_id: string }>(
      'SELECT project_id FROM project_approvers WHERE user_id = $1 ORDER BY project_id',
      [userId],
    );
    return result.rows.map((row) => row.project_id);
  }

  /** Remplacement atomique de la liste. */
  async replace(projectId: string, userIds: readonly string[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM project_approvers WHERE project_id = $1', [projectId]);
      for (const userId of userIds) {
        await client.query('INSERT INTO project_approvers (project_id, user_id) VALUES ($1, $2)', [projectId, userId]);
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
    await this.pool.query('DELETE FROM project_approvers WHERE project_id = $1', [projectId]);
  }
}
