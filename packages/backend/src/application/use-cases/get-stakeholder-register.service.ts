import { StakeholderRegister } from '@domain/entities/stakeholder-register';
import { toStakeholderRegisterDto } from '@application/mappers/stakeholder-register.mappers';
import type { GetStakeholderRegisterUseCase } from '@application/ports/in/stakeholder-register.use-cases';
import type { StakeholderRegisterRepository } from '@application/ports/out/stakeholder-register.repository';
import { loadOrEmpty } from '@application/use-cases/load-or-empty';
import type { StakeholderRegisterDto } from '@shared/index';

export class GetStakeholderRegisterService implements GetStakeholderRegisterUseCase {
  constructor(private readonly repository: StakeholderRegisterRepository) {}

  async execute(query: { projectId: string }): Promise<StakeholderRegisterDto> {
    return toStakeholderRegisterDto(
      await loadOrEmpty(this.repository, query.projectId, StakeholderRegister.empty),
    );
  }
}
