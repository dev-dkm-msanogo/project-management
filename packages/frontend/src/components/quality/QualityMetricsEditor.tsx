import { useState } from 'react';
import type { QualityMetricInput, QualityMetricsInput } from '@shared/index';
import { qualityMetricsApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { DateInput, TextArea, TextInput } from '@/components/form/controls';
import type { DocumentEditorProps } from '@/features/DocumentFeature';
import { nextCode } from '@/lib/codes';
import { todayIso } from '@/lib/format';
import { blankMetric } from '@/lib/quality-tools-format';

/** Rédaction des métriques qualité : élément, métrique, méthode de mesure, cible. */
export function QualityMetricsEditor({
  projectId,
  initialInput,
  onCancel,
  onSaved,
}: DocumentEditorProps<QualityMetricsInput> & { projectId: string }) {
  const [input, setInput] = useState<QualityMetricsInput>(initialInput);
  const patch = (changes: Partial<QualityMetricsInput>) => setInput((current) => ({ ...current, ...changes }));

  return (
    <EditorShell title="Métriques qualité" save={() => qualityMetricsApi.save(projectId, input)} onCancel={onCancel} onSaved={onSaved}>
      <fieldset className="editor-section">
        <legend>Métriques qualité</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Métriques ({input.metrics.length})</legend>
        <ArrayEditor<QualityMetricInput>
          items={input.metrics}
          onChange={(metrics) => patch({ metrics })}
          addLabel="Ajouter une métrique"
          emptyLabel="Aucune métrique."
          makeEmpty={() => blankMetric(nextCode(input.metrics, 'QM'))}
          renderItem={(metric, update) => (
            <div className="entry-form">
              <section className="entry-form__step">
                <div className="editor-grid editor-grid--3">
                  <Field label="Code">
                    <TextInput value={metric.code} onChange={(code) => update({ code })} required />
                  </Field>
                  <Field label="Élément mesuré">
                    <TextInput value={metric.item} onChange={(item) => update({ item })} required />
                  </Field>
                  <Field label="Cible">
                    <TextInput value={metric.target} onChange={(target) => update({ target })} placeholder="≥ 99,5 %" />
                  </Field>
                </div>
                <Field label="Métrique">
                  <TextInput value={metric.metric} onChange={(text) => update({ metric: text })} required />
                </Field>
                <Field label="Méthode de mesure">
                  <TextArea value={metric.method} onChange={(method) => update({ method })} rows={2} required />
                </Field>
              </section>
            </div>
          )}
        />
      </fieldset>
    </EditorShell>
  );
}
