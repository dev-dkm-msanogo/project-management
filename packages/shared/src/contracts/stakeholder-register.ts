/**
 * Contrats du registre des parties prenantes (PMBOK 8 : processus 2, alimenté par 14, 24 et 36),
 * alignés sur le template « Stakeholder Register ». Minimisation des données (RGPD) : seul un
 * contact professionnel facultatif est conservé, jamais de coordonnées personnelles.
 */

export type StakeholderType = 'INTERNAL' | 'EXTERNAL';

/** Niveaux d'engagement de la matrice d'évaluation PMBOK, du plus faible au plus fort. */
export type EngagementLevel = 'UNAWARE' | 'RESISTANT' | 'NEUTRAL' | 'SUPPORTIVE' | 'LEADING';

/** Quadrant de la grille pouvoir / intérêt, qui détermine la stratégie d'engagement. */
export type StakeholderQuadrant = 'MANAGE_CLOSELY' | 'KEEP_SATISFIED' | 'KEEP_INFORMED' | 'MONITOR';

export interface StakeholderInput {
  code: string;
  name: string;
  role: string;
  organization: string | null;
  type: StakeholderType;
  /** Contact professionnel facultatif (e-mail pro, boîte de service, canal). */
  contact: string | null;
  /** Pouvoir (influence sur les décisions), de 1 à 5. */
  power: number;
  /** Intérêt pour le projet, de 1 à 5. */
  interest: number;
  currentEngagement: EngagementLevel;
  desiredEngagement: EngagementLevel;
  requirements: string | null;
  expectations: string | null;
  strategy: string | null;
}

export interface StakeholderDto extends StakeholderInput {
  quadrant: StakeholderQuadrant;
  /** Écart d'engagement en niveaux (souhaité − actuel) ; positif = à faire progresser. */
  engagementGap: number;
}

export interface StakeholderRegisterDto {
  projectId: string;
  stakeholders: StakeholderDto[];
}

export interface StakeholderRegisterInput {
  stakeholders: StakeholderInput[];
}
