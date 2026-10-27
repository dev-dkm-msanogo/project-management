import { ActualCost, ActualCosts } from '@domain/entities/actual-costs';
import { TaskProgress } from '@domain/entities/task-progress';
import type { ActualCostsInput, TaskProgressDto, TaskProgressInput } from '@shared/index';

/** Mesures d'avancement et dépenses réelles : saisie ⇄ domaine ⇄ lecture. */

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);
const parseIsoDate = (iso: string): Date => new Date(`${iso}T00:00:00Z`);
const parseOrNull = (iso: string | null): Date | null => (iso ? parseIsoDate(iso) : null);

export function toTaskProgressDto(progress: TaskProgress): TaskProgressDto {
  const { props } = progress;
  return {
    wbs: props.wbs,
    status: props.status,
    percentComplete: props.percentComplete,
    actualStart: props.actualStart ? isoDate(props.actualStart) : null,
    actualFinish: props.actualFinish ? isoDate(props.actualFinish) : null,
    asOf: isoDate(props.asOf),
    note: props.note,
    updatedBy: props.updatedBy,
    updatedAt: props.updatedAt.toISOString(),
  };
}

/** Forme persistée d'une mesure (une ligne par tâche). */
export type StoredTaskProgress = Omit<TaskProgressDto, 'wbs'>;

export function storedToTaskProgress(projectId: string, wbs: string, data: StoredTaskProgress): TaskProgress {
  return inputToTaskProgress(projectId, wbs, data, { by: data.updatedBy, at: new Date(data.updatedAt) }, parseIsoDate(data.asOf));
}

/** `today` : jour de référence des contrôles « jamais dans le futur ». */
export function inputToTaskProgress(
  projectId: string,
  wbs: string,
  input: TaskProgressInput,
  updated: { by: string; at: Date },
  today: Date,
): TaskProgress {
  return TaskProgress.create(
    {
      projectId,
      wbs,
      status: input.status,
      percentComplete: input.percentComplete,
      actualStart: parseOrNull(input.actualStart),
      actualFinish: parseOrNull(input.actualFinish),
      asOf: parseIsoDate(input.asOf),
      note: input.note,
      updatedBy: updated.by,
      updatedAt: updated.at,
    },
    today,
  );
}

export function inputToActualCosts(projectId: string, input: ActualCostsInput): ActualCosts {
  return ActualCosts.create({
    projectId,
    entries: input.entries.map((entry) => ActualCost.create({ ...entry, date: parseIsoDate(entry.date) })),
  });
}

export function actualCostsToInput(costs: ActualCosts): ActualCostsInput {
  return {
    entries: costs.entries.map(({ props }) => ({ ...props, date: isoDate(props.date) })),
  };
}
