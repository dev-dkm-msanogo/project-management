import type { Pool } from 'pg';
import type {
  AuditEventRecord,
  AuditLogRepository,
  DocumentVersionLog,
  NewAuditEvent,
} from '@application/ports/out/governance.repository';
import { listVersions } from '@infrastructure/adapters/out/persistence/postgres/versioned-rows';

/**
 * Historique des versions (table `document_versions`) ; la clé d'un document est le nom de sa table,
 * fixé par la route (liste fermée), jamais une entrée utilisateur.
 */
export class PostgresDocumentVersionLog implements DocumentVersionLog {
  constructor(private readonly pool: Pool) {}

  list(document: string, projectId: string) {
    return listVersions(this.pool, document, projectId);
  }
}

/** Journal d'audit (table `audit_events`, ajout seul, requêtes paramétrées). */
export class PostgresAuditLogRepository implements AuditLogRepository {
  constructor(private readonly pool: Pool) {}

  async record(event: NewAuditEvent): Promise<void> {
    await this.pool.query(
      `INSERT INTO audit_events (user_id, user_name, project_id, action, detail, ip)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [event.userId, event.userName, event.projectId, event.action, event.detail, event.ip],
    );
  }

  async list(filter: { projectId?: string; before?: number; limit: number }): Promise<AuditEventRecord[]> {
    const result = await this.pool.query<{
      id: string;
      at: Date;
      user_id: string | null;
      user_name: string | null;
      project_id: string | null;
      action: string;
      detail: string | null;
    }>(
      `SELECT id, at, user_id, user_name, project_id, action, detail FROM audit_events
       WHERE ($1::text IS NULL OR project_id = $1) AND ($2::bigint IS NULL OR id < $2)
       ORDER BY id DESC LIMIT $3`,
      [filter.projectId ?? null, filter.before ?? null, filter.limit],
    );
    return result.rows.map((row) => ({
      id: Number(row.id),
      at: row.at,
      userId: row.user_id,
      userName: row.user_name,
      projectId: row.project_id,
      action: row.action,
      detail: row.detail,
    }));
  }
}
