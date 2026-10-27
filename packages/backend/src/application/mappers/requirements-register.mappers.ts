import { Requirement } from '@domain/entities/requirement';
import { RequirementsRegister } from '@domain/entities/requirements-register';
import type { RequirementsRegisterDto, RequirementsRegisterInput } from '@shared/index';

/** Traductions du registre des exigences : domaine ⇄ saisie ⇄ lecture. */

export function requirementsRegisterToInput(register: RequirementsRegister): RequirementsRegisterInput {
  return {
    requirements: register.requirements.map((item) => ({ ...item.props, satisfies: [...item.props.satisfies] })),
  };
}

export function inputToRequirementsRegister(projectId: string, input: RequirementsRegisterInput): RequirementsRegister {
  return RequirementsRegister.create({ projectId, requirements: input.requirements.map(Requirement.create) });
}

export function toRequirementsRegisterDto(register: RequirementsRegister): RequirementsRegisterDto {
  return { projectId: register.projectId, ...requirementsRegisterToInput(register), metrics: register.metrics };
}
