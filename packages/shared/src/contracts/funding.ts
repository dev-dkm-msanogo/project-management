/**
 * Financement du projet (PMBOK 8 : processus 10 et 12), aligné sur les templates « Funding
 * Strategy » et « Project Funding Requirements ». Montants en francs CFA entiers, dates ISO-8601.
 */

import type { CostPeriodDto } from './cost-estimates';

// --- Stratégie de financement ---

export interface FundingTrancheInput {
  /** Nom de la tranche, ex. « Tranche 1 ». */
  name: string;
  /** Période couverte, ex. « Janvier 2025 ». */
  period: string;
  /** Date de mise à disposition des fonds. */
  releaseOn: string;
  /** Activités financées. */
  activities: string;
  amount: number;
}

export interface CostCategoryInput {
  name: string;
  amount: number;
  description: string;
}

export interface FundingRiskInput {
  risk: string;
  mitigation: string;
}

export interface FundingStrategyInput {
  preparedOn: string;
  /** Source des fonds et autorité qui les engage. */
  source: string;
  /** Ce que couvre le financement approuvé (le montant est le budget de la charte). */
  approvedFundingNote: string;
  tranches: FundingTrancheInput[];
  /** Conditions de déblocage des tranches. */
  releaseMechanism: string;
  costCategories: CostCategoryInput[];
  risks: FundingRiskInput[];
}

export interface FundingStrategyDto extends FundingStrategyInput {
  projectId: string;
  /** Budget approuvé de la charte, relu à chaque lecture (`null` sans charte). */
  charterBudget: number | null;
  tranchesTotal: number;
  categoriesTotal: number;
}

// --- Besoins de financement (calculés) ---

export interface FundingRequirementRowDto {
  name: string;
  releaseOn: string;
  amount: number;
  cumulativeFunded: number;
  /** Dépense cumulée prévue jusqu'au déblocage de la tranche suivante (ou fin du projet). */
  cumulativeSpend: number;
  /** Excédent de financement ; négatif : la dépense dépasse les fonds disponibles. */
  surplus: number;
}

export interface FundingRequirementsDto {
  projectId: string;
  rows: FundingRequirementRowDto[];
  /** Dépense cumulée prévue par mois (référence des coûts). */
  periods: CostPeriodDto[];
  direct: number;
  /** Référence des coûts (coûts directs + réserve pour aléas). */
  costBaseline: number;
  /** Réserve de management, débloquée à la demande. */
  managementReserve: number;
  /** Financement total requis (référence des coûts + réserve de management). */
  totalRequired: number;
  tranchesTotal: number;
  /** Tranches dont les fonds ne couvrent pas la dépense prévue. */
  shortfalls: string[];
}
