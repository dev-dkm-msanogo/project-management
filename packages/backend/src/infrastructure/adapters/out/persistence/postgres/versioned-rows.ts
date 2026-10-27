import type { Pool } from 'pg';
import { ConflictError } from '@application/errors/application-errors';
import { scopeFor } from '@infrastructure/concurrency/document-scope';
import { requestActor } from '@infrastructure/concurrency/request-context';

/**
 * Lecture et écriture d'une ligne JSONB par projet, avec sa version (concurrence optimiste). Chaque
 * version écrite est aussi conservée dans `document_versions` avec son auteur : historique consultable
 * et restaurable. Une suppression garde l'historique ; un document recréé reprend la numérotation.
 */

const STALE_DOCUMENT =
  "Ce document a été modifié par un autre utilisateur depuis son ouverture : rechargez la page pour récupérer sa dernière version, puis reportez vos modifications.";
const ALREADY_CREATED =
  "Ce document vient d'être créé par un autre utilisateur : rechargez la page pour le consulter, puis reportez vos modifications.";

/** Numéro de la prochaine version d'un document neuf (après une suppression, la numérotation continue). */
const NEXT_VERSION = `(SELECT COALESCE(MAX(version), 0) + 1 FROM document_versions WHERE table_name = $3 AND project_id = $1)`;

/** Conserve la version écrite par la requête `written` (CTE) dans l'historique. */
const KEEP_VERSION = `INSERT INTO document_versions (table_name, project_id, version, data, saved_by)
  SELECT $3, project_id, version, data, $4 FROM written RETURNING version`;

/**
 * Lit la ligne d'un projet ; dépose sa version dans la portée de la requête. Dans une portée « à la
 * version N », lit cette version dans l'historique (sans version courante à renvoyer).
 */
export async function readRow<Data>(pool: Pool, table: string, projectId: string): Promise<Data | null> {
  const scope = scopeFor(table);
  if (scope?.asOf !== undefined) {
    const past = await pool.query<{ data: Data }>(
      'SELECT data FROM document_versions WHERE table_name = $1 AND project_id = $2 AND version = $3',
      [table, projectId, scope.asOf],
    );
    return past.rows[0]?.data ?? null;
  }
  const result = await pool.query<{ data: Data; version: number }>(
    `SELECT data, version FROM ${table} WHERE project_id = $1`,
    [projectId],
  );
  const row = result.rows[0];
  if (scope) scope.version = row?.version ?? null;
  return row ? row.data : null;
}

/**
 * Écrit la ligne d'un projet et sa version dans l'historique en une seule requête (contrôle atomique).
 * Avec une version attendue, refuse d'écraser une version plus récente ou de recréer un document déjà
 * créé (409). Un enregistrement qui ne change rien au contenu ne crée aucune version : la version
 * courante est conservée (et renvoyée), l'historique ne se remplit que de vrais changements.
 */
export async function writeRow(pool: Pool, table: string, projectId: string, data: unknown): Promise<void> {
  const scope = scopeFor(table);
  const expected = scope?.expected;
  const params = [projectId, data, table, requestActor()];
  let result;
  if (expected === null) {
    result = await pool.query<{ version: number }>(
      `WITH written AS (
         INSERT INTO ${table} (project_id, data, updated_at, version) VALUES ($1, $2, now(), ${NEXT_VERSION})
         ON CONFLICT (project_id) DO NOTHING RETURNING project_id, version, data
       ) ${KEEP_VERSION}`,
      params,
    );
    if (result.rowCount === 0) throw new ConflictError(ALREADY_CREATED);
  } else if (typeof expected === 'number') {
    result = await pool.query<{ version: number }>(
      `WITH written AS (
         UPDATE ${table} SET data = $2, updated_at = now(), version = version + 1
         WHERE project_id = $1 AND version = $5 AND data IS DISTINCT FROM $2::jsonb
         RETURNING project_id, version, data
       ) ${KEEP_VERSION}`,
      [...params, expected],
    );
    if (result.rowCount === 0) {
      // Soit rien n'a changé (la version lue est toujours la courante), soit quelqu'un est passé avant.
      const same = await pool.query<{ version: number }>(
        `SELECT version FROM ${table} WHERE project_id = $1 AND version = $3 AND data = $2::jsonb`,
        [projectId, data, expected],
      );
      if (same.rowCount === 0) throw new ConflictError(STALE_DOCUMENT);
      result = same;
    }
  } else {
    result = await pool.query<{ version: number }>(
      `WITH written AS (
         INSERT INTO ${table} (project_id, data, updated_at, version) VALUES ($1, $2, now(), ${NEXT_VERSION})
         ON CONFLICT (project_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now(), version = ${table}.version + 1
         WHERE ${table}.data IS DISTINCT FROM EXCLUDED.data
         RETURNING project_id, version, data
       ) ${KEEP_VERSION}`,
      params,
    );
    if (result.rowCount === 0) {
      result = await pool.query<{ version: number }>(`SELECT version FROM ${table} WHERE project_id = $1`, [projectId]);
    }
  }
  if (scope) scope.version = result.rows[0]!.version;
}

/** Supprime la ligne d'un projet ; avec une version attendue, refuse de supprimer une version plus récente (409). */
export async function deleteRow(pool: Pool, table: string, projectId: string): Promise<void> {
  const expected = scopeFor(table)?.expected;
  if (typeof expected !== 'number') {
    await pool.query(`DELETE FROM ${table} WHERE project_id = $1`, [projectId]);
    return;
  }
  const result = await pool.query(`DELETE FROM ${table} WHERE project_id = $1 AND version = $2`, [projectId, expected]);
  if (result.rowCount === 0) throw new ConflictError(STALE_DOCUMENT);
}

/** Versions conservées d'un document, de la plus récente à la plus ancienne, et sa version courante. */
export async function listVersions(
  pool: Pool,
  table: string,
  projectId: string,
): Promise<{ current: number | null; versions: { version: number; savedAt: Date; savedBy: string | null }[] }> {
  const [current, versions] = await Promise.all([
    pool.query<{ version: number }>(`SELECT version FROM ${table} WHERE project_id = $1`, [projectId]),
    pool.query<{ version: number; saved_at: Date; saved_by: string | null }>(
      `SELECT version, saved_at, saved_by FROM document_versions
       WHERE table_name = $1 AND project_id = $2 ORDER BY version DESC`,
      [table, projectId],
    ),
  ]);
  return {
    current: current.rows[0]?.version ?? null,
    versions: versions.rows.map((row) => ({ version: row.version, savedAt: row.saved_at, savedBy: row.saved_by })),
  };
}
