import { useState, type ReactNode } from 'react';
import { ConfirmDialog } from '@/components/ui/Dialog';

interface DeleteActionProps {
  /** Titre de la confirmation : « Supprimer le business case ? ». */
  title: string;
  /** Conséquences de la suppression, rappelées avant de confirmer. */
  message: ReactNode;
  /** Supprime puis rafraîchit la page ; une erreur (ex. 409) s'affiche dans la boîte. */
  onDelete: () => Promise<void>;
  label?: string;
}

/**
 * Seule façon de supprimer une donnée enregistrée dans l'application : bouton « Supprimer »
 * discret, puis confirmation dans une boîte de dialogue. (Retirer une ligne d'un formulaire en
 * cours de saisie reste immédiat : rien n'est enregistré avant « Enregistrer ».)
 */
export function DeleteAction({ title, message, onDelete, label = 'Supprimer' }: DeleteActionProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="btn btn--danger-ghost"
        // Plusieurs « Supprimer » par page (cartes, lignes) : le nom accessible dit lequel.
        aria-label={title.replace(/\s*\?$/, '')}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      <ConfirmDialog
        open={open}
        title={title}
        message={message}
        confirmLabel="Supprimer"
        danger
        onConfirm={async () => {
          await onDelete();
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
