import { useState } from 'react';
import type {
  DefectSummaryInput,
  MetricStatus,
  MetricStatusInput,
  QualityAuditInput,
  QualityMetricInput,
  QualityRecommendationInput,
  QualityReportInput,
} from '@shared/index';
import { qualityReportApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { DateInput, NumberInput, SelectInput, TextArea, TextInput } from '@/components/form/controls';
import type { DocumentEditorProps } from '@/features/DocumentFeature';
import { todayIso } from '@/lib/format';
import { METRIC_STATUS_LABELS, METRIC_STATUSES, SEVERITY_LABELS } from '@/lib/quality-tools-format';

const STATUS_OPTIONS = METRIC_STATUSES.map((value) => ({ value, label: METRIC_STATUS_LABELS[value] }));

interface QualityReportEditorProps extends DocumentEditorProps<QualityReportInput> {
  projectId: string;
  metrics: readonly QualityMetricInput[];
}

/** Rédaction du rapport qualité : statuts des métriques, anomalies, recommandations, audit. */
export function QualityReportEditor({ projectId, metrics, initialInput, onCancel, onSaved }: QualityReportEditorProps) {
  const [input, setInput] = useState<QualityReportInput>(initialInput);
  const patch = (changes: Partial<QualityReportInput>) => setInput((current) => ({ ...current, ...changes }));
  const setDefects = (changes: Partial<DefectSummaryInput>) => patch({ defects: { ...input.defects, ...changes } });
  const setAudit = (changes: Partial<QualityAuditInput>) => patch({ audit: { ...input.audit, ...changes } });

  const same = (a: string, b: string) => a.toUpperCase() === b.toUpperCase();
  const unreported = metrics.filter((metric) => !input.statuses.some((entry) => same(entry.metricCode, metric.code)));
  const find = (code: string) => metrics.find((metric) => same(metric.code, code));
  const { defects } = input;
  const openTotal = defects.openBySeverity.reduce((total, value) => total + value, 0);
  const expected = defects.logged - defects.resolved;

  return (
    <EditorShell title="Rapport qualité" save={() => qualityReportApi.save(projectId, input)} onCancel={onCancel} onSaved={onSaved}>
      <fieldset className="editor-section">
        <legend>Période</legend>
        <div className="editor-grid editor-grid--3">
          <Field label="Début de la période">
            <DateInput value={input.periodStart} onChange={(date) => patch({ periodStart: date ?? todayIso() })} required />
          </Field>
          <Field label="Fin de la période">
            <DateInput value={input.periodEnd} onChange={(date) => patch({ periodEnd: date ?? todayIso() })} required />
          </Field>
          <Field label="Date du rapport">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Statut des métriques ({input.statuses.length})</legend>
        {unreported.length > 0 && (
          <button
            type="button"
            className="btn btn--ghost engagement-add-all"
            onClick={() =>
              patch({
                statuses: [
                  ...input.statuses,
                  ...unreported.map((metric): MetricStatusInput => ({ metricCode: metric.code, measurement: '', status: 'NOT_STARTED' })),
                ],
              })
            }
          >
            + Ajouter les {unreported.length} métrique(s) sans statut
          </button>
        )}
        <ArrayEditor<MetricStatusInput>
          items={input.statuses}
          onChange={(statuses) => patch({ statuses })}
          addLabel="Ajouter une métrique"
          emptyLabel="Aucune métrique renseignée."
          makeEmpty={() => ({ metricCode: unreported[0]?.code ?? '', measurement: '', status: 'NOT_STARTED' })}
          renderItem={(entry, update) => {
            const metric = find(entry.metricCode);
            const options = [...(metric ? [metric] : []), ...unreported].map((item) => ({
              value: item.code,
              label: `${item.code} · ${item.item}`,
            }));
            return (
              <div className="entry-form">
                <section className="entry-form__step">
                  <div className="editor-grid">
                    <Field label="Métrique" hint={metric?.target ? `Cible : ${metric.target}` : undefined}>
                      {options.length > 0 ? (
                        <SelectInput value={entry.metricCode} onChange={(metricCode) => update({ metricCode })} options={options} />
                      ) : (
                        <input className="form-input" value={entry.metricCode} disabled />
                      )}
                    </Field>
                    <Field label="Statut">
                      <SelectInput<MetricStatus> value={entry.status} onChange={(status) => update({ status })} options={STATUS_OPTIONS} />
                    </Field>
                  </div>
                  <Field label="Mesure actuelle">
                    <TextInput value={entry.measurement} onChange={(measurement) => update({ measurement })} required={entry.status !== 'NOT_STARTED'} />
                  </Field>
                </section>
              </div>
            );
          }}
        />
      </fieldset>

      <fieldset className="editor-section">
        <legend>Anomalies (cumul)</legend>
        <div className="editor-grid">
          <Field label="Enregistrées">
            <NumberInput value={defects.logged} onChange={(logged) => setDefects({ logged })} min={0} step={1} />
          </Field>
          <Field label="Résolues">
            <NumberInput value={defects.resolved} onChange={(resolved) => setDefects({ resolved })} min={0} step={1} />
          </Field>
        </div>
        <div className="editor-grid editor-grid--4">
          {SEVERITY_LABELS.map((label, index) => (
            <Field key={label} label={`Ouvertes : ${label.toLowerCase()}`}>
              <NumberInput
                value={defects.openBySeverity[index]!}
                onChange={(value) =>
                  setDefects({
                    openBySeverity: defects.openBySeverity.map((other, position) =>
                      position === index ? value : other,
                    ) as DefectSummaryInput['openBySeverity'],
                  })
                }
                min={0}
                step={1}
              />
            </Field>
          ))}
        </div>
        <p className={`field__hint${openTotal === expected ? '' : ' quality-mismatch'}`}>
          {openTotal === expected
            ? `${openTotal} anomalie(s) ouverte(s), cohérent avec les enregistrées moins les résolues.`
            : `Ouvertes : ${openTotal} ; enregistrées moins résolues : ${expected}. Les deux doivent être égales.`}
        </p>
        <div className="editor-grid">
          <Field label="Tendance">
            <TextArea value={defects.trend} onChange={(trend) => setDefects({ trend })} rows={2} />
          </Field>
          <Field label="Répartition par catégorie">
            <TextArea value={defects.categories} onChange={(categories) => setDefects({ categories })} rows={2} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Améliorations et recommandations ({input.recommendations.length})</legend>
        <ArrayEditor<QualityRecommendationInput>
          items={input.recommendations}
          onChange={(recommendations) => patch({ recommendations })}
          addLabel="Ajouter une recommandation"
          emptyLabel="Aucune recommandation."
          makeEmpty={() => ({ subject: '', recommendation: '' })}
          renderItem={(item, update) => (
            <div className="entry-form">
              <section className="entry-form__step">
                <Field label="Objet">
                  <TextInput value={item.subject} onChange={(subject) => update({ subject })} required />
                </Field>
                <Field label="Recommandation">
                  <TextArea value={item.recommendation} onChange={(recommendation) => update({ recommendation })} rows={2} required />
                </Field>
              </section>
            </div>
          )}
        />
      </fieldset>

      <fieldset className="editor-section">
        <legend>Audit qualité</legend>
        <div className="editor-grid">
          <Field label="Audit ou revue">
            <TextInput value={input.audit.name} onChange={(name) => setAudit({ name })} />
          </Field>
          <Field label="Date">
            <DateInput value={input.audit.heldOn} onChange={(heldOn) => setAudit({ heldOn })} />
          </Field>
        </div>
        <Field label="Bonnes pratiques">
          <TextArea value={input.audit.goodPractices} onChange={(goodPractices) => setAudit({ goodPractices })} rows={2} />
        </Field>
        <Field label="Améliorations">
          <TextArea value={input.audit.improvements} onChange={(improvements) => setAudit({ improvements })} rows={2} />
        </Field>
        <Field label="Non-conformités">
          <TextArea value={input.audit.deficiencies} onChange={(deficiencies) => setAudit({ deficiencies })} rows={2} />
        </Field>
      </fieldset>
    </EditorShell>
  );
}
