import { useState } from 'react';
import type { Role, UserAdminDto, UserCredentialsDto } from '@shared/index';
import { usersApi } from '@/api/admin-client';
import { Field } from '@/components/form/Field';
import { CheckboxInput, SelectInput, TextInput } from '@/components/form/controls';
import { Dialog } from '@/components/ui/Dialog';
import { ROLE_DESCRIPTIONS } from '@/lib/admin-format';

const ROLE_OPTIONS = (Object.keys(ROLE_DESCRIPTIONS) as Role[]).map((value) => ({ value, label: ROLE_DESCRIPTIONS[value] }));

interface UserFormDialogProps {
  /** Compte à modifier ; null pour une création. */
  user: UserAdminDto | null;
  isSelf: boolean;
  onClose: () => void;
  onCreated: (credentials: UserCredentialsDto) => void;
  onSaved: () => void;
}

/** Création ou modification d'un compte, dans un panneau latéral. */
export function UserFormDialog({ user, isSelf, onClose, onCreated, onSaved }: UserFormDialogProps) {
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [role, setRole] = useState<Role>(user?.role ?? 'VIEWER');
  const [active, setActive] = useState(user?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (user) {
        await usersApi.update(user.id, { name, email, role, active });
        onSaved();
      } else {
        onCreated(await usersApi.create({ name, email, role }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open variant="drawer" title={user ? `Modifier le compte de ${user.name}` : 'Nouvel utilisateur'} onClose={onClose}>
      <form className="dialog__form" onSubmit={handleSubmit}>
        <div className="dialog__body">
          <Field label="Nom complet">
            <TextInput value={name} onChange={setName} required />
          </Field>
          <Field label="Adresse e-mail professionnelle" hint="Identifiant de connexion.">
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          <Field label="Rôle" hint={isSelf ? 'Votre propre rôle ne peut être changé que par un autre administrateur.' : undefined}>
            {isSelf ? (
              <input className="form-input" value={ROLE_DESCRIPTIONS[role]} disabled />
            ) : (
              <SelectInput value={role} onChange={setRole} options={ROLE_OPTIONS} />
            )}
          </Field>
          {user && !isSelf && (
            <CheckboxInput label="Compte actif (décocher ferme aussitôt ses sessions)" checked={active} onChange={setActive} />
          )}
          {!user && (
            <p className="editor__info">
              Un mot de passe provisoire sera généré et affiché une seule fois ; l'utilisateur le remplacera à sa
              première connexion.
            </p>
          )}
          {error && (
            <p className="editor__error" role="alert">
              {error}
            </p>
          )}
        </div>
        <footer className="dialog__footer">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
            Annuler
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Enregistrement…' : user ? 'Enregistrer' : 'Créer le compte'}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
