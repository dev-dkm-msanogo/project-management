import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId } from '@domain/value-objects/register-rules';

export const MANAGEMENT_PLAN_KINDS = [
  'SCOPE_MANAGEMENT',
  'REQUIREMENTS_MANAGEMENT',
  'SCHEDULE_MANAGEMENT',
  'FINANCIAL_MANAGEMENT',
] as const;
export type ManagementPlanKind = (typeof MANAGEMENT_PLAN_KINDS)[number];

const SECTION_KEY = /^[A-Za-z]{1,40}$/;

export interface ManagementPlan {
  preparedOn: Date;
  /** Texte de chaque section rédigée, par clé de section du template. */
  sections: Readonly<Record<string, string>>;
}

export type ManagementPlansMap = Partial<Record<ManagementPlanKind, ManagementPlan>>;

/**
 * Agrégat racine : les plans de gestion rédigés d'un projet (périmètre, exigences, finances…), un par
 * type. Un plan rédigé comporte au moins une section ; les sections vides ne sont pas
 * conservées. Les sections admises pour chaque type sont contrôlées à l'entrée de l'API.
 */
export class ManagementPlans {
  private constructor(
    public readonly projectId: string,
    public readonly plans: Readonly<ManagementPlansMap>,
  ) {}

  static create(params: { projectId: string; plans: ManagementPlansMap }): ManagementPlans {
    assertProjectId(params.projectId);

    const plans: ManagementPlansMap = {};
    for (const [kind, plan] of Object.entries(params.plans)) {
      if (!plan) continue;
      if (!(MANAGEMENT_PLAN_KINDS as readonly string[]).includes(kind)) {
        throw new DomainError(`Type de plan de gestion inconnu : ${kind}.`);
      }
      if (Number.isNaN(plan.preparedOn.getTime())) {
        throw new DomainError('Date de préparation du plan de gestion invalide.');
      }
      const sections = Object.fromEntries(
        Object.entries(plan.sections)
          .map(([key, text]) => [key, text.trim()] as const)
          .filter(([, text]) => text !== ''),
      );
      if (Object.keys(sections).some((key) => !SECTION_KEY.test(key))) {
        throw new DomainError('Section de plan de gestion invalide.');
      }
      if (Object.keys(sections).length === 0) {
        throw new DomainError('Un plan de gestion rédigé doit comporter au moins une section.');
      }
      plans[kind as ManagementPlanKind] = { preparedOn: new Date(plan.preparedOn), sections: Object.freeze(sections) };
    }
    return new ManagementPlans(params.projectId, Object.freeze(plans));
  }

  static empty(projectId: string): ManagementPlans {
    return ManagementPlans.create({ projectId, plans: {} });
  }
}
