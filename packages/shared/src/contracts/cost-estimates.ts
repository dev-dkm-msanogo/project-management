/**
 * Contrats des estimations des coûts (PMBOK 8 : processus 11, alimenté par 34) et de la
 * référence des coûts (processus 12), alignés sur les templates « Activity Cost Estimates »,
 * « Basis of Estimates » et « Cost Baseline ». Montants en FCFA ; dates en ISO-8601.
 */

export type CostEstimateMethod = 'ANALOGOUS' | 'PARAMETRIC' | 'THREE_POINT' | 'BOTTOM_UP';

export type EstimateConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

/** Coût unitaire × nombre d'unités. */
export interface ParametricBasisInput {
  method: 'PARAMETRIC';
  costVariable: string;
  unitCost: number;
  units: number;
}

/** Coût d'une activité antérieure comparable × coefficient d'ajustement. */
export interface AnalogousBasisInput {
  method: 'ANALOGOUS';
  previousActivity: string;
  previousCost: number;
  multiplier: number;
}

/** PERT : (optimiste + 4 × plus probable + pessimiste) / 6. */
export interface ThreePointBasisInput {
  method: 'THREE_POINT';
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
}

/** Ascendante : main-d'œuvre (heures × taux) plus les autres composantes du coût. */
export interface BottomUpBasisInput {
  method: 'BOTTOM_UP';
  laborHours: number;
  laborRate: number;
  material: number;
  supplies: number;
  equipment: number;
  travel: number;
  otherDirect: number;
  indirect: number;
  reserve: number;
}

export type CostBasisInput = ParametricBasisInput | AnalogousBasisInput | ThreePointBasisInput | BottomUpBasisInput;

export interface CostActivityInput {
  code: string;
  /** Code WBS de l'activité (« » si non rattachée) ; il la situe dans l'échéancier. */
  wbsCode: string;
  name: string;
  /** Ressource du référentiel (identifiant) ; « » : non précisée. */
  resourceId: string;
  laborCost: number;
  physicalCost: number;
  /** Nature des coûts physiques (licences, matériel, prestations…). */
  physicalCostNote: string;
  method: CostEstimateMethod;
  /** Fourchette d'exactitude, en ± %. */
  rangePct: number;
  confidence: EstimateConfidence;
  /** Détail du calcul (base de l'estimation), de la méthode de l'activité ; facultatif. */
  basis: CostBasisInput | null;
}

/** Synthèse narrative de la base des estimations (template « Basis of Estimates »). */
export interface BasisNarrativeInput {
  approach: string;
  sources: string;
  assumptions: string;
  constraints: string;
  rangeAndConfidence: string;
  risksAndReserves: string;
  approval: string;
}

export interface CostEstimatesInput {
  preparedOn: string;
  activities: CostActivityInput[];
  /** Réserve pour aléas (risques identifiés), incluse dans la référence des coûts. */
  contingencyReserve: number;
  /** Réserve de management (inconnus), hors référence des coûts. */
  managementReserve: number;
  narrative: BasisNarrativeInput;
}

/** Cascade du template : coûts directs + aléas = référence (BAC) ; + management = financement. */
export interface CostSummaryDto {
  labor: number;
  physical: number;
  direct: number;
  contingencyReserve: number;
  costBaseline: number;
  managementReserve: number;
  totalFunding: number;
}

export interface CostEstimatesDto extends CostEstimatesInput {
  projectId: string;
  summary: CostSummaryDto;
  /** Montant calculé par la base de chaque activité détaillée, par code d'activité. */
  basisEstimates: Record<string, number>;
  /** Budget pré-approuvé de la charte (référence), ou null sans charte. */
  charterBudget: number | null;
}

/** Coût planifié (valeur planifiée) d'un mois. */
export interface CostPeriodDto {
  /** Mois au format YYYY-MM. */
  period: string;
  plannedValue: number;
  cumulative: number;
  /** Part cumulée des coûts directs (0–100). */
  percentOfDirect: number;
}

/** Activité estimée qu'aucune tâche datée de l'échéancier ne situe dans le temps. */
export interface UnscheduledCostDto {
  code: string;
  name: string;
  wbsCode: string;
  amount: number;
}

export interface CostBaselineDto {
  projectId: string;
  periods: CostPeriodDto[];
  unscheduled: UnscheduledCostDto[];
  summary: CostSummaryDto;
  charterBudget: number | null;
}
