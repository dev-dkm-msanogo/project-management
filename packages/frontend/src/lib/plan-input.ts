import type { ProjectPlanDto, ProjectPlanInput } from '@shared/index';

/** Conversions entre le modèle de lecture (DTO) et le modèle de saisie du plan. */

/** Dérive un modèle de saisie éditable à partir d'un plan chargé (champs calculés exclus). */
export function planDtoToInput(dto: ProjectPlanDto): ProjectPlanInput {
  const input: ProjectPlanInput = {
    title: dto.title,
    managerId: dto.managerId,
    tasks: dto.tasks.map((task) => ({
      wbs: task.wbs,
      name: task.name,
      status: task.status,
      assigneeId: task.assigneeId,
      start: task.start,
      end: task.end,
      comments: task.comments,
    })),
  };
  return structuredClone(input);
}

/** Modèle de saisie vierge pour créer un nouveau plan (une tâche racine). */
export function blankPlanInput(): ProjectPlanInput {
  return {
    title: '',
    managerId: null,
    tasks: [
      { wbs: '1', name: '', status: 'NOT_STARTED', assigneeId: null, start: null, end: null, comments: null },
    ],
  };
}
