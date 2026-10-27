import { ApprovalBar } from '@/components/approval/ApprovalBar';
import type { DocumentApprovalState } from '@/hooks/useDocumentApproval';

interface DocumentApprovalBarProps {
  projectId: string;
  approval: DocumentApprovalState;
  /** Composant du plan de management : étapes menées depuis la page du plan. */
  component?: boolean;
}

/** Bandeau de validation d'une page de document, une fois l'état chargé. */
export function DocumentApprovalBar({ projectId, approval, component }: DocumentApprovalBarProps) {
  const { approvals, state } = approval;
  if (!approvals.data || !state) return null;
  return (
    <ApprovalBar
      projectId={projectId}
      approvals={approvals.data}
      approval={state}
      component={component}
      onChanged={approval.changed}
      viewingApproved={approval.viewingApproved}
      onToggleApproved={approval.toggleApproved}
    />
  );
}
