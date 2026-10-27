/**
 * Contrats de la matrice des responsabilités RACI (PMBOK 8 : processus 1, alimentée par 13,
 * 22 et 23), alignés sur le template « Responsibility Assignment Matrix ».
 */

/** R : réalise · A : rend compte (un seul par activité) · C : consulté · I : informé. */
export type RaciCode = 'R' | 'A' | 'C' | 'I';

export interface RaciParticipantInput {
  /** Identifiant stable de la colonne (référencé par les affectations). */
  key: string;
  /** Ressource du référentiel (identifiant) ; son nom est relu dans le référentiel. */
  resourceId: string;
  role: string;
}

export interface RaciActivityInput {
  name: string;
  /** Affectations par clé de participant ; un participant absent n'est pas impliqué. */
  assignments: Record<string, RaciCode>;
}

export interface ResponsibilityMatrixInput {
  preparedOn: string;
  participants: RaciParticipantInput[];
  activities: RaciActivityInput[];
}

/** Activité incomplète : il lui manque un « A » et/ou un « R ». */
export interface RaciGapDto {
  activity: string;
  missing: ('A' | 'R')[];
}

export interface ResponsibilityMatrixDto extends ResponsibilityMatrixInput {
  projectId: string;
  gaps: RaciGapDto[];
}
