/** Classifications du registre des parties prenantes (ensembles fermés). */

export const STAKEHOLDER_TYPES = ['INTERNAL', 'EXTERNAL'] as const;
export type StakeholderType = (typeof STAKEHOLDER_TYPES)[number];

/** Matrice d'évaluation de l'engagement (PMBOK), du plus faible au plus fort. */
export const ENGAGEMENT_LEVELS = ['UNAWARE', 'RESISTANT', 'NEUTRAL', 'SUPPORTIVE', 'LEADING'] as const;
export type EngagementLevel = (typeof ENGAGEMENT_LEVELS)[number];

export type StakeholderQuadrant = 'MANAGE_CLOSELY' | 'KEEP_SATISFIED' | 'KEEP_INFORMED' | 'MONITOR';

/**
 * Seuils « élevé » de la grille pouvoir / intérêt (échelle 1–5), calés sur le template :
 * un pouvoir moyen reste « tenir informé », un intérêt moyen compte comme élevé.
 */
export const HIGH_POWER = 4;
export const HIGH_INTEREST = 3;

/** Grille pouvoir / intérêt : la position détermine la stratégie d'engagement. */
export function quadrantOf(power: number, interest: number): StakeholderQuadrant {
  const highPower = power >= HIGH_POWER;
  const highInterest = interest >= HIGH_INTEREST;
  if (highPower && highInterest) return 'MANAGE_CLOSELY';
  if (highPower) return 'KEEP_SATISFIED';
  if (highInterest) return 'KEEP_INFORMED';
  return 'MONITOR';
}

/** Directions de l'influence par rapport au chef de projet. */
export const INFLUENCE_DIRECTIONS = ['UPWARD', 'DOWNWARD', 'OUTWARD', 'SIDEWARD'] as const;
export type InfluenceDirection = (typeof INFLUENCE_DIRECTIONS)[number];

export type SalienceCategory =
  | 'DEFINITIVE'
  | 'DOMINANT'
  | 'DEPENDENT'
  | 'DANGEROUS'
  | 'DORMANT'
  | 'DISCRETIONARY'
  | 'DEMANDING'
  | 'NONE';

/** Modèle de saillance : la combinaison pouvoir / urgence / légitimité fixe la catégorie. */
export function salienceOf(power: boolean, urgency: boolean, legitimacy: boolean): SalienceCategory {
  if (power && urgency && legitimacy) return 'DEFINITIVE';
  if (power && legitimacy) return 'DOMINANT';
  if (urgency && legitimacy) return 'DEPENDENT';
  if (power && urgency) return 'DANGEROUS';
  if (power) return 'DORMANT';
  if (legitimacy) return 'DISCRETIONARY';
  if (urgency) return 'DEMANDING';
  return 'NONE';
}

export function engagementRank(level: EngagementLevel): number {
  return ENGAGEMENT_LEVELS.indexOf(level);
}

export function isStakeholderType(value: string): value is StakeholderType {
  return (STAKEHOLDER_TYPES as readonly string[]).includes(value);
}

export function isEngagementLevel(value: string): value is EngagementLevel {
  return (ENGAGEMENT_LEVELS as readonly string[]).includes(value);
}
