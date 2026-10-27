import type { ProjectStatus } from '@shared/index';

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: 'Actif',
  ON_HOLD: 'En pause',
  CLOSED: 'Clôturé',
};

export const PROJECT_STATUS_MODIFIERS: Record<ProjectStatus, 'green' | 'amber' | 'grey'> = {
  ACTIVE: 'green',
  ON_HOLD: 'amber',
  CLOSED: 'grey',
};
