import { AssumptionLog } from '@domain/entities/assumption-log';
import type { ProcurementPlan } from '@domain/entities/procurement-plan';
import { toProcurementPlanDto } from '@application/mappers/procurement.mappers';
import type { AssumptionLogRepository } from '@application/ports/out/assumption-log.repository';
import { loadOrEmpty } from '@application/use-cases/load-or-empty';
import type { ProcurementPlanDto } from '@shared/index';

/**
 * Lecture du plan de gestion des approvisionnements : ses contraintes et hypothèses proviennent
 * du registre (catégorie « Approvisionnements », source unique), relu à chaque lecture.
 */
export function procurementPlanReader(assumptions: AssumptionLogRepository) {
  return async (plan: ProcurementPlan): Promise<ProcurementPlanDto> =>
    toProcurementPlanDto(plan, await loadOrEmpty(assumptions, plan.projectId, AssumptionLog.empty));
}
