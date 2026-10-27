import type { StakeholderMapping } from '@domain/entities/stakeholder-mapping';
import { StakeholderRegister } from '@domain/entities/stakeholder-register';
import { DomainError } from '@domain/errors/domain-errors';
import { toMappingDto } from '@application/mappers/stakeholder-tools.mappers';
import type { StakeholderRegisterRepository } from '@application/ports/out/stakeholder-register.repository';
import { loadOrEmpty } from '@application/use-cases/load-or-empty';
import type { StakeholderMappingDto } from '@shared/index';

/**
 * Cartographie des parties prenantes : le registre reste la source de leur identité et de leur
 * pouvoir (relus à chaque lecture) ; chaque entrée vise une partie prenante du registre.
 */
export function stakeholderMappingServices(stakeholders: StakeholderRegisterRepository) {
  const register = (projectId: string) => loadOrEmpty(stakeholders, projectId, StakeholderRegister.empty);

  return {
    toDto: async (mapping: StakeholderMapping): Promise<StakeholderMappingDto> =>
      toMappingDto(mapping, await register(mapping.projectId)),

    beforeSave: async (mapping: StakeholderMapping): Promise<void> => {
      const unknown = mapping.unknownStakeholders(await register(mapping.projectId));
      if (unknown.length > 0) {
        throw new DomainError(`Partie(s) prenante(s) absente(s) du registre : ${unknown.join(', ')}.`);
      }
    },
  };
}
