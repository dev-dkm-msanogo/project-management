import type { ProjectPlan } from '@domain/entities/project-plan';
import type { Task } from '@domain/entities/task';
import type { TaskProgress } from '@domain/entities/task-progress';
import type { TaskStatus } from '@domain/value-objects/task-status';

/** Avancement effectif d'un élément de la WBS. */
export interface TaskTracking {
  task: Task;
  /** Sans sous-tâche : c'est elle qui reçoit l'avancement. */
  isLeaf: boolean;
  status: TaskStatus;
  /** 0 à 100, non arrondi (pondéré par les durées pour un élément parent). */
  percentComplete: number;
  actualStart: Date | null;
  actualFinish: Date | null;
  /** Dernière mesure saisie (tâche élémentaire). */
  progress: TaskProgress | null;
  /** Fin prévue dépassée sans être terminée. */
  overdue: boolean;
}

const day = (date: Date): string => date.toISOString().slice(0, 10);
const within = (code: string, root: string) => code === root || code.startsWith(`${root}.`);

/** Statut d'un élément parent déduit de ses tâches élémentaires. */
function aggregateStatus(statuses: readonly TaskStatus[]): TaskStatus {
  if (statuses.length === 0 || statuses.every((status) => status === 'NOT_STARTED')) return 'NOT_STARTED';
  if (statuses.every((status) => status === 'COMPLETE')) return 'COMPLETE';
  if (statuses.includes('IN_PROGRESS')) return 'IN_PROGRESS';
  if (statuses.includes('ON_HOLD')) return 'ON_HOLD';
  return 'IN_PROGRESS';
}

/**
 * Avancement effectif de chaque élément de la WBS : la mesure saisie pour une tâche élémentaire (à
 * défaut, son statut initial : terminée = 100 %), agrégée pour un élément parent — pourcentage
 * pondéré par les durées prévues, statut et dates réelles déduits de ses tâches élémentaires.
 */
export function trackPlan(plan: ProjectPlan, measures: readonly TaskProgress[], today: Date): TaskTracking[] {
  const codes = plan.tasks.map((task) => task.wbs.value);
  const isLeaf = (code: string) => !codes.some((other) => other !== code && within(other, code));
  const byWbs = new Map(measures.map((measure) => [measure.wbs, measure]));

  const leaves = plan.tasks
    .filter((task) => isLeaf(task.wbs.value))
    .map((task) => {
      const measure = byWbs.get(task.wbs.value) ?? null;
      return {
        code: task.wbs.value,
        weight: task.durationDays ?? 1,
        status: measure ? measure.props.status : task.status,
        percent: measure ? measure.props.percentComplete : task.status === 'COMPLETE' ? 100 : 0,
        start: measure?.props.actualStart ?? null,
        finish: measure?.props.actualFinish ?? null,
        measure,
      };
    });

  return plan.tasks.map((task) => {
    const code = task.wbs.value;
    const below = leaves.filter((leaf) => within(leaf.code, code));
    const weight = below.reduce((sum, leaf) => sum + leaf.weight, 0);
    const status = aggregateStatus(below.map((leaf) => leaf.status));
    const starts = below.flatMap((leaf) => (leaf.start ? [leaf.start] : []));
    const finishes = below.flatMap((leaf) => (leaf.finish ? [leaf.finish] : []));
    return {
      task,
      isLeaf: isLeaf(code),
      status,
      percentComplete: weight === 0 ? 0 : below.reduce((sum, leaf) => sum + leaf.weight * leaf.percent, 0) / weight,
      actualStart: starts.length > 0 ? new Date(Math.min(...starts.map((date) => date.getTime()))) : null,
      actualFinish:
        status === 'COMPLETE' && finishes.length > 0 ? new Date(Math.max(...finishes.map((date) => date.getTime()))) : null,
      progress: below.length === 1 && below[0]!.code === code ? below[0]!.measure : null,
      overdue: task.end !== null && day(task.end) < day(today) && status !== 'COMPLETE',
    };
  });
}
