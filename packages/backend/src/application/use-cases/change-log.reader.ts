import type { ChangeLog } from '@domain/entities/change-log';
import type { CostEstimates } from '@domain/entities/cost-estimates';
import { toChangeLogDto } from '@application/mappers/change-log.mappers';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import type { ChangeLogDto } from '@shared/index';

/**
 * Lecture du registre des modifications : la réserve pour aléas vient des estimations des coûts
 * (relues à chaque lecture), pour suivre ce qu'en consomment les modifications approuvées.
 */
export function changeLogReader(costEstimates: ProjectDocumentRepository<CostEstimates>) {
  return async (log: ChangeLog): Promise<ChangeLogDto> => {
    const estimates = await costEstimates.findByProjectId(log.projectId);
    return toChangeLogDto(log, estimates?.props.contingencyReserve ?? null);
  };
}
