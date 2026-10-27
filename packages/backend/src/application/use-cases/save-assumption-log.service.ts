import { DomainError } from '@domain/errors/domain-errors';
import { RiskRegister } from '@domain/entities/risk-register';
import { inputToAssumptionLog, toAssumptionLogDto } from '@application/mappers/assumption-log.mappers';
import type {
  SaveAssumptionLogCommand,
  SaveAssumptionLogUseCase,
} from '@application/ports/in/assumption-log.use-cases';
import type { AssumptionLogRepository } from '@application/ports/out/assumption-log.repository';
import type { RiskRegisterRepository } from '@application/ports/out/risk-register.repository';
import { loadOrEmpty } from '@application/use-cases/load-or-empty';
import type { AssumptionLogDto } from '@shared/index';

/**
 * Enregistre le registre des hypothèses et contraintes après avoir vérifié que chaque
 * risque lié existe dans le registre des risques du projet (intégrité référentielle).
 */
export class SaveAssumptionLogService implements SaveAssumptionLogUseCase {
  constructor(
    private readonly repository: AssumptionLogRepository,
    private readonly risks: RiskRegisterRepository,
  ) {}

  async execute(command: SaveAssumptionLogCommand): Promise<AssumptionLogDto> {
    const log = inputToAssumptionLog(command.projectId, command.input);
    const register = await loadOrEmpty(this.risks, command.projectId, RiskRegister.empty);
    const unknown = log.unknownRiskReferences(register.risks.map((risk) => risk.code));
    if (unknown.length > 0) {
      throw new DomainError(`Risque(s) absent(s) du registre des risques : ${unknown.join(', ')}.`);
    }
    await this.repository.save(log);
    return toAssumptionLogDto(log);
  }
}
