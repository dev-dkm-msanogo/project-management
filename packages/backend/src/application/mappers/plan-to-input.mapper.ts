import type { ProjectPlan } from '@domain/entities/project-plan';
import type { ProjectPlanInput } from '@shared/index';

function isoDateOrNull(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

/** Sérialise le plan du domaine vers son modèle de SAISIE (forme de persistance). */
export function planToInput(plan: ProjectPlan): ProjectPlanInput {
  return {
    title: plan.project.name,
    managerId: plan.managerId,
    tasks: plan.tasks.map((task) => ({
      wbs: task.wbs.value,
      name: task.name,
      status: task.status,
      assigneeId: task.assigneeId,
      start: isoDateOrNull(task.start),
      end: isoDateOrNull(task.end),
      comments: task.comments,
    })),
  };
}
