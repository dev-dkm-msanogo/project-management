import { AssumptionLog } from '@domain/entities/assumption-log';
import { StakeholderRegister } from '@domain/entities/stakeholder-register';
import { CharterNotFoundError } from '@application/errors/application-errors';
import { toProjectCharterDto } from '@application/mappers/project-charter.mappers';
import type { GetProjectCharterUseCase } from '@application/ports/in/project-charter.use-cases';
import type { AssumptionLogRepository } from '@application/ports/out/assumption-log.repository';
import type { ProjectCharterRepository } from '@application/ports/out/project-charter.repository';
import type { StakeholderRegisterRepository } from '@application/ports/out/stakeholder-register.repository';
import { loadOrEmpty } from '@application/use-cases/load-or-empty';
import type { ProjectCharterDto } from '@shared/index';

/**
 * Charte du projet et ses références vivantes : parties prenantes clés, contraintes
 * et hypothèses proviennent de leurs registres (source unique).
 */
export class GetProjectCharterService implements GetProjectCharterUseCase {
  constructor(
    private readonly charters: ProjectCharterRepository,
    private readonly stakeholders: StakeholderRegisterRepository,
    private readonly assumptions: AssumptionLogRepository,
  ) {}

  async execute(query: { projectId: string }): Promise<ProjectCharterDto> {
    const [charter, stakeholders, assumptions] = await Promise.all([
      this.charters.findByProjectId(query.projectId),
      loadOrEmpty(this.stakeholders, query.projectId, StakeholderRegister.empty),
      loadOrEmpty(this.assumptions, query.projectId, AssumptionLog.empty),
    ]);
    if (!charter) {
      throw new CharterNotFoundError(query.projectId);
    }
    return toProjectCharterDto(charter, stakeholders, assumptions);
  }
}
