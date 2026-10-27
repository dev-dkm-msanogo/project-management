import { useState } from 'react';
import type { ContractType, ProcurementPhaseInput, ProcurementStrategyInput } from '@shared/index';
import { procurementStrategyApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { CheckboxInput, DateInput, TextArea, TextInput } from '@/components/form/controls';
import type { DocumentEditorProps } from '@/features/DocumentFeature';
import { todayIso } from '@/lib/format';
import {
  CONTRACT_RISK,
  CONTRACT_TYPES,
  contractTypeLabel,
  STRATEGY_TEXT_LABELS,
} from '@/lib/procurement-format';

/** Rédaction de la stratégie d'approvisionnement : livraison, types de contrat, cycle d'achat. */
export function ProcurementStrategyEditor({
  projectId,
  mode,
  initialInput,
  onCancel,
  onSaved,
}: DocumentEditorProps<ProcurementStrategyInput> & { projectId: string }) {
  const [input, setInput] = useState<ProcurementStrategyInput>(initialInput);
  const patch = (changes: Partial<ProcurementStrategyInput>) => setInput((current) => ({ ...current, ...changes }));

  const choiceOf = (type: ContractType) => input.contractTypes.find((choice) => choice.type === type);
  // Ordre canonique des types (du prix ferme à la régie), quel que soit l'ordre de sélection.
  const toggle = (type: ContractType, checked: boolean) =>
    patch({
      contractTypes: checked
        ? CONTRACT_TYPES.filter((other) => other === type || choiceOf(other)).map(
            (other) => choiceOf(other) ?? { type: other, note: '' },
          )
        : input.contractTypes.filter((choice) => choice.type !== type),
    });
  const setNote = (type: ContractType, note: string) =>
    patch({ contractTypes: input.contractTypes.map((choice) => (choice.type === type ? { ...choice, note } : choice)) });

  const text = (key: keyof typeof STRATEGY_TEXT_LABELS, rows = 3) => (
    <Field label={STRATEGY_TEXT_LABELS[key]}>
      <TextArea value={input[key]} onChange={(value) => patch({ [key]: value })} rows={rows} />
    </Field>
  );

  return (
    <EditorShell
      title={mode === 'create' ? "Nouvelle stratégie d'approvisionnement" : "Stratégie d'approvisionnement"}
      save={() => procurementStrategyApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <fieldset className="editor-section">
        <legend>Livraison</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
        <div className="editor-grid">
          {text('deliveryMethod', 4)}
          {text('makeOrBuy', 4)}
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Types de contrat ({input.contractTypes.length})</legend>
        <div className="contract-options">
          {CONTRACT_TYPES.map((type) => {
            const choice = choiceOf(type);
            return (
              <div key={type} className={`contract-option${choice ? ' contract-option--selected' : ''}`}>
                <CheckboxInput
                  label={contractTypeLabel(type)}
                  checked={Boolean(choice)}
                  onChange={(checked) => toggle(type, checked)}
                />
                <span className={`contract-risk contract-risk--${CONTRACT_RISK[type].modifier}`}>
                  {CONTRACT_RISK[type].label}
                </span>
                {choice && (
                  <Field label="À quoi il s'applique et pourquoi">
                    <TextArea value={choice.note} onChange={(note) => setNote(type, note)} rows={2} required />
                  </Field>
                )}
              </div>
            );
          })}
        </div>
        {text('incentiveCriteria')}
      </fieldset>

      <fieldset className="editor-section">
        <legend>Cycle d'achat ({input.lifecycle.length})</legend>
        <ArrayEditor<ProcurementPhaseInput>
          items={input.lifecycle}
          onChange={(lifecycle) => patch({ lifecycle })}
          addLabel="Ajouter une phase"
          emptyLabel="Aucune phase."
          makeEmpty={() => ({ phase: '', entryCriteria: '', deliverables: '', exitCriteria: '' })}
          renderItem={(item, update, index) => (
            <div className="entry-form">
              <section className="entry-form__step">
                <Field label={`Phase ${index + 1}`}>
                  <TextInput value={item.phase} onChange={(phase) => update({ phase })} required />
                </Field>
                <div className="editor-grid editor-grid--3">
                  <Field label="Critères d'entrée">
                    <TextArea value={item.entryCriteria} onChange={(entryCriteria) => update({ entryCriteria })} rows={2} />
                  </Field>
                  <Field label="Livrables">
                    <TextArea value={item.deliverables} onChange={(deliverables) => update({ deliverables })} rows={2} />
                  </Field>
                  <Field label="Critères de sortie">
                    <TextArea value={item.exitCriteria} onChange={(exitCriteria) => update({ exitCriteria })} rows={2} />
                  </Field>
                </div>
              </section>
            </div>
          )}
        />
      </fieldset>

      <fieldset className="editor-section">
        <legend>Transfert de connaissances</legend>
        {text('knowledgeTransfer', 4)}
      </fieldset>
    </EditorShell>
  );
}
