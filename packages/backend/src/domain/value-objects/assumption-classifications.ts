/** Classifications du registre des hypothèses et contraintes (ensembles fermés). */

export const ASSUMPTION_KINDS = ['ASSUMPTION', 'CONSTRAINT'] as const;
export type AssumptionKind = (typeof ASSUMPTION_KINDS)[number];

export const ASSUMPTION_CATEGORIES = [
  'SCOPE',
  'SCHEDULE',
  'COST',
  'RESOURCES',
  'STAKEHOLDERS',
  'TECHNICAL',
  'QUALITY',
  'ORGANIZATIONAL',
  'EXTERNAL',
  'PROCUREMENT',
] as const;
export type AssumptionCategory = (typeof ASSUMPTION_CATEGORIES)[number];

/** Cycle de vie d'une hypothèse : à valider, puis validée ou invalidée. */
export const ASSUMPTION_STATUSES = ['TO_VALIDATE', 'VALIDATED', 'INVALIDATED'] as const;
/** Cycle de vie d'une contrainte : en vigueur, puis levée. */
export const CONSTRAINT_STATUSES = ['ACTIVE', 'LIFTED'] as const;

export type AssumptionStatus =
  | (typeof ASSUMPTION_STATUSES)[number]
  | (typeof CONSTRAINT_STATUSES)[number];

export function statusesFor(kind: AssumptionKind): readonly AssumptionStatus[] {
  return kind === 'ASSUMPTION' ? ASSUMPTION_STATUSES : CONSTRAINT_STATUSES;
}

export function isAssumptionKind(value: string): value is AssumptionKind {
  return (ASSUMPTION_KINDS as readonly string[]).includes(value);
}

export function isAssumptionCategory(value: string): value is AssumptionCategory {
  return (ASSUMPTION_CATEGORIES as readonly string[]).includes(value);
}
