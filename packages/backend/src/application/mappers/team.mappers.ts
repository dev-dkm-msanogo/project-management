import { TeamAssessment } from '@domain/entities/team-assessment';
import { isoDateOrNull, parseIsoDateOrNull } from '@application/mappers/iso-date';
import type { TeamAssessmentInput } from '@shared/index';

/** Traductions de l'évaluation de l'équipe : domaine ⇄ saisie (la lecture ajoute les affectations). */

export function teamAssessmentToInput(assessment: TeamAssessment): TeamAssessmentInput {
  return {
    assessedOn: isoDateOrNull(assessment.assessedOn),
    criteria: { ...assessment.criteria },
    developmentAreas: assessment.developmentAreas.map((area) => ({ ...area, actions: [...area.actions] })),
  };
}

export function inputToTeamAssessment(projectId: string, input: TeamAssessmentInput): TeamAssessment {
  return TeamAssessment.create({
    projectId,
    assessedOn: parseIsoDateOrNull(input.assessedOn),
    criteria: input.criteria,
    developmentAreas: input.developmentAreas,
  });
}
