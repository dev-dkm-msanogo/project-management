/**
 * Contrats des plans de gestion de la qualité (PMBOK 8 : processus 26) et des risques
 * (processus 16), alignés sur les templates « Quality Management Plan » et « Risk Management
 * Plan ». Dates en ISO-8601.
 */
import type { RiskCategory } from './risk-register';

export interface RoleResponsibilityInput {
  role: string;
  responsibility: string;
}

// --- Plan de gestion de la qualité ---

export interface QualityObjectiveInput {
  objective: string;
  /** Indicateur ou spécification, et sa mesure. */
  measure: string;
}

export interface QualityManagementPlanInput {
  preparedOn: string;
  /** Normes et référentiels applicables, un par ligne. */
  standards: string[];
  objectives: QualityObjectiveInput[];
  roles: RoleResponsibilityInput[];
  /** Livrables et processus soumis à revue qualité, un par ligne. */
  deliverables: string[];
  processes: string[];
  managementApproach: string;
  controlApproach: string;
  procedures: string;
}

export interface QualityManagementPlanDto extends QualityManagementPlanInput {
  projectId: string;
}

// --- Plan de gestion des risques ---

export interface ProbabilityDefinitionInput {
  range: string;
  description: string;
}

export interface ImpactDefinitionInput {
  scope: string;
  quality: string;
  time: string;
  cost: string;
}

export interface RiskManagementPlanInput {
  preparedOn: string;
  strategy: string;
  methodology: string;
  roles: RoleResponsibilityInput[];
  /** Structure de découpage des risques : sous-catégories de chaque catégorie du registre. */
  breakdown: Record<RiskCategory, string[]>;
  funding: string;
  contingencyProtocols: string;
  timing: string;
  tolerances: string;
  tracking: string;
  /** Définition des niveaux 1 à 5 (index 0 = niveau 1), alignés sur l'échelle du registre. */
  probability: ProbabilityDefinitionInput[];
  impact: ImpactDefinitionInput[];
}

export interface RiskManagementPlanDto extends RiskManagementPlanInput {
  projectId: string;
}
