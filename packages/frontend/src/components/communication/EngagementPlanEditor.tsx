import { useState } from 'react';
import type {
  CommunicationStyle,
  EngagementApproachInput,
  StakeholderDto,
  StakeholderEngagementPlanInput,
} from '@shared/index';
import { engagementPlanApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { CheckboxInput, DateInput, SelectInput, TextArea, TextInput } from '@/components/form/controls';
import type { DocumentEditorProps } from '@/features/DocumentFeature';
import { approachFor, STYLE_LABELS, STYLES } from '@/lib/communication-format';
import { todayIso } from '@/lib/format';
import { ENGAGEMENT_LABELS } from '@/lib/stakeholder-format';

interface EngagementPlanEditorProps extends DocumentEditorProps<StakeholderEngagementPlanInput> {
  projectId: string;
  /** Parties prenantes du registre (de la plus à la moins influente). */
  stakeholders: readonly StakeholderDto[];
}

/** Rédaction du plan d'engagement : une approche par partie prenante du registre. */
export function EngagementPlanEditor({
  projectId,
  stakeholders,
  mode,
  initialInput,
  onCancel,
  onSaved,
}: EngagementPlanEditorProps) {
  const [input, setInput] = useState<StakeholderEngagementPlanInput>(initialInput);
  const patch = (changes: Partial<StakeholderEngagementPlanInput>) => setInput((current) => ({ ...current, ...changes }));

  const same = (a: string, b: string) => a.toUpperCase() === b.toUpperCase();
  const covered = (code: string) => input.approaches.some((item) => same(item.stakeholderCode, code));
  const uncovered = stakeholders.filter((stakeholder) => !covered(stakeholder.code));
  const find = (code: string) => stakeholders.find((stakeholder) => same(stakeholder.code, code));

  const renderApproach = (
    item: EngagementApproachInput,
    update: (changes: Partial<EngagementApproachInput>) => void,
  ) => {
    const stakeholder = find(item.stakeholderCode);
    // Partie prenante de cette ligne + celles qui n'ont pas encore d'approche.
    const options = [
      ...(stakeholder ? [stakeholder] : []),
      ...uncovered.filter((other) => !same(other.code, item.stakeholderCode)),
    ].map((other) => ({ value: other.code, label: `${other.code} · ${other.name}` }));
    const toggleStyle = (style: CommunicationStyle, checked: boolean) =>
      update({ styles: checked ? [...item.styles, style] : item.styles.filter((other) => other !== style) });

    return (
      <div className="entry-form">
        <section className="entry-form__step">
          <div className="editor-grid editor-grid--wide-narrow">
            <Field label="Partie prenante">
              {options.length > 0 ? (
                <SelectInput
                  value={item.stakeholderCode}
                  onChange={(code) => {
                    const chosen = find(code);
                    update({ stakeholderCode: code, approach: item.approach || chosen?.strategy || '' });
                  }}
                  options={options}
                />
              ) : (
                <input className="form-input" value={item.stakeholderCode} disabled />
              )}
            </Field>
            <Field label="Actuel → souhaité">
              <input
                className="form-input"
                value={
                  stakeholder
                    ? `${ENGAGEMENT_LABELS[stakeholder.currentEngagement]} → ${ENGAGEMENT_LABELS[stakeholder.desiredEngagement]}`
                    : 'Absente du registre'
                }
                disabled
              />
            </Field>
          </div>
          <Field label="Approche" hint="Comment faire passer la partie prenante du niveau actuel au niveau souhaité.">
            <TextArea value={item.approach} onChange={(approach) => update({ approach })} rows={2} required />
          </Field>
          <Field label="Besoins d'information">
            <TextArea value={item.informationNeeds} onChange={(informationNeeds) => update({ informationNeeds })} rows={2} />
          </Field>
          <div className="editor-grid">
            <Field label="Fréquence">
              <TextInput value={item.frequency} onChange={(frequency) => update({ frequency })} />
            </Field>
            <Field label="Moyen">
              <TextInput value={item.method} onChange={(method) => update({ method })} />
            </Field>
          </div>
          <div className="style-options" role="group" aria-label="Méthodes de communication">
            {STYLES.map((style) => (
              <CheckboxInput
                key={style}
                label={STYLE_LABELS[style]}
                checked={item.styles.includes(style)}
                onChange={(checked) => toggleStyle(style, checked)}
              />
            ))}
          </div>
        </section>
      </div>
    );
  };

  return (
    <EditorShell
      title={mode === 'create' ? "Nouveau plan d'engagement des parties prenantes" : "Plan d'engagement des parties prenantes"}
      save={() => engagementPlanApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <p className="editor__info">
        Les niveaux d'engagement actuel et souhaité proviennent du registre des parties prenantes : modifiez-les dans
        le registre.
      </p>

      <fieldset className="editor-section">
        <legend>Évolutions et relations</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
        <div className="editor-grid">
          <Field label="Évolutions d'engagement attendues">
            <TextArea value={input.pendingChanges} onChange={(pendingChanges) => patch({ pendingChanges })} rows={4} />
          </Field>
          <Field label="Relations entre parties prenantes">
            <TextArea value={input.relationships} onChange={(relationships) => patch({ relationships })} rows={4} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Approches ({input.approaches.length})</legend>
        {uncovered.length > 0 && (
          <button
            type="button"
            className="btn btn--ghost engagement-add-all"
            onClick={() => patch({ approaches: [...input.approaches, ...uncovered.map(approachFor)] })}
          >
            {uncovered.length === 1
              ? `+ Ajouter ${uncovered[0]!.name}, sans approche`
              : `+ Ajouter les ${uncovered.length} parties prenantes sans approche`}
          </button>
        )}
        <ArrayEditor<EngagementApproachInput>
          items={input.approaches}
          onChange={(approaches) => patch({ approaches })}
          addLabel="Ajouter une approche"
          emptyLabel="Aucune approche."
          makeEmpty={() =>
            uncovered[0]
              ? approachFor(uncovered[0])
              : { stakeholderCode: '', approach: '', informationNeeds: '', frequency: '', method: '', styles: [] }
          }
          renderItem={renderApproach}
        />
      </fieldset>
    </EditorShell>
  );
}
