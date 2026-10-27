import { useId, useState } from 'react';
import type {
  ChangeAlternativeInput,
  ChangeAssessmentInput,
  ChangeCategory,
  ChangeImpactArea,
  ChangeImpactDirection,
  ChangeLogInput,
  ChangeRequestInput,
  ChangeStatus,
  StakeholderImpactRisk,
} from '@shared/index';
import { changeLogApi } from '@/api/project-documents';
import { ResourceSuggestions } from '@/components/admin/ResourceSuggestions';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { ScoringCriteriaEditor } from '@/components/form/ScoringCriteriaEditor';
import { CheckboxInput, DateInput, NumberInput, SelectInput, TextArea, TextInput } from '@/components/form/controls';
import { PersonSelect } from '@/components/people/People';
import {
  blankAssessment,
  CHANGE_CATEGORIES,
  CHANGE_CATEGORY_LABELS,
  CHANGE_STATUS_LABELS,
  DIRECTION_LABELS,
  DISPOSITION_LABELS,
  IMPACT_AREAS,
  isUndecided,
  STAKEHOLDER_RISK_LABELS,
} from '@/lib/change-format';
import { formatShortDate, todayIso } from '@/lib/format';
import { withOptionAdded, withOptionRemoved } from '@/lib/scoring';

/** Options d'une liste dont la valeur vide signifie « non renseigné ». */
const optional = <T extends string>(labels: Record<T, string>, empty: string) => [
  { value: '' as T | '', label: empty },
  ...(Object.keys(labels) as T[]).map((value) => ({ value: value as T | '', label: labels[value] })),
];
const options = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));

const MAX_ALTERNATIVES = 10;

/** Évaluation : alternatives comparées, analyse pondérée, recommandation. */
function AssessmentFields({
  assessment,
  onChange,
}: {
  assessment: ChangeAssessmentInput;
  onChange: (assessment: ChangeAssessmentInput) => void;
}) {
  const patch = (changes: Partial<ChangeAssessmentInput>) => onChange({ ...assessment, ...changes });
  const { alternatives, criteria } = assessment;
  const label = (index: number) => alternatives[index]?.name || `Alternative ${index + 1}`;

  const updateAlternative = (index: number, changes: Partial<ChangeAlternativeInput>) => {
    const previous = alternatives[index]!.name;
    patch({
      alternatives: alternatives.map((item, i) => (i === index ? { ...item, ...changes } : item)),
      // Renommer l'alternative recommandée garde la recommandation.
      recommended: changes.name !== undefined && assessment.recommended === previous ? changes.name : assessment.recommended,
    });
  };
  const addAlternative = () =>
    patch({
      alternatives: [...alternatives, { name: '', cost: '', schedule: '', pros: '', cons: '' }],
      criteria: withOptionAdded(criteria),
    });
  const removeAlternative = (index: number) =>
    patch({
      alternatives: alternatives.filter((_, i) => i !== index),
      criteria: withOptionRemoved(criteria, index),
      recommended: assessment.recommended === alternatives[index]!.name ? null : assessment.recommended,
    });

  return (
    <>
      <div className="editor-grid">
        <Field label="Évaluée par">
          <PersonSelect value={assessment.assessedById || null} onChange={(id) => patch({ assessedById: id ?? '' })} />
        </Field>
        <Field label="Date d'évaluation">
          <DateInput value={assessment.assessedOn} onChange={(date) => patch({ assessedOn: date ?? todayIso() })} required />
        </Field>
      </div>

      <h4 className="entry-form__step-title">Alternatives ({alternatives.length})</h4>
      {alternatives.map((alternative, index) => (
        <div key={index} className="array-editor__row">
          <div className="array-editor__fields entry-form">
            <section className="entry-form__step">
              <div className="editor-grid editor-grid--3">
                <Field label={`Alternative ${index + 1}`}>
                  <TextInput value={alternative.name} onChange={(name) => updateAlternative(index, { name })} required />
                </Field>
                <Field label="Coût">
                  <TextInput value={alternative.cost} onChange={(cost) => updateAlternative(index, { cost })} />
                </Field>
                <Field label="Délai">
                  <TextInput value={alternative.schedule} onChange={(schedule) => updateAlternative(index, { schedule })} />
                </Field>
              </div>
              <div className="editor-grid">
                <Field label="Avantages">
                  <TextArea value={alternative.pros} onChange={(pros) => updateAlternative(index, { pros })} rows={2} />
                </Field>
                <Field label="Inconvénients">
                  <TextArea value={alternative.cons} onChange={(cons) => updateAlternative(index, { cons })} rows={2} />
                </Field>
              </div>
            </section>
          </div>
          <button
            type="button"
            className="btn btn--icon"
            onClick={() => removeAlternative(index)}
            disabled={alternatives.length === 1}
            aria-label={`Retirer ${label(index)}`}
          >
            ✕
          </button>
        </div>
      ))}
      {alternatives.length < MAX_ALTERNATIVES && (
        <button type="button" className="btn btn--ghost change-add" onClick={addAlternative}>
          + Ajouter une alternative
        </button>
      )}

      <h4 className="entry-form__step-title">Analyse multicritère (facultative)</h4>
      <ScoringCriteriaEditor
        options={alternatives.map((_, index) => label(index))}
        criteria={criteria}
        onChange={(next) => patch({ criteria: next })}
      />

      <div className="editor-grid editor-grid--fluid">
        <Field label="Alternative recommandée">
          <SelectInput
            value={assessment.recommended ?? ''}
            onChange={(recommended) => patch({ recommended: recommended || null })}
            options={[
              { value: '', label: 'Aucune' },
              ...alternatives.filter((item) => item.name.trim()).map((item) => ({ value: item.name, label: item.name })),
            ]}
          />
        </Field>
      </div>
      <div className="editor-grid">
        <Field label="Recommandation">
          <TextArea value={assessment.recommendation} onChange={(recommendation) => patch({ recommendation })} rows={3} />
        </Field>
        <Field label="Mise en œuvre prévue">
          <TextArea
            value={assessment.implementationNotes}
            onChange={(implementationNotes) => patch({ implementationNotes })}
            rows={3}
          />
        </Field>
      </div>
    </>
  );
}

interface ChangeRequestEditorProps {
  projectId: string;
  /** Registre courant : la demande y est ajoutée ou remplacée à l'enregistrement. */
  log: ChangeLogInput;
  initialInput: ChangeRequestInput;
  isNew: boolean;
  onCancel: () => void;
  onSaved: (code: string) => void;
}

/** Rédaction d'une demande de modification : demande, impacts, évaluation, décision. */
export function ChangeRequestEditor({ projectId, log, initialInput, isNew, onCancel, onSaved }: ChangeRequestEditorProps) {
  const [input, setInput] = useState<ChangeRequestInput>(initialInput);
  const patch = (changes: Partial<ChangeRequestInput>) => setInput((current) => ({ ...current, ...changes }));
  const peopleListId = useId();
  const decided = input.disposition !== null;

  const setImpact = (area: ChangeImpactArea, changes: Partial<ChangeRequestInput['impacts'][ChangeImpactArea]>) =>
    patch({ impacts: { ...input.impacts, [area]: { ...input.impacts[area], ...changes } } });
  const toggleCategory = (category: ChangeCategory, checked: boolean) =>
    patch({
      categories: checked
        ? CHANGE_CATEGORIES.filter((other) => other === category || input.categories.includes(other))
        : input.categories.filter((other) => other !== category),
    });
  // La décision vient des valideurs : avant elle, la demande est soumise ou en analyse ; après,
  // elle peut être mise en œuvre (si approuvée) puis close.
  const statusOptions = options(CHANGE_STATUS_LABELS).filter(({ value }) =>
    input.disposition === null
      ? isUndecided(value)
      : value === 'DECIDED' || value === 'CLOSED' || (value === 'IMPLEMENTED' && input.disposition === 'APPROVED'),
  );

  const save = () => {
    const requests = isNew
      ? [...log.requests, input]
      : log.requests.map((request) => (request.code === initialInput.code ? input : request));
    return changeLogApi.save(projectId, { requests });
  };

  return (
    <EditorShell
      title={isNew ? 'Nouvelle demande de modification' : `Demande ${initialInput.code}`}
      save={save}
      onCancel={onCancel}
      onSaved={() => onSaved(input.code.trim())}
    >
      <fieldset className="editor-section">
        <legend>Demande</legend>
        <div className="editor-grid editor-grid--3">
          <Field label="Code">
            <TextInput value={input.code} onChange={(code) => patch({ code })} required />
          </Field>
          <Field label="Demandeur">
            <TextInput value={input.requestor} onChange={(requestor) => patch({ requestor })} list={peopleListId} required />
          </Field>
          <Field label="Date de soumission">
            <DateInput value={input.submittedOn} onChange={(date) => patch({ submittedOn: date ?? todayIso() })} required />
          </Field>
        </div>
        <Field label="Modification demandée" hint="Résumé repris dans le registre.">
          <TextInput value={input.title} onChange={(title) => patch({ title })} required />
        </Field>
        <div className="style-options" role="group" aria-label="Catégories">
          {CHANGE_CATEGORIES.map((category) => (
            <CheckboxInput
              key={category}
              label={CHANGE_CATEGORY_LABELS[category]}
              checked={input.categories.includes(category)}
              onChange={(checked) => toggleCategory(category, checked)}
            />
          ))}
        </div>
        <div className="editor-grid">
          <Field label="Description détaillée">
            <TextArea value={input.description} onChange={(description) => patch({ description })} rows={4} />
          </Field>
          <Field label="Justification">
            <TextArea value={input.justification} onChange={(justification) => patch({ justification })} rows={4} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Impacts</legend>
        <div className="editor-grid">
          <Field label="Coût estimé (FCFA)" hint="Négatif pour une économie.">
            <NumberInput value={input.costImpact} onChange={(value) => patch({ costImpact: Math.round(value) })} step={1} />
          </Field>
          <Field label="Délai (jours ouvrés)" hint="Négatif pour un gain.">
            <NumberInput
              value={input.scheduleImpactDays}
              onChange={(value) => patch({ scheduleImpactDays: Math.round(value) })}
              step={1}
            />
          </Field>
        </div>
        {IMPACT_AREAS.map((area) => (
          <div key={area} className="editor-grid editor-grid--narrow-wide">
            <Field label={CHANGE_CATEGORY_LABELS[area]}>
              <SelectInput<ChangeImpactDirection | ''>
                value={input.impacts[area].direction ?? ''}
                onChange={(direction) => setImpact(area, { direction: direction || null })}
                options={optional(DIRECTION_LABELS, 'Sans effet')}
              />
            </Field>
            <Field label="Description">
              <TextInput value={input.impacts[area].description} onChange={(description) => setImpact(area, { description })} />
            </Field>
          </div>
        ))}
        <div className="editor-grid editor-grid--narrow-wide">
          <Field label="Parties prenantes">
            <SelectInput<StakeholderImpactRisk | ''>
              value={input.stakeholderRisk ?? ''}
              onChange={(risk) => patch({ stakeholderRisk: risk || null })}
              options={optional(STAKEHOLDER_RISK_LABELS, 'Non évalué')}
            />
          </Field>
          <Field label="Description">
            <TextInput value={input.stakeholderImpact} onChange={(stakeholderImpact) => patch({ stakeholderImpact })} />
          </Field>
        </div>
        <div className="editor-grid">
          <Field label="Documents du projet à mettre à jour">
            <TextArea value={input.affectedDocuments} onChange={(affectedDocuments) => patch({ affectedDocuments })} rows={3} />
          </Field>
          <Field label="Commentaires">
            <TextArea value={input.comments} onChange={(comments) => patch({ comments })} rows={3} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Évaluation</legend>
        <CheckboxInput
          label="Évaluer la demande : alternatives, analyse multicritère, recommandation"
          checked={input.assessment !== null}
          onChange={(checked) => patch({ assessment: checked ? blankAssessment() : null })}
        />
        {input.assessment && (
          <AssessmentFields assessment={input.assessment} onChange={(assessment) => patch({ assessment })} />
        )}
      </fieldset>

      <fieldset className="editor-section">
        <legend>Suivi</legend>
        <div className="editor-grid editor-grid--3">
          <Field label="Statut">
            <SelectInput<ChangeStatus>
              value={input.status}
              onChange={(status) => patch({ status })}
              options={statusOptions}
            />
          </Field>
        </div>
        <p className="editor-section__note">
          {decided && input.disposition
            ? `${DISPOSITION_LABELS[input.disposition]} le ${formatShortDate(input.decidedOn)} par ${input.decidedBy} : seuls le statut et les commentaires évoluent désormais.`
            : 'La décision revient aux valideurs du projet : ils la prennent depuis la fiche de la demande.'}
        </p>
      </fieldset>
      <ResourceSuggestions id={peopleListId} />
    </EditorShell>
  );
}
