import type { AssumptionLog } from '@domain/entities/assumption-log';
import { ScopeStatement } from '@domain/entities/scope-statement';
import { toAssumptionEntryDto } from '@application/mappers/assumption-log.mappers';
import { isoDate, parseIsoDate } from '@application/mappers/iso-date';
import type { ScopeStatementDto, ScopeStatementInput } from '@shared/index';

/** Traductions de l'énoncé du périmètre : domaine ⇄ saisie ⇄ lecture. */

export function scopeStatementToInput(statement: ScopeStatement): ScopeStatementInput {
  const { projectId: _projectId, ...props } = statement.props;
  return {
    ...props,
    preparedOn: isoDate(props.preparedOn),
    deliverables: props.deliverables.map((item) => ({ ...item })),
    acceptanceCriteria: [...props.acceptanceCriteria],
    exclusions: [...props.exclusions],
  };
}

export function inputToScopeStatement(projectId: string, input: ScopeStatementInput): ScopeStatement {
  return ScopeStatement.create({ ...input, projectId, preparedOn: parseIsoDate(input.preparedOn) });
}

/** Domaine → lecture, avec les contraintes et hypothèses en vigueur du registre. */
export function toScopeStatementDto(statement: ScopeStatement, assumptions: AssumptionLog): ScopeStatementDto {
  return {
    projectId: statement.projectId,
    ...scopeStatementToInput(statement),
    references: {
      constraints: assumptions.constraints.map(toAssumptionEntryDto),
      assumptions: assumptions.currentAssumptions.map(toAssumptionEntryDto),
    },
  };
}
