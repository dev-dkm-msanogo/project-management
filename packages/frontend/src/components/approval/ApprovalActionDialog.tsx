import { useState } from 'react';
import type { ApprovalAction, ApprovalDto } from '@shared/index';
import { Dialog, useAsyncAction } from '@/components/ui/Dialog';
import { useChangeLog } from '@/hooks/useProjectDocuments';
import { APPROVAL_ACTION_LABELS, MIN_REJECTION_COMMENT, SUBJECT_LABELS } from '@/lib/approval-format';

interface ApprovalActionDialogProps {
  projectId: string;
  approval: ApprovalDto;
  action: ApprovalAction | null;
  onConfirm: (action: ApprovalAction, comment: string | null, changeRequest: string | null) => Promise<void>;
  onClose: () => void;
}

/** Ce que l'étape change, dit avant de la confirmer. */
function consequence(approval: ApprovalDto, action: ApprovalAction): string {
  const next = approval.revision + 1;
  switch (action) {
    case 'SUBMIT':
      return `La version ${approval.revision} sera figée et transmise aux valideurs du projet.`;
    case 'WITHDRAW':
      return `La version ${approval.revision} redevient un brouillon modifiable ; il faudra la soumettre à nouveau.`;
    case 'APPROVE':
      return `La version ${approval.revision} deviendra la référence, figée et archivée telle quelle.`;
    case 'REJECT':
      return `La version ${approval.revision} redevient un brouillon ; votre commentaire dit au chef de projet quoi corriger.`;
    case 'REVISE':
      return (
        `La version ${next} s'ouvre en brouillon ; la version ${approval.revision} reste la référence jusqu'à l'approbation de la suivante.` +
        (approval.subject === 'PROJECT_MANAGEMENT_PLAN' ? ' La valeur acquise reste mesurée contre ses références de base.' : '')
      );
  }
}

/** Révision du plan de management : seule une demande de modification approuvée la justifie. */
function ApprovedChangeSelect({ projectId, value, onChange }: { projectId: string; value: string; onChange: (code: string) => void }) {
  const log = useChangeLog(projectId);
  const approved = (log.data?.requests ?? []).filter((request) => request.disposition === 'APPROVED');
  return (
    <label className="field">
      <span className="field__label">Demande de modification approuvée qui justifie la révision</span>
      <select className="form-input" value={value} onChange={(event) => onChange(event.target.value)} required>
        <option value="">{log.loading ? 'Chargement du registre…' : 'Choisir une demande…'}</option>
        {approved.map((request) => (
          <option key={request.code} value={request.code}>
            {request.code} — {request.title}
          </option>
        ))}
      </select>
      {!log.loading && approved.length === 0 && (
        <span className="field__hint">Aucune demande approuvée au registre des modifications : faites-en décider une d'abord.</span>
      )}
    </label>
  );
}

/**
 * Confirmation d'une étape du circuit, avec un commentaire (obligatoire pour rejeter) ; réviser le
 * plan de management exige de citer la demande de modification approuvée qui le justifie.
 */
export function ApprovalActionDialog({ projectId, approval, action, onConfirm, onClose }: ApprovalActionDialogProps) {
  const [comment, setComment] = useState('');
  const [changeRequest, setChangeRequest] = useState('');
  const required = action === 'REJECT';
  const needsChange = action === 'REVISE' && approval.subject === 'PROJECT_MANAGEMENT_PLAN';
  const tooShort = required && comment.trim().length < MIN_REJECTION_COMMENT;
  const reset = () => {
    setComment('');
    setChangeRequest('');
  };
  const [busy, error, run] = useAsyncAction(async () => {
    if (!action) return;
    await onConfirm(action, comment.trim() ? comment.trim() : null, needsChange ? changeRequest : null);
    reset();
  });
  const close = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={action !== null}
      title={action ? `${APPROVAL_ACTION_LABELS[action]} : ${SUBJECT_LABELS[approval.subject].toLowerCase()}` : ''}
      onClose={close}
    >
      {action && (
        <>
          <div className="dialog__body">
            <p className="dialog__message">{consequence(approval, action)}</p>
            {needsChange && <ApprovedChangeSelect projectId={projectId} value={changeRequest} onChange={setChangeRequest} />}
            <label className="field">
              <span className="field__label">
                {required ? `Motif du rejet (${MIN_REJECTION_COMMENT} caractères au moins)` : 'Commentaire (facultatif)'}
              </span>
              <textarea
                className="form-input"
                rows={3}
                maxLength={2000}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                required={required}
              />
            </label>
            {error && (
              <p className="editor__error" role="alert">
                {error}
              </p>
            )}
          </div>
          <footer className="dialog__footer">
            <button type="button" className="btn btn--ghost" onClick={close} disabled={busy}>
              Annuler
            </button>
            <button
              type="button"
              className={`btn ${action === 'REJECT' ? 'btn--danger' : 'btn--primary'}`}
              onClick={run}
              disabled={busy || tooShort || (needsChange && !changeRequest)}
            >
              {busy ? 'En cours…' : APPROVAL_ACTION_LABELS[action]}
            </button>
          </footer>
        </>
      )}
    </Dialog>
  );
}
