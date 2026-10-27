import { useState } from 'react';
import type {
  AlternativeOutcome,
  BusinessAlternativeInput,
  BusinessCaseInput,
  FinancialLineInput,
  FinancialLineKind,
} from '@shared/index';
import { businessCaseApi } from '@/api/project-documents';
import { FinancialSummaryTable } from '@/components/business-case/FinancialSummaryTable';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { DateInput, LinesInput, NumberInput, SelectInput, TextArea, TextInput } from '@/components/form/controls';
import { LINE_KIND_LABELS, OUTCOME_LABELS, YEARS, financialSummary } from '@/lib/business-case-format';
import { todayIso } from '@/lib/format';
import type { DocumentEditorProps } from '@/features/DocumentFeature';

const options = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));

const OUTCOME_OPTIONS = options<AlternativeOutcome>(OUTCOME_LABELS);
const KIND_OPTIONS = options<FinancialLineKind>(LINE_KIND_LABELS);
const LINES_HINT = 'Un élément par ligne.';

/** Rédaction du business case selon le template PMI. */
export function BusinessCaseEditor({
  projectId,
  mode,
  initialInput,
  onCancel,
  onSaved,
}: DocumentEditorProps<BusinessCaseInput> & { projectId: string }) {
  const [input, setInput] = useState<BusinessCaseInput>(initialInput);
  const patch = (changes: Partial<BusinessCaseInput>) => setInput((current) => ({ ...current, ...changes }));

  // Retenir une alternative rejette les autres : une seule peut l'être.
  const changeOutcome = (index: number, outcome: AlternativeOutcome) =>
    patch({
      alternatives: input.alternatives.map((item, i) =>
        i === index ? { ...item, outcome } : outcome === 'SELECTED' ? { ...item, outcome: 'REJECTED' } : item,
      ),
    });

  return (
    <EditorShell
      title={mode === 'create' ? 'Nouveau business case' : 'Business case'}
      save={() => businessCaseApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <fieldset className="editor-section">
        <legend>Besoin et alignement</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
        <Field label="Besoin métier / problématique">
          <TextArea value={input.businessNeed} onChange={(businessNeed) => patch({ businessNeed })} rows={4} required />
        </Field>
        <Field label="Alignement stratégique">
          <TextArea
            value={input.strategicAlignment}
            onChange={(strategicAlignment) => patch({ strategicAlignment })}
            rows={3}
          />
        </Field>
        <Field label="Analyse de la situation" hint={LINES_HINT}>
          <LinesInput value={input.situation} onChange={(situation) => patch({ situation })} rows={5} />
        </Field>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Alternatives étudiées ({input.alternatives.length})</legend>
        <ArrayEditor<BusinessAlternativeInput>
          items={input.alternatives}
          onChange={(alternatives) => patch({ alternatives })}
          addLabel="Ajouter une alternative"
          emptyLabel="Aucune alternative."
          makeEmpty={() => ({ option: '', description: '', cost: '', outcome: 'REJECTED', rationale: '' })}
          renderItem={(item, update, index) => (
            <div className="entry-form">
              <div className="editor-grid editor-grid--wide-narrow">
                <Field label="Option">
                  <TextInput value={item.option} onChange={(option) => update({ option })} required />
                </Field>
                <Field label="Décision">
                  <SelectInput
                    value={item.outcome}
                    onChange={(outcome) => changeOutcome(index, outcome)}
                    options={OUTCOME_OPTIONS}
                  />
                </Field>
              </div>
              <div className="editor-grid editor-grid--wide-narrow">
                <Field label="Description">
                  <TextInput value={item.description} onChange={(description) => update({ description })} />
                </Field>
                <Field label="Coût estimé">
                  <TextInput value={item.cost} onChange={(cost) => update({ cost })} />
                </Field>
              </div>
              <Field label="Motif de la décision">
                <TextInput value={item.rationale} onChange={(rationale) => update({ rationale })} />
              </Field>
            </div>
          )}
        />
        <Field label="Solution recommandée">
          <TextArea
            value={input.recommendedSolution}
            onChange={(recommendedSolution) => patch({ recommendedSolution })}
            rows={3}
          />
        </Field>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Synthèse financière sur 3 ans (FCFA)</legend>
        <ArrayEditor<FinancialLineInput>
          items={input.financialLines}
          onChange={(financialLines) => patch({ financialLines })}
          addLabel="Ajouter une ligne"
          emptyLabel="Aucune ligne de chiffrage."
          makeEmpty={() => ({ label: '', kind: 'COST', amounts: [0, 0, 0] })}
          renderItem={(line, update) => (
            <div className="editor-grid editor-grid--financial">
              <Field label="Poste">
                <TextInput value={line.label} onChange={(label) => update({ label })} required />
              </Field>
              <Field label="Nature">
                <SelectInput value={line.kind} onChange={(kind) => update({ kind })} options={KIND_OPTIONS} />
              </Field>
              {YEARS.map((year, index) => (
                <Field key={year} label={`Année ${year}`}>
                  <NumberInput
                    value={line.amounts[index] ?? 0}
                    min={0}
                    step={100_000}
                    onChange={(amount) =>
                      update({ amounts: line.amounts.map((value, i) => (i === index ? amount : value)) })
                    }
                  />
                </Field>
              ))}
            </div>
          )}
        />
        {input.financialLines.length > 0 && (
          <>
            <div className="editor-sub">Aperçu des totaux</div>
            <FinancialSummaryTable lines={input.financialLines} summary={financialSummary(input.financialLines)} />
          </>
        )}
        <Field label="Hypothèses de chiffrage (définition des années, coûts valorisés…)">
          <TextArea
            value={input.financialNote ?? ''}
            onChange={(value) => patch({ financialNote: value.trim() === '' ? null : value })}
            rows={2}
          />
        </Field>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Risques et recommandation</legend>
        <Field label="Risques clés" hint={LINES_HINT}>
          <LinesInput value={input.keyRisks} onChange={(keyRisks) => patch({ keyRisks })} />
        </Field>
        <Field label="Recommandation">
          <TextArea value={input.recommendation} onChange={(recommendation) => patch({ recommendation })} rows={3} />
        </Field>
      </fieldset>
    </EditorShell>
  );
}
