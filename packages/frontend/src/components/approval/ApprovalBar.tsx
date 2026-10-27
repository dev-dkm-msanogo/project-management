import { useState } from 'react';
import type { ApprovalAction, ApprovalDto, ProjectApprovalsDto } from '@shared/index';
import { actOnApproval } from '@/api/approval-client';
import { ApprovalActionDialog } from '@/components/approval/ApprovalActionDialog';
import { ApprovalHistory } from '@/components/approval/ApprovalHistory';
import {
  APPROVAL_ACTION_LABELS,
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_MODIFIERS,
  approvalDate,
} from '@/lib/approval-format';

interface ApprovalBarProps {
  projectId: string;
  approvals: ProjectApprovalsDto;
  approval: ApprovalDto;
  onChanged: () => void;
  /** Composant du plan de management : état affiché ici, étapes menées depuis la page du plan. */
  component?: boolean;
  /** Consultation de la version approuvée archivée, quand une version suivante est en cours. */
  viewingApproved?: boolean;
  onToggleApproved?: () => void;
}

/** État de la version en cours, en une phrase. */
function describe(approvals: ProjectApprovalsDto, approval: ApprovalDto): string {
  const { approved, submitted } = approval;
  if (approval.status === 'APPROVED' && approved) {
    return `Approuvée le ${approvalDate(approved.at)} par ${approved.by.name} : version figée.`;
  }
  if (approval.status === 'SUBMITTED' && submitted) {
    const deciders = approvals.approvers.filter((approver) => approver.active).map((approver) => approver.name);
    return (
      `Soumise le ${approvalDate(submitted.at)} par ${submitted.by.name}, figée pendant la validation` +
      (deciders.length > 0 ? ` : décision attendue de ${deciders.join(' ou ')}.` : '.')
    );
  }
  return approved
    ? `En préparation. La version ${approved.revision}, approuvée le ${approvalDate(approved.at)} par ${approved.by.name}, reste la référence.`
    : 'En préparation, jamais approuvée.';
}

/**
 * Bandeau de validation d'un document : état, version, dernière décision, étapes permises
 * (soumettre, retirer, approuver, rejeter, réviser) et historique.
 */
export function ApprovalBar({
  projectId,
  approvals,
  approval,
  onChanged,
  component = false,
  viewingApproved = false,
  onToggleApproved,
}: ApprovalBarProps) {
  const [pending, setPending] = useState<ApprovalAction | null>(null);
  const lastEvent = approval.history[0];
  const rejected = approval.status === 'DRAFT' && lastEvent?.type === 'REJECTED' ? lastEvent : null;
  const actions = component ? [] : approval.actions;
  const reference = approval.approved;
  const canViewReference =
    onToggleApproved && reference?.archived && (approval.status !== 'APPROVED' || reference.revision !== approval.revision);

  const confirm = async (action: ApprovalAction, comment: string | null, changeRequest: string | null) => {
    await actOnApproval(projectId, approval.subject, action, comment, changeRequest);
    setPending(null);
    onChanged();
  };

  return (
    <section className={`approval-bar approval-bar--${APPROVAL_STATUS_MODIFIERS[approval.status]}`} aria-label="Validation">
      <div className="approval-bar__main">
        <span className={`status-badge status-badge--${APPROVAL_STATUS_MODIFIERS[approval.status]}`}>
          {APPROVAL_STATUS_LABELS[approval.status]}
        </span>
        <span className="approval-bar__version">Version {approval.revision}</span>
        <p className="approval-bar__text">
          {component && 'Validé avec le plan de management du projet. '}
          {describe(approvals, approval)}
          {component && approval.status !== 'DRAFT' && ' Révisez le plan de management pour modifier ce document.'}
        </p>
        <div className="approval-bar__actions">
          {canViewReference && (
            <button type="button" className="btn btn--ghost" onClick={onToggleApproved}>
              {viewingApproved ? 'Revenir à la version en cours' : `Voir la version ${reference!.revision} approuvée`}
            </button>
          )}
          {actions
            .filter((action) => action !== 'REJECT')
            .map((action) => (
              <button
                key={action}
                type="button"
                className={`btn ${action === 'APPROVE' || action === 'SUBMIT' ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => setPending(action)}
              >
                {APPROVAL_ACTION_LABELS[action]}
              </button>
            ))}
          {actions.includes('REJECT') && (
            <button type="button" className="btn btn--danger-ghost" onClick={() => setPending('REJECT')}>
              {APPROVAL_ACTION_LABELS.REJECT}
            </button>
          )}
        </div>
      </div>
      {rejected && (
        <p className="approval-bar__rejection" role="note">
          Rejetée le {approvalDate(rejected.at)} par {rejected.by.name} : « {rejected.comment} »
        </p>
      )}
      {!component && approval.status === 'DRAFT' && approval.missingForSubmission.length > 0 && (
        <p className="approval-bar__missing">Pour soumettre, il manque : {approval.missingForSubmission.join(', ')}.</p>
      )}
      {viewingApproved && reference && (
        <p className="approval-bar__viewing" role="status">
          Vous consultez la version {reference.revision}, telle qu'approuvée le {approvalDate(reference.at)}.
        </p>
      )}
      {approval.history.length > 0 && <ApprovalHistory events={approval.history} />}
      <ApprovalActionDialog
        projectId={projectId}
        approval={approval}
        action={pending}
        onConfirm={confirm}
        onClose={() => setPending(null)}
      />
    </section>
  );
}
