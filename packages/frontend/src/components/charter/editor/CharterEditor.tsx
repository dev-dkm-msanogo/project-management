import { useState } from 'react';
import type {
  CharterMilestoneInput,
  CharterObjectiveCategory,
  CharterObjectiveInput,
  OverallRiskLevel,
  ProjectCharterInput,
  ProjectManagerAuthorityInput,
} from '@shared/index';
import { charterApi } from '@/api/project-documents';
import { EditorShell } from '@/components/form/EditorShell';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { Field } from '@/components/form/Field';
import { DateInput, LinesInput, MoneyInput, SelectInput, TextArea, TextInput } from '@/components/form/controls';
import { PersonSelect, usePeople } from '@/components/people/People';
import {
  AUTHORITY_LABELS,
  OBJECTIVE_CATEGORY_LABELS,
  OVERALL_RISK_LABELS,
  missingForSubmission,
} from '@/lib/charter-format';
import { todayIso } from '@/lib/format';

const options = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));

const CATEGORY_OPTIONS = options<CharterObjectiveCategory>(OBJECTIVE_CATEGORY_LABELS);
const RISK_OPTIONS: { value: OverallRiskLevel | ''; label: string }[] = [
  { value: '', label: 'À évaluer' },
  ...options<OverallRiskLevel>(OVERALL_RISK_LABELS),
];
const AUTHORITY_KEYS = Object.keys(AUTHORITY_LABELS) as (keyof ProjectManagerAuthorityInput)[];

const LINES_HINT = 'Un élément par ligne.';
const nullIfEmpty = (value: string): string | null => (value.trim() === '' ? null : value);

interface CharterEditorProps {
  mode: 'edit' | 'create';
  projectId: string;
  initialInput: ProjectCharterInput;
  onCancel: () => void;
  onSaved: () => void;
}

/** Rédaction de la charte selon le template PMI : contenu et autorités (signatures : circuit de validation). */
export function CharterEditor({ mode, projectId, initialInput, onCancel, onSaved }: CharterEditorProps) {
  const [input, setInput] = useState<ProjectCharterInput>(initialInput);

  const patch = (changes: Partial<ProjectCharterInput>) => setInput((current) => ({ ...current, ...changes }));
  const patchAuthority = (changes: Partial<ProjectManagerAuthorityInput>) =>
    patch({ projectManager: { ...input.projectManager, authority: { ...input.projectManager.authority, ...changes } } });
  const missing = missingForSubmission(input);
  const { byId } = usePeople();
  // Fonction du sponsor reprise du référentiel quand on change de sponsor, sauf si elle a été retouchée.
  const jobTitleOf = (id: string | null) => (id ? (byId.get(id)?.jobTitle ?? '') : '');
  const sponsorRoleFor = (resourceId: string | null) =>
    !input.sponsor.role || input.sponsor.role === jobTitleOf(input.sponsor.resourceId) ? jobTitleOf(resourceId) : input.sponsor.role;

  return (
    <EditorShell title={mode === 'create' ? 'Nouvelle charte' : 'Charte du projet'} save={() => charterApi.save(projectId, input)} onCancel={onCancel} onSaved={onSaved}>
      {missing.length > 0 ? (
        <p className="entry-form__warning" role="note">
          <strong>À compléter avant de soumettre la charte à validation ({missing.length}) :</strong> {missing.join(', ')}.
          Les rubriques marquées d'un * sont obligatoires ; vous pouvez enregistrer un brouillon en attendant.
        </p>
      ) : (
        <p className="entry-form__ready" role="note">
          Toutes les rubriques obligatoires sont renseignées : la charte peut être soumise à validation après l'enregistrement.
        </p>
      )}

      <fieldset className="editor-section">
        <legend>Identification</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
          <Field label="Sponsor">
            <PersonSelect
              value={input.sponsor.resourceId || null}
              onChange={(resourceId) =>
                patch({ sponsor: { ...input.sponsor, resourceId: resourceId ?? '', role: sponsorRoleFor(resourceId) } })
              }
            />
          </Field>
          <Field label="Fonction du sponsor">
            <TextInput value={input.sponsor.role} onChange={(role) => patch({ sponsor: { ...input.sponsor, role } })} />
          </Field>
          <Field label="Chef de projet">
            <PersonSelect
              value={input.projectManager.resourceId || null}
              onChange={(resourceId) => patch({ projectManager: { ...input.projectManager, resourceId: resourceId ?? '' } })}
            />
          </Field>
        </div>
        <Field label="Client du projet (interne et/ou externe)">
          <TextInput value={input.customer ?? ''} onChange={(value) => patch({ customer: nullIfEmpty(value) })} />
        </Field>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Objet et description</legend>
        <Field label="Objet du projet (besoin, opportunité, bénéfices attendus)">
          <TextArea value={input.purpose} onChange={(purpose) => patch({ purpose })} rows={3} required />
        </Field>
        <Field label="Description de haut niveau (ce que le projet va réaliser)" needed>
          <TextArea value={input.description} onChange={(description) => patch({ description })} rows={3} />
        </Field>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Limites, livrables et exigences</legend>
        <div className="editor-grid">
          <Field label="Dans le périmètre" hint={LINES_HINT}>
            <LinesInput value={input.inScope} onChange={(inScope) => patch({ inScope })} />
          </Field>
          <Field label="Hors périmètre" hint={LINES_HINT}>
            <LinesInput value={input.outOfScope} onChange={(outOfScope) => patch({ outOfScope })} />
          </Field>
          <Field label="Livrables clés" hint={LINES_HINT} needed>
            <LinesInput value={input.deliverables} onChange={(deliverables) => patch({ deliverables })} />
          </Field>
          <Field label="Exigences de haut niveau" hint={LINES_HINT} needed>
            <LinesInput value={input.requirements} onChange={(requirements) => patch({ requirements })} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Risque global du projet</legend>
        <div className="editor-grid editor-grid--narrow-wide">
          <Field label="Niveau" needed>
            <SelectInput<OverallRiskLevel | ''>
              value={input.overallRiskLevel ?? ''}
              onChange={(value) => patch({ overallRiskLevel: value === '' ? null : value })}
              options={RISK_OPTIONS}
            />
          </Field>
          <Field label="Principaux domaines de risque" hint={LINES_HINT}>
            <LinesInput value={input.highLevelRisks} onChange={(highLevelRisks) => patch({ highLevelRisks })} rows={3} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Objectifs et critères de succès ({input.objectives.length}) *</legend>
        <ArrayEditor<CharterObjectiveInput>
          items={input.objectives}
          onChange={(objectives) => patch({ objectives })}
          addLabel="Ajouter un objectif"
          emptyLabel="Aucun objectif."
          makeEmpty={() => ({ category: 'SCOPE', objective: '', successCriterion: '' })}
          renderItem={(item, update) => (
            <div className="editor-grid editor-grid--objective">
              <Field label="Rubrique">
                <SelectInput value={item.category} onChange={(category) => update({ category })} options={CATEGORY_OPTIONS} />
              </Field>
              <Field label="Objectif">
                <TextInput value={item.objective} onChange={(objective) => update({ objective })} required />
              </Field>
              <Field label="Critère de succès (mesurable)">
                <TextInput
                  value={item.successCriterion}
                  onChange={(successCriterion) => update({ successCriterion })}
                  required
                />
              </Field>
            </div>
          )}
        />
      </fieldset>

      <fieldset className="editor-section">
        <legend>Jalons sommaires * et financement</legend>
        <ArrayEditor<CharterMilestoneInput>
          items={input.milestones}
          onChange={(milestones) => patch({ milestones })}
          addLabel="Ajouter un jalon"
          emptyLabel="Aucun jalon."
          makeEmpty={() => ({ name: '', targetDate: '' })}
          renderItem={(item, update) => (
            <div className="editor-grid editor-grid--wide-narrow">
              <Field label="Jalon">
                <TextInput value={item.name} onChange={(name) => update({ name })} required />
              </Field>
              <Field label="Échéance">
                <DateInput value={item.targetDate || null} onChange={(date) => update({ targetDate: date ?? '' })} required />
              </Field>
            </div>
          )}
        />
        <div className="editor-grid editor-grid--narrow-wide charter-editor__funding">
          <Field label="Ressources financières pré-approuvées">
            <MoneyInput value={input.budget} onChange={(budget) => patch({ budget })} />
          </Field>
          <Field label="Source de financement">
            <TextInput value={input.fundingSource ?? ''} onChange={(value) => patch({ fundingSource: nullIfEmpty(value) })} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Critères de clôture et autorités</legend>
        <Field label="Critères de clôture du projet (conditions de fin ou d'arrêt)" needed>
          <TextArea value={input.exitCriteria} onChange={(exitCriteria) => patch({ exitCriteria })} rows={2} />
        </Field>
        <div className="editor-sub">Niveau d'autorité du chef de projet</div>
        <div className="editor-grid">
          {AUTHORITY_KEYS.map((key) => (
            <Field key={key} label={AUTHORITY_LABELS[key]} needed>
              <TextArea
                value={input.projectManager.authority[key]}
                onChange={(value) => patchAuthority({ [key]: value })}
                rows={2}
              />
            </Field>
          ))}
        </div>
        <Field label="Autorité du sponsor" needed>
          <TextArea
            value={input.sponsor.authority}
            onChange={(authority) => patch({ sponsor: { ...input.sponsor, authority } })}
            rows={2}
          />
        </Field>
      </fieldset>

    </EditorShell>
  );
}
