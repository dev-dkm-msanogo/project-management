import { useState } from 'react';
import type { ProjectPlanInput, TaskInput } from '@shared/index';
import { saveProjectPlan } from '@/api/plan-client';
import { EditorShell } from '@/components/form/EditorShell';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { Field } from '@/components/form/Field';
import { DateInput, SelectInput, TextInput } from '@/components/form/controls';
import { PersonSelect } from '@/components/people/People';
import { useResourceDirectory } from '@/hooks/useAdministration';
import { useScheduleModel } from '@/hooks/useProjectDocuments';
import { formatShortDate } from '@/lib/format';

interface PlanEditorProps {
  mode: 'edit' | 'create';
  projectId: string;
  initialInput: ProjectPlanInput;
  onCancel: () => void;
  onSaved: () => void;
}

/** Formulaire de saisie/édition du plan de projet (en-tête + tâches WBS). */
export function PlanEditor({ mode, projectId, initialInput, onCancel, onSaved }: PlanEditorProps) {
  const [input, setInput] = useState<ProjectPlanInput>(initialInput);
  const { data: directory } = useResourceDirectory();
  // Lots planifiés par le réseau d'activités : leurs dates en viennent, elles ne se saisissent pas.
  const { data: schedule } = useScheduleModel(projectId);
  const scheduled = schedule?.wbsDates ?? {};
  // Personnes affectables : ressources actives du référentiel (une ressource archivée reste affichée si déjà affectée).
  const assigneeOptions = (current: string | null) => [
    { value: '', label: 'Personne' },
    ...(directory?.resources ?? [])
      .filter((resource) => resource.active || resource.id === current)
      .map((resource) => ({ value: resource.id, label: [resource.name, resource.jobTitle].filter(Boolean).join(' · ') })),
  ];

  const patch = (partial: Partial<ProjectPlanInput>) =>
    setInput((prev) => ({ ...prev, ...partial }));

  return (
    <EditorShell title={mode === 'create' ? 'Nouveau plan de projet' : 'Éditer le plan de projet'} save={() => saveProjectPlan(projectId, input)} onCancel={onCancel} onSaved={onSaved}>

      <fieldset className="editor-section">
        <legend>Général</legend>
        <div className="editor-grid">
          <Field label="Intitulé du projet">
            <TextInput value={input.title} onChange={(title) => patch({ title })} required />
          </Field>
          <Field label="Chef de projet">
            <PersonSelect value={input.managerId} onChange={(managerId) => patch({ managerId })} optional />
          </Field>
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Tâches (WBS)</legend>
        <ArrayEditor<TaskInput>
          items={input.tasks}
          onChange={(tasks) => patch({ tasks })}
          addLabel="Ajouter une tâche"
          makeEmpty={() => ({
            wbs: '',
            name: '',
            status: 'NOT_STARTED',
            assigneeId: null,
            start: null,
            end: null,
            comments: null,
          })}
          renderItem={(task, update) => (
            <div className="editor-grid editor-grid--task">
              <Field label="WBS" hint="1, 1.2, 1.2.3">
                <TextInput value={task.wbs} onChange={(wbs) => update({ wbs })} required />
              </Field>
              <Field label="Nom de la tâche">
                <TextInput value={task.name} onChange={(name) => update({ name })} required />
              </Field>
              <Field label="Affectée à" hint="Le statut et le % réalisé se saisissent dans « Avancement des tâches ».">
                <SelectInput<string>
                  value={task.assigneeId ?? ''}
                  onChange={(value) => update({ assigneeId: value === '' ? null : value })}
                  options={assigneeOptions(task.assigneeId)}
                />
              </Field>
              {scheduled[task.wbs] ? (
                <Field label="Dates" hint="Calculées par le réseau d'activités (durées et dépendances) : modifiez-les dans le Gantt ou les activités.">
                  <span className="field__static">
                    {formatShortDate(scheduled[task.wbs]!.start)} → {formatShortDate(scheduled[task.wbs]!.end)}
                  </span>
                </Field>
              ) : (
                <>
                  <Field label="Début">
                    <DateInput value={task.start} onChange={(start) => update({ start })} />
                  </Field>
                  <Field label="Fin">
                    <DateInput value={task.end} onChange={(end) => update({ end })} />
                  </Field>
                </>
              )}
              <Field label="Commentaires">
                <TextInput
                  value={task.comments ?? ''}
                  onChange={(value) => update({ comments: value === '' ? null : value })}
                />
              </Field>
            </div>
          )}
        />
      </fieldset>
    </EditorShell>
  );
}
