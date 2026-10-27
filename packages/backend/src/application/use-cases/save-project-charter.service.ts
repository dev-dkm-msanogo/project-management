import { AssumptionLog } from '@domain/entities/assumption-log';
import { StakeholderRegister } from '@domain/entities/stakeholder-register';
import { inputToCharter, toProjectCharterDto } from '@application/mappers/project-charter.mappers';
import type {
  SaveProjectCharterCommand,
  SaveProjectCharterUseCase,
} from '@application/ports/in/project-charter.use-cases';
import type { AssumptionLogRepository } from '@application/ports/out/assumption-log.repository';
import type { ProjectCharterRepository } from '@application/ports/out/project-charter.repository';
import type { StakeholderRegisterRepository } from '@application/ports/out/stakeholder-register.repository';
import { loadOrEmpty } from '@application/use-cases/load-or-empty';
import type { ProjectCharterDto } from '@shared/index';

/**
 * Enregistre la charte, complète ou non : le circuit de validation exige toutes les rubriques du
 * template pour la soumettre.
 */
export class SaveProjectCharterService implements SaveProjectCharterUseCase {
  constructor(
    private readonly charters: ProjectCharterRepository,
    private readonly stakeholders: StakeholderRegisterRepository,
    private readonly assumptions: AssumptionLogRepository,
  ) {}

  async execute(command: SaveProjectCharterCommand): Promise<ProjectCharterDto> {
    const charter = inputToCharter(command.projectId, command.input);
    await this.charters.save(charter);
    const [stakeholders, assumptions] = await Promise.all([
      loadOrEmpty(this.stakeholders, command.projectId, StakeholderRegister.empty),
      loadOrEmpty(this.assumptions, command.projectId, AssumptionLog.empty),
    ]);
    return toProjectCharterDto(charter, stakeholders, assumptions);
  }
}
