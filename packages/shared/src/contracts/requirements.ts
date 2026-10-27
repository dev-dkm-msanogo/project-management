/**
 * Contrats du registre des exigences (PMBOK 8 : processus 4, alimenté par 31 et 32), qui
 * produit la documentation des exigences et les matrices de traçabilité des templates PMI.
 */

export type RequirementCategory =
  | 'BUSINESS'
  | 'STAKEHOLDER'
  | 'FUNCTIONAL'
  | 'NON_FUNCTIONAL'
  | 'TRANSITION'
  | 'PROJECT';

/** Priorisation MoSCoW. */
export type RequirementPriority = 'MUST' | 'SHOULD' | 'COULD' | 'WONT';

export type RequirementStatus =
  | 'PROPOSED'
  | 'APPROVED'
  | 'IN_DESIGN'
  | 'IN_DEVELOPMENT'
  | 'IN_TEST'
  | 'VERIFIED'
  | 'DEFERRED'
  | 'REJECTED';

export interface RequirementInput {
  code: string;
  statement: string;
  /** Partie prenante à l'origine de l'exigence. */
  source: string;
  category: RequirementCategory;
  priority: RequirementPriority;
  acceptanceCriteria: string;
  /** Méthode de test ou de vérification. */
  verification: string;
  /** Phase ou version cible. */
  phase: string;
  status: RequirementStatus;
  businessObjective: string;
  deliverable: string;
  /** Validation par la partie prenante (recette, signature…). */
  validation: string;
  /** Exigences métier ou parties prenantes que cette exigence technique satisfait. */
  satisfies: string[];
}

export interface RequirementsRegisterInput {
  requirements: RequirementInput[];
}

/** Indicateurs de qualité du plan de gestion des exigences. */
export interface RequirementsMetricsDto {
  /** Exigences actives (hors rejetées et reportées). */
  active: number;
  must: number;
  verified: number;
  /** Part des exigences actives ayant des critères d'acceptation (0–100). */
  withAcceptanceCriteriaPct: number;
  /** Besoins (métier, parties prenantes) qu'aucune exigence technique ne satisfait. */
  uncoveredNeeds: string[];
  /** Exigences Must / Should sans méthode de vérification. */
  unverifiable: string[];
}

export interface RequirementsRegisterDto extends RequirementsRegisterInput {
  projectId: string;
  metrics: RequirementsMetricsDto;
}
