import { BusinessCase } from '@domain/entities/business-case';
import { isoDate, parseIsoDate } from '@application/mappers/iso-date';
import type { BusinessCaseDto, BusinessCaseInput } from '@shared/index';

/** Traductions du business case : domaine ⇄ saisie ⇄ lecture. */

export function businessCaseToInput(document: BusinessCase): BusinessCaseInput {
  const { projectId: _projectId, ...props } = document.props;
  return {
    ...props,
    preparedOn: isoDate(props.preparedOn),
    situation: [...props.situation],
    alternatives: props.alternatives.map((item) => ({ ...item })),
    financialLines: props.financialLines.map((line) => ({ ...line, amounts: [...line.amounts] })),
    keyRisks: [...props.keyRisks],
  };
}

export function inputToBusinessCase(projectId: string, input: BusinessCaseInput): BusinessCase {
  return BusinessCase.create({ ...input, projectId, preparedOn: parseIsoDate(input.preparedOn) });
}

export function toBusinessCaseDto(document: BusinessCase): BusinessCaseDto {
  return {
    projectId: document.projectId,
    ...businessCaseToInput(document),
    financialSummary: document.financialSummary,
  };
}
