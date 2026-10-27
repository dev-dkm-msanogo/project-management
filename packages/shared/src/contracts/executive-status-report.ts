/**
 * Contrats (DTO) du rapport de statut exécutif.
 *
 * Source de vérité UNIQUE du format d'échange entre le backend et le frontend.
 * Ces types ne contiennent aucune logique : ils décrivent la forme sérialisée
 * (JSON) exposée par l'API. Les dates sont transportées en chaînes ISO-8601.
 */
import type { MajorRisksDto } from './risk-register';

export type RagLevel = 'GREEN' | 'AMBER' | 'RED' | 'NOT_APPLICABLE';
export type TrendDirection = 'UP' | 'DOWN' | 'STABLE';
export type MilestoneState = 'COMPLETE' | 'IN_PROGRESS' | 'NOT_STARTED' | 'AT_RISK';

export interface MoneyDto {
  amount: number;
  currency: string;
}

/** En-tête : projet, période de reporting, date du rapport (date à laquelle tout est calculé). */
export interface ReportHeaderDto {
  projectId: string;
  projectName: string;
  reportTitle: string;
  reportingPeriod: { from: string; to: string };
  reportDate: string;
  /** Dernière mesure d'avancement des tâches ; `null` : aucune. */
  progressMeasuredOn: string | null;
  /** Aucune mesure d'avancement pendant la période : délai et valeur acquise sont à prendre avec prudence. */
  progressStale: boolean;
}

/** 1. Statut global RAG : la pire des dimensions (périmètre, délai, coût), ajustable avec justification. */
export interface OverallStatusDto {
  rag: RagLevel;
  /** Niveau calculé, avant ajustement éventuel du chef de projet. */
  computedRag: RagLevel;
  overridden: boolean;
  overrideReason: string | null;
  headline: string;
  statement: string;
}

/** 2. Résumé exécutif. */
export interface ExecutiveSummaryDto {
  narrative: string;
}

/** 3. Jalons clés (jalons de l'échéancier). */
export interface MilestoneDto {
  code: string | null;
  name: string;
  planned: string | null;
  actual: string | null;
  status: MilestoneState;
}

/** 4 & 5. Ventilation d'une dimension (périmètre / planning). */
export interface DimensionBreakdownDto {
  label: string;
  rag: RagLevel;
  percentage: number;
}

export interface DimensionStatusDto {
  rag: RagLevel;
  headlinePercentage: number;
  headlineLabel: string;
  breakdown: DimensionBreakdownDto[];
  /** Ce sur quoi porte la ventilation, ex. « 18 tâches élémentaires » ; `null` : pas de données. */
  basis: string | null;
}

/** 6. Statut coût / budget. */
export interface CostStatusDto {
  /** « Budget approuvé (charte) » ou « Référence des coûts » ; `null` : aucun budget connu. */
  budgetLabel: string | null;
  /** Indice de performance des coûts et estimation à l'achèvement (valeur acquise). */
  cpi: number | null;
  eac: MoneyDto | null;
  rag: RagLevel;
  headlinePercentage: number;
  headlineLabel: string;
  budget: MoneyDto;
  spent: MoneyDto;
  committed: MoneyDto;
  remaining: MoneyDto;
  spentPct: number;
  committedPct: number;
  remainingPct: number;
}

/** 8. Décisions attendues : demandes de modification à décider, problèmes escaladés, puis décisions saisies. */
export interface DecisionDto {
  source: 'CHANGE' | 'ISSUE' | null;
  code: string | null;
  description: string;
  impact: string | null;
  neededBy: string | null;
}

/** 9. Synthèse des changements. */
export interface ChangeBucketDto {
  count: number;
  impact: MoneyDto;
}

export interface ChangeSummaryDto {
  approved: ChangeBucketDto;
  pending: ChangeBucketDto;
  rejected: ChangeBucketDto;
  netCostImpact: MoneyDto;
  netScheduleImpactDays: number;
}

/** 10. Priorités de la période suivante. */
export interface PriorityDto {
  description: string;
  done: boolean;
}

/** 11. Indicateurs clés (KPIs). */
export interface KpiDto {
  key: string;
  label: string;
  value: string;
  hint: string | null;
  /** Calculé à partir du projet (sinon saisi par le chef de projet). */
  computed: boolean;
}

/** 12. Prévision & confiance de livraison : fin prévue de la WBS corrigée par l'indice de délai. */
export interface ForecastDto {
  forecastLabel: string;
  plannedDate: string | null;
  forecastDate: string | null;
  onPlan: boolean;
  confidencePercentage: number;
  confidenceLabel: string;
  statement: string;
}

/** Agrégat complet du rapport exécutif (les 12 sections). */
export interface ExecutiveStatusReportDto {
  /** Mois du rapport (AAAA-MM) : un rapport par mois et par projet. */
  period: string;
  /** Publication : le rapport est figé tel que publié ; `null` : brouillon, recalculé à chaque lecture. */
  publication: { at: string; by: string } | null;
  header: ReportHeaderDto;
  overall: OverallStatusDto;
  executiveSummary: ExecutiveSummaryDto;
  milestones: MilestoneDto[];
  scope: DimensionStatusDto;
  schedule: DimensionStatusDto;
  cost: CostStatusDto;
  /** 7. Dérivé du registre des risques (source unique), jamais saisi dans le rapport. */
  majorRisks: MajorRisksDto;
  decisions: DecisionDto[];
  changeSummary: ChangeSummaryDto;
  priorities: PriorityDto[];
  kpis: KpiDto[];
  forecast: ForecastDto;
}

/** Rapport d'un mois dans l'historique du projet. */
export interface ExecutiveReportSummaryDto {
  period: string;
  reportDate: string;
  /** Statut global publié ; `null` : brouillon. */
  publishedRag: RagLevel | null;
  publishedAt: string | null;
  publishedBy: string | null;
}

/** Clés des indicateurs calculés à partir du projet : un indicateur saisi ne peut pas en reprendre une. */
export const COMPUTED_KPI_KEYS = [
  'PROGRESS',
  'SPI',
  'CPI',
  'EAC',
  'LATE_TASKS',
  'CRITICAL_RISKS',
  'OPEN_ISSUES',
  'VERIFIED_REQUIREMENTS',
] as const;
