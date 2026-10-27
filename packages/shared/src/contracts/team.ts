/**
 * Contrats de l'équipe du projet (PMBOK 8 : processus 22, alimenté par 23) : affectations relues
 * dans le projet (charte, plan des ressources, RACI, WBS) et évaluation de la performance de
 * l'équipe, alignée sur le template « Team Performance Assessment ». Dates en ISO-8601.
 */
import type { TaskStatus } from './project-plan';

export type TeamRating = 'EXCEEDS' | 'MEETS' | 'NEEDS_IMPROVEMENT';

/** Critères du template : performance technique, puis compétences relationnelles. */
export type TeamCriterion =
  | 'SCOPE'
  | 'QUALITY'
  | 'SCHEDULE'
  | 'COST'
  | 'COMMUNICATION'
  | 'COLLABORATION'
  | 'CONFLICT_MANAGEMENT'
  | 'DECISION_MAKING'
  | 'MORALE';

export const TEAM_CRITERIA: readonly TeamCriterion[] = [
  'SCOPE',
  'QUALITY',
  'SCHEDULE',
  'COST',
  'COMMUNICATION',
  'COLLABORATION',
  'CONFLICT_MANAGEMENT',
  'DECISION_MAKING',
  'MORALE',
];

export interface TeamCriterionInput {
  /** `null` : pas encore évalué. */
  rating: TeamRating | null;
  comments: string;
}

/** Axe de progression de l'équipe : constat, approche et actions. */
export interface DevelopmentAreaInput {
  area: string;
  approach: string;
  actions: string[];
}

export interface TeamAssessmentInput {
  /** Date de l'évaluation ; `null` tant que l'équipe n'a pas été évaluée. */
  assessedOn: string | null;
  criteria: Record<TeamCriterion, TeamCriterionInput>;
  developmentAreas: DevelopmentAreaInput[];
}

/** Tâche élémentaire de la WBS affectée au membre. */
export interface TeamAssignmentDto {
  wbs: string;
  name: string;
  start: string | null;
  end: string | null;
  status: TaskStatus;
  percentComplete: number;
  overdue: boolean;
}

export interface TeamMemberDto {
  /** Ressource du référentiel (identifiant) ; son nom est relu dans le référentiel. */
  resourceId: string;
  /** Rôles tenus dans le projet : charte, plan des ressources, matrice RACI. */
  roles: string[];
  assignments: TeamAssignmentDto[];
  /** Période d'affectation : du début de la première tâche à la fin de la dernière. */
  start: string | null;
  end: string | null;
  /** Durée cumulée des tâches affectées, en jours. */
  workloadDays: number;
  openTasks: number;
  overdueTasks: number;
}

export interface TeamDto extends TeamAssessmentInput {
  projectId: string;
  members: TeamMemberDto[];
}
