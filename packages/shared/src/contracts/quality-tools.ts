/**
 * Outils qualité (PMBOK 8 : processus 26), alignés sur les templates « Quality Metrics »,
 * « Quality Report », « Affinity Diagram », « Cause and Effect Diagram » et « Flowchart ».
 * Dates en ISO-8601.
 */

// --- Métriques qualité ---

export interface QualityMetricInput {
  /** Identifiant, ex. « QM-001 ». */
  code: string;
  /** Élément mesuré, ex. « Disponibilité ». */
  item: string;
  metric: string;
  /** Méthode de mesure. */
  method: string;
  /** Cible (facultative), ex. « ≥ 99,5 % ». */
  target: string;
}

export interface QualityMetricsInput {
  preparedOn: string;
  metrics: QualityMetricInput[];
}

export interface QualityMetricsDto extends QualityMetricsInput {
  projectId: string;
}

// --- Rapport qualité ---

export type MetricStatus = 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'NOT_STARTED';

export interface MetricStatusInput {
  /** Code d'une métrique qualité. */
  metricCode: string;
  /** Mesure actuelle (facultative tant que la mesure n'a pas commencé). */
  measurement: string;
  status: MetricStatus;
}

export interface DefectSummaryInput {
  logged: number;
  resolved: number;
  /** Anomalies ouvertes par sévérité, de 1 (bloquante) à 4 : leur total = enregistrées − résolues. */
  openBySeverity: [number, number, number, number];
  trend: string;
  categories: string;
}

export interface QualityRecommendationInput {
  subject: string;
  recommendation: string;
}

export interface QualityAuditInput {
  name: string;
  heldOn: string | null;
  goodPractices: string;
  improvements: string;
  deficiencies: string;
}

export interface QualityReportInput {
  preparedOn: string;
  periodStart: string;
  periodEnd: string;
  statuses: MetricStatusInput[];
  defects: DefectSummaryInput;
  recommendations: QualityRecommendationInput[];
  audit: QualityAuditInput;
}

export interface MetricStatusDto extends MetricStatusInput {
  item: string;
  metric: string;
  target: string;
}

export interface QualityReportDto extends Omit<QualityReportInput, 'statuses'> {
  projectId: string;
  statuses: MetricStatusDto[];
  /** Métriques sans statut dans le rapport. */
  unreported: string[];
  summary: Record<MetricStatus, number>;
}

// --- Outils d'analyse : affinités, causes et effets, logigrammes ---

export interface AffinityGroupInput {
  theme: string;
  ideas: string[];
}

export interface AffinityDiagramInput {
  /** Question posée lors du remue-méninges. */
  question: string;
  groups: AffinityGroupInput[];
}

export interface CauseCategoryInput {
  /** Catégorie (personnes, processus, technologie…). */
  name: string;
  causes: string[];
}

export interface CauseEffectInput {
  /** Identifiant, ex. « CE-001 ». */
  code: string;
  /** Effet (problème) analysé. */
  effect: string;
  categories: CauseCategoryInput[];
}

export type FlowStepKind = 'START' | 'ACTION' | 'DECISION' | 'END';

export interface FlowStepInput {
  /** Identifiant de l'étape, ex. « E-001 ». */
  code: string;
  kind: FlowStepKind;
  label: string;
  /** Décision : étape vers laquelle mène « Non » (sinon `null` et `noLabel` décrit l'issue). */
  noTarget: string | null;
  noLabel: string;
}

export interface FlowchartInput {
  /** Identifiant, ex. « FL-001 ». */
  code: string;
  name: string;
  description: string;
  /** Étapes dans l'ordre : « Oui » mène à l'étape suivante. */
  steps: FlowStepInput[];
}

export interface QualityAnalysesInput {
  preparedOn: string;
  affinity: AffinityDiagramInput;
  causeEffects: CauseEffectInput[];
  flowcharts: FlowchartInput[];
}

export interface QualityAnalysesDto extends QualityAnalysesInput {
  projectId: string;
}
