import { useState } from 'react';
import type { IterationInput, ProductBacklogDto, ProductBacklogInput } from '@shared/index';
import { backlogApi } from '@/api/project-documents';
import { EditorShell } from '@/components/form/EditorShell';
import { FocusedEntry, useEntryFocus, type EntryTarget } from '@/components/form/EntryFocus';
import { Field } from '@/components/form/Field';
import { CheckboxInput, DateInput, LinesInput, NumberInput, TextArea, TextInput } from '@/components/form/controls';
import { blankIteration, productBacklogDtoToInput } from '@/lib/agile-format';
import { todayIso } from '@/lib/format';

interface IterationEditorProps {
  projectId: string;
  backlog: ProductBacklogDto;
  /** Itération éditée ; nouvelle itération si `key` est `null`. */
  target: EntryTarget;
  onCancel: () => void;
  onSaved: () => void;
}

/** Planification d'une itération, puis sa revue et sa rétrospective. */
export function IterationEditor({ projectId, backlog, target, onCancel, onSaved }: IterationEditorProps) {
  const initial = productBacklogDtoToInput(backlog);
  const focus = useEntryFocus({
    entries: initial.iterations,
    keyOf: (iteration) => iteration.code,
    target,
    blank: () => blankIteration(initial.iterations),
    labels: {
      create: 'Nouvelle itération',
      edit: (iteration) => `${iteration.name} (${iteration.code})`,
      deleteMessage: "L'itération disparaît ; ses éléments retournent au carnet, non planifiés.",
    },
    remove: (code) =>
      backlogApi.save(projectId, {
        items: initial.items.map((item) => (item.iterationCode === code ? { ...item, iterationCode: null } : item)),
        iterations: initial.iterations.filter((iteration) => iteration.code !== code),
      }),
    onRemoved: onSaved,
  });
  const [input, setInput] = useState<ProductBacklogInput>({ ...initial, iterations: focus.entries });

  const renderIteration = (iteration: IterationInput, update: (changes: Partial<IterationInput>) => void) => (
    <div className="entry-form">
      <section className="entry-form__step">
        <div className="editor-grid editor-grid--3">
          <Field label="Code">
            <TextInput value={iteration.code} onChange={(code) => update({ code })} required />
          </Field>
          <Field label="Nom">
            <TextInput value={iteration.name} onChange={(name) => update({ name })} required />
          </Field>
          <Field label="Capacité (points)" hint="Points que l'équipe peut terminer.">
            <CheckboxInput
              checked={iteration.capacity !== null}
              onChange={(checked) => update({ capacity: checked ? (iteration.capacity ?? 0) : null })}
              label="Précisée"
            />
            {iteration.capacity !== null && (
              <NumberInput value={iteration.capacity} onChange={(capacity) => update({ capacity })} min={0} step={1} />
            )}
          </Field>
        </div>
        <div className="editor-grid editor-grid--3">
          <Field label="Début">
            <DateInput value={iteration.start} onChange={(start) => update({ start: start ?? todayIso() })} required />
          </Field>
          <Field label="Fin">
            <DateInput value={iteration.end} onChange={(end) => update({ end: end ?? iteration.start })} required />
          </Field>
        </div>
        <Field label="Objectif de l'itération">
          <TextArea value={iteration.goal} onChange={(goal) => update({ goal })} rows={2} />
        </Field>
      </section>
      <section className="entry-form__step">
        <Field label="Revue : ce qui a été montré, retours des parties prenantes">
          <TextArea value={iteration.review} onChange={(review) => update({ review })} rows={3} />
        </Field>
        <div className="editor-grid">
          <Field label="Rétrospective : ce qui a bien marché">
            <TextArea value={iteration.wentWell} onChange={(wentWell) => update({ wentWell })} rows={3} />
          </Field>
          <Field label="Rétrospective : ce qui est à améliorer">
            <TextArea value={iteration.toImprove} onChange={(toImprove) => update({ toImprove })} rows={3} />
          </Field>
        </div>
        <Field label="Actions d'amélioration retenues" hint="Une action par ligne.">
          <LinesInput value={iteration.actions} onChange={(actions) => update({ actions })} rows={3} />
        </Field>
      </section>
    </div>
  );

  return (
    <EditorShell
      title={focus.title ?? 'Itérations'}
      save={() => backlogApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
      extraActions={focus.deleteAction}
    >
      {focus.index === null ? (
        <p className="app__status">Itération introuvable : elle a pu être supprimée entre-temps.</p>
      ) : (
        <FocusedEntry
          entries={input.iterations}
          index={focus.index}
          onChange={(iterations) => setInput({ ...input, iterations })}
          render={renderIteration}
        />
      )}
    </EditorShell>
  );
}
