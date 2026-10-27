import { Project } from '@domain/entities/project';
import { ProjectPlan } from '@domain/entities/project-plan';
import { Task } from '@domain/entities/task';
import type { ProjectPlanInput } from '@shared/index';

function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function parseIsoDateOrNull(iso: string | null): Date | null {
  return iso ? parseIsoDate(iso) : null;
}

/** Traduit le modèle de saisie vers l'agrégat du domaine (revalide les invariants). */
export function inputToPlan(projectId: string, input: ProjectPlanInput): ProjectPlan {
  const managerId = input.managerId?.trim();
  return ProjectPlan.create({
    project: Project.create(projectId, input.title),
    managerId: managerId ? managerId : null,
    tasks: input.tasks.map((task) =>
      Task.create({
        wbs: task.wbs,
        name: task.name,
        status: task.status,
        assigneeId: task.assigneeId,
        start: parseIsoDateOrNull(task.start),
        end: parseIsoDateOrNull(task.end),
        comments: task.comments,
      }),
    ),
  });
}
