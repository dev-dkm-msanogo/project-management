import type { TaskProgressDto } from './performance';

/**
 * Contrats du plan de projet (WBS + Gantt).
 * Modèle de LECTURE : porte les champs calculés (niveau, durées, bornes).
 * Dates transportées en chaînes ISO-8601 (YYYY-MM-DD).
 */

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETE';

export interface TaskDto {
  wbs: string;
  level: number;
  name: string;
  /** Statut effectif : celui de l'avancement saisi (agrégé pour un élément parent). */
  status: TaskStatus;
  /** Ressource du référentiel affectée et son nom. */
  assigneeId: string | null;
  assignee: string | null;
  start: string | null;
  end: string | null;
  durationDays: number | null;
  comments: string | null;
  /** Tâche élémentaire (sans sous-tâche) : c'est elle qui reçoit l'avancement. */
  isLeaf: boolean;
  /** 0 à 100 ; agrégé (pondéré par les durées) pour un élément parent. */
  percentComplete: number;
  actualStart: string | null;
  actualFinish: string | null;
  /** Dernière mesure d'avancement d'une tâche élémentaire. */
  progress: TaskProgressDto | null;
  /** Fin prévue dépassée sans être terminée. */
  overdue: boolean;
}

export interface ProjectPlanDto {
  projectId: string;
  title: string;
  /** Chef de projet : ressource du référentiel (identifiant). */
  managerId: string | null;
  startDate: string | null;
  endDate: string | null;
  durationDays: number | null;
  tasks: TaskDto[];
}

/** Modèle d'ÉCRITURE : uniquement les champs saisis (calculés exclus). */
export interface TaskInput {
  wbs: string;
  name: string;
  /** Statut initial ; ensuite, c'est l'avancement saisi qui fait foi. */
  status: TaskStatus;
  assigneeId: string | null;
  start: string | null;
  end: string | null;
  comments: string | null;
}

export interface ProjectPlanInput {
  title: string;
  /** Chef de projet : ressource du référentiel (identifiant). */
  managerId: string | null;
  tasks: TaskInput[];
}
