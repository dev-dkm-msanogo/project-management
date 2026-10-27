import type { RiskRegister } from '@domain/entities/risk-register';
import { inputToRiskRegister, toRiskRegisterDto } from '@application/mappers/risk-register.mappers';
import type {
  SaveRiskRegisterCommand,
  SaveRiskRegisterUseCase,
} from '@application/ports/in/risk-register.use-cases';
import type { RiskRegisterRepository } from '@application/ports/out/risk-register.repository';
import type { RiskRegisterDto } from '@shared/index';

export class SaveRiskRegisterService implements SaveRiskRegisterUseCase {
  /** `beforeSave` : contrôle avant enregistrement, ex. entrées retirées encore citées ailleurs. */
  constructor(
    private readonly repository: RiskRegisterRepository,
    private readonly beforeSave: (projectId: string, register: RiskRegister) => Promise<void> = async () => {},
  ) {}

  async execute(command: SaveRiskRegisterCommand): Promise<RiskRegisterDto> {
    const register = inputToRiskRegister(command.projectId, command.input);
    await this.beforeSave(command.projectId, register);
    await this.repository.save(register);
    return toRiskRegisterDto(register);
  }
}
