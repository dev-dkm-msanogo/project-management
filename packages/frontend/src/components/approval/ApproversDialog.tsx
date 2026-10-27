import { useState } from 'react';
import type { ProjectApproverDto } from '@shared/index';
import { saveProjectApprovers } from '@/api/approval-client';
import { CheckboxInput } from '@/components/form/controls';
import { Dialog, useAsyncAction } from '@/components/ui/Dialog';
import { useUsers } from '@/hooks/useAdministration';
import { ROLE_LABELS } from '@/lib/admin-format';

interface ApproversDialogProps {
  open: boolean;
  projectId: string;
  projectName: string;
  current: ProjectApproverDto[];
  onSaved: () => void;
  onClose: () => void;
}

/**
 * Désignation des valideurs d'un projet (administrateurs) : comptes actifs, quel que soit leur
 * rôle — un sponsor en lecture seule peut valider. Personne n'approuve sa propre soumission.
 */
export function ApproversDialog({ open, projectId, projectName, current, onSaved, onClose }: ApproversDialogProps) {
  const users = useUsers(open);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(current.map((approver) => approver.id)));
  const [busy, error, run] = useAsyncAction(async () => {
    await saveProjectApprovers(projectId, [...selected]);
    onSaved();
  });
  const toggle = (id: string, checked: boolean) =>
    setSelected((value) => {
      const next = new Set(value);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  const candidates = (users.data ?? []).filter((user) => user.active || selected.has(user.id));

  return (
    <Dialog open={open} title={`Valideurs du projet « ${projectName} »`} variant="drawer" onClose={onClose}>
      <div className="dialog__body">
        <p className="dialog__message">
          Les valideurs approuvent ou rejettent les documents soumis, décident des demandes de modification et
          attribuent les achats. Un compte en lecture seule peut être valideur.
        </p>
        {users.loading && <p className="app__status">Chargement des comptes…</p>}
        {users.error && <p className="app__status app__status--error">{users.error}</p>}
        <ul className="approvers-choice">
          {candidates.map((user) => (
            <li key={user.id}>
              <CheckboxInput
                checked={selected.has(user.id)}
                onChange={(checked) => toggle(user.id, checked)}
                label={`${user.name} · ${ROLE_LABELS[user.role]}${user.active ? '' : ' (désactivé)'}`}
              />
            </li>
          ))}
        </ul>
        {error && (
          <p className="editor__error" role="alert">
            {error}
          </p>
        )}
      </div>
      <footer className="dialog__footer">
        <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
          Annuler
        </button>
        <button type="button" className="btn btn--primary" onClick={run} disabled={busy}>
          {busy ? 'En cours…' : 'Enregistrer les valideurs'}
        </button>
      </footer>
    </Dialog>
  );
}
