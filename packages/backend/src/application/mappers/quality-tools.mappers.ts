import { QualityAnalyses } from '@domain/entities/quality-analyses';
import { QualityMetrics } from '@domain/entities/quality-metrics';
import { METRIC_STATUSES, QualityReport } from '@domain/entities/quality-report';
import { isoDate, isoDateOrNull, parseIsoDate, parseIsoDateOrNull } from '@application/mappers/iso-date';
import type {
  MetricStatus,
  QualityAnalysesDto,
  QualityAnalysesInput,
  QualityMetricsDto,
  QualityMetricsInput,
  QualityReportDto,
  QualityReportInput,
} from '@shared/index';

/** Traductions des outils qualité : domaine ⇄ saisie ⇄ lecture. */

// --- Métriques ---

export function qualityMetricsToInput(metrics: QualityMetrics): QualityMetricsInput {
  return { preparedOn: isoDate(metrics.props.preparedOn), metrics: metrics.props.metrics.map((metric) => ({ ...metric })) };
}

export function inputToQualityMetrics(projectId: string, input: QualityMetricsInput): QualityMetrics {
  return QualityMetrics.create({ projectId, preparedOn: parseIsoDate(input.preparedOn), metrics: input.metrics });
}

export function toQualityMetricsDto(metrics: QualityMetrics): QualityMetricsDto {
  return { projectId: metrics.projectId, ...qualityMetricsToInput(metrics) };
}

// --- Rapport ---

export function qualityReportToInput(report: QualityReport): QualityReportInput {
  const { props } = report;
  return {
    preparedOn: isoDate(props.preparedOn),
    periodStart: isoDate(props.periodStart),
    periodEnd: isoDate(props.periodEnd),
    statuses: props.statuses.map((entry) => ({ ...entry })),
    defects: { ...props.defects, openBySeverity: [...props.defects.openBySeverity] },
    recommendations: props.recommendations.map((item) => ({ ...item })),
    audit: { ...props.audit, heldOn: isoDateOrNull(props.audit.heldOn) },
  };
}

export function inputToQualityReport(projectId: string, input: QualityReportInput): QualityReport {
  return QualityReport.create({
    projectId,
    preparedOn: parseIsoDate(input.preparedOn),
    periodStart: parseIsoDate(input.periodStart),
    periodEnd: parseIsoDate(input.periodEnd),
    statuses: input.statuses,
    defects: input.defects,
    recommendations: input.recommendations,
    audit: { ...input.audit, heldOn: parseIsoDateOrNull(input.audit.heldOn) },
  });
}

/** Domaine → lecture : intitulé et cible de chaque métrique relus, métriques sans statut, synthèse. */
export function toQualityReportDto(report: QualityReport, metrics: QualityMetrics | null): QualityReportDto {
  const input = qualityReportToInput(report);
  const summary = Object.fromEntries(METRIC_STATUSES.map((status) => [status, 0])) as Record<MetricStatus, number>;
  for (const entry of input.statuses) summary[entry.status] += 1;
  return {
    projectId: report.projectId,
    ...input,
    statuses: input.statuses.map((entry) => {
      const metric = metrics?.find(entry.metricCode);
      return { ...entry, item: metric?.item ?? entry.metricCode, metric: metric?.metric ?? '', target: metric?.target ?? '' };
    }),
    unreported: metrics ? report.unreported(metrics) : [],
    summary,
  };
}

// --- Outils d'analyse ---

export function qualityAnalysesToInput(analyses: QualityAnalyses): QualityAnalysesInput {
  const { props } = analyses;
  return {
    preparedOn: isoDate(props.preparedOn),
    affinity: {
      question: props.affinity.question,
      groups: props.affinity.groups.map((group) => ({ theme: group.theme, ideas: [...group.ideas] })),
    },
    causeEffects: props.causeEffects.map((analysis) => ({
      ...analysis,
      categories: analysis.categories.map((category) => ({ name: category.name, causes: [...category.causes] })),
    })),
    flowcharts: props.flowcharts.map((flowchart) => ({ ...flowchart, steps: flowchart.steps.map((step) => ({ ...step })) })),
  };
}

export function inputToQualityAnalyses(projectId: string, input: QualityAnalysesInput): QualityAnalyses {
  return QualityAnalyses.create({ ...input, projectId, preparedOn: parseIsoDate(input.preparedOn) });
}

export function toQualityAnalysesDto(analyses: QualityAnalyses): QualityAnalysesDto {
  return { projectId: analyses.projectId, ...qualityAnalysesToInput(analyses) };
}
