import { useId, useState } from 'react';
import type {
  ResourceBasisNarrativeInput,
  ResourceCategory,
  ResourceRequirementInput,
  ResourceRequirementsInput,
} from '@shared/index';
import { resourceRequirementsApi } from '@/api/project-documents';
import { ResourceSuggestions } from '@/components/admin/ResourceSuggestions';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { FocusedEntry, useEntryFocus, type EntryTarget } from '@/components/form/EntryFocus';
import { Field } from '@/components/form/Field';
import { SelectInput, TextArea, TextInput } from '@/components/form/controls';
import { blankResource, RESOURCE_CATEGORY_LABELS, RESOURCE_NARRATIVE_LABELS } from '@/lib/resource-format';

const CATEGORY_OPTIONS = (Object.keys(RESOURCE_CATEGORY_LABELS) as ResourceCategory[]).map((value) => ({
  value,
  label: RESOURCE_CATEGORY_LABELS[value],
}));

interface ResourceRequirementsEditorProps {
  projectId: string;
  initialInput: ResourceRequirementsInput;
  /** Entrée éditée seule ; absente : tout le registre. */
  target?: EntryTarget;
  onCancel: () => void;
  onSaved: () => void;
}

/** Saisie des besoins en ressources et de la base de leur estimation. */
export function ResourceRequirementsEditor({ projectId, initialInput, target, onCancel, onSaved }: ResourceRequirementsEditorProps) {
  const focus = useEntryFocus({
    entries: initialInput.requirements,
    keyOf: (requirement) => requirement.code,
    target,
    blank: () => blankResource(initialInput.requirements),
    labels: {
      create: 'Nouvelle ressource',
      edit: (requirement) => `Ressource ${requirement.code}`,
      deleteMessage: 'La ressource disparaît des besoins et de la structure de découpage des ressources.',
    },
    remove: (code) =>
      resourceRequirementsApi.save(projectId, {
        ...initialInput,
        requirements: initialInput.requirements.filter((requirement) => requirement.code !== code),
      }),
    onRemoved: onSaved,
  });
  const [input, setInput] = useState<ResourceRequirementsInput>({ ...initialInput, requirements: focus.entries });
  const groupListId = useId();
  const directoryListId = useId();
  const groups = [...new Set(input.requirements.map((requirement) => requirement.group).filter(Boolean))];

  const renderRequirement = (
    requirement: ResourceRequirementInput,
    update: (patch: Partial<ResourceRequirementInput>) => void,
  ) => {
    const isPerson = requirement.category === 'PEOPLE';
    return (
      <div className="entry-form">
        <section className="entry-form__step">
          <h3 className="entry-form__step-title">Ressource</h3>
          <div className="editor-grid editor-grid--fluid">
            <Field label="Code">
              <TextInput value={requirement.code} onChange={(code) => update({ code })} required />
            </Field>
            <Field label="Catégorie">
              <SelectInput value={requirement.category} onChange={(category) => update({ category })} options={CATEGORY_OPTIONS} />
            </Field>
            <Field label="Sous-ensemble (RBS)" hint="Regroupe les ressources dans la structure de découpage.">
              <TextInput value={requirement.group} onChange={(group) => update({ group })} list={groupListId} />
            </Field>
          </div>
          <Field label={isPerson ? 'Rôle ou personne' : 'Ressource'}>
            <TextInput
              value={requirement.name}
              onChange={(name) => update({ name })}
              list={isPerson ? directoryListId : undefined}
              required
            />
          </Field>
          <div className="editor-grid">
            <Field label={isPerson ? 'Quantité et allocation' : 'Quantité'}>
              <TextInput value={requirement.quantity} onChange={(quantity) => update({ quantity })} />
            </Field>
            <Field label={isPerson ? 'Niveau de compétence' : 'Qualité (grade)'}>
              <TextInput value={requirement.grade} onChange={(grade) => update({ grade })} />
            </Field>
          </div>
        </section>
        <section className="entry-form__step">
          <h3 className="entry-form__step-title">Hypothèses et commentaires</h3>
          <div className="editor-grid">
            <Field label="Hypothèses">
              <TextArea value={requirement.assumptions} onChange={(assumptions) => update({ assumptions })} rows={2} />
            </Field>
            <Field label="Commentaires">
              <TextArea value={requirement.comments} onChange={(comments) => update({ comments })} rows={2} />
            </Field>
          </div>
        </section>
      </div>
    );
  };

  return (
    <EditorShell
      title={focus.title ?? 'Besoins en ressources'}
      save={() => resourceRequirementsApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
      extraActions={focus.deleteAction}
    >
      {focus.index === null ? (
        <>
          <fieldset className="editor-section">
            <legend>Ressources ({input.requirements.length})</legend>
            <ArrayEditor<ResourceRequirementInput>
              items={input.requirements}
              onChange={(requirements) => setInput((current) => ({ ...current, requirements }))}
              addLabel="Ajouter une ressource"
              emptyLabel="Aucune ressource."
              makeEmpty={() => blankResource(input.requirements)}
              renderItem={renderRequirement}
            />
          </fieldset>

          <fieldset className="editor-section">
            <legend>Base des estimations</legend>
            {(Object.keys(RESOURCE_NARRATIVE_LABELS) as (keyof ResourceBasisNarrativeInput)[]).map((key) => (
              <Field key={key} label={RESOURCE_NARRATIVE_LABELS[key]}>
                <TextArea
                  value={input.narrative[key]}
                  onChange={(text) => setInput((current) => ({ ...current, narrative: { ...current.narrative, [key]: text } }))}
                  rows={3}
                />
              </Field>
            ))}
          </fieldset>
        </>
      ) : (
        <FocusedEntry
          entries={input.requirements}
          index={focus.index}
          onChange={(requirements) => setInput((current) => ({ ...current, requirements }))}
          render={renderRequirement}
        />
      )}

      <datalist id={groupListId}>
        {groups.map((group) => (
          <option key={group} value={group} />
        ))}
      </datalist>
      <ResourceSuggestions id={directoryListId} />
    </EditorShell>
  );
}
