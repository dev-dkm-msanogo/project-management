/**
 * Contrats du registre des risques (PMBOK 8 : processus 16–19, alimenté par 29 et 38).
 * Dates transportées en chaînes ISO-8601 (YYYY-MM-DD).
 */
import type { TrendDirection } from './executive-status-report';

export type RiskType = 'THREAT' | 'OPPORTUNITY';
export type RiskCategory = 'TECHNICAL' | 'MANAGEMENT' | 'ORGANIZATIONAL' | 'EXTERNAL';
export type RiskStrategy =
  | 'ESCALATE'
  | 'AVOID'
  | 'TRANSFER'
  | 'MITIGATE'
  | 'ACCEPT'
  | 'EXPLOIT'
  | 'SHARE'
  | 'ENHANCE';
export type RiskStatus =
  | 'IDENTIFIED'
  | 'ANALYZED'
  | 'RESPONSE_PLANNED'
  | 'RESPONSE_IN_PROGRESS'
  | 'CLOSED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** Impact sur chaque objectif, de 1 à 5 (échelles du plan de gestion des risques). */
export interface RiskImpactsInput {
  scope: number;
  quality: number;
  time: number;
  cost: number;
}

/** Modèle d'ÉCRITURE d'une entrée (champs saisis uniquement). */
export interface RiskEntryInput {
  code: string;
  title: string;
  description: string | null;
  type: RiskType;
  category: RiskCategory;
  probability: number;
  impacts: RiskImpactsInput;
  strategy: RiskStrategy | null;
  response: string | null;
  /** Déclencheur ou signe avant-coureur. */
  trigger: string | null;
  /** Ressource du référentiel (identifiant) ; son nom est relu dans le référentiel. */
  ownerId: string;
  status: RiskStatus;
  trend: TrendDirection;
  dueDate: string | null;
  lastReviewedOn: string | null;
  /** Risque résiduel, après la réponse : probabilité et impact, renseignés ensemble. */
  residualProbability: number | null;
  residualImpact: number | null;
  comments: string | null;
}

/**
 * Modèle de LECTURE : impact retenu (le plus fort des objectifs), score (P × I), criticité,
 * et score résiduel calculés par le domaine.
 */
export interface RiskEntryDto extends RiskEntryInput {
  impact: number;
  score: number;
  level: RiskLevel;
  residualScore: number | null;
  residualLevel: RiskLevel | null;
}

export interface RiskRegisterDto {
  projectId: string;
  risks: RiskEntryDto[];
}

/** Vue « risques majeurs » du registre, remontée au rapport exécutif (section 7). */
export interface MajorRisksDto {
  /** Risques ouverts de criticité élevée ou critique, du plus au moins critique. */
  items: RiskEntryDto[];
  /** Nombre total de risques ouverts dans le registre. */
  openCount: number;
}

export interface RiskRegisterInput {
  risks: RiskEntryInput[];
}
