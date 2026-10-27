import { useState } from 'react';
import type { ProjectRecordDto, UpdateProjectInput } from '@shared/index';
import { createProject, updateProject } from '@/api/project-client';
import { Field } from '@/components/form/Field';
import { SelectInput, TextArea, TextInput } from '@/components/form/controls';
import { PROJECT_STATUS_OPTIONS } from '@/components/form/options';
import { Dialog, useAsyncAction } from '@/components/ui/Dialog';

interface ProjectFormDialogProps {
  /** Projet à modifier ; `null` : création (l'identifiant sera tiré du nom). */
  project: Pick<ProjectRecordDto, 'id' | 'name' | 'description' | 'status'> | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Création ou modification d'un projet (nom, statut, description) dans un panneau latéral ; l'identifiant reste. */
export function ProjectFormDialog({ project, onClose, onSaved }: ProjectFormDialogProps) {
  const [input, setInput] = useState<UpdateProjectInput>({
    name: project?.name ?? '',
    description: project?.description ?? null,
    status: project?.status ?? 'ACTIVE',
  });
  const patch = (changes: Partial<UpdateProjectInput>) => setInput((current) => ({ ...current, ...changes }));
  const [saving, error, save] = useAsyncAction(async () => {
    const payload = { ...input, name: input.name.trim(), description: input.description?.trim() || null };
    if (project) await updateProject(project.id, payload);
    else await createProject(payload);
    onSaved();
  });

  return (
    <Dialog open variant="drawer" title={project ? `Modifier « ${project.name} »` : 'Nouveau projet'} onClose={onClose}>
      <form
        className="dialog__form"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="dialog__body">
          <Field label="Nom du projet">
            <TextInput value={input.name} onChange={(name) => patch({ name })} required />
          </Field>
          <Field label="Statut">
            <SelectInput value={input.status} onChange={(status) => patch({ status })} options={PROJECT_STATUS_OPTIONS} />
          </Field>
          <Field label="Description (facultatif)">
            <TextArea value={input.description ?? ''} onChange={(description) => patch({ description })} rows={3} />
          </Field>
          {project && (
            <Field label="Identifiant" hint="Repris dans les adresses et les documents du projet : il ne change pas.">
              <input className="form-input" value={project.id} readOnly />
            </Field>
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
            {saving ? 'Enregistrement…' : project ? 'Enregistrer' : 'Créer le projet'}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
