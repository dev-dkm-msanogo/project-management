import type { StakeholderRegister } from '@domain/entities/stakeholder-register';
import {
  inputToStakeholderRegister,
  toStakeholderRegisterDto,
} from '@application/mappers/stakeholder-register.mappers';
import type {
  SaveStakeholderRegisterCommand,
  SaveStakeholderRegisterUseCase,
} from '@application/ports/in/stakeholder-register.use-cases';
import type { StakeholderRegisterRepository } from '@application/ports/out/stakeholder-register.repository';
import type { StakeholderRegisterDto } from '@shared/index';

export class SaveStakeholderRegisterService implements SaveStakeholderRegisterUseCase {
  /** `beforeSave` : contrôle avant enregistrement, ex. entrées retirées encore citées ailleurs. */
  constructor(
    private readonly repository: StakeholderRegisterRepository,
    private readonly beforeSave: (projectId: string, register: StakeholderRegister) => Promise<void> = async () => {},
  ) {}

  async execute(command: SaveStakeholderRegisterCommand): Promise<StakeholderRegisterDto> {
    const register = inputToStakeholderRegister(command.projectId, command.input);
    await this.beforeSave(command.projectId, register);
    await this.repository.save(register);
    return toStakeholderRegisterDto(register);
  }
}
