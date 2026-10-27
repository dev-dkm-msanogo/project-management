import { ResourceManagementPlan } from '@domain/entities/resource-management-plan';
import { ResourceRequirement, ResourceRequirements } from '@domain/entities/resource-requirements';
import { TeamCharter } from '@domain/entities/team-charter';
import { isoDate, isoDateOrNull, parseIsoDate, parseIsoDateOrNull } from '@application/mappers/iso-date';
import type {
  ResourceManagementPlanDto,
  ResourceManagementPlanInput,
  ResourceRequirementInput,
  ResourceRequirementsDto,
  ResourceRequirementsInput,
  TeamCharterDto,
  TeamCharterInput,
} from '@shared/index';

/** Traductions des documents de ressources : domaine ⇄ saisie ⇄ lecture. */

const requirementToInput = (item: ResourceRequirement): ResourceRequirementInput => ({ ...item.props });

// --- Besoins en ressources ---

export function resourceRequirementsToInput(register: ResourceRequirements): ResourceRequirementsInput {
  return { requirements: register.requirements.map(requirementToInput), narrative: { ...register.narrative } };
}

export function inputToResourceRequirements(projectId: string, input: ResourceRequirementsInput): ResourceRequirements {
  return ResourceRequirements.create({
    projectId,
    requirements: input.requirements.map(ResourceRequirement.create),
    narrative: input.narrative,
  });
}

export function toResourceRequirementsDto(register: ResourceRequirements): ResourceRequirementsDto {
  return { projectId: register.projectId, ...resourceRequirementsToInput(register) };
}

// --- Plan de gestion des ressources ---

export function resourcePlanToInput(plan: ResourceManagementPlan): ResourceManagementPlanInput {
  const { projectId: _projectId, ...props } = plan.props;
  return { ...props, preparedOn: isoDate(props.preparedOn), roles: props.roles.map((role) => ({ ...role })) };
}

export function inputToResourcePlan(projectId: string, input: ResourceManagementPlanInput): ResourceManagementPlan {
  return ResourceManagementPlan.create({ ...input, projectId, preparedOn: parseIsoDate(input.preparedOn) });
}

/** Domaine → lecture, avec l'équipe et les ressources physiques des besoins en ressources. */
export function toResourcePlanDto(
  plan: ResourceManagementPlan,
  requirements: ResourceRequirements,
): ResourceManagementPlanDto {
  return {
    projectId: plan.projectId,
    ...resourcePlanToInput(plan),
    references: {
      team: requirements.team.map(requirementToInput),
      physical: requirements.physical.map(requirementToInput),
    },
  };
}

// --- Charte de l'équipe ---

export function teamCharterToInput(charter: TeamCharter): TeamCharterInput {
  const { projectId: _projectId, ...props } = charter.props;
  return {
    ...props,
    preparedOn: isoDate(props.preparedOn),
    values: [...props.values],
    meetingGuidelines: [...props.meetingGuidelines],
    communicationGuidelines: [...props.communicationGuidelines],
    otherAgreements: [...props.otherAgreements],
    signatures: props.signatures.map((signature) => ({ ...signature, signedOn: isoDateOrNull(signature.signedOn) })),
  };
}

export function inputToTeamCharter(projectId: string, input: TeamCharterInput): TeamCharter {
  return TeamCharter.create({
    ...input,
    projectId,
    preparedOn: parseIsoDate(input.preparedOn),
    signatures: input.signatures.map((signature) => ({
      ...signature,
      signedOn: parseIsoDateOrNull(signature.signedOn),
    })),
  });
}

export function toTeamCharterDto(charter: TeamCharter): TeamCharterDto {
  return { projectId: charter.projectId, ...teamCharterToInput(charter) };
}
