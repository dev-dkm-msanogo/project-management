/**
 * Outils d'identification des parties prenantes (PMBOK 8 : processus 2), alignés sur les templates
 * « Stakeholder Identification Questionnaire » et « Stakeholder Mapping and Representation »
 * (grille pouvoir / intérêt, modèle de saillance, directions d'influence). Dates en ISO-8601.
 */

import type { StakeholderDto } from './stakeholder-register';

// --- Questionnaire d'identification ---

/** Questions du template, dans l'ordre (source unique, validée par le serveur). */
export const STAKEHOLDER_QUESTIONS = [
  { key: 'authorization', label: 'Qui a autorisé le projet et approuve son financement ?' },
  { key: 'delivery', label: 'Qui réalise ou pilote le travail au quotidien ?' },
  { key: 'positiveImpact', label: 'Qui bénéficiera du livrable ?' },
  { key: 'negativeImpact', label: 'Qui pourrait être pénalisé ou dérangé par le projet ?' },
  { key: 'resources', label: 'Qui fournit des ressources (personnes, budget, matériel, outils) ?' },
  { key: 'expertise', label: "Qui détient l'expertise technique ou métier nécessaire au projet ?" },
  { key: 'currentUsers', label: 'Qui utilise ou dépend de la solution actuelle ?' },
  { key: 'blockers', label: 'Qui pourrait bloquer ou accélérer fortement le projet ?' },
  { key: 'endUsers', label: 'Qui sont les utilisateurs finaux du livrable ?' },
  { key: 'regulators', label: "Des organismes de réglementation, de conformité ou d'audit sont-ils concernés ?" },
  { key: 'suppliers', label: 'Des fournisseurs, partenaires ou prestataires externes interviennent-ils ?' },
  { key: 'operations', label: 'Qui exploitera ou assurera le support du livrable après sa mise en service ?' },
  { key: 'silent', label: 'Des parties prenantes silencieuses ou sous-représentées sont-elles à inclure ?' },
  { key: 'observers', label: "Qui s'intéresse au résultat du projet sans y être directement impliqué ?" },
] as const;

export type StakeholderQuestionKey = (typeof STAKEHOLDER_QUESTIONS)[number]['key'];

export interface StakeholderQuestionnaireInput {
  preparedOn: string;
  /** Réponse à chaque question (vide : sans réponse). */
  answers: Record<StakeholderQuestionKey, string>;
}

export interface StakeholderQuestionnaireDto extends StakeholderQuestionnaireInput {
  projectId: string;
}

// --- Cartographie : modèle de saillance et directions d'influence ---

/** Catégorie du modèle de saillance, selon la combinaison pouvoir / urgence / légitimité. */
export type SalienceCategory =
  | 'DEFINITIVE'
  | 'DOMINANT'
  | 'DEPENDENT'
  | 'DANGEROUS'
  | 'DORMANT'
  | 'DISCRETIONARY'
  | 'DEMANDING'
  | 'NONE';

/** Direction de l'influence par rapport au chef de projet. */
export type InfluenceDirection = 'UPWARD' | 'DOWNWARD' | 'OUTWARD' | 'SIDEWARD';

export interface StakeholderMappingEntryInput {
  /** Code d'une partie prenante du registre. */
  stakeholderCode: string;
  /** Besoin d'une attention immédiate. */
  urgency: boolean;
  /** Implication légitime dans le projet. */
  legitimacy: boolean;
  direction: InfluenceDirection;
}

export interface StakeholderMappingInput {
  preparedOn: string;
  entries: StakeholderMappingEntryInput[];
}

export interface StakeholderMappingEntryDto extends StakeholderMappingEntryInput {
  name: string;
  role: string;
  /** Pouvoir du modèle de saillance : niveau élevé dans le registre (même seuil que la grille). */
  power: boolean;
  category: SalienceCategory;
}

export interface StakeholderMappingDto {
  projectId: string;
  preparedOn: string;
  entries: StakeholderMappingEntryDto[];
  /** Registre relu à chaque lecture (grille pouvoir / intérêt). */
  stakeholders: StakeholderDto[];
  /** Parties prenantes du registre encore absentes de la cartographie. */
  unmapped: string[];
}
