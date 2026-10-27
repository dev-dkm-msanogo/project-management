import type { ApprovalEvent, DocumentApproval } from '@domain/entities/document-approval';
import type { ApprovalAction, ApprovalDto, ApprovalEventDto } from '@shared/index';

/** Forme stockée d'un événement : celle de la lecture (dates-heures en ISO-8601). */
export type StoredApprovalEvent = ApprovalEventDto;

export function approvalEventToDto(event: ApprovalEvent): ApprovalEventDto {
  return {
    type: event.type,
    revision: event.revision,
    at: event.at.toISOString(),
    by: { id: event.by.id, name: event.by.name },
    comment: event.comment,
    changeRequest: event.changeRequest ?? null,
  };
}

export function storedToApprovalEvent(stored: StoredApprovalEvent): ApprovalEvent {
  return { ...stored, at: new Date(stored.at), by: { id: stored.by.id, name: stored.by.name } };
}

export function toApprovalDto(
  approval: DocumentApproval,
  context: { actions: ApprovalAction[]; missingForSubmission: string[]; archivedRevisions: readonly number[] },
): ApprovalDto {
  const lastApproval = approval.lastApproval;
  const approvedSubmission = approval.approvedSubmission;
  const submission = approval.currentSubmission;
  return {
    subject: approval.subject,
    status: approval.status,
    revision: approval.revision,
    approved: lastApproval
      ? {
          revision: lastApproval.revision,
          at: lastApproval.at.toISOString(),
          by: { ...lastApproval.by },
          submittedAt: (approvedSubmission ?? lastApproval).at.toISOString(),
          archived: context.archivedRevisions.includes(lastApproval.revision),
        }
      : null,
    submitted: submission ? { at: submission.at.toISOString(), by: { ...submission.by } } : null,
    history: [...approval.events].reverse().map(approvalEventToDto),
    actions: context.actions,
    missingForSubmission: context.missingForSubmission,
  };
}
