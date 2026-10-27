import type { ProjectPlan } from '@domain/entities/project-plan';
import type { TaskTracking } from '@domain/entities/plan-progress';
import { toTaskProgressDto } from '@application/mappers/performance.mappers';
import type { ProjectPlanDto } from '@shared/index';

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isoDateOrNull(date: Date | null): string | null {
  return date ? isoDate(date) : null;
}

/**
 * Traduit l'agrégat Plan de projet vers le DTO de lecture (champs calculés inclus) : nom de la
 * ressource affectée et avancement effectif de chaque élément (`tracking`, dans l'ordre des tâches).
 */
export function toProjectPlanDto(
  plan: ProjectPlan,
  tracking: readonly TaskTracking[],
  resourceNames: ReadonlyMap<string, string>,
): ProjectPlanDto {
  return {
    projectId: plan.project.id,
    title: plan.project.name,
    managerId: plan.managerId,
    startDate: isoDateOrNull(plan.startDate),
    endDate: isoDateOrNull(plan.endDate),
    durationDays: plan.durationDays,
    tasks: tracking.map(({ task, ...state }) => ({
      wbs: task.wbs.value,
      level: task.level,
      name: task.name,
      status: state.status,
      assigneeId: task.assigneeId,
      assignee: task.assigneeId ? (resourceNames.get(task.assigneeId) ?? null) : null,
      start: isoDateOrNull(task.start),
      end: isoDateOrNull(task.end),
      durationDays: task.durationDays,
      comments: task.comments,
      isLeaf: state.isLeaf,
      percentComplete: Math.round(state.percentComplete),
      actualStart: isoDateOrNull(state.actualStart),
      actualFinish: isoDateOrNull(state.actualFinish),
      progress: state.progress ? toTaskProgressDto(state.progress) : null,
      overdue: state.overdue,
    })),
  };
}
