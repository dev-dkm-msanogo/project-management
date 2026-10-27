import { useState } from 'react';
import type { BenefitMetricInput, BenefitsPlanInput, PlannedBenefitInput } from '@shared/index';
import { benefitsPlanApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { DateInput, LinesInput, TextArea, TextInput } from '@/components/form/controls';
import { PersonSelect } from '@/components/people/People';
import type { DocumentEditorProps } from '@/features/DocumentFeature';
import { blankBenefit } from '@/lib/benefits-format';
import { todayIso } from '@/lib/format';

const LINES_HINT = 'Un élément par ligne.';

/** Rédaction du plan de gestion des bénéfices : bénéfices, calendrier et indicateurs. */
export function BenefitsPlanEditor({
  projectId,
  mode,
  initialInput,
  onCancel,
  onSaved,
}: DocumentEditorProps<BenefitsPlanInput> & { projectId: string }) {
  const [input, setInput] = useState<BenefitsPlanInput>(initialInput);
  const patch = (changes: Partial<BenefitsPlanInput>) => setInput((current) => ({ ...current, ...changes }));

  const renderBenefit = (benefit: PlannedBenefitInput, update: (changes: Partial<PlannedBenefitInput>) => void) => (
    <div className="entry-form">
      <section className="entry-form__step">
        <h3 className="entry-form__step-title">Bénéfice et calendrier</h3>
        <Field label="Bénéfice">
          <TextInput value={benefit.name} onChange={(name) => update({ name })} required />
        </Field>
        <div className="editor-grid">
          <Field label="Réalisé à partir de">
            <TextInput value={benefit.realizedFrom} onChange={(realizedFrom) => update({ realizedFrom })} />
          </Field>
          <Field label="Maintenu jusqu'à">
            <TextInput value={benefit.sustainedThrough} onChange={(sustainedThrough) => update({ sustainedThrough })} />
          </Field>
        </div>
      </section>
      <section className="entry-form__step">
        <h3 className="entry-form__step-title">Indicateurs ({benefit.metrics.length})</h3>
        <ArrayEditor<BenefitMetricInput>
          items={benefit.metrics}
          onChange={(metrics) => update({ metrics })}
          addLabel="Ajouter un indicateur"
          emptyLabel="Aucun indicateur."
          makeEmpty={() => ({ metric: '', baseline: '', target: '', ownerId: '' })}
          renderItem={(metric, updateMetric) => (
            <div className="editor-grid editor-grid--fluid">
              <Field label="Indicateur">
                <TextInput value={metric.metric} onChange={(value) => updateMetric({ metric: value })} required />
              </Field>
              <Field label="Situation de départ">
                <TextInput value={metric.baseline} onChange={(baseline) => updateMetric({ baseline })} />
              </Field>
              <Field label="Cible">
                <TextInput value={metric.target} onChange={(target) => updateMetric({ target })} required />
              </Field>
              <Field label="Responsable">
                <PersonSelect value={metric.ownerId || null} onChange={(id) => updateMetric({ ownerId: id ?? '' })} />
              </Field>
            </div>
          )}
        />
      </section>
    </div>
  );

  return (
    <EditorShell
      title={mode === 'create' ? 'Nouveau plan de gestion des bénéfices' : 'Plan de gestion des bénéfices'}
      save={() => benefitsPlanApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <fieldset className="editor-section">
        <legend>Bénéfices visés et alignement</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
        <Field label="Introduction">
          <TextArea value={input.summary} onChange={(summary) => patch({ summary })} rows={2} />
        </Field>
        <Field label="Bénéfices visés" hint={LINES_HINT}>
          <LinesInput value={input.targetBenefits} onChange={(targetBenefits) => patch({ targetBenefits })} />
        </Field>
        <Field label="Alignement stratégique">
          <TextArea
            value={input.strategicAlignment}
            onChange={(strategicAlignment) => patch({ strategicAlignment })}
            rows={3}
          />
        </Field>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Bénéfices, calendrier et indicateurs ({input.benefits.length})</legend>
        <ArrayEditor<PlannedBenefitInput>
          items={input.benefits}
          onChange={(benefits) => patch({ benefits })}
          addLabel="Ajouter un bénéfice"
          emptyLabel="Aucun bénéfice planifié."
          makeEmpty={blankBenefit}
          renderItem={renderBenefit}
        />
      </fieldset>

      <fieldset className="editor-section">
        <legend>Hypothèses, risques et gouvernance</legend>
        <div className="editor-grid">
          <Field label="Hypothèses" hint={LINES_HINT}>
            <LinesInput value={input.assumptions} onChange={(assumptions) => patch({ assumptions })} />
          </Field>
          <Field label="Risques sur la réalisation des bénéfices" hint={LINES_HINT}>
            <LinesInput value={input.risks} onChange={(risks) => patch({ risks })} />
          </Field>
        </div>
        <Field label="Revue des bénéfices et gouvernance">
          <TextArea value={input.governance} onChange={(governance) => patch({ governance })} rows={4} />
        </Field>
      </fieldset>
    </EditorShell>
  );
}
