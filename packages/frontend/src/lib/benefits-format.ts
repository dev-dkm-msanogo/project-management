import type { BenefitsPlanDto, BenefitsPlanInput, PlannedBenefitInput } from '@shared/index';
import { todayIso } from '@/lib/format';

/** Conversions du plan de gestion des bénéfices (template PMI). */

export function benefitsPlanDtoToInput(dto: BenefitsPlanDto): BenefitsPlanInput {
  const { projectId: _projectId, ...input } = dto;
  return structuredClone(input);
}

export function blankBenefit(): PlannedBenefitInput {
  return { name: '', realizedFrom: '', sustainedThrough: '', metrics: [{ metric: '', baseline: '', target: '', ownerId: '' }] };
}

export function blankBenefitsPlan(): BenefitsPlanInput {
  return {
    preparedOn: todayIso(),
    summary: '',
    targetBenefits: [],
    strategicAlignment: '',
    benefits: [],
    assumptions: [],
    risks: [],
    governance: '',
  };
}
