/**
 * Contrats des approvisionnements (PMBOK 8 : processus 20), alignés sur les templates
 * « Procurement Management Plan », « Procurement Strategy » et « Source Selection Criteria ».
 * Dates en ISO-8601.
 */
import type { AssumptionEntryDto } from './assumption-log';

// --- Plan de gestion des approvisionnements ---

/** Intégration des achats au reste du projet, par domaine (template « Procurement Integration »). */
export interface ProcurementIntegrationInput {
  scope: string;
  schedule: string;
  documentation: string;
  risk: string;
  reporting: string;
}

export interface ProcurementActivityInput {
  date: string;
  activity: string;
}

export interface ProcurementMetricInput {
  item: string;
  metric: string;
  measurement: string;
}

export interface ProcurementRoleInput {
  role: string;
  responsibility: string;
  authority: string;
}

export interface PrequalifiedSellerInput {
  name: string;
  description: string;
}

export interface ProcurementPlanInput {
  preparedOn: string;
  integration: ProcurementIntegrationInput;
  activities: ProcurementActivityInput[];
  metrics: ProcurementMetricInput[];
  roles: ProcurementRoleInput[];
  jurisdiction: string;
  independentEstimates: string;
  riskManagement: string;
  sellers: PrequalifiedSellerInput[];
}

export interface ProcurementPlanDto extends ProcurementPlanInput {
  projectId: string;
  /** Hypothèses et contraintes « Approvisionnements » du registre (source unique). */
  references: { constraints: AssumptionEntryDto[]; assumptions: AssumptionEntryDto[] };
}

// --- Stratégie d'approvisionnement ---

export type ContractType = 'FFP' | 'FPIF' | 'FP_EPA' | 'CPFF' | 'CPIF' | 'CPAF' | 'TM' | 'OTHER';

/** Type de contrat retenu, avec ce à quoi il s'applique et pourquoi. */
export interface ContractChoiceInput {
  type: ContractType;
  note: string;
}

export interface ProcurementPhaseInput {
  phase: string;
  entryCriteria: string;
  deliverables: string;
  exitCriteria: string;
}

export interface ProcurementStrategyInput {
  preparedOn: string;
  deliveryMethod: string;
  makeOrBuy: string;
  contractTypes: ContractChoiceInput[];
  incentiveCriteria: string;
  lifecycle: ProcurementPhaseInput[];
  knowledgeTransfer: string;
}

export interface ProcurementStrategyDto extends ProcurementStrategyInput {
  projectId: string;
}

// --- Critères de sélection des fournisseurs ---

export interface SelectionCriterionInput {
  name: string;
  description: string;
  /** Pondération en % ; le total des critères fait 100. */
  weight: number;
  /** Note de 1 à 5 de chaque candidat, dans l'ordre des candidats. */
  ratings: number[];
}

export interface SourceSelectionInput {
  /** Achat évalué (ex. « Outils de test et de charge »). */
  procurement: string;
  preparedOn: string;
  candidates: string[];
  criteria: SelectionCriterionInput[];
  recommendation: string;
  /** Attribution décidée par un valideur du projet ; l'évaluation est alors figée. */
  award: SourceSelectionAwardDto | null;
}

export interface SourceSelectionAwardDto {
  supplier: string;
  decidedOn: string;
  decidedBy: string;
  rationale: string;
}

/** Attribution d'un achat à l'un de ses candidats. */
export interface SourceSelectionAwardInput {
  procurement: string;
  supplier: string;
  rationale: string;
}

export interface SourceSelectionsInput {
  evaluations: SourceSelectionInput[];
}

/** Score = pondération × note ; total sur 500. */
export interface SourceSelectionResultDto {
  /** Total de chaque candidat, dans l'ordre des candidats. */
  totals: number[];
  /** Candidat(s) en tête (plusieurs en cas d'égalité). */
  leaders: string[];
}

export interface SourceSelectionsDto {
  projectId: string;
  evaluations: (SourceSelectionInput & { result: SourceSelectionResultDto })[];
}
