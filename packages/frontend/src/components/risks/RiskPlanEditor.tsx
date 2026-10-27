import { useState } from 'react';
import type { ImpactDefinitionInput, ProbabilityDefinitionInput, RiskManagementPlanInput } from '@shared/index';
import { riskPlanApi } from '@/api/project-documents';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { DateInput, LinesInput, TextArea, TextInput } from '@/components/form/controls';
import { RolesEditor } from '@/components/quality/QualityPlanEditor';
import type { DocumentEditorProps } from '@/features/DocumentFeature';
import { todayIso } from '@/lib/format';
import { IMPACT_OBJECTIVE_LABELS, RISK_CATEGORIES, RISK_PLAN_TEXT_LABELS } from '@/lib/quality-risk-format';
import { IMPACT_SCALE, PROBABILITY_SCALE, RISK_CATEGORY_LABELS } from '@/lib/risk-format';

const IMPACT_KEYS = Object.keys(IMPACT_OBJECTIVE_LABELS) as (keyof ImpactDefinitionInput)[];
const TEXT_KEYS = Object.keys(RISK_PLAN_TEXT_LABELS) as (keyof typeof RISK_PLAN_TEXT_LABELS)[];

/** Rédaction du plan de gestion des risques : démarche, RBS, réserve, échelles de probabilité et d'impact. */
export function RiskPlanEditor({
  projectId,
  mode,
  initialInput,
  onCancel,
  onSaved,
}: DocumentEditorProps<RiskManagementPlanInput> & { projectId: string }) {
  const [input, setInput] = useState<RiskManagementPlanInput>(initialInput);
  const patch = (changes: Partial<RiskManagementPlanInput>) => setInput((current) => ({ ...current, ...changes }));

  const setProbability = (index: number, changes: Partial<ProbabilityDefinitionInput>) =>
    patch({ probability: input.probability.map((item, i) => (i === index ? { ...item, ...changes } : item)) });
  const setImpact = (index: number, changes: Partial<ImpactDefinitionInput>) =>
    patch({ impact: input.impact.map((item, i) => (i === index ? { ...item, ...changes } : item)) });

  return (
    <EditorShell
      title={mode === 'create' ? 'Nouveau plan de gestion des risques' : 'Plan de gestion des risques'}
      save={() => riskPlanApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <fieldset className="editor-section">
        <legend>Démarche</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
        <div className="editor-grid">
          <Field label="Stratégie">
            <TextArea value={input.strategy} onChange={(strategy) => patch({ strategy })} rows={4} />
          </Field>
          <Field label="Méthodologie">
            <TextArea value={input.methodology} onChange={(methodology) => patch({ methodology })} rows={4} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Rôles et responsabilités ({input.roles.length})</legend>
        <RolesEditor roles={input.roles} onChange={(roles) => patch({ roles })} />
      </fieldset>

      <fieldset className="editor-section">
        <legend>Catégories de risques (RBS)</legend>
        <p className="editor__info">
          Les catégories sont celles du registre des risques ; précisez leurs sous-catégories, une par ligne.
        </p>
        <div className="editor-grid">
          {RISK_CATEGORIES.map((category) => (
            <Field key={category} label={RISK_CATEGORY_LABELS[category]}>
              <LinesInput
                value={input.breakdown[category]}
                onChange={(lines) => patch({ breakdown: { ...input.breakdown, [category]: lines } })}
                rows={5}
              />
            </Field>
          ))}
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Financement, calendrier et suivi</legend>
        <div className="editor-grid">
          {TEXT_KEYS.map((key) => (
            <Field key={key} label={RISK_PLAN_TEXT_LABELS[key]}>
              <TextArea value={input[key]} onChange={(text) => patch({ [key]: text })} rows={4} />
            </Field>
          ))}
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Définitions de la probabilité</legend>
        {input.probability.map((item, index) => (
          <div key={index} className="editor-grid editor-grid--narrow-wide scale-row">
            <Field label={`${index + 1} · ${PROBABILITY_SCALE[index]} : fourchette`}>
              <TextInput value={item.range} onChange={(range) => setProbability(index, { range })} />
            </Field>
            <Field label="Description">
              <TextInput value={item.description} onChange={(description) => setProbability(index, { description })} />
            </Field>
          </div>
        ))}
      </fieldset>

      <fieldset className="editor-section">
        <legend>Définitions de l'impact par objectif</legend>
        {input.impact.map((item, index) => (
          <div key={index} className="scale-row">
            <h4 className="entry-form__step-title">
              {index + 1} · {IMPACT_SCALE[index]}
            </h4>
            <div className="editor-grid editor-grid--4">
              {IMPACT_KEYS.map((key) => (
                <Field key={key} label={IMPACT_OBJECTIVE_LABELS[key]}>
                  <TextInput value={item[key]} onChange={(text) => setImpact(index, { [key]: text })} />
                </Field>
              ))}
            </div>
          </div>
        ))}
      </fieldset>
    </EditorShell>
  );
}
