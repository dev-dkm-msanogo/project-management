import type { RequirementInput, RequirementPriority, RequirementStatus } from '@shared/index';
import {
  PRIORITY_DESCRIPTIONS,
  PRIORITY_LABELS,
  PRIORITY_MODIFIERS,
  REQUIREMENT_STATUS_LABELS,
  REQUIREMENT_STATUS_MODIFIERS,
} from '@/lib/requirements-format';

export function PriorityBadge({ priority }: { priority: RequirementPriority }) {
  return (
    <span className={`status-badge status-badge--${PRIORITY_MODIFIERS[priority]}`} title={PRIORITY_DESCRIPTIONS[priority]}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function RequirementStatusBadge({ status }: { status: RequirementStatus }) {
  return (
    <span className={`status-badge status-badge--${REQUIREMENT_STATUS_MODIFIERS[status]}`}>
      {REQUIREMENT_STATUS_LABELS[status]}
    </span>
  );
}

/** Codes d'exigences reliées, avec leur énoncé en infobulle. */
export function RequirementCodes({ requirements }: { requirements: readonly RequirementInput[] }) {
  if (requirements.length === 0) return <span className="register-table__muted-cell">—</span>;
  return (
    <span className="req-codes">
      {requirements.map((requirement) => (
        <span key={requirement.code} className="req-code" title={requirement.statement}>
          {requirement.code}
        </span>
      ))}
    </span>
  );
}
