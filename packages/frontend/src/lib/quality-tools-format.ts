import type {
  CauseEffectInput,
  FlowchartInput,
  FlowStepInput,
  FlowStepKind,
  MetricStatus,
  QualityAnalysesDto,
  QualityAnalysesInput,
  QualityMetricInput,
  QualityMetricsDto,
  QualityMetricsInput,
  QualityReportDto,
  QualityReportInput,
} from '@shared/index';
import { nextCode } from '@/lib/codes';
import { todayIso } from '@/lib/format';

/** Libellés, valeurs par défaut et conversions des outils qualité. */

// --- Métriques ---

export const blankMetric = (code: string): QualityMetricInput => ({ code, item: '', metric: '', method: '', target: '' });

export const blankQualityMetrics = (): QualityMetricsInput => ({ preparedOn: todayIso(), metrics: [] });

export function qualityMetricsDtoToInput(dto: QualityMetricsDto): QualityMetricsInput {
  return { preparedOn: dto.preparedOn, metrics: dto.metrics.map((metric) => ({ ...metric })) };
}

// --- Rapport ---

export const METRIC_STATUSES: readonly MetricStatus[] = ['ON_TRACK', 'AT_RISK', 'OFF_TRACK', 'NOT_STARTED'];

export const METRIC_STATUS_LABELS: Record<MetricStatus, string> = {
  ON_TRACK: 'Conforme',
  AT_RISK: 'À risque',
  OFF_TRACK: 'Hors cible',
  NOT_STARTED: 'Non démarrée',
};

/** Variante de `status-badge` de chaque statut. */
export const METRIC_STATUS_MODIFIERS: Record<MetricStatus, string> = {
  ON_TRACK: 'green',
  AT_RISK: 'amber',
  OFF_TRACK: 'red',
  NOT_STARTED: 'grey',
};

export const SEVERITY_LABELS = ['Bloquante', 'Majeure', 'Mineure', 'Cosmétique'] as const;

/** Rapport prérempli : un statut « non démarrée » par métrique. */
export function blankQualityReport(metrics: readonly QualityMetricInput[]): QualityReportInput {
  const today = todayIso();
  return {
    preparedOn: today,
    periodStart: `${today.slice(0, 8)}01`,
    periodEnd: today,
    statuses: metrics.map((metric) => ({ metricCode: metric.code, measurement: '', status: 'NOT_STARTED' })),
    defects: { logged: 0, resolved: 0, openBySeverity: [0, 0, 0, 0], trend: '', categories: '' },
    recommendations: [],
    audit: { name: '', heldOn: null, goodPractices: '', improvements: '', deficiencies: '' },
  };
}

export function qualityReportDtoToInput(dto: QualityReportDto): QualityReportInput {
  return {
    preparedOn: dto.preparedOn,
    periodStart: dto.periodStart,
    periodEnd: dto.periodEnd,
    statuses: dto.statuses.map(({ metricCode, measurement, status }) => ({ metricCode, measurement, status })),
    defects: { ...dto.defects, openBySeverity: [...dto.defects.openBySeverity] },
    recommendations: dto.recommendations.map((item) => ({ ...item })),
    audit: { ...dto.audit },
  };
}

// --- Outils d'analyse ---

export type AnalysisTab = 'affinity' | 'causes' | 'flowcharts';

export const FLOW_STEP_LABELS: Record<FlowStepKind, string> = {
  START: 'Début',
  ACTION: 'Action',
  DECISION: 'Décision',
  END: 'Fin',
};

export const FLOW_STEP_KINDS = Object.keys(FLOW_STEP_LABELS) as FlowStepKind[];

export function blankQualityAnalyses(): QualityAnalysesInput {
  return { preparedOn: todayIso(), affinity: { question: '', groups: [] }, causeEffects: [], flowcharts: [] };
}

export function qualityAnalysesDtoToInput(dto: QualityAnalysesDto): QualityAnalysesInput {
  const { projectId: _projectId, ...input } = dto;
  return structuredClone(input);
}

/** Catégories classiques des 6 M, proposées pour une nouvelle analyse des causes. */
export function blankCauseEffect(existing: readonly CauseEffectInput[]): CauseEffectInput {
  return {
    code: nextCode(existing, 'CE'),
    effect: '',
    categories: ['Personnes', 'Processus', 'Technologie', 'Données', 'Outils', 'Environnement'].map((name) => ({
      name,
      causes: [],
    })),
  };
}

export const blankStep = (steps: readonly FlowStepInput[], kind: FlowStepKind): FlowStepInput => ({
  code: nextCode(steps, 'E'),
  kind,
  label: '',
  noTarget: null,
  noLabel: '',
});

/** Nouveau logigramme : un début et une fin, à compléter. */
export function blankFlowchart(existing: readonly FlowchartInput[]): FlowchartInput {
  const start = blankStep([], 'START');
  return {
    code: nextCode(existing, 'FL'),
    name: '',
    description: '',
    steps: [start, blankStep([start], 'END')],
  };
}
