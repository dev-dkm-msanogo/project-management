import type { ProjectCharterDto, ScopeStatementDto, ScopeStatementInput } from '@shared/index';
import { todayIso } from '@/lib/format';

/** Conversions de l'énoncé du périmètre (template PMI). */

export function scopeStatementDtoToInput(dto: ScopeStatementDto): ScopeStatementInput {
  const { projectId: _projectId, references: _references, ...input } = dto;
  return structuredClone(input);
}

/**
 * Nouvel énoncé, prérempli depuis la charte quand elle existe (élaboration progressive) :
 * description, livrables et exclusions de haut niveau, à détailler ensuite.
 */
export function blankScopeStatement(charter: ProjectCharterDto | null): ScopeStatementInput {
  return {
    preparedOn: todayIso(),
    description: charter?.description ?? '',
    deliverables: (charter?.deliverables ?? []).map((name) => ({ name, description: '' })),
    acceptanceCriteria: [],
    exclusions: [...(charter?.outOfScope ?? [])],
  };
}
