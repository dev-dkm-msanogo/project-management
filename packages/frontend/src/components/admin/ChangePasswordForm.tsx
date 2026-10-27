import { useState } from 'react';
import { PASSWORD_MIN_LENGTH, type UserDto } from '@shared/index';
import { changePassword } from '@/api/auth-client';
import { Field } from '@/components/form/Field';

interface ChangePasswordFormProps {
  /** Libellé du mot de passe actuel (ex. « Mot de passe provisoire »). */
  currentLabel?: string;
  submitLabel?: string;
  onChanged: (user: UserDto) => void;
}

/**
 * Changement de son mot de passe : actuel, nouveau et confirmation. Contrôles immédiats
 * (longueur, confirmation) en miroir du serveur, qui reste l'autorité.
 */
export function ChangePasswordForm({
  currentLabel = 'Mot de passe actuel',
  submitLabel = 'Changer le mot de passe',
  onChanged,
}: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooShort = newPassword.length > 0 && newPassword.length < PASSWORD_MIN_LENGTH;
  const mismatch = confirmation.length > 0 && confirmation !== newPassword;
  const ready = currentPassword && newPassword.length >= PASSWORD_MIN_LENGTH && confirmation === newPassword;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const user = await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
      onChanged(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="password-form" onSubmit={handleSubmit} noValidate>
      <Field label={currentLabel}>
        <input
          className="form-input"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
      </Field>
      <Field
        label="Nouveau mot de passe"
        hint={`${PASSWORD_MIN_LENGTH} caractères au minimum ; une courte phrase est facile à retenir et difficile à deviner.`}
      >
        <input
          className="form-input"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          aria-invalid={tooShort}
          required
        />
      </Field>
      <Field label="Confirmation du nouveau mot de passe">
        <input
          className="form-input"
          type="password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          aria-invalid={mismatch}
          required
        />
      </Field>
      {(tooShort || mismatch) && (
        <p className="entry-form__warning" role="status">
          {tooShort
            ? `Encore ${PASSWORD_MIN_LENGTH - newPassword.length} caractère(s) au minimum.`
            : 'La confirmation ne correspond pas au nouveau mot de passe.'}
        </p>
      )}
      {error && (
        <p className="editor__error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn--primary" disabled={submitting || !ready}>
        {submitting ? 'Enregistrement…' : submitLabel}
      </button>
    </form>
  );
}
