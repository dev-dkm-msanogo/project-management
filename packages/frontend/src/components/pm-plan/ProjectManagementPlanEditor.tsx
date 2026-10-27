import { useState } from 'react';
import type {
  DevelopmentApproachKind,
  LifeCyclePhaseInput,
  ProjectManagementPlanInput,
} from '@shared/index';
import { projectManagementPlanApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { DateInput, SelectInput, TextArea, TextInput } from '@/components/form/controls';
import type { DocumentEditorProps } from '@/features/DocumentFeature';
import { todayIso } from '@/lib/format';
import {
  APPROACH_HINTS,
  APPROACH_LABELS,
  CHANGE_LABELS,
  CONFIGURATION_LABELS,
  DEVELOPMENT_TEXT_LABELS,
} from '@/lib/pm-plan-format';

const options = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));

/** Rubriques rédigées d'un composant : une zone de texte par rubrique, sur deux colonnes. */
function TextFields<K extends string>({
  labels,
  values,
  onChange,
}: {
  labels: Record<K, string>;
  values: Record<K, string>;
  onChange: (key: K, text: string) => void;
}) {
  return (
    <div className="editor-grid">
      {(Object.keys(labels) as K[]).map((key) => (
        <Field key={key} label={labels[key]}>
          <TextArea value={values[key]} onChange={(text) => onChange(key, text)} rows={4} />
        </Field>
      ))}
    </div>
  );
}

/** Rédaction du plan de management : identification, cycle de vie, approche, modifications, configuration. */
export function ProjectManagementPlanEditor({
  projectId,
  mode,
  initialInput,
  onCancel,
  onSaved,
}: DocumentEditorProps<ProjectManagementPlanInput> & { projectId: string }) {
  const [input, setInput] = useState<ProjectManagementPlanInput>(initialInput);
  const patch = (changes: Partial<ProjectManagementPlanInput>) => setInput((current) => ({ ...current, ...changes }));
  const { lifeCycle, developmentApproach } = input;

  return (
    <EditorShell
      title={mode === 'create' ? 'Nouveau plan de management du projet' : 'Plan de management du projet'}
      save={() => projectManagementPlanApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <p className="editor__info">
        Les plans de gestion et les références de base se rédigent dans leurs pages : le plan les reprend
        automatiquement, avec le chef de projet et le sponsor de la charte. Version et approbation : circuit de
        validation.
      </p>

      <fieldset className="editor-section">
        <legend>Identification</legend>
        <div className="editor-grid editor-grid--3">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Cycle de vie ({lifeCycle.phases.length} phases)</legend>
        <Field label="Vue d'ensemble">
          <TextArea value={lifeCycle.overview} onChange={(overview) => patch({ lifeCycle: { ...lifeCycle, overview } })} rows={3} />
        </Field>
        <ArrayEditor<LifeCyclePhaseInput>
          items={lifeCycle.phases}
          onChange={(phases) => patch({ lifeCycle: { ...lifeCycle, phases } })}
          addLabel="Ajouter une phase"
          emptyLabel="Aucune phase."
          makeEmpty={() => ({ name: '', period: '', description: '', gate: '' })}
          renderItem={(phase, update, index) => (
            <div className="entry-form">
              <section className="entry-form__step">
                <div className="editor-grid editor-grid--wide-narrow">
                  <Field label={`Phase ${index + 1}`}>
                    <TextInput value={phase.name} onChange={(name) => update({ name })} required />
                  </Field>
                  <Field label="Période">
                    <TextInput value={phase.period} onChange={(period) => update({ period })} placeholder="ex. févr.–mars 2025" />
                  </Field>
                </div>
                <Field label="Contenu de la phase">
                  <TextArea value={phase.description} onChange={(description) => update({ description })} rows={2} />
                </Field>
                <Field label="Revue de passage">
                  <TextInput value={phase.gate} onChange={(gate) => update({ gate })} />
                </Field>
              </section>
            </div>
          )}
        />
        <Field label="Revues de passage">
          <TextArea value={lifeCycle.gateReview} onChange={(gateReview) => patch({ lifeCycle: { ...lifeCycle, gateReview } })} rows={3} />
        </Field>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Approche de développement</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Approche" hint={APPROACH_HINTS[developmentApproach.kind]}>
            <SelectInput<DevelopmentApproachKind>
              value={developmentApproach.kind}
              onChange={(kind) => patch({ developmentApproach: { ...developmentApproach, kind } })}
              options={options(APPROACH_LABELS)}
            />
          </Field>
        </div>
        <TextFields
          labels={DEVELOPMENT_TEXT_LABELS}
          values={developmentApproach}
          onChange={(key, text) => patch({ developmentApproach: { ...developmentApproach, [key]: text } })}
        />
      </fieldset>

      <fieldset className="editor-section">
        <legend>Gestion des modifications</legend>
        <TextFields
          labels={CHANGE_LABELS}
          values={input.changeManagement}
          onChange={(key, text) => patch({ changeManagement: { ...input.changeManagement, [key]: text } })}
        />
      </fieldset>

      <fieldset className="editor-section">
        <legend>Gestion de la configuration</legend>
        <TextFields
          labels={CONFIGURATION_LABELS}
          values={input.configurationManagement}
          onChange={(key, text) => patch({ configurationManagement: { ...input.configurationManagement, [key]: text } })}
        />
      </fieldset>
    </EditorShell>
  );
}
