import { useId, useState } from 'react';
import type {
  RequirementCategory,
  RequirementInput,
  RequirementPriority,
  RequirementStatus,
  RequirementsRegisterInput,
} from '@shared/index';
import { requirementsApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { FocusedEntry, useEntryFocus, type EntryTarget } from '@/components/form/EntryFocus';
import { Field } from '@/components/form/Field';
import { CheckboxInput, SelectInput, TextArea, TextInput } from '@/components/form/controls';
import { useProjectCharter, useScopeStatement, useStakeholderRegister } from '@/hooks/useProjectDocuments';
import { nextCode } from '@/lib/codes';
import {
  blankRequirement,
  CATEGORY_PREFIXES,
  isNeed,
  isSolution,
  PRIORITY_DESCRIPTIONS,
  REQUIREMENT_CATEGORY_LABELS,
  REQUIREMENT_STATUS_LABELS,
  SOLUTION_CATEGORIES,
  verifiedWithoutEvidence,
} from '@/lib/requirements-format';

const options = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));

const CATEGORY_OPTIONS = options<RequirementCategory>(REQUIREMENT_CATEGORY_LABELS);
const PRIORITY_OPTIONS = options<RequirementPriority>(PRIORITY_DESCRIPTIONS);
const STATUS_OPTIONS = options<RequirementStatus>(REQUIREMENT_STATUS_LABELS);
const AUTO_CODE = /^[BSFNTP]-\d+$/i;

const sameCode = (a: string, b: string) => a.toUpperCase() === b.toUpperCase();
const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))];

interface RequirementsRegisterEditorProps {
  projectId: string;
  initialInput: RequirementsRegisterInput;
  /** Entrée éditée seule ; absente : tout le registre. */
  target?: EntryTarget;
  onCancel: () => void;
  onSaved: () => void;
}

/**
 * Saisie des exigences et de leur traçabilité. Suggestions tirées des autres documents du
 * projet : parties prenantes (source), objectifs de la charte, livrables de l'énoncé du périmètre.
 */
export function RequirementsRegisterEditor({ projectId, initialInput, target, onCancel, onSaved }: RequirementsRegisterEditorProps) {
  const focus = useEntryFocus({
    entries: initialInput.requirements,
    keyOf: (requirement) => requirement.code,
    target,
    blank: () => blankRequirement(initialInput.requirements),
    labels: {
      create: 'Nouvelle exigence',
      edit: (requirement) => `Exigence ${requirement.code}`,
      deleteMessage: "L'exigence disparaît du registre et de la matrice de traçabilité.",
    },
    remove: (code) =>
      requirementsApi.save(projectId, {
        ...initialInput,
        requirements: initialInput.requirements.filter((requirement) => requirement.code !== code),
      }),
    onRemoved: onSaved,
  });
  const [input, setInput] = useState<RequirementsRegisterInput>({ ...initialInput, requirements: focus.entries });
  const listId = useId();
  const { data: stakeholders } = useStakeholderRegister(projectId);
  const { data: charter } = useProjectCharter(projectId);
  const { data: scope } = useScopeStatement(projectId);

  const suggestions = {
    sources: unique(stakeholders?.stakeholders.map((stakeholder) => stakeholder.name) ?? []),
    objectives: unique(charter?.objectives.map((objective) => objective.objective) ?? []),
    deliverables: unique(scope?.deliverables.map((deliverable) => deliverable.name) ?? charter?.deliverables ?? []),
  };
  const needs = input.requirements.filter(isNeed);

  const renderRequirement = (
    requirement: RequirementInput,
    update: (patch: Partial<RequirementInput>) => void,
    index: number,
  ) => {
    // Changer de catégorie : code renuméroté s'il suit le format automatique ; un besoin ne
    // satisfait aucune autre exigence.
    const changeCategory = (category: RequirementCategory) => {
      const others = input.requirements.filter((_, i) => i !== index);
      update({
        category,
        code: AUTO_CODE.test(requirement.code) ? nextCode(others, CATEGORY_PREFIXES[category]) : requirement.code,
        satisfies: SOLUTION_CATEGORIES.includes(category) ? requirement.satisfies : [],
      });
    };
    const isLinked = (code: string) => requirement.satisfies.some((linked) => sameCode(linked, code));
    const toggleNeed = (code: string, checked: boolean) =>
      update({
        satisfies: checked
          ? [...requirement.satisfies, code]
          : requirement.satisfies.filter((linked) => !sameCode(linked, code)),
      });
    // Liens vers un besoin supprimé ou renommé : affichés pour pouvoir les retirer.
    const dangling = requirement.satisfies.filter((code) => !needs.some((need) => sameCode(need.code, code)));

    return (
      <div className="entry-form">
        <section className="entry-form__step">
          <h3 className="entry-form__step-title">Exigence</h3>
          <div className="editor-grid editor-grid--fluid">
            <Field label="Catégorie">
              <SelectInput value={requirement.category} onChange={changeCategory} options={CATEGORY_OPTIONS} />
            </Field>
            <Field label="Code">
              <TextInput value={requirement.code} onChange={(code) => update({ code })} required />
            </Field>
            <Field label="Priorité (MoSCoW)">
              <SelectInput value={requirement.priority} onChange={(priority) => update({ priority })} options={PRIORITY_OPTIONS} />
            </Field>
            <Field label="Statut">
              <SelectInput value={requirement.status} onChange={(status) => update({ status })} options={STATUS_OPTIONS} />
            </Field>
          </div>
          <Field label="Exigence">
            <TextArea value={requirement.statement} onChange={(statement) => update({ statement })} rows={2} required />
          </Field>
          <div className="editor-grid">
            <Field label="Partie prenante (source)">
              <TextInput value={requirement.source} onChange={(source) => update({ source })} list={`${listId}-sources`} />
            </Field>
            <Field label="Phase ou version">
              <TextInput value={requirement.phase} onChange={(phase) => update({ phase })} />
            </Field>
          </div>
        </section>

        <section className="entry-form__step">
          <h3 className="entry-form__step-title">Acceptation et vérification</h3>
          <Field label="Critères d'acceptation">
            <TextArea
              value={requirement.acceptanceCriteria}
              onChange={(acceptanceCriteria) => update({ acceptanceCriteria })}
              rows={2}
            />
          </Field>
          <div className="editor-grid">
            <Field label="Méthode de vérification">
              <TextInput value={requirement.verification} onChange={(verification) => update({ verification })} />
            </Field>
            <Field label="Validation (par qui, comment)">
              <TextInput value={requirement.validation} onChange={(validation) => update({ validation })} />
            </Field>
          </div>
          {verifiedWithoutEvidence(requirement) && (
            <p className="entry-form__warning" role="alert">
              Une exigence vérifiée doit avoir des critères d'acceptation et une méthode de vérification.
            </p>
          )}
        </section>

        <section className="entry-form__step">
          <h3 className="entry-form__step-title">Traçabilité</h3>
          <div className="editor-grid">
            <Field label="Objectif métier">
              <TextInput
                value={requirement.businessObjective}
                onChange={(businessObjective) => update({ businessObjective })}
                list={`${listId}-objectives`}
              />
            </Field>
            <Field label="Livrable">
              <TextInput
                value={requirement.deliverable}
                onChange={(deliverable) => update({ deliverable })}
                list={`${listId}-deliverables`}
              />
            </Field>
          </div>
          {isSolution(requirement) && (
            <div className="req-needs" role="group" aria-label="Besoins satisfaits">
              <span className="field__label">Besoins satisfaits</span>
              {needs.length === 0 && dangling.length === 0 ? (
                <span className="field__hint">Aucune exigence métier ou partie prenante dans le registre.</span>
              ) : (
                <div className="req-needs__options">
                  {needs.map((need) => (
                    <CheckboxInput
                      key={need.code}
                      label={`${need.code} · ${need.statement || 'sans énoncé'}`}
                      checked={isLinked(need.code)}
                      onChange={(checked) => toggleNeed(need.code, checked)}
                    />
                  ))}
                  {dangling.map((code) => (
                    <CheckboxInput
                      key={code}
                      label={`${code} · introuvable dans le registre`}
                      checked
                      onChange={() => toggleNeed(code, false)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    );
  };

  return (
    <EditorShell
      title={focus.title ?? 'Registre des exigences'}
      save={() => requirementsApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
      extraActions={focus.deleteAction}
    >
      {focus.index === null ? (
        <>
          <fieldset className="editor-section">
            <legend>Exigences ({input.requirements.length})</legend>
            <ArrayEditor<RequirementInput>
              items={input.requirements}
              onChange={(requirements) => setInput({ requirements })}
              addLabel="Ajouter une exigence"
              emptyLabel="Aucune exigence."
              makeEmpty={() => blankRequirement(input.requirements)}
              renderItem={renderRequirement}
            />
          </fieldset>
        </>
      ) : (
        <FocusedEntry
          entries={input.requirements}
          index={focus.index}
          onChange={(requirements) => setInput({ requirements })}
          render={renderRequirement}
        />
      )}

      {Object.entries(suggestions).map(([key, values]) => (
        <datalist key={key} id={`${listId}-${key}`}>
          {values.map((value) => (
            <option key={value} value={value} />
          ))}
        </datalist>
      ))}
    </EditorShell>
  );
}
