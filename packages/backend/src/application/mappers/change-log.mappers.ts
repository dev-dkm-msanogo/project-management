import { ChangeLog } from '@domain/entities/change-log';
import { ChangeRequest } from '@domain/entities/change-request';
import { isoDate, isoDateOrNull, parseIsoDate, parseIsoDateOrNull } from '@application/mappers/iso-date';
import type { ChangeLogDto, ChangeLogInput, ChangeRequestInput } from '@shared/index';

/** Traductions du registre des modifications : domaine ⇄ saisie ⇄ lecture. */

function changeRequestToInput(request: ChangeRequest): ChangeRequestInput {
  const { props } = request;
  const assessment = props.assessment;
  return {
    ...props,
    submittedOn: isoDate(props.submittedOn),
    categories: [...props.categories],
    impacts: structuredClone(props.impacts),
    assessment: assessment
      ? {
          ...assessment,
          assessedOn: isoDate(assessment.assessedOn),
          alternatives: assessment.alternatives.map((item) => ({ ...item })),
          criteria: assessment.criteria.map((criterion) => ({ ...criterion, ratings: [...criterion.ratings] })),
        }
      : null,
    decidedOn: isoDateOrNull(props.decidedOn),
  };
}

function inputToChangeRequest(input: ChangeRequestInput): ChangeRequest {
  return ChangeRequest.create({
    ...input,
    submittedOn: parseIsoDate(input.submittedOn),
    assessment: input.assessment ? { ...input.assessment, assessedOn: parseIsoDate(input.assessment.assessedOn) } : null,
    decidedOn: parseIsoDateOrNull(input.decidedOn),
  });
}

export function changeLogToInput(log: ChangeLog): ChangeLogInput {
  return { requests: log.requests.map(changeRequestToInput) };
}

export function inputToChangeLog(projectId: string, input: ChangeLogInput): ChangeLog {
  return ChangeLog.create({ projectId, requests: input.requests.map(inputToChangeRequest) });
}

/** Domaine → lecture, avec la consommation de la réserve pour aléas des estimations des coûts. */
export function toChangeLogDto(log: ChangeLog, contingencyReserve: number | null): ChangeLogDto {
  const summary = log.summary;
  return {
    projectId: log.projectId,
    requests: log.requests.map((request) => ({
      ...changeRequestToInput(request),
      assessmentResult: request.assessmentResult,
    })),
    summary: {
      ...summary,
      contingency:
        contingencyReserve === null
          ? null
          : {
              reserve: contingencyReserve,
              consumed: summary.approvedCost,
              remaining: contingencyReserve - summary.approvedCost,
            },
    },
  };
}
