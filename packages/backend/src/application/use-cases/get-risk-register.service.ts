import { RiskRegister } from '@domain/entities/risk-register';
import { toRiskRegisterDto } from '@application/mappers/risk-register.mappers';
import type { GetRiskRegisterUseCase } from '@application/ports/in/risk-register.use-cases';
import type { RiskRegisterRepository } from '@application/ports/out/risk-register.repository';
import { loadOrEmpty } from '@application/use-cases/load-or-empty';
import type { RiskRegisterDto } from '@shared/index';

export class GetRiskRegisterService implements GetRiskRegisterUseCase {
  constructor(private readonly repository: RiskRegisterRepository) {}

  async execute(query: { projectId: string }): Promise<RiskRegisterDto> {
    return toRiskRegisterDto(await loadOrEmpty(this.repository, query.projectId, RiskRegister.empty));
  }
}
