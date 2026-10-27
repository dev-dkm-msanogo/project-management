import { useState } from 'react';
import type {
  AssumptionCategory,
  AssumptionEntryInput,
  AssumptionKind,
  AssumptionLogInput,
  AssumptionStatus,
} from '@shared/index';
import { assumptionLogApi } from '@/api/project-documents';
import { EditorShell } from '@/components/form/EditorShell';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { FocusedEntry, useEntryFocus, type EntryTarget } from '@/components/form/EntryFocus';
import { Field } from '@/components/form/Field';
import { DateInput, SelectInput, TextArea, TextInput } from '@/components/form/controls';
import { PersonSelect } from '@/components/people/People';
import { useRiskRegister } from '@/hooks/useProjectDocuments';
import {
  ASSUMPTION_CATEGORY_LABELS,
  ASSUMPTION_STATUS_LABELS,
  KIND_LABELS,
  KIND_PREFIXES,
  needsRisk,
  statusesFor,
} from '@/lib/assumption-format';
import { nextCode } from '@/lib/codes';

const options = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));

const KIND_OPTIONS = options<AssumptionKind>(KIND_LABELS);
const CATEGORY_OPTIONS = options<AssumptionCategory>(ASSUMPTION_CATEGORY_LABELS);
const AUTO_CODE = /^[HC]-\d+$/i;

const nullIfEmpty = (value: string): string | null => (value.trim() === '' ? null : value);

function blankEntry(entries: readonly AssumptionEntryInput[]): AssumptionEntryInput {
  return {
    code: nextCode(entries, KIND_PREFIXES.ASSUMPTION),
    kind: 'ASSUMPTION',
    statement: '',
    category: 'SCOPE',
    ownerId: '',
    dueDate: null,
    actions: null,
    status: 'TO_VALIDATE',
    comments: null,
    riskCode: null,
  };
}

interface AssumptionLogEditorProps {
  projectId: string;
  initialInput: AssumptionLogInput;
  /** Entrée éditée seule ; absente : tout le registre. */
  target?: EntryTarget;
  onCancel: () => void;
  onSaved: () => void;
}

/** Saisie des hypothèses (à valider) et des contraintes (imposées), avec lien vers les risques. */
export function AssumptionLogEditor({ projectId, initialInput, target, onCancel, onSaved }: AssumptionLogEditorProps) {
  const focus = useEntryFocus({
    entries: initialInput.entries,
    keyOf: (entry) => entry.code,
    target,
    blank: () => blankEntry(initialInput.entries),
    labels: {
      create: 'Nouvelle hypothèse ou contrainte',
      edit: (entry) => `${KIND_LABELS[entry.kind]} ${entry.code}`,
      deleteMessage: "L'entrée disparaît du registre des hypothèses et contraintes.",
    },
    remove: (code) =>
      assumptionLogApi.save(projectId, { ...initialInput, entries: initialInput.entries.filter((entry) => entry.code !== code) }),
    onRemoved: onSaved,
  });
  const [input, setInput] = useState<AssumptionLogInput>({ ...initialInput, entries: focus.entries });
  const { data: riskRegister } = useRiskRegister(projectId);

  const riskOptions = [
    { value: '', label: 'Aucun' },
    ...(riskRegister?.risks ?? []).map((risk) => ({ value: risk.code, label: `${risk.code} · ${risk.title}` })),
  ];

  const renderEntry = (
    entry: AssumptionEntryInput,
    update: (patch: Partial<AssumptionEntryInput>) => void,
    index: number,
  ) => {
    const isAssumption = entry.kind === 'ASSUMPTION';

    // Changer de nature : statut initial de la nature et code renuméroté s'il suit le
    // format automatique (H-xxx / C-xxx).
    const changeKind = (kind: AssumptionKind) => {
      const others = input.entries.filter((_, i) => i !== index);
      update({
        kind,
        status: statusesFor(kind)[0]!,
        code: AUTO_CODE.test(entry.code) ? nextCode(others, KIND_PREFIXES[kind]) : entry.code,
      });
    };

    return (
      <div className="entry-form">
        <section className="entry-form__step">
          <h3 className="entry-form__step-title">Énoncé</h3>
          <div className="editor-grid editor-grid--fluid">
            <Field label="Nature">
              <SelectInput value={entry.kind} onChange={changeKind} options={KIND_OPTIONS} />
            </Field>
            <Field label="Code">
              <TextInput value={entry.code} onChange={(code) => update({ code })} required />
            </Field>
            <Field label="Domaine">
              <SelectInput value={entry.category} onChange={(category) => update({ category })} options={CATEGORY_OPTIONS} />
            </Field>
            <Field label="Responsable">
              <PersonSelect value={entry.ownerId || null} onChange={(id) => update({ ownerId: id ?? '' })} />
            </Field>
          </div>
          <Field label={isAssumption ? 'Hypothèse (tenue pour vraie sans preuve)' : 'Contrainte (limite imposée au projet)'}>
            <TextArea value={entry.statement} onChange={(statement) => update({ statement })} rows={2} required />
          </Field>
        </section>

        <section className="entry-form__step">
          <h3 className="entry-form__step-title">Suivi</h3>
          <div className="editor-grid editor-grid--fluid">
            <Field label="Statut">
              <SelectInput<AssumptionStatus>
                value={entry.status}
                onChange={(status) => update({ status })}
                options={statusesFor(entry.kind).map((value) => ({ value, label: ASSUMPTION_STATUS_LABELS[value] }))}
              />
            </Field>
            <Field label={isAssumption ? 'Échéance de validation' : 'Échéance'}>
              <DateInput value={entry.dueDate} onChange={(dueDate) => update({ dueDate })} />
            </Field>
            {isAssumption && (
              <Field label="Risque lié">
                <SelectInput
                  value={entry.riskCode ?? ''}
                  onChange={(value) => update({ riskCode: value === '' ? null : value })}
                  options={riskOptions}
                />
              </Field>
            )}
          </div>
          <div className="editor-grid">
            <Field label={isAssumption ? 'Actions de validation' : 'Actions de suivi'}>
              <TextArea value={entry.actions ?? ''} onChange={(value) => update({ actions: nullIfEmpty(value) })} rows={2} />
            </Field>
            <Field label="Commentaires (impact)">
              <TextArea
                value={entry.comments ?? ''}
                onChange={(value) => update({ comments: nullIfEmpty(value) })}
                rows={2}
              />
            </Field>
          </div>
          {needsRisk(entry) && (
            <p className="entry-form__warning" role="alert">
              Une hypothèse invalidée devient un risque : liez-la au risque qui la porte (créez-le d'abord dans le
              registre des risques si besoin).
            </p>
          )}
        </section>
      </div>
    );
  };

  return (
    <EditorShell title={focus.title ?? 'Hypothèses et contraintes'} save={() => assumptionLogApi.save(projectId, input)} onCancel={onCancel} onSaved={onSaved} extraActions={focus.deleteAction}>

      {focus.index === null ? (
        <>
          <fieldset className="editor-section">
            <legend>Entrées ({input.entries.length})</legend>
            <ArrayEditor<AssumptionEntryInput>
              items={input.entries}
              onChange={(entries) => setInput({ entries })}
              addLabel="Ajouter une hypothèse ou une contrainte"
              emptyLabel="Aucune hypothèse ni contrainte."
              makeEmpty={() => blankEntry(input.entries)}
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
