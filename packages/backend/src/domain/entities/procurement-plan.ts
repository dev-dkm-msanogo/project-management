import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, assertUniqueNames, requiredText } from '@domain/value-objects/register-rules';

export const INTEGRATION_AREAS = ['scope', 'schedule', 'documentation', 'risk', 'reporting'] as const;
export type ProcurementIntegration = Record<(typeof INTEGRATION_AREAS)[number], string>;

export interface ProcurementActivity {
  date: Date;
  activity: string;
}

export interface ProcurementMetric {
  item: string;
  metric: string;
  measurement: string;
}

export interface ProcurementRole {
  role: string;
  responsibility: string;
  authority: string;
}

export interface PrequalifiedSeller {
  name: string;
  description: string;
}

export interface ProcurementPlanProps {
  projectId: string;
  preparedOn: Date;
  integration: ProcurementIntegration;
  activities: readonly ProcurementActivity[];
  metrics: readonly ProcurementMetric[];
  roles: readonly ProcurementRole[];
  jurisdiction: string;
  independentEstimates: string;
  riskManagement: string;
  sellers: readonly PrequalifiedSeller[];
}

/**
 * Agrégat racine : le plan de gestion des approvisionnements (template PMI). Les activités clés
 * sont datées et rangées chronologiquement ; rôles et fournisseurs présélectionnés sont uniques.
 * Ses hypothèses et contraintes vivent dans le registre (catégorie « Approvisionnements »).
 */
export class ProcurementPlan {
  private constructor(readonly props: Readonly<ProcurementPlanProps>) {}

  static create(params: ProcurementPlanProps): ProcurementPlan {
    assertProjectId(params.projectId);
    if (Number.isNaN(params.preparedOn.getTime())) {
      throw new DomainError('Date de préparation du plan de gestion des approvisionnements invalide.');
    }

    const activities = params.activities
      .map((item, index) => {
        if (Number.isNaN(item.date.getTime())) {
          throw new DomainError(`Date invalide pour l'activité d'achat n° ${index + 1}.`);
        }
        return {
          date: new Date(item.date),
          activity: requiredText(item.activity, `Décrivez l'activité d'achat n° ${index + 1}.`),
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const metrics = params.metrics.map((item, index) => ({
      item: requiredText(item.item, `Nommez l'indicateur de performance n° ${index + 1}.`),
      metric: item.metric.trim(),
      measurement: item.measurement.trim(),
    }));

    const roles = params.roles.map((item, index) => ({
      role: requiredText(item.role, `Nommez le rôle n° ${index + 1}.`),
      responsibility: item.responsibility.trim(),
      authority: item.authority.trim(),
    }));
    assertUniqueNames(roles.map((item) => item.role), (name) => `Rôle en double : « ${name} ».`);

    const sellers = params.sellers.map((item, index) => ({
      name: requiredText(item.name, `Nommez le fournisseur présélectionné n° ${index + 1}.`),
      description: item.description.trim(),
    }));
    assertUniqueNames(sellers.map((item) => item.name), (name) => `Fournisseur en double : « ${name} ».`);

    const integration = Object.fromEntries(
      INTEGRATION_AREAS.map((area) => [area, params.integration[area].trim()]),
    ) as ProcurementIntegration;

    return new ProcurementPlan(
      Object.freeze({
        ...params,
        preparedOn: new Date(params.preparedOn),
        integration,
        activities,
        metrics,
        roles,
        jurisdiction: params.jurisdiction.trim(),
        independentEstimates: params.independentEstimates.trim(),
        riskManagement: params.riskManagement.trim(),
        sellers,
      }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }
}
