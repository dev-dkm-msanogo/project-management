import type { EngagementLevel, StakeholderQuadrant, StakeholderType } from '@shared/index';

/** Libellés et règles d'affichage du registre des parties prenantes. */

export const STAKEHOLDER_TYPE_LABELS: Record<StakeholderType, string> = {
  INTERNAL: 'Interne',
  EXTERNAL: 'Externe',
};

/** Du plus faible au plus fort (ordre de la matrice d'évaluation de l'engagement). */
export const ENGAGEMENT_LEVELS: readonly EngagementLevel[] = [
  'UNAWARE',
  'RESISTANT',
  'NEUTRAL',
  'SUPPORTIVE',
  'LEADING',
];

export const ENGAGEMENT_LABELS: Record<EngagementLevel, string> = {
  UNAWARE: 'Non informé',
  RESISTANT: 'Réfractaire',
  NEUTRAL: 'Neutre',
  SUPPORTIVE: 'Favorable',
  LEADING: 'Moteur',
};

export const QUADRANT_LABELS: Record<StakeholderQuadrant, string> = {
  MANAGE_CLOSELY: 'Gérer étroitement',
  KEEP_SATISFIED: 'Garder satisfait',
  KEEP_INFORMED: 'Tenir informé',
  MONITOR: 'Surveiller',
};

export const QUADRANT_HINTS: Record<StakeholderQuadrant, string> = {
  MANAGE_CLOSELY: 'Associer aux décisions',
  KEEP_SATISFIED: 'Consulter sur les sujets clés',
  KEEP_INFORMED: 'Informer régulièrement',
  MONITOR: 'Effort minimal',
};

/** Classe CSS du quadrant (teinte de la grille et des badges). */
export const QUADRANT_MODIFIERS: Record<StakeholderQuadrant, string> = {
  MANAGE_CLOSELY: 'manage',
  KEEP_SATISFIED: 'satisfy',
  KEEP_INFORMED: 'inform',
  MONITOR: 'monitor',
};

export const INFLUENCE_SCALE: readonly string[] = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];

/** Seuils « élevé » calés sur le template : pouvoir à partir de 4, intérêt à partir de 3. */
export const HIGH_POWER = 4;
export const HIGH_INTEREST = 3;

// Miroir UX des règles du domaine (stakeholder-classifications.ts) — le serveur reste l'autorité.
export function quadrantOf(power: number, interest: number): StakeholderQuadrant {
  const highPower = power >= HIGH_POWER;
  const highInterest = interest >= HIGH_INTEREST;
  if (highPower && highInterest) return 'MANAGE_CLOSELY';
  if (highPower) return 'KEEP_SATISFIED';
  if (highInterest) return 'KEEP_INFORMED';
  return 'MONITOR';
}

export function engagementGap(current: EngagementLevel, desired: EngagementLevel): number {
  return ENGAGEMENT_LEVELS.indexOf(desired) - ENGAGEMENT_LEVELS.indexOf(current);
}

/** « +2 », « Atteint » ou « −1 » (engagement au-delà du besoin). */
export function formatGap(gap: number): string {
  if (gap === 0) return 'Atteint';
  return gap > 0 ? `+${gap}` : `−${-gap}`;
}
