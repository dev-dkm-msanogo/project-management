import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  /** « drawer » : panneau latéral (formulaires) ; « modal » : boîte centrée (confirmations). */
  variant?: 'modal' | 'drawer';
  children: ReactNode;
}

/**
 * Boîte de dialogue native (<dialog> + showModal) : focus piégé et rendu au déclencheur par
 * le navigateur, Échap pour fermer. Le contenu fournit `.dialog__body` et `.dialog__footer`.
 */
export function Dialog({ open, title, onClose, variant = 'modal', children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`dialog dialog--${variant}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {open && (
        <div className="dialog__panel">
          <header className="dialog__header">
            <h2 id={titleId} className="dialog__title">
              {title}
            </h2>
            <button type="button" className="btn btn--icon" aria-label="Fermer" onClick={onClose}>
              ✕
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

/** Confirmation d'une action sensible ; une erreur serveur s'affiche dans la boîte. */
export function ConfirmDialog({ open, title, message, confirmLabel, danger, onConfirm, onClose }: ConfirmDialogProps) {
  const [busy, error, run] = useAsyncAction(onConfirm);
  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <div className="dialog__body">
        <div className="dialog__message">{message}</div>
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
        <button type="button" className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`} onClick={run} disabled={busy}>
          {busy ? 'En cours…' : confirmLabel}
        </button>
      </footer>
    </Dialog>
  );
}

/** Action asynchrone avec état « en cours » et message d'erreur lisible. */
export function useAsyncAction(action: () => Promise<void>): [boolean, string | null, () => Promise<void>] {
  const [state, setState] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });
  const run = async () => {
    setState({ busy: true, error: null });
    try {
      await action();
      setState({ busy: false, error: null });
    } catch (err) {
      setState({ busy: false, error: err instanceof Error ? err.message : 'Erreur inconnue.' });
    }
  };
  return [state.busy, state.error, run];
}
