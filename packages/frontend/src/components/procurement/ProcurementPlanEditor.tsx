import { useState } from 'react';
import type {
  PrequalifiedSellerInput,
  ProcurementActivityInput,
  ProcurementIntegrationInput,
  ProcurementMetricInput,
  ProcurementPlanInput,
  ProcurementRoleInput,
} from '@shared/index';
import { procurementPlanApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { DateInput, TextArea, TextInput } from '@/components/form/controls';
import type { DocumentEditorProps } from '@/features/DocumentFeature';
import { todayIso } from '@/lib/format';
import { INTEGRATION_LABELS, PLAN_TEXT_LABELS } from '@/lib/procurement-format';

const INTEGRATION_KEYS = Object.keys(INTEGRATION_LABELS) as (keyof ProcurementIntegrationInput)[];
const TEXT_KEYS = Object.keys(PLAN_TEXT_LABELS) as (keyof typeof PLAN_TEXT_LABELS)[];

/** Rédaction du plan de gestion des approvisionnements (template PMI). */
export function ProcurementPlanEditor({
  projectId,
  mode,
  initialInput,
  onCancel,
  onSaved,
}: DocumentEditorProps<ProcurementPlanInput> & { projectId: string }) {
  const [input, setInput] = useState<ProcurementPlanInput>(initialInput);
  const patch = (changes: Partial<ProcurementPlanInput>) => setInput((current) => ({ ...current, ...changes }));

  return (
    <EditorShell
      title={mode === 'create' ? 'Nouveau plan de gestion des approvisionnements' : 'Plan de gestion des approvisionnements'}
      save={() => procurementPlanApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <p className="editor__info">
        Les contraintes et hypothèses d'approvisionnement se tiennent dans le registre des hypothèses et contraintes
        (catégorie « Approvisionnements ») : le plan les reprend automatiquement.
      </p>

      <fieldset className="editor-section">
        <legend>Calendrier des activités d'achat ({input.activities.length})</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
        <ArrayEditor<ProcurementActivityInput>
          items={input.activities}
          onChange={(activities) => patch({ activities })}
          addLabel="Ajouter une activité"
          emptyLabel="Aucune activité."
          makeEmpty={() => ({ date: todayIso(), activity: '' })}
          renderItem={(item, update) => (
            <div className="editor-grid editor-grid--narrow-wide">
              <Field label="Date">
                <DateInput value={item.date} onChange={(date) => update({ date: date ?? todayIso() })} required />
              </Field>
              <Field label="Activité">
                <TextInput value={item.activity} onChange={(activity) => update({ activity })} required />
              </Field>
            </div>
          )}
        />
      </fieldset>

      <fieldset className="editor-section">
        <legend>Intégration au projet</legend>
        <div className="editor-grid">
          {INTEGRATION_KEYS.map((key) => (
            <Field key={key} label={INTEGRATION_LABELS[key]}>
              <TextArea
                value={input.integration[key]}
                onChange={(text) => patch({ integration: { ...input.integration, [key]: text } })}
                rows={3}
              />
            </Field>
          ))}
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Rôles, responsabilités et autorité ({input.roles.length})</legend>
        <ArrayEditor<ProcurementRoleInput>
          items={input.roles}
          onChange={(roles) => patch({ roles })}
          addLabel="Ajouter un rôle"
          emptyLabel="Aucun rôle."
          makeEmpty={() => ({ role: '', responsibility: '', authority: '' })}
          renderItem={(item, update) => (
            <div className="entry-form">
              <section className="entry-form__step">
                <Field label="Rôle">
                  <TextInput value={item.role} onChange={(role) => update({ role })} required />
                </Field>
                <div className="editor-grid">
                  <Field label="Responsabilités">
                    <TextArea value={item.responsibility} onChange={(responsibility) => update({ responsibility })} rows={2} />
                  </Field>
                  <Field label="Autorité">
                    <TextArea value={item.authority} onChange={(authority) => update({ authority })} rows={2} />
                  </Field>
                </div>
              </section>
            </div>
          )}
        />
      </fieldset>

      <fieldset className="editor-section">
        <legend>Indicateurs de performance des fournisseurs ({input.metrics.length})</legend>
        <ArrayEditor<ProcurementMetricInput>
          items={input.metrics}
          onChange={(metrics) => patch({ metrics })}
          addLabel="Ajouter un indicateur"
          emptyLabel="Aucun indicateur."
          makeEmpty={() => ({ item: '', metric: '', measurement: '' })}
          renderItem={(item, update) => (
            <div className="editor-grid editor-grid--3">
              <Field label="Élément suivi">
                <TextInput value={item.item} onChange={(value) => update({ item: value })} required />
              </Field>
              <Field label="Indicateur">
                <TextInput value={item.metric} onChange={(metric) => update({ metric })} />
              </Field>
              <Field label="Mesure et seuil">
                <TextInput value={item.measurement} onChange={(measurement) => update({ measurement })} />
              </Field>
            </div>
          )}
        />
      </fieldset>

      <fieldset className="editor-section">
        <legend>Cadre contractuel</legend>
        {TEXT_KEYS.map((key) => (
          <Field key={key} label={PLAN_TEXT_LABELS[key]}>
            <TextArea value={input[key]} onChange={(text) => patch({ [key]: text })} rows={3} />
          </Field>
        ))}
      </fieldset>

      <fieldset className="editor-section">
        <legend>Fournisseurs présélectionnés ({input.sellers.length})</legend>
        <ArrayEditor<PrequalifiedSellerInput>
          items={input.sellers}
          onChange={(sellers) => patch({ sellers })}
          addLabel="Ajouter un fournisseur"
          emptyLabel="Aucun fournisseur."
          makeEmpty={() => ({ name: '', description: '' })}
          renderItem={(item, update) => (
            <div className="editor-grid editor-grid--narrow-wide">
              <Field label="Fournisseur">
                <TextInput value={item.name} onChange={(name) => update({ name })} required />
              </Field>
              <Field label="Description">
                <TextInput value={item.description} onChange={(description) => update({ description })} />
              </Field>
            </div>
          )}
        />
      </fieldset>
    </EditorShell>
  );
}
