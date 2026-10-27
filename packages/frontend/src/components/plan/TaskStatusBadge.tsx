import type { TaskStatus } from '@shared/index';
import { TASK_STATUS_LABELS, TASK_STATUS_MODIFIERS } from '@/lib/plan-format';

/** Badge coloré du statut d'une tâche. */
export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`status-badge status-badge--${TASK_STATUS_MODIFIERS[status]}`}>
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}
