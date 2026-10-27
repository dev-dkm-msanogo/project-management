import { useState } from 'react';
import type { BacklogItemInput } from '@shared/index';
import { decideBacklogItem } from '@/api/agile-client';
import { TextArea } from '@/components/form/controls';
import { ConfirmDialog } from '@/components/ui/Dialog';

interface BacklogDecisionProps {
  projectId: string;
  item: BacklogItemInput;
  onDecided: () => void;
}

/**
 * Décision du Product Owner sur un élément : « Accepter » un élément en revue ; « Refuser » un élément
 * en revue, ou « Rouvrir » un élément accepté, avec un motif. Rien n'est proposé aux autres statuts.
 */
export function BacklogDecision({ projectId, item, onDecided }: BacklogDecisionProps) {
  const [dialog, setDialog] = useState<'ACCEPT' | 'REJECT' | null>(null);
  const [reason, setReason] = useState('');
  if (item.status !== 'IN_REVIEW' && item.status !== 'DONE') return null;
  const reopen = item.status === 'DONE';

  const close = () => {
    setDialog(null);
    setReason('');
  };
  const decide = async () => {
    await decideBacklogItem(projectId, item.code, { decision: dialog!, comment: dialog === 'REJECT' ? reason : null });
    close();
    onDecided();
  };

  return (
    <span className="backlog-decision">
      {!reopen && (
        <button type="button" className="btn btn--primary btn--sm" onClick={() => setDialog('ACCEPT')}>
          Accepter
        </button>
      )}
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDialog('REJECT')}>
        {reopen ? 'Rouvrir' : 'Refuser'}
      </button>
      <ConfirmDialog
        open={dialog !== null}
        title={dialog === 'ACCEPT' ? `Accepter ${item.code} ?` : `${reopen ? 'Rouvrir' : 'Refuser'} ${item.code} ?`}
        message={
          dialog === 'ACCEPT' ? (
            `« ${item.title} » répond à ses critères d'acceptation et à la définition de « terminé » : il est terminé aujourd'hui, accepté à votre nom.`
          ) : (
            <label className="field">
              <span className="field__label">Motif (l'élément repart en cours ; l'équipe le verra)</span>
              <TextArea value={reason} onChange={setReason} rows={3} required />
            </label>
          )
        }
        confirmLabel={dialog === 'ACCEPT' ? 'Accepter' : reopen ? 'Rouvrir' : 'Refuser'}
        danger={dialog === 'REJECT'}
        onConfirm={decide}
        onClose={close}
      />
    </span>
  );
}
