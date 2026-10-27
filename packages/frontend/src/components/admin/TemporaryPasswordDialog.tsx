import { useState } from 'react';
import type { UserCredentialsDto } from '@shared/index';
import { Dialog } from '@/components/ui/Dialog';

interface TemporaryPasswordDialogProps {
  credentials: UserCredentialsDto;
  reason: 'created' | 'reset';
  onClose: () => void;
}

/** Mot de passe provisoire, affiché une seule fois, à transmettre par un canal sûr. */
export function TemporaryPasswordDialog({ credentials, reason, onClose }: TemporaryPasswordDialogProps) {
  const [copied, setCopied] = useState(false);
  const { user, temporaryPassword } = credentials;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog
      open
      title={reason === 'created' ? 'Compte créé' : 'Mot de passe réinitialisé'}
      onClose={onClose}
    >
      <div className="dialog__body">
        <p className="dialog__message">
          Mot de passe provisoire de <strong>{user.name}</strong> ({user.email}) :
        </p>
        <div className="credential">
          <code className="credential__value">{temporaryPassword}</code>
          <button type="button" className="btn btn--ghost" onClick={() => void copy()}>
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
        <p className="entry-form__warning">
          Il ne sera plus affiché. Transmettez-le en main propre ou par téléphone, jamais dans le même message
          que l'adresse de connexion. {user.name} devra le remplacer à sa première connexion
          {reason === 'reset' ? ' ; ses sessions ouvertes ont été fermées' : ''}.
        </p>
      </div>
      <footer className="dialog__footer">
        <button type="button" className="btn btn--primary" onClick={onClose}>
          J'ai transmis le mot de passe
        </button>
      </footer>
    </Dialog>
  );
}
