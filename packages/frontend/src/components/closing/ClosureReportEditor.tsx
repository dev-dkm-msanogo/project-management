import { useState } from 'react';
import type {
  BenefitOutcome,
  ClosureBenefitInput,
  ClosureObjectiveInput,
  ClosureReportInput,
  TransitionAcceptanceInput,
  TransitionRecipientInput,
} from '@shared/index';
import { closureReportApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { DateInput, LinesInput, SelectInput, TextArea, TextInput } from '@/components/form/controls';
import { PersonSelect } from '@/components/people/People';
import { BENEFIT_OUTCOME_LABELS } from '@/lib/closing-format';
import { todayIso } from '@/lib/format';

const OUTCOME_OPTIONS = (Object.keys(BENEFIT_OUTCOME_LABELS) as BenefitOutcome[]).map((value) => ({
  value,
  label: BENEFIT_OUTCOME_LABELS[value],
}));

interface ClosureReportEditorProps {
  mode: 'edit' | 'create';
  projectId: string;
  initialInput: ClosureReportInput;
  onCancel: () => void;
  onSaved: () => void;
}

/** Rédaction du rapport de clôture ; écarts, livrables et registres ouverts sont relus dans le projet. */
export function ClosureReportEditor({ mode, projectId, initialInput, onCancel, onSaved }: ClosureReportEditorProps) {
  const [input, setInput] = useState<ClosureReportInput>(initialInput);
  const patch = (changes: Partial<ClosureReportInput>) => setInput((current) => ({ ...current, ...changes }));

  return (
    <EditorShell
      title={mode === 'create' ? 'Nouveau rapport de clôture' : 'Rapport de clôture'}
      save={() => closureReportApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <p className="entry-form__ready" role="note">
        Écarts de délai et de coût, livrables acceptés, risques et problèmes ouverts et leçons apprises sont repris du
        projet à la lecture. Les rubriques marquées d'un * sont obligatoires pour soumettre le rapport à validation.
      </p>

      <fieldset className="editor-section">
        <legend>Projet</legend>
        <div className="editor-grid editor-grid--3">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
        <Field label="Description du projet (ce qui a été réalisé, période)" needed>
          <TextArea value={input.description} onChange={(description) => patch({ description })} rows={3} />
        </Field>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Bilan des objectifs ({input.objectives.length}) *</legend>
        <ArrayEditor<ClosureObjectiveInput>
          items={input.objectives}
          onChange={(objectives) => patch({ objectives })}
          addLabel="Ajouter un objectif"
          emptyLabel="Aucun objectif."
          makeEmpty={() => ({ objective: '', criteria: '', howMet: '' })}
          renderItem={(item, update) => (
            <div className="editor-grid editor-grid--3">
              <Field label="Objectif">
                <TextInput value={item.objective} onChange={(objective) => update({ objective })} required />
              </Field>
              <Field label="Critères d'achèvement">
                <TextArea value={item.criteria} onChange={(criteria) => update({ criteria })} rows={2} />
              </Field>
              <Field label="Comment ils ont été atteints">
                <TextArea value={item.howMet} onChange={(howMet) => update({ howMet })} rows={2} />
              </Field>
            </div>
          )}
        />
      </fieldset>

      <fieldset className="editor-section">
        <legend>Écarts</legend>
        <div className="editor-grid">
          <Field label="Délai : commentaires sur l'écart">
            <TextArea value={input.scheduleComments} onChange={(scheduleComments) => patch({ scheduleComments })} rows={2} />
          </Field>
          <Field label="Coût : commentaires sur l'écart et les réserves">
            <TextArea value={input.costComments} onChange={(costComments) => patch({ costComments })} rows={2} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Bénéfices ({input.benefits.length})</legend>
        <ArrayEditor<ClosureBenefitInput>
          items={input.benefits}
          onChange={(benefits) => patch({ benefits })}
          addLabel="Ajouter un bénéfice"
          emptyLabel="Aucun bénéfice."
          makeEmpty={() => ({ need: '', outcome: 'MEASURING', comments: '' })}
          renderItem={(item, update) => (
            <div className="editor-grid editor-grid--3">
              <Field label="Besoin ou bénéfice">
                <TextInput value={item.need} onChange={(need) => update({ need })} required />
              </Field>
              <Field label="Situation à la clôture">
                <SelectInput<BenefitOutcome> value={item.outcome} onChange={(outcome) => update({ outcome })} options={OUTCOME_OPTIONS} />
              </Field>
              <Field label="Commentaires">
                <TextArea value={item.comments} onChange={(comments) => update({ comments })} rows={2} />
              </Field>
            </div>
          )}
        />
      </fieldset>

      <fieldset className="editor-section">
        <legend>Risques et problèmes</legend>
        <Field label="Disposition finale des risques et problèmes encore ouverts (transférés, acceptés, clos)">
          <TextArea
            value={input.riskAndIssueDisposition}
            onChange={(riskAndIssueDisposition) => patch({ riskAndIssueDisposition })}
            rows={3}
          />
        </Field>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Transition vers l'exploitation</legend>
        <Field label="Produit ou résultat transféré, et ce qu'il comprend" needed>
          <TextArea value={input.product} onChange={(product) => patch({ product })} rows={3} />
        </Field>
        <div className="editor-sub">Destinataires</div>
        <ArrayEditor<TransitionRecipientInput>
          items={input.recipients}
          onChange={(recipients) => patch({ recipients })}
          addLabel="Ajouter un destinataire"
          emptyLabel="Aucun destinataire."
          makeEmpty={() => ({ recipient: '', responsibility: '', materials: '' })}
          renderItem={(item, update) => (
            <div className="editor-grid editor-grid--3">
              <Field label="Destinataire">
                <TextInput value={item.recipient} onChange={(recipient) => update({ recipient })} required />
              </Field>
              <Field label="Responsabilité d'exploitation">
                <TextArea value={item.responsibility} onChange={(responsibility) => update({ responsibility })} rows={2} />
              </Field>
              <Field label="Éléments remis">
                <TextArea value={item.materials} onChange={(materials) => update({ materials })} rows={2} />
              </Field>
            </div>
          )}
        />
        <div className="editor-grid">
          <Field label="Formations dispensées">
            <TextArea value={input.training} onChange={(training) => patch({ training })} rows={3} />
          </Field>
          <Field label="Support après la transition">
            <TextArea value={input.supportArrangements} onChange={(supportArrangements) => patch({ supportArrangements })} rows={3} />
          </Field>
        </div>
        <Field label="Éléments restants ou reportés" hint="Un élément par ligne.">
          <LinesInput value={input.outstandingItems} onChange={(outstandingItems) => patch({ outstandingItems })} rows={3} />
        </Field>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Acceptation de la transition ({input.acceptances.length}) *</legend>
        <ArrayEditor<TransitionAcceptanceInput>
          items={input.acceptances}
          onChange={(acceptances) => patch({ acceptances })}
          addLabel="Ajouter une acceptation"
          emptyLabel="Aucune acceptation."
          makeEmpty={() => ({ resourceId: '', role: '', acceptedOn: null })}
          renderItem={(item, update) => (
            <div className="editor-grid editor-grid--3">
              <Field label="Personne">
                <PersonSelect value={item.resourceId || null} onChange={(id) => update({ resourceId: id ?? '' })} />
              </Field>
              <Field label="Rôle (ex. sponsor, exploitation)">
                <TextInput value={item.role} onChange={(role) => update({ role })} />
              </Field>
              <Field label="Acceptée le" hint="Vide tant que la transition n'est pas acceptée.">
                <DateInput value={item.acceptedOn} onChange={(acceptedOn) => update({ acceptedOn })} />
              </Field>
            </div>
          )}
        />
      </fieldset>
    </EditorShell>
  );
}
