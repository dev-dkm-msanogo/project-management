import { useState } from 'react';
import type {
  AffinityGroupInput,
  CauseCategoryInput,
  CauseEffectInput,
  FlowchartInput,
  FlowStepInput,
  FlowStepKind,
  QualityAnalysesInput,
} from '@shared/index';
import { qualityAnalysesApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { DateInput, LinesInput, SelectInput, TextInput } from '@/components/form/controls';
import { todayIso } from '@/lib/format';
import {
  blankCauseEffect,
  blankFlowchart,
  blankStep,
  FLOW_STEP_KINDS,
  FLOW_STEP_LABELS,
  type AnalysisTab,
} from '@/lib/quality-tools-format';

const TITLES: Record<AnalysisTab, string> = {
  affinity: "Diagramme d'affinités",
  causes: 'Analyses des causes et effets',
  flowcharts: 'Logigrammes',
};

const KIND_OPTIONS = FLOW_STEP_KINDS.map((value) => ({ value, label: FLOW_STEP_LABELS[value] }));

interface QualityAnalysesEditorProps {
  projectId: string;
  section: AnalysisTab;
  initialInput: QualityAnalysesInput;
  onCancel: () => void;
  onSaved: () => void;
}

/** Rédaction d'un outil d'analyse ; l'enregistrement porte sur l'ensemble des outils. */
export function QualityAnalysesEditor({ projectId, section, initialInput, onCancel, onSaved }: QualityAnalysesEditorProps) {
  const [input, setInput] = useState<QualityAnalysesInput>(initialInput);
  const patch = (changes: Partial<QualityAnalysesInput>) => setInput((current) => ({ ...current, ...changes }));

  return (
    <EditorShell title={TITLES[section]} save={() => qualityAnalysesApi.save(projectId, input)} onCancel={onCancel} onSaved={onSaved}>
      <fieldset className="editor-section">
        <legend>Outils d'analyse</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
      </fieldset>

      {section === 'affinity' && (
        <fieldset className="editor-section">
          <legend>Thèmes ({input.affinity.groups.length})</legend>
          <Field label="Question posée">
            <TextInput
              value={input.affinity.question}
              onChange={(question) => patch({ affinity: { ...input.affinity, question } })}
              placeholder="Qu'est-ce qui fera le succès du livrable ?"
            />
          </Field>
          <ArrayEditor<AffinityGroupInput>
            items={input.affinity.groups}
            onChange={(groups) => patch({ affinity: { ...input.affinity, groups } })}
            addLabel="Ajouter un thème"
            emptyLabel="Aucun thème."
            makeEmpty={() => ({ theme: '', ideas: [] })}
            renderItem={(group, update) => (
              <div className="entry-form">
                <section className="entry-form__step">
                  <Field label="Thème">
                    <TextInput value={group.theme} onChange={(theme) => update({ theme })} required />
                  </Field>
                  <Field label="Idées" hint="Une idée par ligne.">
                    <LinesInput value={group.ideas} onChange={(ideas) => update({ ideas })} rows={4} />
                  </Field>
                </section>
              </div>
            )}
          />
        </fieldset>
      )}

      {section === 'causes' && (
        <fieldset className="editor-section">
          <legend>Analyses ({input.causeEffects.length})</legend>
          <ArrayEditor<CauseEffectInput>
            items={input.causeEffects}
            onChange={(causeEffects) => patch({ causeEffects })}
            addLabel="Ajouter une analyse"
            emptyLabel="Aucune analyse des causes."
            makeEmpty={() => blankCauseEffect(input.causeEffects)}
            renderItem={(analysis, update) => (
              <div className="entry-form">
                <section className="entry-form__step">
                  <div className="editor-grid editor-grid--wide-narrow">
                    <Field label="Effet (problème) analysé">
                      <TextInput value={analysis.effect} onChange={(effect) => update({ effect })} required />
                    </Field>
                    <Field label="Code">
                      <TextInput value={analysis.code} onChange={(code) => update({ code })} required />
                    </Field>
                  </div>
                  <ArrayEditor<CauseCategoryInput>
                    items={analysis.categories}
                    onChange={(categories) => update({ categories })}
                    addLabel="Ajouter une catégorie"
                    emptyLabel="Aucune catégorie."
                    makeEmpty={() => ({ name: '', causes: [] })}
                    renderItem={(category, change) => (
                      <div className="editor-grid editor-grid--wide-narrow cause-category">
                        <Field label="Causes" hint="Une cause par ligne.">
                          <LinesInput value={category.causes} onChange={(causes) => change({ causes })} rows={3} />
                        </Field>
                        <Field label="Catégorie">
                          <TextInput value={category.name} onChange={(name) => change({ name })} required />
                        </Field>
                      </div>
                    )}
                  />
                </section>
              </div>
            )}
          />
        </fieldset>
      )}

      {section === 'flowcharts' && (
        <fieldset className="editor-section">
          <legend>Logigrammes ({input.flowcharts.length})</legend>
          <ArrayEditor<FlowchartInput>
            items={input.flowcharts}
            onChange={(flowcharts) => patch({ flowcharts })}
            addLabel="Ajouter un logigramme"
            emptyLabel="Aucun logigramme."
            makeEmpty={() => blankFlowchart(input.flowcharts)}
            renderItem={(flowchart, update) => <FlowchartForm flowchart={flowchart} update={update} />}
          />
        </fieldset>
      )}
    </EditorShell>
  );
}

function FlowchartForm({ flowchart, update }: { flowchart: FlowchartInput; update: (changes: Partial<FlowchartInput>) => void }) {
  const { steps } = flowchart;
  const setSteps = (next: FlowStepInput[]) => update({ steps: next });
  const move = (index: number, offset: number) => {
    const next = [...steps];
    const [moved] = next.splice(index, 1);
    next.splice(index + offset, 0, moved!);
    setSteps(next);
  };
  // Une nouvelle étape s'insère avant la fin.
  const addStep = (kind: FlowStepKind) => {
    const endIndex = steps.findIndex((step) => step.kind === 'END');
    const at = endIndex === -1 ? steps.length : endIndex;
    setSteps([...steps.slice(0, at), blankStep(steps, kind), ...steps.slice(at)]);
  };

  return (
    <div className="entry-form">
      <section className="entry-form__step">
        <div className="editor-grid editor-grid--wide-narrow">
          <Field label="Processus">
            <TextInput value={flowchart.name} onChange={(name) => update({ name })} required />
          </Field>
          <Field label="Code">
            <TextInput value={flowchart.code} onChange={(code) => update({ code })} required />
          </Field>
        </div>
        <Field label="Description">
          <TextInput value={flowchart.description} onChange={(description) => update({ description })} />
        </Field>
      </section>

      <section className="entry-form__step">
        <h4 className="entry-form__step-title">Étapes ({steps.length})</h4>
        <ol className="flow-steps">
          {steps.map((step, index) => {
            const change = (changes: Partial<FlowStepInput>) =>
              setSteps(steps.map((other, position) => (position === index ? { ...other, ...changes } : other)));
            const targets = steps.filter((other) => other.code !== step.code);
            return (
              <li key={index} className="flow-steps__item">
                <div className="editor-grid flow-step-grid">
                  <Field label="Type">
                    <SelectInput<FlowStepKind> value={step.kind} onChange={(kind) => change({ kind })} options={KIND_OPTIONS} />
                  </Field>
                  <Field label={`Étape ${step.code}`}>
                    <TextInput value={step.label} onChange={(label) => change({ label })} required />
                  </Field>
                </div>
                {step.kind === 'DECISION' && (
                  <div className="editor-grid">
                    <Field label="« Non » mène à">
                      <SelectInput<string>
                        value={step.noTarget ?? ''}
                        onChange={(target) => change({ noTarget: target || null })}
                        options={[
                          { value: '', label: 'Une issue décrite ci-contre' },
                          ...targets.map((other) => ({ value: other.code, label: `${other.code} · ${other.label || FLOW_STEP_LABELS[other.kind]}` })),
                        ]}
                      />
                    </Field>
                    <Field label="Libellé ou issue de « Non »">
                      <TextInput value={step.noLabel} onChange={(noLabel) => change({ noLabel })} required={!step.noTarget} />
                    </Field>
                  </div>
                )}
                <div className="flow-steps__actions">
                  <button type="button" className="btn btn--icon flow-steps__move" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Monter l'étape">
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn--icon flow-steps__move"
                    onClick={() => move(index, 1)}
                    disabled={index === steps.length - 1}
                    aria-label="Descendre l'étape"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn--icon"
                    onClick={() => setSteps(steps.filter((_, position) => position !== index))}
                    aria-label="Supprimer l'étape"
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="flow-steps__add">
          <button type="button" className="btn btn--ghost" onClick={() => addStep('ACTION')}>
            + Action
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => addStep('DECISION')}>
            + Décision
          </button>
        </div>
      </section>
    </div>
  );
}
