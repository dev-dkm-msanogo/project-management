import type { Pool } from 'pg';
import { deleteRow, readRow, writeRow } from '@infrastructure/adapters/out/persistence/postgres/versioned-rows';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';

/**
 * Tables « un document JSONB par projet ». Liste fermée : le nom de table est
 * interpolé dans le SQL, il ne doit jamais provenir d'une entrée utilisateur.
 */
export type DocumentTable =
  | 'risk_registers'
  | 'project_charters'
  | 'stakeholder_registers'
  | 'assumption_logs'
  | 'business_cases'
  | 'benefits_plans'
  | 'responsibility_matrices'
  | 'management_plans'
  | 'requirements_registers'
  | 'scope_statements'
  | 'cost_estimates'
  | 'resource_requirements'
  | 'resource_management_plans'
  | 'team_charters'
  | 'stakeholder_engagement_plans'
  | 'communication_plans'
  | 'procurement_plans'
  | 'procurement_strategies'
  | 'source_selections'
  | 'project_management_plans'
  | 'quality_management_plans'
  | 'risk_management_plans'
  | 'change_logs'
  | 'issue_logs'
  | 'lessons_learned'
  | 'schedule_models'
  | 'wbs_dictionaries'
  | 'stakeholder_questionnaires'
  | 'stakeholder_mappings'
  | 'quality_metrics'
  | 'quality_reports'
  | 'quality_analyses'
  | 'funding_strategies'
  | 'actual_costs'
  | 'deliverables_registers'
  | 'team_assessments'
  | 'closure_reports';

export const DOCUMENT_TABLES: readonly DocumentTable[] = [
  'risk_registers',
  'project_charters',
  'stakeholder_registers',
  'assumption_logs',
  'business_cases',
  'benefits_plans',
  'responsibility_matrices',
  'management_plans',
  'requirements_registers',
  'scope_statements',
  'cost_estimates',
  'resource_requirements',
  'resource_management_plans',
  'team_charters',
  'stakeholder_engagement_plans',
  'communication_plans',
  'procurement_plans',
  'procurement_strategies',
  'source_selections',
  'project_management_plans',
  'quality_management_plans',
  'risk_management_plans',
  'change_logs',
  'issue_logs',
  'lessons_learned',
  'schedule_models',
  'wbs_dictionaries',
  'stakeholder_questionnaires',
  'stakeholder_mappings',
  'quality_metrics',
  'quality_reports',
  'quality_analyses',
  'funding_strategies',
  'actual_costs',
  'deliverables_registers',
  'team_assessments',
  'closure_reports',
];

interface DocumentMapping<T, Input> {
  /** Domaine → forme de saisie stockée en JSONB. */
  toInput: (document: T) => Input;
  /** JSONB relu → domaine (invariants revalidés). */
  fromInput: (projectId: string, input: Input) => T;
}

/**
 * Adaptateur SORTANT PostgreSQL générique : un agrégat par projet stocké en JSONB
 * (sa forme de saisie), requêtes paramétrées.
 */
export class PostgresDocumentRepository<T extends { readonly projectId: string }, Input>
  implements ProjectDocumentRepository<T>
{
  constructor(
    private readonly pool: Pool,
    private readonly table: DocumentTable,
    private readonly mapping: DocumentMapping<T, Input>,
  ) {}

  async findByProjectId(projectId: string): Promise<T | null> {
    const data = await readRow<Input>(this.pool, this.table, projectId);
    return data ? this.mapping.fromInput(projectId, data) : null;
  }

  async save(document: T): Promise<void> {
    await writeRow(this.pool, this.table, document.projectId, this.mapping.toInput(document));
  }

  async delete(projectId: string): Promise<void> {
    await deleteRow(this.pool, this.table, projectId);
  }
}
