import { ResponsibilityMatrix } from '@domain/entities/responsibility-matrix';
import { isoDate, parseIsoDate } from '@application/mappers/iso-date';
import type { ResponsibilityMatrixDto, ResponsibilityMatrixInput } from '@shared/index';

/** Traductions de la matrice RACI : domaine ⇄ saisie ⇄ lecture. */

export function responsibilityMatrixToInput(document: ResponsibilityMatrix): ResponsibilityMatrixInput {
  return {
    preparedOn: isoDate(document.props.preparedOn),
    participants: document.props.participants.map((participant) => ({ ...participant })),
    activities: document.props.activities.map((activity) => ({
      name: activity.name,
      assignments: { ...activity.assignments },
    })),
  };
}

export function inputToResponsibilityMatrix(
  projectId: string,
  input: ResponsibilityMatrixInput,
): ResponsibilityMatrix {
  return ResponsibilityMatrix.create({ ...input, projectId, preparedOn: parseIsoDate(input.preparedOn) });
}

export function toResponsibilityMatrixDto(document: ResponsibilityMatrix): ResponsibilityMatrixDto {
  return { projectId: document.projectId, ...responsibilityMatrixToInput(document), gaps: document.gaps };
}
