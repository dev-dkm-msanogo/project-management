import { useState } from 'react';
import type { InfluenceDirection, StakeholderDto, StakeholderMappingEntryInput, StakeholderMappingInput } from '@shared/index';
import { stakeholderMappingApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { CheckboxInput, DateInput, SelectInput } from '@/components/form/controls';
import type { DocumentEditorProps } from '@/features/DocumentFeature';
import { todayIso } from '@/lib/format';
import {
  DIRECTION_LABELS,
  DIRECTION_ORDER,
  hasPower,
  mappingEntryFor,
  SALIENCE_LABELS,
  salienceOf,
} from '@/lib/stakeholder-tools-format';

const DIRECTION_OPTIONS = DIRECTION_ORDER.map((value) => ({ value, label: DIRECTION_LABELS[value] }));

interface StakeholderMappingEditorProps extends DocumentEditorProps<StakeholderMappingInput> {
  projectId: string;
  /** Parties prenantes du registre (de la plus à la moins influente). */
  stakeholders: readonly StakeholderDto[];
}

/** Rédaction de la cartographie : urgence, légitimité et direction d'influence de chaque partie prenante. */
export function StakeholderMappingEditor({
  projectId,
  stakeholders,
  mode,
  initialInput,
  onCancel,
  onSaved,
}: StakeholderMappingEditorProps) {
  const [input, setInput] = useState<StakeholderMappingInput>(initialInput);
  const patch = (changes: Partial<StakeholderMappingInput>) => setInput((current) => ({ ...current, ...changes }));

  const same = (a: string, b: string) => a.toUpperCase() === b.toUpperCase();
  const find = (code: string) => stakeholders.find((stakeholder) => same(stakeholder.code, code));
  const unmapped = stakeholders.filter((stakeholder) => !input.entries.some((entry) => same(entry.stakeholderCode, stakeholder.code)));

  const renderEntry = (entry: StakeholderMappingEntryInput, update: (changes: Partial<StakeholderMappingEntryInput>) => void) => {
    const stakeholder = find(entry.stakeholderCode);
    // Partie prenante de cette ligne + celles qui ne sont pas encore cartographiées.
    const options = [...(stakeholder ? [stakeholder] : []), ...unmapped].map((other) => ({
      value: other.code,
      label: `${other.code} · ${other.name}`,
    }));
    const power = hasPower(stakeholder);
    const category = salienceOf(power, entry.urgency, entry.legitimacy);

    return (
      <div className="entry-form">
        <section className="entry-form__step">
          <div className="editor-grid">
            <Field label="Partie prenante">
              {options.length > 0 ? (
                <SelectInput value={entry.stakeholderCode} onChange={(stakeholderCode) => update({ stakeholderCode })} options={options} />
              ) : (
                <input className="form-input" value={entry.stakeholderCode} disabled />
              )}
            </Field>
            <Field label="Direction d'influence">
              <SelectInput<InfluenceDirection>
                value={entry.direction}
                onChange={(direction) => update({ direction })}
                options={DIRECTION_OPTIONS}
              />
            </Field>
          </div>
          <div className="mapping-attributes" role="group" aria-label="Attributs de saillance">
            <span className={`mapping-power${power ? ' mapping-power--on' : ''}`}>
              Pouvoir {power ? 'élevé' : 'faible'} {stakeholder ? `(registre : ${stakeholder.power}/5)` : '(absente du registre)'}
            </span>
            <CheckboxInput label="Urgence" checked={entry.urgency} onChange={(urgency) => update({ urgency })} />
            <CheckboxInput label="Légitimité" checked={entry.legitimacy} onChange={(legitimacy) => update({ legitimacy })} />
            <span className={`salience-badge salience-badge--${category.toLowerCase()}`}>{SALIENCE_LABELS[category]}</span>
          </div>
        </section>
      </div>
    );
  };

  return (
    <EditorShell
      title={mode === 'create' ? 'Nouvelle cartographie des parties prenantes' : 'Cartographie des parties prenantes'}
      save={() => stakeholderMappingApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <p className="editor__info">
        Le pouvoir provient du registre des parties prenantes (élevé à partir de 4) : modifiez-le dans le registre.
      </p>

      <fieldset className="editor-section">
        <legend>Cartographie</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Parties prenantes ({input.entries.length})</legend>
        {unmapped.length > 0 && (
          <button
            type="button"
            className="btn btn--ghost engagement-add-all"
            onClick={() => patch({ entries: [...input.entries, ...unmapped.map(mappingEntryFor)] })}
          >
            {unmapped.length === 1
              ? `+ Ajouter ${unmapped[0]!.name}`
              : `+ Ajouter les ${unmapped.length} parties prenantes non cartographiées`}
          </button>
        )}
        <ArrayEditor<StakeholderMappingEntryInput>
          items={input.entries}
          onChange={(entries) => patch({ entries })}
          addLabel="Ajouter une partie prenante"
          emptyLabel="Aucune partie prenante cartographiée."
          makeEmpty={() =>
            unmapped[0] ? mappingEntryFor(unmapped[0]) : { stakeholderCode: '', urgency: false, legitimacy: true, direction: 'SIDEWARD' }
          }
          renderItem={renderEntry}
        />
      </fieldset>
    </EditorShell>
  );
}
