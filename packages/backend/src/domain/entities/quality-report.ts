import { DomainError } from '@domain/errors/domain-errors';
import type { QualityMetrics } from '@domain/entities/quality-metrics';
import { assertProjectId, entryCode, requiredText } from '@domain/value-objects/register-rules';

export const METRIC_STATUSES = ['ON_TRACK', 'AT_RISK', 'OFF_TRACK', 'NOT_STARTED'] as const;
export type MetricStatus = (typeof METRIC_STATUSES)[number];

export interface MetricStatusEntry {
  metricCode: string;
  measurement: string;
  status: MetricStatus;
}

export interface DefectSummary {
  logged: number;
  resolved: number;
  openBySeverity: readonly [number, number, number, number];
  trend: string;
  categories: string;
}

export interface QualityRecommendation {
  subject: string;
  recommendation: string;
}

export interface QualityAudit {
  name: string;
  heldOn: Date | null;
  goodPractices: string;
  improvements: string;
  deficiencies: string;
}

export interface QualityReportProps {
  projectId: string;
  preparedOn: Date;
  periodStart: Date;
  periodEnd: Date;
  statuses: readonly MetricStatusEntry[];
  defects: DefectSummary;
  recommendations: readonly QualityRecommendation[];
  audit: QualityAudit;
}

const validDate = (date: Date) => !Number.isNaN(date.getTime());
const count = (value: number, label: string) => {
  if (!Number.isInteger(value) || value < 0) throw new DomainError(`${label} : nombre entier positif ou nul attendu.`);
  return value;
};

/**
 * Agrégat racine : le rapport qualité de la dernière période (template « Quality Report ») :
 * statut de chaque métrique, synthèse des anomalies, recommandations, constats d'audit.
 */
export class QualityReport {
  private constructor(readonly props: Readonly<QualityReportProps>) {}

  static create(params: QualityReportProps): QualityReport {
    assertProjectId(params.projectId);
    const { preparedOn, periodStart, periodEnd } = params;
    if (![preparedOn, periodStart, periodEnd].every(validDate)) {
      throw new DomainError('Dates du rapport qualité invalides.');
    }
    if (periodEnd < periodStart) throw new DomainError('La période se termine avant de commencer.');
    if (preparedOn < periodStart) throw new DomainError('Le rapport ne peut être établi avant le début de sa période.');

    const seen = new Set<string>();
    const statuses = params.statuses.map((entry) => {
      const code = entryCode(entry.metricCode, 'de métrique');
      if (seen.has(code.toUpperCase())) throw new DomainError(`La métrique ${code} a deux statuts dans le rapport.`);
      seen.add(code.toUpperCase());
      if (!(METRIC_STATUSES as readonly string[]).includes(entry.status)) {
        throw new DomainError(`Statut invalide pour la métrique ${code}.`);
      }
      const measurement =
        entry.status === 'NOT_STARTED'
          ? entry.measurement.trim()
          : requiredText(entry.measurement, `${code} : indiquez la mesure actuelle.`);
      return { metricCode: code, measurement, status: entry.status };
    });

    const { defects } = params;
    const logged = count(defects.logged, 'Anomalies enregistrées');
    const resolved = count(defects.resolved, 'Anomalies résolues');
    if (resolved > logged) throw new DomainError("Plus d'anomalies résolues qu'enregistrées.");
    const open = defects.openBySeverity.map((value, index) => count(value, `Anomalies ouvertes de sévérité ${index + 1}`));
    if (open.length !== 4) throw new DomainError('Quatre niveaux de sévérité attendus.');
    const openTotal = open.reduce((total, value) => total + value, 0);
    if (openTotal !== logged - resolved) {
      throw new DomainError(
        `Les anomalies ouvertes (${openTotal}) doivent égaler les enregistrées moins les résolues (${logged - resolved}).`,
      );
    }

    const recommendations = params.recommendations.map((item, index) => ({
      subject: requiredText(item.subject, `Recommandation n° ${index + 1} : précisez son objet.`),
      recommendation: requiredText(item.recommendation, `Recommandation n° ${index + 1} : rédigez la recommandation.`),
    }));

    const { audit } = params;
    if (audit.heldOn && !validDate(audit.heldOn)) throw new DomainError("Date de l'audit qualité invalide.");

    return new QualityReport(
      Object.freeze({
        projectId: params.projectId,
        preparedOn: new Date(preparedOn),
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        statuses,
        defects: {
          logged,
          resolved,
          openBySeverity: [open[0]!, open[1]!, open[2]!, open[3]!] as const,
          trend: defects.trend.trim(),
          categories: defects.categories.trim(),
        },
        recommendations,
        audit: {
          name: audit.name.trim(),
          heldOn: audit.heldOn ? new Date(audit.heldOn) : null,
          goodPractices: audit.goodPractices.trim(),
          improvements: audit.improvements.trim(),
          deficiencies: audit.deficiencies.trim(),
        },
      }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }

  /** Statuts visant une métrique absente des métriques qualité. */
  unknownMetrics(metrics: QualityMetrics): string[] {
    return this.props.statuses.map((entry) => entry.metricCode).filter((code) => !metrics.find(code));
  }

  /** Métriques qualité sans statut dans le rapport. */
  unreported(metrics: QualityMetrics): string[] {
    const reported = new Set(this.props.statuses.map((entry) => entry.metricCode.toUpperCase()));
    return metrics.props.metrics.map((metric) => metric.code).filter((code) => !reported.has(code.toUpperCase()));
  }
}
