import { AssumptionLog } from '@domain/entities/assumption-log';
import { toAssumptionLogDto } from '@application/mappers/assumption-log.mappers';
import type { GetAssumptionLogUseCase } from '@application/ports/in/assumption-log.use-cases';
import type { AssumptionLogRepository } from '@application/ports/out/assumption-log.repository';
import { loadOrEmpty } from '@application/use-cases/load-or-empty';
import type { AssumptionLogDto } from '@shared/index';

export class GetAssumptionLogService implements GetAssumptionLogUseCase {
  constructor(private readonly repository: AssumptionLogRepository) {}

  async execute(query: { projectId: string }): Promise<AssumptionLogDto> {
    return toAssumptionLogDto(await loadOrEmpty(this.repository, query.projectId, AssumptionLog.empty));
  }
}
