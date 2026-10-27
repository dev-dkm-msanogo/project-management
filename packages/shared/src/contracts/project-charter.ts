/**
 * Contrats de la charte du projet (PMBOK 8 : processus 1), alignés sur le template
 * « Project Charter ». Dates en chaînes ISO-8601 (YYYY-MM-DD).
 */
import type { AssumptionEntryDto } from './assumption-log';
import type { MoneyDto } from './executive-status-report';
import type { StakeholderDto } from './stakeholder-register';

/** Rubriques d'objectifs du template : périmètre, délai, coût, autre (qualité…). */
export type CharterObjectiveCategory = 'SCOPE' | 'SCHEDULE' | 'COST' | 'OTHER';

/** Niveau de risque global du projet. */
export type OverallRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/** Objectif mesurable et son critère de succès. */
export interface CharterObjectiveInput {
  category: CharterObjectiveCategory;
  objective: string;
  successCriterion: string;
}

export interface CharterMilestoneInput {
  name: string;
  targetDate: string;
}

/** Niveau d'autorité du chef de projet, par domaine de décision. */
export interface ProjectManagerAuthorityInput {
  staffing: string;
  budget: string;
  technical: string;
  conflictResolution: string;
}

export interface ProjectCharterInput {
  preparedOn: string;
  customer: string | null;
  /** Objet du projet et justification (besoin métier). */
  purpose: string;
  /** Description de haut niveau. */
  description: string;
  inScope: string[];
  outOfScope: string[];
  deliverables: string[];
  requirements: string[];
  /** Risque global : niveau et principaux domaines de risque. */
  overallRiskLevel: OverallRiskLevel | null;
  highLevelRisks: string[];
  objectives: CharterObjectiveInput[];
  milestones: CharterMilestoneInput[];
  /** Ressources financières pré-approuvées et leur source de financement. */
  budget: MoneyDto;
  fundingSource: string | null;
  /** Conditions de clôture ou d'arrêt du projet. */
  exitCriteria: string;
  /** Sponsor et chef de projet : ressources du référentiel (identifiants). */
  sponsor: { resourceId: string; role: string; authority: string };
  projectManager: { resourceId: string; authority: ProjectManagerAuthorityInput };
}

/** Éléments de la charte tirés en direct des registres (source unique, jamais ressaisis). */
export interface CharterReferencesDto {
  /** Parties prenantes du registre, de la plus à la moins influente. */
  stakeholders: StakeholderDto[];
  /** Contraintes en vigueur. */
  constraints: AssumptionEntryDto[];
  /** Hypothèses à valider ou validées (hors invalidées). */
  assumptions: AssumptionEntryDto[];
}

export interface ProjectCharterDto extends ProjectCharterInput {
  projectId: string;
  references: CharterReferencesDto;
  /** Rubriques encore à compléter pour soumettre la charte (vide : complète). */
  missingForSubmission: string[];
}
