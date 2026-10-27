import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, assertUniqueCodes, entryCode, requiredText } from '@domain/value-objects/register-rules';

export interface QualityMetric {
  code: string;
  item: string;
  metric: string;
  method: string;
  target: string;
}

export interface QualityMetricsProps {
  projectId: string;
  preparedOn: Date;
  metrics: readonly QualityMetric[];
}

/**
 * Agrégat racine : les métriques qualité du projet (template « Quality Metrics ») : élément
 * mesuré, métrique, méthode de mesure et cible ; codes uniques.
 */
export class QualityMetrics {
  private constructor(readonly props: Readonly<QualityMetricsProps>) {}

  static create(params: QualityMetricsProps): QualityMetrics {
    assertProjectId(params.projectId);
    if (Number.isNaN(params.preparedOn.getTime())) {
      throw new DomainError('Date de préparation des métriques qualité invalide.');
    }
    const metrics = params.metrics.map((metric) => {
      const code = entryCode(metric.code, 'de métrique');
      return {
        code,
        item: requiredText(metric.item, `${code} : précisez l'élément mesuré.`),
        metric: requiredText(metric.metric, `${code} : précisez la métrique.`),
        method: requiredText(metric.method, `${code} : précisez la méthode de mesure.`),
        target: metric.target.trim(),
      };
    });
    assertUniqueCodes(metrics, 'de métrique');
    return new QualityMetrics(
      Object.freeze({ projectId: params.projectId, preparedOn: new Date(params.preparedOn), metrics }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }

  find(code: string): QualityMetric | undefined {
    return this.props.metrics.find((metric) => metric.code.toUpperCase() === code.toUpperCase());
  }
}
