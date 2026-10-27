import { AssumptionLog } from '@domain/entities/assumption-log';
import type { ScopeStatement } from '@domain/entities/scope-statement';
import { toScopeStatementDto } from '@application/mappers/scope-statement.mappers';
import type { AssumptionLogRepository } from '@application/ports/out/assumption-log.repository';
import { loadOrEmpty } from '@application/use-cases/load-or-empty';
import type { ScopeStatementDto } from '@shared/index';

/**
 * Lecture de l'énoncé du périmètre : ses contraintes et hypothèses proviennent du registre
 * des hypothèses et contraintes (source unique), relu à chaque lecture.
 */
export function scopeStatementReader(assumptions: AssumptionLogRepository) {
  return async (statement: ScopeStatement): Promise<ScopeStatementDto> =>
    toScopeStatementDto(statement, await loadOrEmpty(assumptions, statement.projectId, AssumptionLog.empty));
}
