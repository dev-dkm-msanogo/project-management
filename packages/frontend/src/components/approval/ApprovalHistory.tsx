import type { ApprovalEventDto } from '@shared/index';
import { APPROVAL_EVENT_LABELS, approvalDate } from '@/lib/approval-format';

/** Historique du circuit, du plus récent au plus ancien (repliable). */
export function ApprovalHistory({ events }: { events: ApprovalEventDto[] }) {
  return (
    <details className="approval-history">
      <summary>Historique de la validation ({events.length})</summary>
      <ol className="approval-history__list">
        {events.map((event, index) => (
          <li key={index} className={`approval-history__item approval-history__item--${event.type.toLowerCase()}`}>
            <span className="approval-history__what">
              {APPROVAL_EVENT_LABELS[event.type]} · version {event.revision}
            </span>
            <span className="approval-history__who">
              {approvalDate(event.at)}, {event.by.name}
            </span>
            {event.changeRequest && (
              <span className="approval-history__comment">Demande de modification {event.changeRequest}</span>
            )}
            {event.comment && <span className="approval-history__comment">« {event.comment} »</span>}
          </li>
        ))}
      </ol>
    </details>
  );
}
