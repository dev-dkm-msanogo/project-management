/**
 * Contrats du business case (PMBOK 8 : processus 1), alignés sur le template « Business Case ».
 * Montants en FCFA, sur trois années ; dates en chaînes ISO-8601 (YYYY-MM-DD).
 */

export type AlternativeOutcome = 'SELECTED' | 'REJECTED';

/** Ligne de la synthèse financière : coût ou bénéfice. */
export type FinancialLineKind = 'COST' | 'BENEFIT';

export interface BusinessAlternativeInput {
  option: string;
  description: string;
  /** Coût estimé, en clair (ex. « ≈ 6,2 M FCFA + 2,4 M FCFA/an »). */
  cost: string;
  outcome: AlternativeOutcome;
  rationale: string;
}

export interface FinancialLineInput {
  label: string;
  kind: FinancialLineKind;
  /** Montants des années 1, 2 et 3, en FCFA. */
  amounts: number[];
}

export interface BusinessCaseInput {
  preparedOn: string;
  businessNeed: string;
  strategicAlignment: string;
  situation: string[];
  alternatives: BusinessAlternativeInput[];
  recommendedSolution: string;
  financialLines: FinancialLineInput[];
  /** Hypothèses de chiffrage (définition des années, coûts valorisés…). */
  financialNote: string | null;
  keyRisks: string[];
  recommendation: string;
}

/** Synthèse financière calculée : une valeur par année, puis le total sur trois ans. */
export interface FinancialSummaryDto {
  totalCost: number[];
  totalBenefits: number[];
  netBenefit: number[];
  total: { cost: number; benefits: number; net: number };
}

export interface BusinessCaseDto extends BusinessCaseInput {
  projectId: string;
  financialSummary: FinancialSummaryDto;
}
