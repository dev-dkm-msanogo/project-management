import { DomainError } from '@domain/errors/domain-errors';
import type { Requirement } from '@domain/entities/requirement';
import { assertProjectId, assertUniqueCodes } from '@domain/value-objects/register-rules';

export interface RequirementsMetrics {
  active: number;
  must: number;
  verified: number;
  withAcceptanceCriteriaPct: number;
  uncoveredNeeds: string[];
  unverifiable: string[];
}

/**
 * Agrégat racine : le registre des exigences d'un projet, d'où se lisent la documentation
 * des exigences et les matrices de traçabilité. Une exigence de solution ne peut satisfaire
 * qu'un besoin (exigence métier ou partie prenante) du même registre. Registre vide : valide.
 */
export class RequirementsRegister {
  private constructor(
    public readonly projectId: string,
    public readonly requirements: readonly Requirement[],
  ) {}

  static create(params: { projectId: string; requirements: readonly Requirement[] }): RequirementsRegister {
    assertProjectId(params.projectId);
    assertUniqueCodes(params.requirements, "d'exigence");

    const needs = new Set(
      params.requirements.filter((item) => item.isNeed).map((item) => item.code.toUpperCase()),
    );
    for (const requirement of params.requirements) {
      const unknown = requirement.props.satisfies.find((code) => !needs.has(code.toUpperCase()));
      if (unknown) {
        throw new DomainError(
          `L'exigence ${requirement.code} satisfait « ${unknown} », qui n'est pas une exigence métier ou partie prenante du registre.`,
        );
      }
    }
    return new RequirementsRegister(params.projectId, [...params.requirements]);
  }

  static empty(projectId: string): RequirementsRegister {
    return RequirementsRegister.create({ projectId, requirements: [] });
  }

  /** Indicateurs du plan de gestion des exigences, calculés sur les exigences actives. */
  get metrics(): RequirementsMetrics {
    const active = this.requirements.filter((item) => item.isActive);
    const covered = new Set(
      active.flatMap((item) => item.props.satisfies.map((code) => code.toUpperCase())),
    );
    const withCriteria = active.filter((item) => item.props.acceptanceCriteria !== '').length;
    return {
      active: active.length,
      must: active.filter((item) => item.props.priority === 'MUST').length,
      verified: active.filter((item) => item.props.status === 'VERIFIED').length,
      withAcceptanceCriteriaPct: active.length === 0 ? 0 : Math.round((withCriteria / active.length) * 100),
      uncoveredNeeds: active
        .filter((item) => item.isNeed && !covered.has(item.code.toUpperCase()))
        .map((item) => item.code),
      unverifiable: active
        .filter((item) => ['MUST', 'SHOULD'].includes(item.props.priority) && item.props.verification === '')
        .map((item) => item.code),
    };
  }
}
