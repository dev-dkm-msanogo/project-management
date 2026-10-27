import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, assertUniqueNames, requiredText } from '@domain/value-objects/register-rules';

export interface RoleResponsibility {
  role: string;
  responsibility: string;
}

export interface QualityObjective {
  objective: string;
  measure: string;
}

export interface QualityManagementPlanProps {
  projectId: string;
  preparedOn: Date;
  standards: readonly string[];
  objectives: readonly QualityObjective[];
  roles: readonly RoleResponsibility[];
  deliverables: readonly string[];
  processes: readonly string[];
  managementApproach: string;
  controlApproach: string;
  procedures: string;
}

/** Liste à puces : éléments rognés, lignes vides retirées. */
export const bulletList = (items: readonly string[]): string[] =>
  items.map((item) => item.trim()).filter((item) => item !== '');

/** Rôles nommés, uniques sans distinction de casse. */
export function roleList(roles: readonly RoleResponsibility[]): RoleResponsibility[] {
  const list = roles.map((item, index) => ({
    role: requiredText(item.role, `Nommez le rôle n° ${index + 1}.`),
    responsibility: item.responsibility.trim(),
  }));
  assertUniqueNames(list.map((item) => item.role), (name) => `Rôle en double : « ${name} ».`);
  return list;
}

/**
 * Agrégat racine : le plan de gestion de la qualité (template PMI). Chaque objectif qualité est
 * énoncé et mesurable ; les rôles sont uniques.
 */
export class QualityManagementPlan {
  private constructor(readonly props: Readonly<QualityManagementPlanProps>) {}

  static create(params: QualityManagementPlanProps): QualityManagementPlan {
    assertProjectId(params.projectId);
    if (Number.isNaN(params.preparedOn.getTime())) {
      throw new DomainError('Date de préparation du plan de gestion de la qualité invalide.');
    }

    const objectives = params.objectives.map((item, index) => ({
      objective: requiredText(item.objective, `Énoncez l'objectif qualité n° ${index + 1}.`),
      measure: requiredText(item.measure, `Précisez comment mesurer l'objectif qualité n° ${index + 1}.`),
    }));

    return new QualityManagementPlan(
      Object.freeze({
        projectId: params.projectId,
        preparedOn: new Date(params.preparedOn),
        standards: bulletList(params.standards),
        objectives,
        roles: roleList(params.roles),
        deliverables: bulletList(params.deliverables),
        processes: bulletList(params.processes),
        managementApproach: params.managementApproach.trim(),
        controlApproach: params.controlApproach.trim(),
        procedures: params.procedures.trim(),
      }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }
}
