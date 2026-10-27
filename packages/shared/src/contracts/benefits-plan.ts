/**
 * Contrats du plan de gestion des bénéfices (PMBOK 8 : processus 1, alimenté par 30 et 40),
 * alignés sur le template « Benefits Management Plan ». Dates en ISO-8601 (YYYY-MM-DD).
 */

/** Indicateur d'un bénéfice : mesure, situation de départ, cible et responsable. */
export interface BenefitMetricInput {
  metric: string;
  baseline: string;
  target: string;
  /** Ressource du référentiel (identifiant) ; son nom est relu dans le référentiel. */
  ownerId: string;
}

/** Bénéfice planifié : calendrier de réalisation et indicateurs de suivi. */
export interface PlannedBenefitInput {
  name: string;
  realizedFrom: string;
  sustainedThrough: string;
  metrics: BenefitMetricInput[];
}

export interface BenefitsPlanInput {
  preparedOn: string;
  /** Introduction des bénéfices visés. */
  summary: string;
  targetBenefits: string[];
  strategicAlignment: string;
  benefits: PlannedBenefitInput[];
  assumptions: string[];
  risks: string[];
  /** Revue des bénéfices et gouvernance (qui mesure, à quel rythme, transfert à la clôture). */
  governance: string;
}

/** Aucune valeur calculée : la lecture reprend la saisie. */
export interface BenefitsPlanDto extends BenefitsPlanInput {
  projectId: string;
}
