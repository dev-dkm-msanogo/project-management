import { CommunicationPlan } from '@domain/entities/communication-plan';
import { StakeholderEngagementPlan } from '@domain/entities/stakeholder-engagement-plan';
import type { StakeholderRegister } from '@domain/entities/stakeholder-register';
import { isoDate, parseIsoDate } from '@application/mappers/iso-date';
import { toStakeholderDto } from '@application/mappers/stakeholder-register.mappers';
import type {
  CommunicationPlanDto,
  CommunicationPlanInput,
  StakeholderEngagementPlanDto,
  StakeholderEngagementPlanInput,
} from '@shared/index';

/** Traductions du plan d'engagement et du plan de communication : domaine ⇄ saisie ⇄ lecture. */

// --- Plan d'engagement des parties prenantes ---

export function engagementPlanToInput(plan: StakeholderEngagementPlan): StakeholderEngagementPlanInput {
  const { props } = plan;
  return {
    preparedOn: isoDate(props.preparedOn),
    approaches: props.approaches.map((item) => ({ ...item, styles: [...item.styles] })),
    pendingChanges: props.pendingChanges,
    relationships: props.relationships,
  };
}

export function inputToEngagementPlan(projectId: string, input: StakeholderEngagementPlanInput): StakeholderEngagementPlan {
  return StakeholderEngagementPlan.create({ ...input, projectId, preparedOn: parseIsoDate(input.preparedOn) });
}

/** Domaine → lecture, avec la matrice d'engagement lue dans le registre des parties prenantes. */
export function toEngagementPlanDto(
  plan: StakeholderEngagementPlan,
  register: StakeholderRegister,
): StakeholderEngagementPlanDto {
  return {
    projectId: plan.projectId,
    ...engagementPlanToInput(plan),
    stakeholders: register.rankedByInfluence.map(toStakeholderDto),
    missingApproaches: plan.missingApproaches(register),
  };
}

// --- Plan de communication ---

export function communicationPlanToInput(plan: CommunicationPlan): CommunicationPlanInput {
  const { props } = plan;
  return {
    preparedOn: isoDate(props.preparedOn),
    communications: props.communications.map((item) => ({ ...item })),
    assumptions: [...props.assumptions],
    constraints: [...props.constraints],
    glossary: props.glossary.map((entry) => ({ ...entry })),
  };
}

export function inputToCommunicationPlan(projectId: string, input: CommunicationPlanInput): CommunicationPlan {
  return CommunicationPlan.create({ ...input, projectId, preparedOn: parseIsoDate(input.preparedOn) });
}

export function toCommunicationPlanDto(plan: CommunicationPlan): CommunicationPlanDto {
  return { projectId: plan.projectId, ...communicationPlanToInput(plan) };
}
