import { useState } from 'react';
import type { DirectoryResourceDto, DirectoryResourceInput, ResourceKind, UserAdminDto } from '@shared/index';
import { resourceDirectoryApi } from '@/api/admin-client';
import { Field } from '@/components/form/Field';
import { CheckboxInput, SelectInput, TextInput } from '@/components/form/controls';
import { Dialog } from '@/components/ui/Dialog';
import { blankDirectoryResource, directoryResourceToInput, RESOURCE_KIND_LABELS } from '@/lib/admin-format';

const KIND_OPTIONS = (Object.keys(RESOURCE_KIND_LABELS) as ResourceKind[]).map((value) => ({
  value,
  label: RESOURCE_KIND_LABELS[value],
}));
const NO_ACCOUNT = '';

interface ResourceFormDialogProps {
  /** Ressource à modifier ; null pour une création. */
  resource: DirectoryResourceDto | null;
  users: readonly UserAdminDto[];
  /** Comptes déjà rattachés à une autre ressource. */
  linkedUserIds: ReadonlySet<string>;
  onClose: () => void;
  onSaved: () => void;
}

/** Création ou modification d'une ressource du référentiel, dans un panneau latéral. */
export function ResourceFormDialog({ resource, users, linkedUserIds, onClose, onSaved }: ResourceFormDialogProps) {
  const [input, setInput] = useState<DirectoryResourceInput>(() =>
    resource ? directoryResourceToInput(resource) : blankDirectoryResource(),
  );
  const [skillsText, setSkillsText] = useState(input.skills.join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const patch = (changes: Partial<DirectoryResourceInput>) => setInput((current) => ({ ...current, ...changes }));

  const accountOptions = [
    { value: NO_ACCOUNT, label: 'Aucun compte' },
    ...users
      .filter((user) => !linkedUserIds.has(user.id) || user.id === resource?.userId)
      .map((user) => ({ value: user.id, label: `${user.name} · ${user.email}` })),
  ];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const payload = { ...input, skills: skillsText.split(',').map((skill) => skill.trim()).filter(Boolean) };
    try {
      if (resource) await resourceDirectoryApi.update(resource.id, payload);
      else await resourceDirectoryApi.create(payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open variant="drawer" title={resource ? `Modifier « ${resource.name} »` : 'Nouvelle ressource'} onClose={onClose}>
      <form className="dialog__form" onSubmit={handleSubmit}>
        <div className="dialog__body">
          <Field label="Nom (personne ou équipe)">
            <TextInput value={input.name} onChange={(name) => patch({ name })} required />
          </Field>
          <div className="editor-grid">
            <Field label="Type">
              <SelectInput value={input.kind} onChange={(kind) => patch({ kind })} options={KIND_OPTIONS} />
            </Field>
            <Field label="Fonction">
              <TextInput value={input.jobTitle} onChange={(jobTitle) => patch({ jobTitle })} />
            </Field>
          </div>
          <Field label={input.kind === 'EXTERNAL' ? 'Entreprise' : 'Service'}>
            <TextInput value={input.department} onChange={(department) => patch({ department })} />
          </Field>
          <Field label="E-mail professionnel" hint="Facultatif. Jamais de coordonnées personnelles (RGPD).">
            <input
              className="form-input"
              type="email"
              value={input.email ?? ''}
              onChange={(event) => patch({ email: event.target.value.trim() || null })}
            />
          </Field>
          <Field label="Compétences" hint="Séparées par des virgules.">
            <TextInput value={skillsText} onChange={setSkillsText} />
          </Field>
          <Field label="Compte utilisateur rattaché" hint="Un compte ne se rattache qu'à une seule ressource.">
            <SelectInput
              value={input.userId ?? NO_ACCOUNT}
              onChange={(value) => patch({ userId: value === NO_ACCOUNT ? null : value })}
              options={accountOptions}
            />
          </Field>
          <CheckboxInput
            label="Ressource active (décochée : archivée, plus proposée aux projets)"
            checked={input.active}
            onChange={(active) => patch({ active })}
          />
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
            {saving ? 'Enregistrement…' : resource ? 'Enregistrer' : 'Ajouter la ressource'}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
