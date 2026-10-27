import { useEffect, useState } from 'react';
import type { ApprovalSubject } from '@shared/index';
import { useApprovals, useApprovedVersion } from '@/hooks/useApprovals';
import { isLocked, subjectOf } from '@/lib/approval-format';

/**
 * Validation d'un document pour sa page : état, verrou (version soumise ou approuvée) et
 * consultation de la version approuvée archivée. Sans `subject`, rien n'est chargé.
 */
export function useDocumentApproval(projectId: string, subject: ApprovalSubject | undefined) {
  const approvals = useApprovals(subject ? projectId : '');
  const state = subject ? subjectOf(approvals.data, subject) : null;
  const [viewingApproved, setViewingApproved] = useState(false);
  const reference = useApprovedVersion(projectId, subject, viewingApproved ? (state?.approved?.revision ?? null) : null);

  useEffect(() => setViewingApproved(false), [projectId]);

  return {
    approvals,
    state,
    locked: isLocked(state),
    viewingApproved,
    reference,
    toggleApproved: () => setViewingApproved((value) => !value),
    /** Après une étape du circuit : état rechargé, retour à la version en cours. */
    changed: () => {
      setViewingApproved(false);
      approvals.reload();
    },
  };
}

export type DocumentApprovalState = ReturnType<typeof useDocumentApproval>;
