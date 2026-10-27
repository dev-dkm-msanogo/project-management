import type { Pool } from 'pg';
import { DOCUMENT_TABLES } from '@infrastructure/adapters/out/persistence/postgres/postgres-document.repository';

/**
 * Migration minimale : crée les tables si absentes.
 * Chaque agrégat est stocké en JSONB (sa forme de saisie), clé = identifiant projet.
 */
export async function migrate(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL,
      role          TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  // Administration des comptes : colonnes ajoutées sans réécrire les lignes existantes.
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS active               BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS last_login_at        TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS sessions_valid_after TIMESTAMPTZ;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS directory_resources (
      id         TEXT PRIMARY KEY,
      data       JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT,
      status      TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS methodology TEXT;`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS executive_reports (
      project_id TEXT PRIMARY KEY,
      data       JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  // Documents « un agrégat JSONB par projet » (registres, charte…).
  for (const table of DOCUMENT_TABLES) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${table} (
        project_id TEXT PRIMARY KEY,
        data       JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  }
  // Méthodologie des projets créés avant son choix : celle de leur plan de management, sinon prédictive.
  await pool.query(`
    UPDATE projects p SET methodology = COALESCE(
      (SELECT m.data -> 'developmentApproach' ->> 'kind' FROM project_management_plans m WHERE m.project_id = p.id),
      'PREDICTIVE'
    )
    WHERE methodology IS NULL;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_plans (
      project_id TEXT PRIMARY KEY,
      data       JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  // Avancement des tâches : une ligne par (projet, tâche), chaque mise à jour ne touche que la sienne.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS task_progress (
      project_id TEXT NOT NULL,
      wbs        TEXT NOT NULL,
      data       JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (project_id, wbs)
    );
  `);
  // Concurrence optimiste : chaque enregistrement incrémente la version du document.
  for (const table of [...DOCUMENT_TABLES, 'executive_reports', 'project_plans']) {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;`);
  }
  // Circuit de validation : historique par document validé, versions approuvées archivées,
  // valideurs désignés par projet.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS document_approvals (
      project_id TEXT NOT NULL,
      subject    TEXT NOT NULL,
      events     JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (project_id, subject)
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS approval_snapshots (
      project_id  TEXT NOT NULL,
      subject     TEXT NOT NULL,
      revision    INTEGER NOT NULL,
      documents   JSONB NOT NULL,
      archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (project_id, subject, revision)
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_approvers (
      project_id TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
      user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      PRIMARY KEY (project_id, user_id)
    );
  `);
  // Gouvernance : membres de chaque projet et leur rôle.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_members (
      project_id TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
      user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      role       TEXT NOT NULL CHECK (role IN ('MANAGER', 'CONTRIBUTOR', 'READER')),
      PRIMARY KEY (project_id, user_id)
    );
  `);
  // Product Owner : un membre au plus par projet (projets hybrides et agiles).
  await pool.query(`ALTER TABLE project_members ADD COLUMN IF NOT EXISTS product_owner BOOLEAN NOT NULL DEFAULT false;`);
  // Historique : chaque version enregistrée d'un document, avec son auteur (consultable, restaurable).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS document_versions (
      table_name TEXT NOT NULL,
      project_id TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
      version    INTEGER NOT NULL,
      data       JSONB NOT NULL,
      saved_by   TEXT,
      saved_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (table_name, project_id, version)
    );
  `);
  // Versions courantes enregistrées avant l'historique (auteur inconnu).
  for (const table of [...DOCUMENT_TABLES, 'executive_reports', 'project_plans']) {
    await pool.query(`
      INSERT INTO document_versions (table_name, project_id, version, data, saved_at)
      SELECT '${table}', project_id, version, data, updated_at FROM ${table}
      WHERE project_id IN (SELECT id FROM projects)
      ON CONFLICT DO NOTHING;
    `);
  }
  // Rapports exécutifs : un par mois et par projet ; publié, le rapport complet est figé. Reprise des
  // rapports enregistrés auparavant (un par projet), au mois de leur période, une seule fois.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS executive_status_reports (
      project_id   TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
      period       TEXT NOT NULL,
      data         JSONB NOT NULL,
      version      INTEGER NOT NULL DEFAULT 1,
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      published    JSONB,
      published_at TIMESTAMPTZ,
      published_by TEXT,
      PRIMARY KEY (project_id, period)
    );
  `);
  await pool.query(`
    INSERT INTO executive_status_reports (project_id, period, data, version, updated_at)
    SELECT project_id, left(data -> 'reportingPeriod' ->> 'from', 7), data, version, updated_at FROM executive_reports
    WHERE project_id IN (SELECT id FROM projects) AND data -> 'reportingPeriod' ->> 'from' IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM executive_status_reports)
    ON CONFLICT DO NOTHING;
  `);
  // Références de base de performance figées à chaque approbation du plan de management.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_baselines (
      project_id  TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
      revision    INTEGER NOT NULL,
      approved_at TIMESTAMPTZ NOT NULL,
      plan        JSONB NOT NULL,
      estimates   JSONB,
      PRIMARY KEY (project_id, revision)
    );
  `);
  // Journal d'audit : qui a fait quoi, quand (conservé après la suppression d'un projet ou d'un compte).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_events (
      id         BIGSERIAL PRIMARY KEY,
      at         TIMESTAMPTZ NOT NULL DEFAULT now(),
      user_id    TEXT,
      user_name  TEXT,
      project_id TEXT,
      action     TEXT NOT NULL,
      detail     TEXT,
      ip         TEXT
    );
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS audit_events_by_project ON audit_events (project_id, id DESC);');
}
