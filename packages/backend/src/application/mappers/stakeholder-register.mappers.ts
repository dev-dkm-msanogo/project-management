import { Stakeholder } from '@domain/entities/stakeholder';
import { StakeholderRegister } from '@domain/entities/stakeholder-register';
import type {
  StakeholderDto,
  StakeholderRegisterDto,
  StakeholderRegisterInput,
} from '@shared/index';

/** Traductions du registre des parties prenantes : domaine ⇄ saisie ⇄ lecture. */

export function toStakeholderDto(stakeholder: Stakeholder): StakeholderDto {
  return {
    ...stakeholder.props,
    quadrant: stakeholder.quadrant,
    engagementGap: stakeholder.engagementGap,
  };
}

export function toStakeholderRegisterDto(register: StakeholderRegister): StakeholderRegisterDto {
  return { projectId: register.projectId, stakeholders: register.stakeholders.map(toStakeholderDto) };
}

/** Domaine → saisie (forme de persistance, champs calculés exclus). */
export function stakeholderRegisterToInput(register: StakeholderRegister): StakeholderRegisterInput {
  return { stakeholders: register.stakeholders.map((stakeholder) => ({ ...stakeholder.props })) };
}

/** Saisie → domaine (invariants revalidés). */
export function inputToStakeholderRegister(
  projectId: string,
  input: StakeholderRegisterInput,
): StakeholderRegister {
  return StakeholderRegister.create({
    projectId,
    stakeholders: input.stakeholders.map((stakeholder) => Stakeholder.create(stakeholder)),
  });
}
