import { useId, useState } from 'react';
import type { CommunicationItemInput, CommunicationPlanInput, GlossaryEntryInput } from '@shared/index';
import { communicationPlanApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { DateInput, LinesInput, TextArea, TextInput } from '@/components/form/controls';
import { PersonSelect } from '@/components/people/People';
import type { DocumentEditorProps } from '@/features/DocumentFeature';
import { useStakeholderRegister } from '@/hooks/useProjectDocuments';
import { GROUP_AUDIENCES } from '@/lib/communication-format';
import { todayIso } from '@/lib/format';

const LINES_HINT = 'Un élément par ligne.';

/**
 * Rédaction du plan de communication. Destinataires suggérés depuis le registre des parties
 * prenantes, émetteurs depuis le référentiel des ressources ; la saisie reste libre.
 */
export function CommunicationPlanEditor({
  projectId,
  mode,
  initialInput,
  onCancel,
  onSaved,
}: DocumentEditorProps<CommunicationPlanInput> & { projectId: string }) {
  const [input, setInput] = useState<CommunicationPlanInput>(initialInput);
  const patch = (changes: Partial<CommunicationPlanInput>) => setInput((current) => ({ ...current, ...changes }));
  const audienceListId = useId();
  const { data: register } = useStakeholderRegister(projectId);
  const audiences = [...GROUP_AUDIENCES, ...(register?.stakeholders ?? []).map((stakeholder) => stakeholder.name)];

  return (
    <EditorShell
      title={mode === 'create' ? 'Nouveau plan de communication' : 'Plan de communication'}
      save={() => communicationPlanApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <fieldset className="editor-section">
        <legend>Communications ({input.communications.length})</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
        <ArrayEditor<CommunicationItemInput>
          items={input.communications}
          onChange={(communications) => patch({ communications })}
          addLabel="Ajouter une communication"
          emptyLabel="Aucune communication."
          makeEmpty={() => ({ audience: '', information: '', method: '', frequency: '', senderId: '' })}
          renderItem={(item, update) => (
            <div className="entry-form">
              <section className="entry-form__step">
                <div className="editor-grid">
                  <Field label="Partie prenante ou groupe">
                    <TextInput value={item.audience} onChange={(audience) => update({ audience })} list={audienceListId} required />
                  </Field>
                  <Field label="Émetteur">
                    <PersonSelect value={item.senderId || null} onChange={(id) => update({ senderId: id ?? '' })} />
                  </Field>
                </div>
                <Field label="Information">
                  <TextArea value={item.information} onChange={(information) => update({ information })} rows={2} required />
                </Field>
                <div className="editor-grid">
                  <Field label="Moyen">
                    <TextInput value={item.method} onChange={(method) => update({ method })} required />
                  </Field>
                  <Field label="Fréquence">
                    <TextInput value={item.frequency} onChange={(frequency) => update({ frequency })} required />
                  </Field>
                </div>
              </section>
            </div>
          )}
        />
      </fieldset>

      <fieldset className="editor-section">
        <legend>Hypothèses et contraintes</legend>
        <div className="editor-grid">
          <Field label="Hypothèses" hint={LINES_HINT}>
            <LinesInput value={input.assumptions} onChange={(assumptions) => patch({ assumptions })} rows={5} />
          </Field>
          <Field label="Contraintes" hint={LINES_HINT}>
            <LinesInput value={input.constraints} onChange={(constraints) => patch({ constraints })} rows={5} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Glossaire ({input.glossary.length})</legend>
        <ArrayEditor<GlossaryEntryInput>
          items={input.glossary}
          onChange={(glossary) => patch({ glossary })}
          addLabel="Ajouter un terme"
          emptyLabel="Aucun terme."
          makeEmpty={() => ({ term: '', definition: '' })}
          renderItem={(entry, update) => (
            <div className="editor-grid editor-grid--narrow-wide">
              <Field label="Terme ou sigle">
                <TextInput value={entry.term} onChange={(term) => update({ term })} required />
              </Field>
              <Field label="Définition">
                <TextInput value={entry.definition} onChange={(definition) => update({ definition })} required />
              </Field>
            </div>
          )}
        />
      </fieldset>

      <datalist id={audienceListId}>
        {[...new Set(audiences)].map((audience) => (
          <option key={audience} value={audience} />
        ))}
      </datalist>
    </EditorShell>
  );
}
