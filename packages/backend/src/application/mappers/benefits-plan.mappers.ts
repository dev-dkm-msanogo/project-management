import { BenefitsPlan } from '@domain/entities/benefits-plan';
import { isoDate, parseIsoDate } from '@application/mappers/iso-date';
import type { BenefitsPlanDto, BenefitsPlanInput } from '@shared/index';

/** Traductions du plan de gestion des bénéfices : domaine ⇄ saisie ⇄ lecture. */

export function benefitsPlanToInput(document: BenefitsPlan): BenefitsPlanInput {
  const { projectId: _projectId, ...props } = document.props;
  return {
    ...props,
    preparedOn: isoDate(props.preparedOn),
    targetBenefits: [...props.targetBenefits],
    benefits: props.benefits.map((benefit) => ({
      ...benefit,
      metrics: benefit.metrics.map((metric) => ({ ...metric })),
    })),
    assumptions: [...props.assumptions],
    risks: [...props.risks],
  };
}

export function inputToBenefitsPlan(projectId: string, input: BenefitsPlanInput): BenefitsPlan {
  return BenefitsPlan.create({ ...input, projectId, preparedOn: parseIsoDate(input.preparedOn) });
}

export function toBenefitsPlanDto(document: BenefitsPlan): BenefitsPlanDto {
  return { projectId: document.projectId, ...benefitsPlanToInput(document) };
}
