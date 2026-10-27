import { useState } from 'react';
import type { WbsDictionaryEntryInput, WbsDictionaryInput, WorkPackageMilestoneInput } from '@shared/index';
import { wbsDictionaryApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { FocusedEntry, useEntryFocus, type EntryTarget } from '@/components/form/EntryFocus';
import { Field } from '@/components/form/Field';
import { DateInput, SelectInput, TextArea, TextInput } from '@/components/form/controls';
import { PersonSelect } from '@/components/people/People';
import { useProjectPlan } from '@/hooks/useProjectPlan';
import { todayIso } from '@/lib/format';
import { blankWbsEntry, WBS_ENTRY_SECTIONS } from '@/lib/schedule-format';

interface WbsDictionaryEditorProps {
  projectId: string;
  initialInput: WbsDictionaryInput;
  /** Entrée éditée seule ; absente : tout le registre. */
  target?: EntryTarget;
  onCancel: () => void;
  onSaved: () => void;
}

/** Rédaction du dictionnaire de la WBS : une fiche par élément de l'échéancier. */
export function WbsDictionaryEditor({ projectId, initialInput, target, onCancel, onSaved }: WbsDictionaryEditorProps) {
  const { data: plan } = useProjectPlan(projectId);
  const tasks = plan?.tasks ?? [];
  const focus = useEntryFocus({
    entries: initialInput.entries,
    keyOf: (entry) => entry.wbsCode,
    target,
    blank: () =>
      blankWbsEntry(tasks.find((task) => !initialInput.entries.some((entry) => entry.wbsCode === task.wbs))?.wbs ?? '1'),
    labels: {
      create: 'Nouvelle fiche',
      edit: (entry) => `Fiche ${entry.wbsCode}`,
      deleteTitle: (wbsCode) => `Supprimer la fiche ${wbsCode} ?`,
      deleteMessage: "La fiche disparaît du dictionnaire ; l'élément reste dans la WBS.",
    },
    remove: (wbsCode) =>
      wbsDictionaryApi.save(projectId, { ...initialInput, entries: initialInput.entries.filter((entry) => entry.wbsCode !== wbsCode) }),
    onRemoved: onSaved,
  });
  const [input, setInput] = useState<WbsDictionaryInput>({ ...initialInput, entries: focus.entries });
  const described = new Set(input.entries.map((entry) => entry.wbsCode));
  const optionsFor = (current: string) => {
    const options = tasks
      .filter((task) => task.wbs === current || !described.has(task.wbs))
      .map((task) => ({ value: task.wbs, label: `${task.wbs} · ${task.name}` }));
    return options.some((option) => option.value === current)
      ? options
      : [{ value: current, label: `${current} (absent de la WBS)` }, ...options];
  };

  const renderEntry = (entry: WbsDictionaryEntryInput, update: (patch: Partial<WbsDictionaryEntryInput>) => void) => (
    <div className="entry-form">
      <section className="entry-form__step">
        <div className="editor-grid">
          <Field label="Élément WBS">
            <SelectInput<string>
              value={entry.wbsCode}
              onChange={(wbsCode) => update({ wbsCode })}
              options={optionsFor(entry.wbsCode)}
            />
          </Field>
          <Field label="Responsable">
            <PersonSelect value={entry.responsibleId || null} onChange={(id) => update({ responsibleId: id ?? '' })} />
          </Field>
        </div>
        <Field label="Description du travail">
          <TextArea value={entry.description} onChange={(description) => update({ description })} rows={2} required />
        </Field>
        <Field label="Livrable clé">
          <TextInput value={entry.keyDeliverable} onChange={(keyDeliverable) => update({ keyDeliverable })} />
        </Field>
      </section>

      <section className="entry-form__step">
        <h4 className="entry-form__step-title">Jalons ({entry.milestones.length})</h4>
        <ArrayEditor<WorkPackageMilestoneInput>
          items={entry.milestones}
          onChange={(milestones) => update({ milestones })}
          addLabel="Ajouter un jalon"
          emptyLabel="Aucun jalon."
          makeEmpty={() => ({ name: '', dueDate: todayIso() })}
          renderItem={(milestone, change) => (
            <div className="editor-grid editor-grid--holiday">
              <Field label="Échéance">
                <DateInput value={milestone.dueDate} onChange={(dueDate) => change({ dueDate: dueDate ?? todayIso() })} required />
              </Field>
              <Field label="Jalon">
                <TextInput value={milestone.name} onChange={(name) => change({ name })} required />
              </Field>
            </div>
          )}
        />
      </section>

      <section className="entry-form__step">
        <h4 className="entry-form__step-title">Détails</h4>
        {(Object.keys(WBS_ENTRY_SECTIONS) as (keyof typeof WBS_ENTRY_SECTIONS)[]).map((key) => (
          <Field key={key} label={WBS_ENTRY_SECTIONS[key]}>
            <TextArea value={entry[key]} onChange={(text) => update({ [key]: text })} rows={2} />
          </Field>
        ))}
      </section>
    </div>
  );

  return (
    <EditorShell
      title={focus.title ?? 'Dictionnaire de la WBS'}
      save={() => wbsDictionaryApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
      extraActions={focus.deleteAction}
    >
      {focus.index === null ? (
        <>
          <fieldset className="editor-section">
            <legend>Fiches ({input.entries.length})</legend>
            <ArrayEditor<WbsDictionaryEntryInput>
              items={input.entries}
              onChange={(entries) => setInput({ entries })}
              addLabel="Ajouter une fiche"
              emptyLabel="Aucune fiche."
              makeEmpty={() => blankWbsEntry(tasks.find((task) => !described.has(task.wbs))?.wbs ?? '1')}
              renderItem={renderEntry}
            />
          </fieldset>
        </>
      ) : (
        <FocusedEntry
          entries={input.entries}
          index={focus.index}
          onChange={(entries) => setInput({ entries })}
          render={renderEntry}
        />
      )}
    </EditorShell>
  );
}
