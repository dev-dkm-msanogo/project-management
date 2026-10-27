import type {
  MilestoneState,
  ProjectStatus,
  RagLevel,
  TaskStatus,
  TrendDirection,
} from '@shared/index';

/** Options de sélection pour les énumérations métier. */

export const RAG_OPTIONS: readonly { value: RagLevel; label: string }[] = [
  { value: 'GREEN', label: 'Vert — Sur la bonne voie' },
  { value: 'AMBER', label: 'Orange — À risque' },
  { value: 'RED', label: 'Rouge — En difficulté' },
  { value: 'NOT_APPLICABLE', label: 'N/A' },
];

export const TREND_OPTIONS: readonly { value: TrendDirection; label: string }[] = [
  { value: 'UP', label: '↗ Hausse' },
  { value: 'STABLE', label: '→ Stable' },
  { value: 'DOWN', label: '↘ Baisse' },
];

export const MILESTONE_STATE_OPTIONS: readonly { value: MilestoneState; label: string }[] = [
  { value: 'COMPLETE', label: 'Terminé' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'NOT_STARTED', label: 'Non démarré' },
  { value: 'AT_RISK', label: 'À risque' },
];

export const TASK_STATUS_OPTIONS: readonly { value: TaskStatus; label: string }[] = [
  { value: 'NOT_STARTED', label: 'Non commencé' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'ON_HOLD', label: 'En attente' },
  { value: 'COMPLETE', label: 'Terminé' },
];

export const PROJECT_STATUS_OPTIONS: readonly { value: ProjectStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'ON_HOLD', label: 'En pause' },
  { value: 'CLOSED', label: 'Clôturé' },
];
