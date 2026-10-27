import { ManagementPlans, type ManagementPlansMap } from '@domain/entities/management-plans';
import { isoDate, parseIsoDate } from '@application/mappers/iso-date';
import type { ManagementPlansDto, ManagementPlansInput } from '@shared/index';

/** Traductions des plans de gestion : domaine ⇄ saisie ⇄ lecture. */

export function managementPlansToInput(document: ManagementPlans): ManagementPlansInput {
  return {
    plans: Object.fromEntries(
      Object.entries(document.plans).map(([kind, plan]) => [
        kind,
        { preparedOn: isoDate(plan.preparedOn), sections: { ...plan.sections } },
      ]),
    ),
  };
}

export function inputToManagementPlans(projectId: string, input: ManagementPlansInput): ManagementPlans {
  const plans: ManagementPlansMap = Object.fromEntries(
    Object.entries(input.plans).map(([kind, plan]) => [
      kind,
      { preparedOn: parseIsoDate(plan.preparedOn), sections: plan.sections },
    ]),
  );
  return ManagementPlans.create({ projectId, plans });
}

export function toManagementPlansDto(document: ManagementPlans): ManagementPlansDto {
  return { projectId: document.projectId, ...managementPlansToInput(document) };
}
