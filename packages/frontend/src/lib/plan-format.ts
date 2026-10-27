import type { TaskStatus } from '@shared/index';

/** Libellés et couleurs du plan de projet. */

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  NOT_STARTED: 'Non commencé',
  IN_PROGRESS: 'En cours',
  ON_HOLD: 'En attente',
  COMPLETE: 'Terminé',
};

export const TASK_STATUS_MODIFIERS: Record<TaskStatus, 'grey' | 'blue' | 'amber' | 'green'> = {
  NOT_STARTED: 'grey',
  IN_PROGRESS: 'blue',
  ON_HOLD: 'amber',
  COMPLETE: 'green',
};

interface PhasePalette {
  solid: string;
  tint: string;
}

// Couleur par phase (1er segment du code WBS), enfants éclaircis via l'opacité.
const PHASES: PhasePalette[] = [
  { solid: '#00884b', tint: 'rgba(0, 136, 75, 0.10)' },
  { solid: '#0087cb', tint: 'rgba(0, 135, 203, 0.10)' },
  { solid: '#cf7a3a', tint: 'rgba(207, 122, 58, 0.12)' },
  { solid: '#135585', tint: 'rgba(19, 85, 133, 0.10)' },
  { solid: '#c9a100', tint: 'rgba(201, 161, 0, 0.14)' },
  { solid: '#797978', tint: 'rgba(121, 121, 120, 0.14)' },
];

function phaseIndex(wbs: string): number {
  const first = Number(wbs.split('.')[0]);
  const base = Number.isFinite(first) && first > 0 ? first - 1 : 0;
  return base % PHASES.length;
}

export function phasePalette(wbs: string): PhasePalette {
  return PHASES[phaseIndex(wbs)];
}

export function barOpacity(level: number): number {
  if (level <= 1) return 1;
  if (level === 2) return 0.78;
  return 0.56;
}

const MS_PER_DAY = 86_400_000;

export function parsePlanDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** Nombre de jours (entiers) entre deux dates. */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}
