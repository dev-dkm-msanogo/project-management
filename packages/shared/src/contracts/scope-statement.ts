/**
 * Contrats de l'énoncé du périmètre (PMBOK 8 : processus 5, alimenté par 31), aligné sur le
 * template « Project Scope Statement ». Dates en ISO-8601 (YYYY-MM-DD).
 */
import type { AssumptionEntryDto } from './assumption-log';

export interface ScopeDeliverableInput {
  name: string;
  /** Contenu détaillé du livrable. */
  description: string;
}

export interface ScopeStatementInput {
  preparedOn: string;
  description: string;
  deliverables: ScopeDeliverableInput[];
  acceptanceCriteria: string[];
  exclusions: string[];
}

/** Contraintes et hypothèses tirées en direct du registre des hypothèses (source unique). */
export interface ScopeStatementReferencesDto {
  constraints: AssumptionEntryDto[];
  assumptions: AssumptionEntryDto[];
}

export interface ScopeStatementDto extends ScopeStatementInput {
  projectId: string;
  references: ScopeStatementReferencesDto;
}
