import { useState } from 'react';
import type {
  RiskCategory,
  RiskEntryInput,
  RiskImpactsInput,
  RiskRegisterInput,
  RiskStatus,
  RiskStrategy,
  RiskType,
} from '@shared/index';
import { riskRegisterApi } from '@/api/project-documents';
import { EditorShell } from '@/components/form/EditorShell';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { FocusedEntry, useEntryFocus, type EntryTarget } from '@/components/form/EntryFocus';
import { Field } from '@/components/form/Field';
import { DateInput, SelectInput, TextArea, TextInput } from '@/components/form/controls';
import { TREND_OPTIONS } from '@/components/form/options';
import { PersonSelect } from '@/components/people/People';
import { nextCode } from '@/lib/codes';
import { IMPACT_OBJECTIVE_LABELS } from '@/lib/quality-risk-format';
import {
  IMPACT_SCALE,
  PROBABILITY_SCALE,
  RISK_CATEGORY_LABELS,
  RISK_LEVEL_LABELS,
  RISK_STATUS_LABELS,
  RISK_STRATEGY_LABELS,
  RISK_TYPE_LABELS,
  riskLevel,
  strategiesFor,
} from '@/lib/risk-format';
import { blankRisk } from '@/lib/risk-input';

type ScaleValue = '1' | '2' | '3' | '4' | '5';
type StrategyChoice = RiskStrategy | '';

const SCALE_VALUES: readonly ScaleValue[] = ['1', '2', '3', '4', '5'];
const STATUSES_REQUIRING_STRATEGY: readonly RiskStatus[] = ['RESPONSE_PLANNED', 'RESPONSE_IN_PROGRESS'];

const options = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));

const TYPE_OPTIONS = options<RiskType>(RISK_TYPE_LABELS);
const CATEGORY_OPTIONS = options<RiskCategory>(RISK_CATEGORY_LABELS);
const STATUS_OPTIONS = options<RiskStatus>(RISK_STATUS_LABELS);

const scaleOptions = (labels: readonly string[]) =>
  SCALE_VALUES.map((value) => ({ value, label: `${value} — ${labels[Number(value) - 1]}` }));

const PROBABILITY_OPTIONS = scaleOptions(PROBABILITY_SCALE);
const IMPACT_OPTIONS = scaleOptions(IMPACT_SCALE);
const OBJECTIVES = Object.keys(IMPACT_OBJECTIVE_LABELS) as (keyof RiskImpactsInput)[];

/** Risque résiduel : « non évalué » ou une valeur de l'échelle. */
type ResidualChoice = ScaleValue | '';
const residualOptions = (choices: { value: ScaleValue; label: string }[]): { value: ResidualChoice; label: string }[] => [
  { value: '', label: 'Non évalué' },
  ...choices,
];

function strategyOptions(type: RiskType): { value: StrategyChoice; label: string }[] {
  return [
    { value: '', label: 'À définir' },
    ...strategiesFor(type).map((strategy) => ({ value: strategy, label: RISK_STRATEGY_LABELS[strategy] })),
  ];
}

const nullIfEmpty = (value: string): string | null => (value.trim() === '' ? null : value);

interface RiskRegisterEditorProps {
  projectId: string;
  initialInput: RiskRegisterInput;
  /** Entrée éditée seule ; absente : tout le registre. */
  target?: EntryTarget;
  onCancel: () => void;
  onSaved: () => void;
}

/** Saisie du registre des risques : identification, analyse par objectif, réponse et risque résiduel, suivi. */
export function RiskRegisterEditor({ projectId, initialInput, target, onCancel, onSaved }: RiskRegisterEditorProps) {
  const focus = useEntryFocus({
    entries: initialInput.risks,
    keyOf: (risk) => risk.code,
    target,
    blank: () => blankRisk(nextCode(initialInput.risks, 'R')),
    labels: {
      create: 'Nouveau risque',
      edit: (risk) => `Risque ${risk.code}`,
      deleteMessage: "Le risque disparaît du registre. Préférez le clore s'il ne menace plus le projet.",
    },
    remove: (code) =>
      riskRegisterApi.save(projectId, { ...initialInput, risks: initialInput.risks.filter((risk) => risk.code !== code) }),
    onRemoved: onSaved,
  });
  const [input, setInput] = useState<RiskRegisterInput>({ ...initialInput, risks: focus.entries });

  const renderRisk = (risk: RiskEntryInput, update: (patch: Partial<RiskEntryInput>) => void) => {
    const impact = Math.max(...OBJECTIVES.map((objective) => risk.impacts[objective]));
    const score = risk.probability * impact;
    const level = riskLevel(score);
    const residualScore =
      risk.residualProbability !== null && risk.residualImpact !== null ? risk.residualProbability * risk.residualImpact : null;
    // Les deux valeurs résiduelles se renseignent ensemble : la seconde reprend la valeur actuelle.
    const setResidual = (changes: { probability?: ResidualChoice; impact?: ResidualChoice }) => {
      const value = changes.probability ?? changes.impact;
      if (value === '') {
        update({ residualProbability: null, residualImpact: null });
        return;
      }
      update({
        residualProbability: changes.probability ? Number(changes.probability) : (risk.residualProbability ?? risk.probability),
        residualImpact: changes.impact ? Number(changes.impact) : (risk.residualImpact ?? impact),
      });
    };
    const missingStrategy = !risk.strategy && STATUSES_REQUIRING_STRATEGY.includes(risk.status);

    const changeType = (type: RiskType) =>
      update({
        type,
        // Une stratégie propre à l'autre type n'est plus valable : elle repasse « à définir ».
        strategy: risk.strategy && strategiesFor(type).includes(risk.strategy) ? risk.strategy : null,
      });

    return (
      <div className="entry-form">
        <section className="entry-form__step">
          <h3 className="entry-form__step-title">
            Identification
          </h3>
          <div className="editor-grid editor-grid--code-title">
            <Field label="Code">
              <TextInput value={risk.code} onChange={(code) => update({ code })} required />
            </Field>
            <Field label="Intitulé">
              <TextInput value={risk.title} onChange={(title) => update({ title })} required />
            </Field>
          </div>
          <div className="editor-grid editor-grid--fluid">
            <Field label="Type">
              <SelectInput value={risk.type} onChange={changeType} options={TYPE_OPTIONS} />
            </Field>
            <Field label="Catégorie">
              <SelectInput
                value={risk.category}
                onChange={(category) => update({ category })}
                options={CATEGORY_OPTIONS}
              />
            </Field>
            <Field label="Responsable">
              <PersonSelect value={risk.ownerId || null} onChange={(id) => update({ ownerId: id ?? '' })} />
            </Field>
          </div>
          <Field label="Description (cause → événement → effet)">
            <TextArea
              value={risk.description ?? ''}
              onChange={(value) => update({ description: nullIfEmpty(value) })}
              rows={2}
            />
          </Field>
        </section>

        <section className="entry-form__step">
          <h3 className="entry-form__step-title">
            Analyse
          </h3>
          <div className="editor-grid editor-grid--fluid">
            <Field label="Probabilité">
              <SelectInput
                value={String(risk.probability) as ScaleValue}
                onChange={(value) => update({ probability: Number(value) })}
                options={PROBABILITY_OPTIONS}
              />
            </Field>
            {OBJECTIVES.map((objective) => (
              <Field key={objective} label={`Impact : ${IMPACT_OBJECTIVE_LABELS[objective].toLowerCase()}`}>
                <SelectInput
                  value={String(risk.impacts[objective]) as ScaleValue}
                  onChange={(value) => update({ impacts: { ...risk.impacts, [objective]: Number(value) } })}
                  options={IMPACT_OPTIONS}
                />
              </Field>
            ))}
            <div className="entry-form__score" aria-live="polite">
              <span className="field__label">Score P × impact le plus fort ({impact})</span>
              <span>
                <span className={`risk-score risk-level--${level.toLowerCase()}`}>{score}</span>{' '}
                {RISK_LEVEL_LABELS[level]}
              </span>
            </div>
          </div>
        </section>

        <section className="entry-form__step">
          <h3 className="entry-form__step-title">
            Réponse
          </h3>
          <div className="editor-grid editor-grid--narrow-wide">
            <Field label="Stratégie">
              <SelectInput<StrategyChoice>
                value={risk.strategy ?? ''}
                onChange={(value) => update({ strategy: value === '' ? null : value })}
                options={strategyOptions(risk.type)}
              />
            </Field>
            <Field label="Plan de réponse (actions)">
              <TextArea
                value={risk.response ?? ''}
                onChange={(value) => update({ response: nullIfEmpty(value) })}
                rows={2}
              />
            </Field>
          </div>
          <Field label="Déclencheur ou signe avant-coureur">
            <TextInput value={risk.trigger ?? ''} onChange={(value) => update({ trigger: nullIfEmpty(value) })} />
          </Field>
          <div className="editor-grid editor-grid--fluid">
            <Field label="Probabilité résiduelle">
              <SelectInput<ResidualChoice>
                value={risk.residualProbability === null ? '' : (String(risk.residualProbability) as ScaleValue)}
                onChange={(value) => setResidual({ probability: value })}
                options={residualOptions(PROBABILITY_OPTIONS)}
              />
            </Field>
            <Field label="Impact résiduel">
              <SelectInput<ResidualChoice>
                value={risk.residualImpact === null ? '' : (String(risk.residualImpact) as ScaleValue)}
                onChange={(value) => setResidual({ impact: value })}
                options={residualOptions(IMPACT_OPTIONS)}
              />
            </Field>
            <div className="entry-form__score" aria-live="polite">
              <span className="field__label">Score résiduel</span>
              {residualScore === null ? (
                <span className="register-table__muted">Non évalué</span>
              ) : (
                <span>
                  <span className={`risk-score risk-level--${riskLevel(residualScore).toLowerCase()}`}>{residualScore}</span>{' '}
                  {RISK_LEVEL_LABELS[riskLevel(residualScore)]}
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="entry-form__step">
          <h3 className="entry-form__step-title">
            Suivi
          </h3>
          <div className="editor-grid editor-grid--fluid">
            <Field label="Statut">
              <SelectInput value={risk.status} onChange={(status) => update({ status })} options={STATUS_OPTIONS} />
            </Field>
            <Field label="Tendance">
              <SelectInput value={risk.trend} onChange={(trend) => update({ trend })} options={TREND_OPTIONS} />
            </Field>
            <Field label="Échéance de la réponse">
              <DateInput value={risk.dueDate} onChange={(dueDate) => update({ dueDate })} />
            </Field>
            <Field label="Dernière revue">
              <DateInput value={risk.lastReviewedOn} onChange={(lastReviewedOn) => update({ lastReviewedOn })} />
            </Field>
          </div>
          <Field label="Commentaires">
            <TextInput value={risk.comments ?? ''} onChange={(value) => update({ comments: nullIfEmpty(value) })} />
          </Field>
          {missingStrategy && (
            <p className="entry-form__warning" role="alert">
              Une réponse planifiée ou en cours exige une stratégie (étape Réponse).
            </p>
          )}
        </section>
      </div>
    );
  };

  return (
    <EditorShell title={focus.title ?? 'Registre des risques'} save={() => riskRegisterApi.save(projectId, input)} onCancel={onCancel} onSaved={onSaved} extraActions={focus.deleteAction}>

      {focus.index === null ? (
        <>
          <fieldset className="editor-section">
            <legend>Risques ({input.risks.length})</legend>
            <ArrayEditor<RiskEntryInput>
              items={input.risks}
              onChange={(risks) => setInput({ risks })}
              addLabel="Identifier un risque"
              emptyLabel="Aucun risque identifié."
              makeEmpty={() => blankRisk(nextCode(input.risks, 'R'))}
              renderItem={renderRisk}
            />
          </fieldset>
        </>
      ) : (
        <FocusedEntry
          entries={input.risks}
          index={focus.index}
          onChange={(risks) => setInput({ risks })}
          render={renderRisk}
        />
      )}
    </EditorShell>
  );
}
