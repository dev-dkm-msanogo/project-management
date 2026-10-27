import { useId, useState } from 'react';
import type {
  BasisNarrativeInput,
  CostActivityInput,
  CostBasisInput,
  CostEstimateMethod,
  CostEstimatesInput,
  EstimateConfidence,
} from '@shared/index';
import { costEstimatesApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { AmountInput, CheckboxInput, DateInput, SelectInput, TextArea, TextInput } from '@/components/form/controls';
import { PersonSelect } from '@/components/people/People';
import type { DocumentEditorProps } from '@/features/DocumentFeature';
import { useProjectPlan } from '@/hooks/useProjectPlan';
import {
  activityDirect,
  basisEstimate,
  blankActivity,
  blankBasis,
  BOTTOM_UP_COMPONENTS,
  CONFIDENCE_LABELS,
  formatPercent,
  METHOD_LABELS,
  NARRATIVE_LABELS,
} from '@/lib/cost-format';
import { formatFcfaMillions, todayIso } from '@/lib/format';

const options = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));

const METHOD_OPTIONS = options<CostEstimateMethod>(METHOD_LABELS);
const CONFIDENCE_OPTIONS = options<EstimateConfidence>(CONFIDENCE_LABELS);
const COMPONENT_KEYS = Object.keys(BOTTOM_UP_COMPONENTS) as (keyof typeof BOTTOM_UP_COMPONENTS)[];

const share = (part: number, whole: number) =>
  whole > 0 ? `≈ ${formatPercent((part / whole) * 100)} des coûts directs` : undefined;

/** Champs de la base de l'estimation, propres à la méthode. */
function BasisFields({ basis, onChange }: { basis: CostBasisInput; onChange: (basis: CostBasisInput) => void }) {
  switch (basis.method) {
    case 'PARAMETRIC':
      return (
        <div className="editor-grid editor-grid--fluid">
          <Field label="Variable de coût">
            <TextInput value={basis.costVariable} onChange={(costVariable) => onChange({ ...basis, costVariable })} required />
          </Field>
          <Field label="Coût unitaire">
            <AmountInput value={basis.unitCost} onChange={(unitCost) => onChange({ ...basis, unitCost })} />
          </Field>
          <Field label="Nombre d'unités">
            <AmountInput value={basis.units} onChange={(units) => onChange({ ...basis, units })} suffix="" />
          </Field>
        </div>
      );
    case 'ANALOGOUS':
      return (
        <div className="editor-grid editor-grid--fluid">
          <Field label="Activité de référence">
            <TextInput
              value={basis.previousActivity}
              onChange={(previousActivity) => onChange({ ...basis, previousActivity })}
              required
            />
          </Field>
          <Field label="Coût de référence">
            <AmountInput value={basis.previousCost} onChange={(previousCost) => onChange({ ...basis, previousCost })} />
          </Field>
          <Field label="Coefficient d'ajustement">
            <AmountInput value={basis.multiplier} onChange={(multiplier) => onChange({ ...basis, multiplier })} suffix="×" />
          </Field>
        </div>
      );
    case 'THREE_POINT':
      return (
        <>
          <div className="editor-grid editor-grid--fluid">
            <Field label="Optimiste">
              <AmountInput value={basis.optimistic} onChange={(optimistic) => onChange({ ...basis, optimistic })} />
            </Field>
            <Field label="Plus probable">
              <AmountInput value={basis.mostLikely} onChange={(mostLikely) => onChange({ ...basis, mostLikely })} />
            </Field>
            <Field label="Pessimiste">
              <AmountInput value={basis.pessimistic} onChange={(pessimistic) => onChange({ ...basis, pessimistic })} />
            </Field>
          </div>
          {(basis.optimistic > basis.mostLikely || basis.mostLikely > basis.pessimistic) && (
            <p className="entry-form__warning" role="alert">
              Les trois valeurs doivent respecter : optimiste ≤ plus probable ≤ pessimiste.
            </p>
          )}
        </>
      );
    case 'BOTTOM_UP':
      return (
        <div className="editor-grid editor-grid--fluid">
          <Field label="Heures de main-d'œuvre">
            <AmountInput value={basis.laborHours} onChange={(laborHours) => onChange({ ...basis, laborHours })} suffix="h" />
          </Field>
          <Field label="Taux horaire">
            <AmountInput value={basis.laborRate} onChange={(laborRate) => onChange({ ...basis, laborRate })} suffix="FCFA/h" />
          </Field>
          {COMPONENT_KEYS.map((key) => (
            <Field key={key} label={BOTTOM_UP_COMPONENTS[key]}>
              <AmountInput value={basis[key]} onChange={(value) => onChange({ ...basis, [key]: value })} />
            </Field>
          ))}
        </div>
      );
  }
}

/**
 * Saisie des estimations des coûts : activités (rattachées à l'échéancier par leur code
 * WBS), base de chaque estimation, réserves et synthèse narrative.
 */
export function CostEstimatesEditor({
  projectId,
  mode,
  initialInput,
  onCancel,
  onSaved,
}: DocumentEditorProps<CostEstimatesInput> & { projectId: string }) {
  const [input, setInput] = useState<CostEstimatesInput>(initialInput);
  const patch = (changes: Partial<CostEstimatesInput>) => setInput((current) => ({ ...current, ...changes }));
  const wbsListId = useId();
  const { data: plan } = useProjectPlan(projectId);
  const direct = input.activities.reduce((total, activity) => total + activityDirect(activity), 0);

  const renderActivity = (activity: CostActivityInput, update: (changes: Partial<CostActivityInput>) => void) => {
    // Changer de méthode : la base détaillée, propre à la méthode, repart de zéro.
    const changeMethod = (method: CostEstimateMethod) =>
      update({ method, basis: activity.basis ? blankBasis(method) : null });

    return (
      <div className="entry-form">
        <section className="entry-form__step">
          <h3 className="entry-form__step-title">Activité</h3>
          <div className="editor-grid editor-grid--fluid">
            <Field label="Code">
              <TextInput value={activity.code} onChange={(code) => update({ code })} required />
            </Field>
            <Field label="Code WBS" hint="Situe l'activité dans l'échéancier.">
              <TextInput value={activity.wbsCode} onChange={(wbsCode) => update({ wbsCode })} list={wbsListId} />
            </Field>
            <Field label="Ressource">
              <PersonSelect value={activity.resourceId || null} onChange={(id) => update({ resourceId: id ?? '' })} optional />
            </Field>
          </div>
          <Field label="Activité">
            <TextInput value={activity.name} onChange={(name) => update({ name })} required />
          </Field>
        </section>

        <section className="entry-form__step">
          <h3 className="entry-form__step-title">
            Coûts <span className="entry-form__hint">· total {formatFcfaMillions(activityDirect(activity))}</span>
          </h3>
          <div className="editor-grid editor-grid--fluid">
            <Field label="Main-d'œuvre">
              <AmountInput value={activity.laborCost} onChange={(laborCost) => update({ laborCost })} />
            </Field>
            <Field label="Coûts physiques">
              <AmountInput value={activity.physicalCost} onChange={(physicalCost) => update({ physicalCost })} />
            </Field>
            <Field label="Nature des coûts physiques">
              <TextInput value={activity.physicalCostNote} onChange={(physicalCostNote) => update({ physicalCostNote })} />
            </Field>
          </div>
        </section>

        <section className="entry-form__step">
          <h3 className="entry-form__step-title">Estimation</h3>
          <div className="editor-grid editor-grid--fluid">
            <Field label="Méthode">
              <SelectInput value={activity.method} onChange={changeMethod} options={METHOD_OPTIONS} />
            </Field>
            <Field label="Fourchette">
              <AmountInput value={activity.rangePct} onChange={(rangePct) => update({ rangePct })} suffix="± %" />
            </Field>
            <Field label="Confiance">
              <SelectInput value={activity.confidence} onChange={(confidence) => update({ confidence })} options={CONFIDENCE_OPTIONS} />
            </Field>
          </div>
          <CheckboxInput
            label="Détailler le calcul (base de l'estimation)"
            checked={activity.basis !== null}
            onChange={(checked) => update({ basis: checked ? blankBasis(activity.method) : null })}
          />
          {activity.basis && (
            <>
              <BasisFields basis={activity.basis} onChange={(basis) => update({ basis })} />
              <p className="cost-basis-result">
                Montant calculé : <strong>{formatFcfaMillions(basisEstimate(activity.basis))}</strong>
              </p>
            </>
          )}
        </section>
      </div>
    );
  };

  return (
    <EditorShell
      title={mode === 'create' ? 'Nouvelles estimations des coûts' : 'Estimations des coûts'}
      save={() => costEstimatesApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <fieldset className="editor-section">
        <legend>Estimations</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>
          Activités ({input.activities.length}) · coûts directs {formatFcfaMillions(direct)}
        </legend>
        <ArrayEditor<CostActivityInput>
          items={input.activities}
          onChange={(activities) => patch({ activities })}
          addLabel="Ajouter une activité"
          emptyLabel="Aucune activité estimée."
          makeEmpty={() => blankActivity(input.activities)}
          renderItem={renderActivity}
        />
      </fieldset>

      <fieldset className="editor-section">
        <legend>Réserves</legend>
        <div className="editor-grid">
          <Field label="Réserve pour aléas" hint={share(input.contingencyReserve, direct)}>
            <AmountInput
              value={input.contingencyReserve}
              onChange={(contingencyReserve) => patch({ contingencyReserve })}
             
            />
          </Field>
          <Field label="Réserve de management (sponsor, hors référence)" hint={share(input.managementReserve, direct)}>
            <AmountInput
              value={input.managementReserve}
              onChange={(managementReserve) => patch({ managementReserve })}
             
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Base des estimations : synthèse</legend>
        {(Object.keys(NARRATIVE_LABELS) as (keyof BasisNarrativeInput)[]).map((key) => (
          <Field key={key} label={NARRATIVE_LABELS[key]}>
            <TextArea
              value={input.narrative[key]}
              onChange={(text) => patch({ narrative: { ...input.narrative, [key]: text } })}
              rows={3}
            />
          </Field>
        ))}
      </fieldset>

      <datalist id={wbsListId}>
        {(plan?.tasks ?? []).map((task) => (
          <option key={task.wbs} value={task.wbs}>
            {task.name}
          </option>
        ))}
      </datalist>
    </EditorShell>
  );
}
