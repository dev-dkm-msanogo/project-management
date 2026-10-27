import type { StakeholderInput, StakeholderRegisterDto, StakeholderRegisterInput } from '@shared/index';

/** Conversions entre le modèle de lecture et le modèle de saisie du registre des parties prenantes. */

export function stakeholderRegisterDtoToInput(dto: StakeholderRegisterDto): StakeholderRegisterInput {
  const input: StakeholderRegisterInput = {
    stakeholders: dto.stakeholders.map(({ quadrant: _quadrant, engagementGap: _gap, ...stakeholder }) => stakeholder),
  };
  return structuredClone(input);
}

/** Nouvelle partie prenante identifiée, analyse par défaut au milieu des échelles. */
export function blankStakeholder(code: string): StakeholderInput {
  return {
    code,
    name: '',
    role: '',
    organization: null,
    type: 'INTERNAL',
    contact: null,
    power: 3,
    interest: 3,
    currentEngagement: 'NEUTRAL',
    desiredEngagement: 'SUPPORTIVE',
    requirements: null,
    expectations: null,
    strategy: null,
  };
}
