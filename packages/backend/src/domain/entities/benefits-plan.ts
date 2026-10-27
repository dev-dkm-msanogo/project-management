import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, requiredText } from '@domain/value-objects/register-rules';

export interface BenefitMetric {
  metric: string;
  baseline: string;
  target: string;
  /** Ressource du référentiel (identifiant). */
  ownerId: string;
}

export interface PlannedBenefit {
  name: string;
  realizedFrom: string;
  sustainedThrough: string;
  metrics: readonly BenefitMetric[];
}

export interface BenefitsPlanProps {
  projectId: string;
  preparedOn: Date;
  summary: string;
  targetBenefits: readonly string[];
  strategicAlignment: string;
  benefits: readonly PlannedBenefit[];
  assumptions: readonly string[];
  risks: readonly string[];
  governance: string;
}

function lines(values: readonly string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}

/**
 * Agrégat racine : le plan de gestion des bénéfices. Chaque bénéfice a un calendrier de
 * réalisation et des indicateurs mesurables, chacun avec une cible et un responsable.
 */
export class BenefitsPlan {
  private constructor(readonly props: Readonly<BenefitsPlanProps>) {}

  static create(params: BenefitsPlanProps): BenefitsPlan {
    assertProjectId(params.projectId);
    if (Number.isNaN(params.preparedOn.getTime())) {
      throw new DomainError('Date de préparation du plan des bénéfices invalide.');
    }

    const benefits = params.benefits.map((benefit, index) => {
      const name = requiredText(benefit.name, `Le bénéfice n° ${index + 1} doit être nommé.`);
      return {
        name,
        realizedFrom: benefit.realizedFrom.trim(),
        sustainedThrough: benefit.sustainedThrough.trim(),
        metrics: benefit.metrics.map((metric, metricIndex) => {
          const label = `l'indicateur n° ${metricIndex + 1} du bénéfice « ${name} »`;
          return {
            metric: requiredText(metric.metric, `Décrivez ${label}.`),
            baseline: metric.baseline.trim(),
            target: requiredText(metric.target, `Indiquez la cible de ${label}.`),
            ownerId: requiredText(metric.ownerId, `Choisissez le responsable de ${label} dans le référentiel des ressources.`),
          };
        }),
      };
    });

    return new BenefitsPlan(
      Object.freeze({
        ...params,
        preparedOn: new Date(params.preparedOn),
        summary: params.summary.trim(),
        targetBenefits: lines(params.targetBenefits),
        strategicAlignment: params.strategicAlignment.trim(),
        benefits,
        assumptions: lines(params.assumptions),
        risks: lines(params.risks),
        governance: params.governance.trim(),
      }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }
}
