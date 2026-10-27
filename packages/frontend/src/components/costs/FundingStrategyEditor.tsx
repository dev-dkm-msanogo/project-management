import { useState } from 'react';
import type { CostCategoryInput, FundingRiskInput, FundingStrategyInput, FundingTrancheInput } from '@shared/index';
import { fundingStrategyApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { AmountInput, DateInput, TextArea, TextInput } from '@/components/form/controls';
import type { DocumentEditorProps } from '@/features/DocumentFeature';
import { formatFcfaMillions, todayIso } from '@/lib/format';
import { blankTranche } from '@/lib/funding-format';

interface FundingStrategyEditorProps extends DocumentEditorProps<FundingStrategyInput> {
  projectId: string;
  /** Budget approuvé de la charte (`null` sans charte). */
  charterBudget: number | null;
}

/** Rédaction de la stratégie de financement : source, tranches, déblocage, catégories, risques. */
export function FundingStrategyEditor({ projectId, charterBudget, initialInput, onCancel, onSaved }: FundingStrategyEditorProps) {
  const [input, setInput] = useState<FundingStrategyInput>(initialInput);
  const patch = (changes: Partial<FundingStrategyInput>) => setInput((current) => ({ ...current, ...changes }));
  const total = (items: readonly { amount: number }[]) => items.reduce((sum, item) => sum + item.amount, 0);
  const versusBudget = (amount: number) =>
    charterBudget === null
      ? `Total : ${formatFcfaMillions(amount)}.`
      : `Total : ${formatFcfaMillions(amount)} pour un budget approuvé de ${formatFcfaMillions(charterBudget)}.`;

  return (
    <EditorShell title="Stratégie de financement" save={() => fundingStrategyApi.save(projectId, input)} onCancel={onCancel} onSaved={onSaved}>
      <fieldset className="editor-section">
        <legend>Source et financement approuvé</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
        <Field label="Source des fonds et autorité">
          <TextArea value={input.source} onChange={(source) => patch({ source })} rows={3} />
        </Field>
        <Field
          label="Ce que couvre le financement approuvé"
          hint={charterBudget === null ? 'Le montant approuvé est le budget de la charte, encore à fixer.' : `Montant approuvé (charte) : ${formatFcfaMillions(charterBudget)}.`}
        >
          <TextArea value={input.approvedFundingNote} onChange={(approvedFundingNote) => patch({ approvedFundingNote })} rows={3} />
        </Field>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Tranches ({input.tranches.length})</legend>
        <ArrayEditor<FundingTrancheInput>
          items={input.tranches}
          onChange={(tranches) => patch({ tranches })}
          addLabel="Ajouter une tranche"
          emptyLabel="Aucune tranche."
          makeEmpty={() => blankTranche(input.tranches.length + 1)}
          renderItem={(tranche, update) => (
            <div className="entry-form">
              <section className="entry-form__step">
                <div className="editor-grid editor-grid--4">
                  <Field label="Tranche">
                    <TextInput value={tranche.name} onChange={(name) => update({ name })} required />
                  </Field>
                  <Field label="Période">
                    <TextInput value={tranche.period} onChange={(period) => update({ period })} placeholder="Janvier 2025" />
                  </Field>
                  <Field label="Déblocage">
                    <DateInput value={tranche.releaseOn} onChange={(date) => update({ releaseOn: date ?? todayIso() })} required />
                  </Field>
                  <Field label="Montant">
                    <AmountInput value={tranche.amount} onChange={(amount) => update({ amount })} />
                  </Field>
                </div>
                <Field label="Activités financées">
                  <TextInput value={tranche.activities} onChange={(activities) => update({ activities })} />
                </Field>
              </section>
            </div>
          )}
        />
        <p className="field__hint">{versusBudget(total(input.tranches))}</p>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Mécanisme de déblocage</legend>
        <Field label="Conditions de mise à disposition des fonds">
          <TextArea value={input.releaseMechanism} onChange={(releaseMechanism) => patch({ releaseMechanism })} rows={3} />
        </Field>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Catégories de coûts ({input.costCategories.length})</legend>
        <ArrayEditor<CostCategoryInput>
          items={input.costCategories}
          onChange={(costCategories) => patch({ costCategories })}
          addLabel="Ajouter une catégorie"
          emptyLabel="Aucune catégorie."
          makeEmpty={() => ({ name: '', amount: 0, description: '' })}
          renderItem={(category, update) => (
            <div className="editor-grid editor-grid--3">
              <Field label="Catégorie">
                <TextInput value={category.name} onChange={(name) => update({ name })} required />
              </Field>
              <Field label="Montant">
                <AmountInput value={category.amount} onChange={(amount) => update({ amount })} />
              </Field>
              <Field label="Précision">
                <TextInput value={category.description} onChange={(description) => update({ description })} />
              </Field>
            </div>
          )}
        />
        <p className="field__hint">{versusBudget(total(input.costCategories))}</p>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Risques de financement ({input.risks.length})</legend>
        <ArrayEditor<FundingRiskInput>
          items={input.risks}
          onChange={(risks) => patch({ risks })}
          addLabel="Ajouter un risque"
          emptyLabel="Aucun risque de financement."
          makeEmpty={() => ({ risk: '', mitigation: '' })}
          renderItem={(item, update) => (
            <div className="editor-grid">
              <Field label="Risque">
                <TextInput value={item.risk} onChange={(risk) => update({ risk })} required />
              </Field>
              <Field label="Parade">
                <TextInput value={item.mitigation} onChange={(mitigation) => update({ mitigation })} required />
              </Field>
            </div>
          )}
        />
      </fieldset>
    </EditorShell>
  );
}
