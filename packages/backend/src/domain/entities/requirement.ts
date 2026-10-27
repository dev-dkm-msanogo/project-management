import { DomainError } from '@domain/errors/domain-errors';
import { entryCode, requiredText } from '@domain/value-objects/register-rules';

export const REQUIREMENT_CATEGORIES = [
  'BUSINESS',
  'STAKEHOLDER',
  'FUNCTIONAL',
  'NON_FUNCTIONAL',
  'TRANSITION',
  'PROJECT',
] as const;
export type RequirementCategory = (typeof REQUIREMENT_CATEGORIES)[number];

/** Priorisation MoSCoW. */
export const REQUIREMENT_PRIORITIES = ['MUST', 'SHOULD', 'COULD', 'WONT'] as const;
export type RequirementPriority = (typeof REQUIREMENT_PRIORITIES)[number];

export const REQUIREMENT_STATUSES = [
  'PROPOSED',
  'APPROVED',
  'IN_DESIGN',
  'IN_DEVELOPMENT',
  'IN_TEST',
  'VERIFIED',
  'DEFERRED',
  'REJECTED',
] as const;
export type RequirementStatus = (typeof REQUIREMENT_STATUSES)[number];

/** Besoins exprimés (métier, parties prenantes)… */
const NEED_CATEGORIES: readonly RequirementCategory[] = ['BUSINESS', 'STAKEHOLDER'];
/** …que satisfont les exigences de solution (fonctionnelles, non fonctionnelles, transition). */
const SOLUTION_CATEGORIES: readonly RequirementCategory[] = ['FUNCTIONAL', 'NON_FUNCTIONAL', 'TRANSITION'];

const oneOf = (values: readonly string[], value: string): boolean => values.includes(value);

export interface RequirementProps {
  code: string;
  statement: string;
  source: string;
  category: RequirementCategory;
  priority: RequirementPriority;
  acceptanceCriteria: string;
  verification: string;
  phase: string;
  status: RequirementStatus;
  businessObjective: string;
  deliverable: string;
  validation: string;
  /** Codes des besoins que satisfait cette exigence de solution. */
  satisfies: readonly string[];
}

/**
 * Exigence du projet ou du produit, avec ses éléments de traçabilité (objectif métier,
 * livrable, vérification, validation). Une exigence vérifiée a forcément des critères
 * d'acceptation et une méthode de vérification.
 */
export class Requirement {
  private constructor(readonly props: Readonly<RequirementProps>) {}

  static create(params: RequirementProps): Requirement {
    const code = entryCode(params.code, "d'exigence");
    if (
      !oneOf(REQUIREMENT_CATEGORIES, params.category) ||
      !oneOf(REQUIREMENT_PRIORITIES, params.priority) ||
      !oneOf(REQUIREMENT_STATUSES, params.status)
    ) {
      throw new DomainError(`Catégorie, priorité ou statut invalide pour l'exigence ${code}.`);
    }

    const acceptanceCriteria = params.acceptanceCriteria.trim();
    const verification = params.verification.trim();
    if (params.status === 'VERIFIED' && (!acceptanceCriteria || !verification)) {
      throw new DomainError(
        `L'exigence ${code} ne peut être vérifiée sans critères d'acceptation ni méthode de vérification.`,
      );
    }

    const satisfies = [...new Set(params.satisfies.map((need) => entryCode(need, 'de besoin satisfait')))];
    if (satisfies.length > 0 && !oneOf(SOLUTION_CATEGORIES, params.category)) {
      throw new DomainError(
        `Seule une exigence fonctionnelle, non fonctionnelle ou de transition satisfait un besoin (${code}).`,
      );
    }

    return new Requirement(
      Object.freeze({
        ...params,
        code,
        statement: requiredText(params.statement, `L'exigence ${code} doit être énoncée.`),
        source: params.source.trim(),
        acceptanceCriteria,
        verification,
        phase: params.phase.trim(),
        businessObjective: params.businessObjective.trim(),
        deliverable: params.deliverable.trim(),
        validation: params.validation.trim(),
        satisfies,
      }),
    );
  }

  get code(): string {
    return this.props.code;
  }

  /** Active : ni rejetée ni reportée. */
  get isActive(): boolean {
    return this.props.status !== 'REJECTED' && this.props.status !== 'DEFERRED';
  }

  get isNeed(): boolean {
    return NEED_CATEGORIES.includes(this.props.category);
  }
}
