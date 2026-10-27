import { bulletList, roleList, type RoleResponsibility } from '@domain/entities/quality-management-plan';
import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, assertUniqueNames } from '@domain/value-objects/register-rules';
import { RISK_CATEGORIES, RISK_SCALE_MAX, type RiskCategory } from '@domain/value-objects/risk-classifications';

export interface ProbabilityDefinition {
  range: string;
  description: string;
}

export interface ImpactDefinition {
  scope: string;
  quality: string;
  time: string;
  cost: string;
}

export interface RiskManagementPlanProps {
  projectId: string;
  preparedOn: Date;
  strategy: string;
  methodology: string;
  roles: readonly RoleResponsibility[];
  breakdown: Readonly<Record<RiskCategory, readonly string[]>>;
  funding: string;
  contingencyProtocols: string;
  timing: string;
  tolerances: string;
  tracking: string;
  probability: readonly ProbabilityDefinition[];
  impact: readonly ImpactDefinition[];
}

const trimAll = <T extends object>(item: T): T =>
  Object.fromEntries(Object.entries(item).map(([key, value]) => [key, String(value).trim()])) as T;

/**
 * Agrégat racine : le plan de gestion des risques (template PMI). La structure de découpage
 * des risques part des catégories du registre ; les échelles de probabilité et d'impact
 * définissent les cinq niveaux utilisés pour noter chaque risque.
 */
export class RiskManagementPlan {
  private constructor(readonly props: Readonly<RiskManagementPlanProps>) {}

  static create(params: RiskManagementPlanProps): RiskManagementPlan {
    assertProjectId(params.projectId);
    if (Number.isNaN(params.preparedOn.getTime())) {
      throw new DomainError('Date de préparation du plan de gestion des risques invalide.');
    }
    if (params.probability.length !== RISK_SCALE_MAX || params.impact.length !== RISK_SCALE_MAX) {
      throw new DomainError(`Les échelles de probabilité et d'impact définissent exactement ${RISK_SCALE_MAX} niveaux.`);
    }
    const unknown = Object.keys(params.breakdown).filter((key) => !(RISK_CATEGORIES as readonly string[]).includes(key));
    if (unknown.length > 0) {
      throw new DomainError(`Catégorie de risque inconnue : ${unknown.join(', ')}.`);
    }

    const breakdown = Object.fromEntries(
      RISK_CATEGORIES.map((category) => {
        const subcategories = bulletList(params.breakdown[category] ?? []);
        assertUniqueNames(subcategories, (name) => `Sous-catégorie de risque en double : « ${name} ».`);
        return [category, subcategories];
      }),
    ) as Record<RiskCategory, string[]>;

    return new RiskManagementPlan(
      Object.freeze({
        projectId: params.projectId,
        preparedOn: new Date(params.preparedOn),
        strategy: params.strategy.trim(),
        methodology: params.methodology.trim(),
        roles: roleList(params.roles),
        breakdown,
        funding: params.funding.trim(),
        contingencyProtocols: params.contingencyProtocols.trim(),
        timing: params.timing.trim(),
        tolerances: params.tolerances.trim(),
        tracking: params.tracking.trim(),
        probability: params.probability.map(trimAll),
        impact: params.impact.map(trimAll),
      }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }
}
