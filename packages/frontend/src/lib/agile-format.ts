import type {
  BacklogItemInput,
  BacklogItemStatus,
  BacklogItemType,
  IterationInput,
  IterationState,
  ProductBacklogDto,
  ProductBacklogInput,
} from '@shared/index';
import { nextCode } from '@/lib/codes';
import { todayIso } from '@/lib/format';

/** Libellés, codes et formes de saisie du module agile. */

export const ITEM_TYPE_LABELS: Record<BacklogItemType, string> = {
  EPIC: 'Épopée',
  STORY: 'Récit utilisateur',
  DEFECT: 'Anomalie',
  TECHNICAL: 'Élément technique',
};

/** Préfixe des codes proposés pour chaque type d'élément. */
export const ITEM_TYPE_PREFIXES: Record<BacklogItemType, string> = {
  EPIC: 'EP',
  STORY: 'US',
  DEFECT: 'AN',
  TECHNICAL: 'TK',
};

export const ITEM_STATUS_LABELS: Record<BacklogItemStatus, string> = {
  TODO: 'À faire',
  IN_PROGRESS: 'En cours',
  IN_REVIEW: 'En revue',
  DONE: 'Terminé',
};

export const ITEM_STATUS_MODIFIERS: Record<BacklogItemStatus, 'grey' | 'blue' | 'amber' | 'green'> = {
  TODO: 'grey',
  IN_PROGRESS: 'blue',
  IN_REVIEW: 'amber',
  DONE: 'green',
};

export const ITERATION_STATE_LABELS: Record<IterationState, string> = {
  PLANNED: 'À venir',
  ACTIVE: 'En cours',
  COMPLETED: 'Terminée',
};

export const ITERATION_STATE_MODIFIERS: Record<IterationState, 'grey' | 'blue' | 'green'> = {
  PLANNED: 'grey',
  ACTIVE: 'blue',
  COMPLETED: 'green',
};

const DAY = 86_400_000;
const addDays = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);

export function productBacklogDtoToInput(dto: ProductBacklogDto): ProductBacklogInput {
  return {
    items: dto.items,
    iterations: dto.iterations.map(
      ({ state: _state, committedPoints: _committed, donePoints: _done, itemCount: _items, doneCount: _doneCount, burndown: _burndown, ...iteration }) =>
        iteration,
    ),
  };
}

export function blankItem(items: readonly BacklogItemInput[], type: BacklogItemType = 'STORY'): BacklogItemInput {
  return {
    code: nextCode(items, ITEM_TYPE_PREFIXES[type]),
    type,
    title: '',
    description: '',
    acceptanceCriteria: '',
    priority: 'SHOULD',
    points: null,
    status: 'TODO',
    doneOn: null,
    iterationCode: null,
    epicCode: null,
    requirementCode: null,
    wbsCode: null,
    assigneeId: null,
  };
}

/** Itération suivante : deux semaines, à partir du lundi qui suit la dernière (ou de ce lundi). */
export function blankIteration(iterations: readonly IterationInput[]): IterationInput {
  const last = iterations.at(-1);
  let start = last ? addDays(last.end, 1) : todayIso();
  while (new Date(`${start}T00:00:00Z`).getUTCDay() !== 1) start = addDays(start, last ? 1 : -1);
  const number = iterations.length + 1;
  return {
    code: nextCode(iterations, 'IT'),
    name: `Itération ${number}`,
    goal: '',
    start,
    end: addDays(start, 11),
    capacity: last?.capacity ?? null,
    review: '',
    wentWell: '',
    toImprove: '',
    actions: [],
  };
}

/** Change le statut d'un élément : achevé aujourd'hui en passant à « Terminé », sans date sinon. */
export function withStatus(item: BacklogItemInput, status: BacklogItemStatus): BacklogItemInput {
  return { ...item, status, doneOn: status === 'DONE' ? (item.doneOn ?? todayIso()) : null };
}

export const formatPoints = (points: number | null) => (points === null ? '—' : `${points} pt${points > 1 ? 's' : ''}`);
