import type { Pool } from 'pg';
import { ConflictError } from '@application/errors/application-errors';
import { inputToReport } from '@application/mappers/input-to-report.mapper';
import { reportToInput } from '@application/mappers/report-to-input.mapper';
import type {
  ReportPublication,
  StatusReportRepository,
  StoredReport,
} from '@application/ports/out/status-report.repository';
import type { ExecutiveStatusReport } from '@domain/entities/executive-status-report';
import { upgradeReportInput } from '@infrastructure/adapters/out/persistence/document-upgrades';
import { scopeFor } from '@infrastructure/concurrency/document-scope';
import type { ExecutiveStatusReportDto, ExecutiveStatusReportInput } from '@shared/index';

const TABLE = 'executive_status_reports';

const STALE_REPORT =
  "Ce rapport a été modifié par un autre utilisateur depuis son ouverture : rechargez la page pour récupérer sa dernière version, puis reportez vos modifications.";
const ALREADY_CREATED =
  "Le rapport de ce mois vient d'être créé par un autre utilisateur : rechargez la page pour le consulter, puis reportez vos modifications.";

interface ReportRow {
  project_id: string;
  data: ExecutiveStatusReportInput;
  version: number;
  published: ExecutiveStatusReportDto | null;
  published_at: Date | null;
  published_by: string | null;
}

const COLUMNS = 'project_id, data, version, published, published_at, published_by';

/**
 * Adaptateur SORTANT PostgreSQL : un rapport par mois et par projet (forme de saisie en JSONB, revalidée
 * par `inputToReport`) et, une fois publié, le rapport complet figé. La version du brouillon lu ou
 * écrit circule en ETag (concurrence optimiste). Requêtes paramétrées.
 */
export class PostgresStatusReportRepository implements StatusReportRepository {
  constructor(private readonly pool: Pool) {}

  private toStored(row: ReportRow): StoredReport {
    return {
      report: inputToReport(row.project_id, upgradeReportInput(row.data)),
      publication:
        row.published && row.published_at
          ? { at: row.published_at, by: row.published_by ?? '', report: row.published }
          : null,
    };
  }

  async list(projectId: string): Promise<StoredReport[]> {
    const result = await this.pool.query<ReportRow>(
      `SELECT ${COLUMNS} FROM ${TABLE} WHERE project_id = $1 ORDER BY period DESC`,
      [projectId],
    );
    return result.rows.map((row) => this.toStored(row));
  }

  async find(projectId: string, period: string): Promise<StoredReport | null> {
    const result = await this.pool.query<ReportRow>(
      `SELECT ${COLUMNS} FROM ${TABLE} WHERE project_id = $1 AND period = $2`,
      [projectId, period],
    );
    const row = result.rows[0];
    const scope = scopeFor(TABLE);
    if (scope) scope.version = row && !row.published ? row.version : null;
    return row ? this.toStored(row) : null;
  }

  async findLatest(projectId: string): Promise<StoredReport | null> {
    const result = await this.pool.query<ReportRow>(
      `SELECT ${COLUMNS} FROM ${TABLE} WHERE project_id = $1 ORDER BY period DESC LIMIT 1`,
      [projectId],
    );
    return result.rows[0] ? this.toStored(result.rows[0]) : null;
  }

  /** Brouillon du mois : jamais par-dessus un rapport publié (refusé avant, et par la requête). */
  async save(report: ExecutiveStatusReport): Promise<void> {
    const scope = scopeFor(TABLE);
    const expected = scope?.expected;
    const params = [report.projectId, report.period, reportToInput(report)];
    let result;
    if (expected === null) {
      result = await this.pool.query<{ version: number }>(
        `INSERT INTO ${TABLE} (project_id, period, data) VALUES ($1, $2, $3)
         ON CONFLICT (project_id, period) DO NOTHING RETURNING version`,
        params,
      );
      if (result.rowCount === 0) throw new ConflictError(ALREADY_CREATED);
    } else if (typeof expected === 'number') {
      result = await this.pool.query<{ version: number }>(
        `UPDATE ${TABLE} SET data = $3, updated_at = now(), version = version + 1
         WHERE project_id = $1 AND period = $2 AND version = $4 AND published IS NULL RETURNING version`,
        [...params, expected],
      );
      if (result.rowCount === 0) throw new ConflictError(STALE_REPORT);
    } else {
      result = await this.pool.query<{ version: number }>(
        `INSERT INTO ${TABLE} (project_id, period, data) VALUES ($1, $2, $3)
         ON CONFLICT (project_id, period) DO UPDATE SET data = EXCLUDED.data, updated_at = now(), version = ${TABLE}.version + 1
         WHERE ${TABLE}.published IS NULL RETURNING version`,
        params,
      );
      if (result.rowCount === 0) throw new ConflictError(STALE_REPORT);
    }
    if (scope) scope.version = result.rows[0]!.version;
  }

  async publish(projectId: string, period: string, publication: ReportPublication): Promise<void> {
    const result = await this.pool.query(
      `UPDATE ${TABLE} SET published = $3, published_at = $4, published_by = $5
       WHERE project_id = $1 AND period = $2 AND published IS NULL`,
      [projectId, period, publication.report, publication.at, publication.by],
    );
    if (result.rowCount === 0) throw new ConflictError(STALE_REPORT);
  }

  async deleteDraft(projectId: string, period: string): Promise<void> {
    const expected = scopeFor(TABLE)?.expected;
    const result = await this.pool.query(
      `DELETE FROM ${TABLE} WHERE project_id = $1 AND period = $2 AND published IS NULL
       AND ($3::int IS NULL OR version = $3)`,
      [projectId, period, typeof expected === 'number' ? expected : null],
    );
    if (result.rowCount === 0) throw new ConflictError(STALE_REPORT);
  }

  async delete(projectId: string): Promise<void> {
    await this.pool.query(`DELETE FROM ${TABLE} WHERE project_id = $1`, [projectId]);
  }
}
