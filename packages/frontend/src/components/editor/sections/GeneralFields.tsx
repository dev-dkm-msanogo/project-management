import type { ExecutiveStatusReportInput, RagLevel } from '@shared/index';
import { Field } from '@/components/form/Field';
import { CheckboxInput, DateInput, SelectInput, TextArea } from '@/components/form/controls';
import { RAG_HEADLINE_LABELS } from '@/lib/format';

const OVERRIDE_OPTIONS: { value: RagLevel; label: string }[] = (['GREEN', 'AMBER', 'RED'] as const).map((value) => ({
  value,
  label: RAG_HEADLINE_LABELS[value],
}));

interface GeneralFieldsProps {
  input: ExecutiveStatusReportInput;
  patch: (partial: Partial<ExecutiveStatusReportInput>) => void;
  /** Niveau calculé à la date du rapport ; `null` : rapport pas encore enregistré. */
  computedRag: RagLevel | null;
}

/** Période, statut global (calculé, ajustable avec justification) et résumé exécutif. */
export function GeneralFields({ input, patch, computedRag }: GeneralFieldsProps) {
  const overall = input.overall;
  const setOverall = (changes: Partial<ExecutiveStatusReportInput['overall']>) => patch({ overall: { ...overall, ...changes } });
  const adjusted = overall.ragOverride !== null;

  return (
    <fieldset className="editor-section">
      <legend>Période, statut global et résumé</legend>
      <div className="editor-grid editor-grid--3">
        <Field label="Date du rapport" hint="Toutes les sections chiffrées sont calculées à cette date.">
          <DateInput value={input.reportDate} onChange={(value) => patch({ reportDate: value ?? '' })} required />
        </Field>
        <Field label="Période : début">
          <DateInput
            value={input.reportingPeriod.from}
            onChange={(value) => patch({ reportingPeriod: { ...input.reportingPeriod, from: value ?? '' } })}
            required
          />
        </Field>
        <Field label="Période : fin">
          <DateInput
            value={input.reportingPeriod.to}
            onChange={(value) => patch({ reportingPeriod: { ...input.reportingPeriod, to: value ?? '' } })}
            required
          />
        </Field>
      </div>

      <div className="report-computed">
        <span className="field__label">Statut global calculé</span>
        <span>
          {computedRag
            ? `${RAG_HEADLINE_LABELS[computedRag]} : la pire des dimensions périmètre, délai et coût à la date du rapport.`
            : "Calculé à l'enregistrement à partir du périmètre, du délai et du coût."}
        </span>
      </div>
      <CheckboxInput
        checked={adjusted}
        onChange={(checked) =>
          setOverall(checked ? { ragOverride: computedRag && computedRag !== 'NOT_APPLICABLE' ? computedRag : 'AMBER' } : { ragOverride: null, overrideReason: null })
        }
        label="Ajuster le statut calculé (justification publiée dans le rapport)"
      />
      {adjusted && (
        <div className="editor-grid editor-grid--narrow-wide">
          <Field label="Statut retenu">
            <SelectInput<RagLevel> value={overall.ragOverride!} onChange={(ragOverride) => setOverall({ ragOverride })} options={OVERRIDE_OPTIONS} />
          </Field>
          <Field label="Justification" hint="10 caractères au moins.">
            <TextArea value={overall.overrideReason ?? ''} onChange={(overrideReason) => setOverall({ overrideReason })} rows={2} required />
          </Field>
        </div>
      )}

      <Field label="Énoncé du statut global">
        <TextArea value={overall.statement} onChange={(statement) => setOverall({ statement })} rows={2} required />
      </Field>
      <Field label="Résumé exécutif">
        <TextArea
          value={input.executiveSummary.narrative}
          onChange={(narrative) => patch({ executiveSummary: { narrative } })}
          rows={4}
          required
        />
      </Field>
    </fieldset>
  );
}
