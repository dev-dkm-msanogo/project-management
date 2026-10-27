import { useState } from 'react';
import type { EngagementLevel, StakeholderInput, StakeholderRegisterInput, StakeholderType } from '@shared/index';
import { stakeholderRegisterApi } from '@/api/project-documents';
import { EditorShell } from '@/components/form/EditorShell';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { FocusedEntry, useEntryFocus, type EntryTarget } from '@/components/form/EntryFocus';
import { Field } from '@/components/form/Field';
import { SelectInput, TextArea, TextInput } from '@/components/form/controls';
import { nextCode } from '@/lib/codes';
import {
  ENGAGEMENT_LABELS,
  ENGAGEMENT_LEVELS,
  INFLUENCE_SCALE,
  QUADRANT_HINTS,
  QUADRANT_LABELS,
  QUADRANT_MODIFIERS,
  STAKEHOLDER_TYPE_LABELS,
  engagementGap,
  formatGap,
  quadrantOf,
} from '@/lib/stakeholder-format';
import { blankStakeholder } from '@/lib/stakeholder-input';

type ScaleValue = '1' | '2' | '3' | '4' | '5';

const SCALE_OPTIONS = (['1', '2', '3', '4', '5'] as const).map((value) => ({
  value,
  label: `${value} — ${INFLUENCE_SCALE[Number(value) - 1]}`,
}));
const TYPE_OPTIONS = (Object.keys(STAKEHOLDER_TYPE_LABELS) as StakeholderType[]).map((value) => ({
  value,
  label: STAKEHOLDER_TYPE_LABELS[value],
}));
const ENGAGEMENT_OPTIONS = ENGAGEMENT_LEVELS.map((value) => ({ value, label: ENGAGEMENT_LABELS[value] }));

const nullIfEmpty = (value: string): string | null => (value.trim() === '' ? null : value);

interface StakeholderRegisterEditorProps {
  projectId: string;
  initialInput: StakeholderRegisterInput;
  /** Entrée éditée seule ; absente : tout le registre. */
  target?: EntryTarget;
  onCancel: () => void;
  onSaved: () => void;
}

/** Saisie du registre : identification, analyse pouvoir / intérêt, engagement actuel et souhaité. */
export function StakeholderRegisterEditor({ projectId, initialInput, target, onCancel, onSaved }: StakeholderRegisterEditorProps) {
  const focus = useEntryFocus({
    entries: initialInput.stakeholders,
    keyOf: (stakeholder) => stakeholder.code,
    target,
    blank: () => blankStakeholder(nextCode(initialInput.stakeholders, 'PP')),
    labels: {
      create: 'Nouvelle partie prenante',
      edit: (stakeholder) => `Partie prenante ${stakeholder.code}`,
      deleteMessage: "La partie prenante disparaît du registre et de l'analyse pouvoir / intérêt.",
    },
    remove: (code) =>
      stakeholderRegisterApi.save(projectId, {
        ...initialInput,
        stakeholders: initialInput.stakeholders.filter((stakeholder) => stakeholder.code !== code),
      }),
    onRemoved: onSaved,
  });
  const [input, setInput] = useState<StakeholderRegisterInput>({ ...initialInput, stakeholders: focus.entries });

  const renderStakeholder = (
    stakeholder: StakeholderInput,
    update: (patch: Partial<StakeholderInput>) => void,
  ) => {
    const quadrant = quadrantOf(stakeholder.power, stakeholder.interest);
    const gap = engagementGap(stakeholder.currentEngagement, stakeholder.desiredEngagement);

    return (
      <div className="entry-form">
        <section className="entry-form__step">
          <h3 className="entry-form__step-title">Identification</h3>
          <div className="editor-grid editor-grid--code-title">
            <Field label="Code">
              <TextInput value={stakeholder.code} onChange={(code) => update({ code })} required />
            </Field>
            <Field label="Nom (personne, groupe ou entité)">
              <TextInput value={stakeholder.name} onChange={(name) => update({ name })} required />
            </Field>
          </div>
          <div className="editor-grid editor-grid--fluid">
            <Field label="Rôle dans le projet">
              <TextInput value={stakeholder.role} onChange={(role) => update({ role })} required />
            </Field>
            <Field label="Organisation">
              <TextInput
                value={stakeholder.organization ?? ''}
                onChange={(value) => update({ organization: nullIfEmpty(value) })}
              />
            </Field>
            <Field label="Type">
              <SelectInput value={stakeholder.type} onChange={(type) => update({ type })} options={TYPE_OPTIONS} />
            </Field>
          </div>
          <Field
            label="Contact professionnel (facultatif)"
            hint="E-mail professionnel, boîte de service ou canal (ex. « Via les chefs de dépôt ») — jamais de coordonnées personnelles."
          >
            <TextInput
              value={stakeholder.contact ?? ''}
              onChange={(value) => update({ contact: nullIfEmpty(value) })}
            />
          </Field>
        </section>

        <section className="entry-form__step">
          <h3 className="entry-form__step-title">Analyse</h3>
          <div className="editor-grid editor-grid--fluid">
            <Field label="Pouvoir">
              <SelectInput
                value={String(stakeholder.power) as ScaleValue}
                onChange={(value) => update({ power: Number(value) })}
                options={SCALE_OPTIONS}
              />
            </Field>
            <Field label="Intérêt">
              <SelectInput
                value={String(stakeholder.interest) as ScaleValue}
                onChange={(value) => update({ interest: Number(value) })}
                options={SCALE_OPTIONS}
              />
            </Field>
            <div className="entry-form__score" aria-live="polite">
              <span className="field__label">Stratégie</span>
              <span>
                <span className={`quadrant-badge quadrant--${QUADRANT_MODIFIERS[quadrant]}`}>
                  {QUADRANT_LABELS[quadrant]}
                </span>{' '}
                <span className="entry-form__hint">{QUADRANT_HINTS[quadrant]}</span>
              </span>
            </div>
          </div>
        </section>

        <section className="entry-form__step">
          <h3 className="entry-form__step-title">Engagement</h3>
          <div className="editor-grid editor-grid--fluid">
            <Field label="Engagement actuel">
              <SelectInput<EngagementLevel>
                value={stakeholder.currentEngagement}
                onChange={(currentEngagement) => update({ currentEngagement })}
                options={ENGAGEMENT_OPTIONS}
              />
            </Field>
            <Field label="Engagement souhaité">
              <SelectInput<EngagementLevel>
                value={stakeholder.desiredEngagement}
                onChange={(desiredEngagement) => update({ desiredEngagement })}
                options={ENGAGEMENT_OPTIONS}
              />
            </Field>
            <div className="entry-form__score" aria-live="polite">
              <span className="field__label">Écart</span>
              <span className={`engagement-gap engagement-gap--${gap > 0 ? 'todo' : 'done'}`}>{formatGap(gap)}</span>
            </div>
          </div>
          <div className="editor-grid editor-grid--fluid">
            <Field label="Exigences">
              <TextArea
                value={stakeholder.requirements ?? ''}
                onChange={(value) => update({ requirements: nullIfEmpty(value) })}
                rows={2}
              />
            </Field>
            <Field label="Attentes">
              <TextArea
                value={stakeholder.expectations ?? ''}
                onChange={(value) => update({ expectations: nullIfEmpty(value) })}
                rows={2}
              />
            </Field>
            <Field label="Actions d'engagement">
              <TextArea
                value={stakeholder.strategy ?? ''}
                onChange={(value) => update({ strategy: nullIfEmpty(value) })}
                rows={2}
              />
            </Field>
          </div>
        </section>
      </div>
    );
  };

  return (
    <EditorShell title={focus.title ?? 'Registre des parties prenantes'} save={() => stakeholderRegisterApi.save(projectId, input)} onCancel={onCancel} onSaved={onSaved} extraActions={focus.deleteAction}>

      {focus.index === null ? (
        <>
          <fieldset className="editor-section">
            <legend>Parties prenantes ({input.stakeholders.length})</legend>
            <p className="editor-section__note">
              Seul un contact professionnel est conservé, et il est facultatif : ni téléphone ni adresse personnels.
            </p>
            <ArrayEditor<StakeholderInput>
              items={input.stakeholders}
              onChange={(stakeholders) => setInput({ stakeholders })}
              addLabel="Identifier une partie prenante"
              emptyLabel="Aucune partie prenante identifiée."
              makeEmpty={() => blankStakeholder(nextCode(input.stakeholders, 'PP'))}
              renderItem={renderStakeholder}
            />
          </fieldset>
        </>
      ) : (
        <FocusedEntry
          entries={input.stakeholders}
          index={focus.index}
          onChange={(stakeholders) => setInput({ stakeholders })}
          render={renderStakeholder}
        />
      )}
    </EditorShell>
  );
}
