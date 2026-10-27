import { useState } from 'react';
import type { ActualCostInput, ActualCostNature, ActualCostsInput } from '@shared/index';
import { actualCostsApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { FocusedEntry, useEntryFocus, type EntryTarget } from '@/components/form/EntryFocus';
import { Field } from '@/components/form/Field';
import { AmountInput, DateInput, SelectInput, TextInput } from '@/components/form/controls';
import { useProjectPlan } from '@/hooks/useProjectPlan';
import { todayIso } from '@/lib/format';
import { ACTUAL_COST_NATURE_LABELS, blankActualCost } from '@/lib/performance-format';

const NATURE_OPTIONS = (Object.keys(ACTUAL_COST_NATURE_LABELS) as ActualCostNature[]).map((value) => ({
  value,
  label: ACTUAL_COST_NATURE_LABELS[value],
}));

interface ActualCostsEditorProps {
  projectId: string;
  initialInput: ActualCostsInput;
  /** Entrée éditée seule ; absente : tout le registre. */
  target?: EntryTarget;
  onCancel: () => void;
  onSaved: () => void;
}

/** Saisie des dépenses réelles : date, élément de la WBS imputé, nature, montant et pièce justificative. */
export function ActualCostsEditor({ projectId, initialInput, target, onCancel, onSaved }: ActualCostsEditorProps) {
  const { data: plan } = useProjectPlan(projectId);
  const wbsOptions = [
    { value: '', label: 'Choisir un élément de la WBS' },
    ...(plan?.tasks ?? []).map((task) => ({ value: task.wbs, label: `${task.wbs} · ${task.name}` })),
  ];
  const focus = useEntryFocus({
    entries: initialInput.entries,
    keyOf: (entry) => entry.code,
    target,
    blank: () => blankActualCost(initialInput.entries),
    labels: {
      create: 'Nouvelle dépense',
      edit: (entry) => `Dépense ${entry.code}`,
      deleteMessage: "La dépense disparaît du registre : le coût réel du projet diminue d'autant.",
    },
    remove: (code) =>
      actualCostsApi.save(projectId, { ...initialInput, entries: initialInput.entries.filter((entry) => entry.code !== code) }),
    onRemoved: onSaved,
  });
  const [input, setInput] = useState<ActualCostsInput>({ ...initialInput, entries: focus.entries });

  const renderEntry = (entry: ActualCostInput, update: (patch: Partial<ActualCostInput>) => void) => (
    <div className="entry-form">
      <section className="entry-form__step">
        <div className="editor-grid editor-grid--3">
          <Field label="Code">
            <TextInput value={entry.code} onChange={(code) => update({ code })} required />
          </Field>
          <Field label="Date" hint="Facture ou service fait ; jamais dans le futur.">
            <DateInput value={entry.date} onChange={(date) => update({ date: date ?? todayIso() })} required />
          </Field>
          <Field label="Nature">
            <SelectInput value={entry.nature} onChange={(nature) => update({ nature })} options={NATURE_OPTIONS} />
          </Field>
        </div>
        <div className="editor-grid">
          <Field label="Élément de la WBS imputé">
            <SelectInput<string> value={entry.wbsCode} onChange={(wbsCode) => update({ wbsCode })} options={wbsOptions} />
          </Field>
          <Field label="Montant">
            <AmountInput value={entry.amount} onChange={(amount) => update({ amount: Math.round(amount) })} />
          </Field>
        </div>
        <Field label="Description">
          <TextInput value={entry.description} onChange={(description) => update({ description })} required />
        </Field>
        <div className="editor-grid">
          <Field label="Fournisseur ou bénéficiaire">
            <TextInput value={entry.supplier} onChange={(supplier) => update({ supplier })} />
          </Field>
          <Field label="Pièce justificative" hint="N° de facture, de bon de commande…">
            <TextInput value={entry.reference} onChange={(reference) => update({ reference })} />
          </Field>
        </div>
      </section>
    </div>
  );

  return (
    <EditorShell
      title={focus.title ?? 'Dépenses réelles'}
      save={() => actualCostsApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
      extraActions={focus.deleteAction}
    >
      {focus.index === null ? (
        <fieldset className="editor-section">
          <legend>Dépenses ({input.entries.length})</legend>
          <ArrayEditor<ActualCostInput>
            items={input.entries}
            onChange={(entries) => setInput({ entries })}
            addLabel="Ajouter une dépense"
            emptyLabel="Aucune dépense."
            makeEmpty={() => blankActualCost(input.entries)}
            renderItem={renderEntry}
          />
        </fieldset>
      ) : (
        <FocusedEntry entries={input.entries} index={focus.index} onChange={(entries) => setInput({ entries })} render={renderEntry} />
      )}
    </EditorShell>
  );
}
