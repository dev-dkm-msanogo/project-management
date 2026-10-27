import type {
  RequirementCategory,
  RequirementInput,
  RequirementPriority,
  RequirementStatus,
  RequirementsRegisterDto,
  RequirementsRegisterInput,
} from '@shared/index';
import { nextCode } from '@/lib/codes';

/** Libellés et règles d'affichage du registre des exigences (template PMI). */

export const REQUIREMENT_CATEGORY_LABELS: Record<RequirementCategory, string> = {
  BUSINESS: 'Métier',
  STAKEHOLDER: 'Partie prenante',
  FUNCTIONAL: 'Fonctionnelle',
  NON_FUNCTIONAL: 'Non fonctionnelle',
  TRANSITION: 'Transition',
  PROJECT: 'Projet',
};

/** Préfixe des codes par catégorie, comme le template : B-001, S-001, F-001… */
export const CATEGORY_PREFIXES: Record<RequirementCategory, string> = {
  BUSINESS: 'B',
  STAKEHOLDER: 'S',
  FUNCTIONAL: 'F',
  NON_FUNCTIONAL: 'N',
  TRANSITION: 'T',
  PROJECT: 'P',
};

export const PRIORITY_LABELS: Record<RequirementPriority, string> = {
  MUST: 'Must',
  SHOULD: 'Should',
  COULD: 'Could',
  WONT: "Won't",
};

export const PRIORITY_DESCRIPTIONS: Record<RequirementPriority, string> = {
  MUST: 'Must · indispensable',
  SHOULD: 'Should · importante',
  COULD: 'Could · souhaitable',
  WONT: "Won't · pas dans cette version",
};

export const PRIORITY_MODIFIERS: Record<RequirementPriority, 'red' | 'amber' | 'blue' | 'grey'> = {
  MUST: 'red',
  SHOULD: 'amber',
  COULD: 'blue',
  WONT: 'grey',
};

export const REQUIREMENT_STATUS_LABELS: Record<RequirementStatus, string> = {
  PROPOSED: 'Proposée',
  APPROVED: 'Approuvée',
  IN_DESIGN: 'En conception',
  IN_DEVELOPMENT: 'En développement',
  IN_TEST: 'En test',
  VERIFIED: 'Vérifiée',
  DEFERRED: 'Reportée',
  REJECTED: 'Rejetée',
};

export const REQUIREMENT_STATUS_MODIFIERS: Record<RequirementStatus, 'amber' | 'blue' | 'green' | 'grey' | 'red'> = {
  PROPOSED: 'amber',
  APPROVED: 'blue',
  IN_DESIGN: 'blue',
  IN_DEVELOPMENT: 'blue',
  IN_TEST: 'blue',
  VERIFIED: 'green',
  DEFERRED: 'grey',
  REJECTED: 'red',
};

export const CATEGORY_ORDER = Object.keys(REQUIREMENT_CATEGORY_LABELS) as RequirementCategory[];

// Miroir UX des règles du domaine (requirement.ts) — le serveur reste l'autorité.
export const NEED_CATEGORIES: readonly RequirementCategory[] = ['BUSINESS', 'STAKEHOLDER'];
export const SOLUTION_CATEGORIES: readonly RequirementCategory[] = ['FUNCTIONAL', 'NON_FUNCTIONAL', 'TRANSITION'];

export const isNeed = (requirement: Pick<RequirementInput, 'category'>): boolean =>
  NEED_CATEGORIES.includes(requirement.category);

export const isSolution = (requirement: Pick<RequirementInput, 'category'>): boolean =>
  SOLUTION_CATEGORIES.includes(requirement.category);

/** Active : ni rejetée ni reportée. */
export const isActive = (requirement: Pick<RequirementInput, 'status'>): boolean =>
  requirement.status !== 'REJECTED' && requirement.status !== 'DEFERRED';

/** Vérifiée sans critères d'acceptation ou sans méthode de vérification (refusé par le serveur). */
export const verifiedWithoutEvidence = (requirement: RequirementInput): boolean =>
  requirement.status === 'VERIFIED' &&
  (requirement.acceptanceCriteria.trim() === '' || requirement.verification.trim() === '');

/** Ordre du template : besoins (métier, parties prenantes), puis solution, puis projet. */
export const byCategoryThenCode = (a: RequirementInput, b: RequirementInput): number =>
  CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) || a.code.localeCompare(b.code);

export function blankRequirement(
  requirements: readonly RequirementInput[],
  category: RequirementCategory = 'FUNCTIONAL',
): RequirementInput {
  return {
    code: nextCode(requirements, CATEGORY_PREFIXES[category]),
    statement: '',
    source: '',
    category,
    priority: 'SHOULD',
    acceptanceCriteria: '',
    verification: '',
    phase: '',
    status: 'PROPOSED',
    businessObjective: '',
    deliverable: '',
    validation: '',
    satisfies: [],
  };
}

export function requirementsDtoToInput(dto: RequirementsRegisterDto): RequirementsRegisterInput {
  return structuredClone({ requirements: dto.requirements });
}
