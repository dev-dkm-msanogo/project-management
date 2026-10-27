/**
 * Contrats du module agile : carnet de produit, itérations, tableau de suivi, vélocité et
 * burndown. En approche hybride, un élément rattaché à un lot de la WBS en fait avancer le
 * travail. Dates en ISO-8601 (YYYY-MM-DD).
 */

export type BacklogItemType = 'EPIC' | 'STORY' | 'DEFECT' | 'TECHNICAL';
export type BacklogItemStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type BacklogPriority = 'MUST' | 'SHOULD' | 'COULD' | 'WONT';

/** Échelle d'estimation en points (suite de Fibonacci). */
export const STORY_POINTS: readonly number[] = [0, 1, 2, 3, 5, 8, 13, 21];

export const BACKLOG_STATUSES: readonly BacklogItemStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

export interface BacklogItemInput {
  code: string;
  type: BacklogItemType;
  title: string;
  /** Ex. « En tant que … je veux … afin de … ». */
  description: string;
  acceptanceCriteria: string;
  priority: BacklogPriority;
  /** `null` : pas encore estimé ; une épopée n'est jamais estimée. */
  points: number | null;
  status: BacklogItemStatus;
  /** Obligatoire une fois terminé, absente sinon. */
  doneOn: string | null;
  iterationCode: string | null;
  epicCode: string | null;
  requirementCode: string | null;
  /** Lot de la WBS dont l'élément fait avancer le travail (approche hybride). */
  wbsCode: string | null;
  /** Ressource du référentiel (identifiant). */
  assigneeId: string | null;
  /** Qui a accepté l'élément (Product Owner), une fois terminé ; posé par sa décision. */
  acceptedBy: { id: string | null; name: string } | null;
  /** Dernier refus du Product Owner : motif, auteur, date ; posé par sa décision. */
  refusal: { reason: string; by: string; on: string } | null;
}

/** Décision du Product Owner sur un élément : accepter (en revue) ou refuser (motif obligatoire). */
export interface BacklogDecisionInput {
  decision: 'ACCEPT' | 'REJECT';
  comment: string | null;
}

export interface IterationInput {
  code: string;
  name: string;
  goal: string;
  start: string;
  end: string;
  /** Capacité de l'équipe en points ; `null` : non précisée. */
  capacity: number | null;
  review: string;
  wentWell: string;
  toImprove: string;
  actions: string[];
}

/** Éléments dans l'ordre de priorité ; itérations dans l'ordre chronologique. */
export interface ProductBacklogInput {
  items: BacklogItemInput[];
  iterations: IterationInput[];
}

export type IterationState = 'PLANNED' | 'ACTIVE' | 'COMPLETED';

/** Point du burndown, chaque jour ouvré : reste idéal et reste réel (absent dans le futur). */
export interface BurndownPointDto {
  date: string;
  ideal: number;
  remaining: number | null;
}

export interface IterationDto extends IterationInput {
  state: IterationState;
  committedPoints: number;
  donePoints: number;
  itemCount: number;
  doneCount: number;
  burndown: BurndownPointDto[];
}

export interface VelocityDto {
  code: string;
  name: string;
  committed: number;
  done: number;
}

/** Cumul des points terminés à la fin de chaque itération, face au périmètre du carnet. */
export interface BurnupPointDto {
  code: string;
  name: string;
  end: string;
  done: number | null;
  scope: number;
}

export interface BacklogMetricsDto {
  totalPoints: number;
  donePoints: number;
  remainingPoints: number;
  /** Éléments à réaliser non estimés. */
  unestimated: number;
  currentIteration: string | null;
  velocity: VelocityDto[];
  /** Moyenne des trois dernières itérations terminées ; `null` sans itération terminée. */
  averageVelocity: number | null;
  /** Itérations encore nécessaires au rythme moyen ; `null` sans vélocité. */
  forecastIterations: number | null;
  burnup: BurnupPointDto[];
  /** Points et éléments de chaque épopée. */
  epics: Record<string, { points: number; donePoints: number; items: number }>;
}

export interface ProductBacklogDto extends ProductBacklogInput {
  projectId: string;
  iterations: IterationDto[];
  metrics: BacklogMetricsDto;
  /** Intitulés des exigences et des lots de la WBS cités, par code ; lots disponibles pour un rattachement. */
  references: { requirements: Record<string, string>; workPackages: Record<string, string> };
  /** Définition de « terminé », rédigée dans le plan de management (approche de développement). */
  definitionOfDone: string;
  /** Product Owner désigné dans l'équipe du projet ; `null` : le chef de projet décide. */
  productOwner: { id: string; name: string } | null;
}
