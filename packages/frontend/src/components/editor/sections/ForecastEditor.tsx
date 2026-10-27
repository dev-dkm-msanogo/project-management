import type { ForecastInput } from '@shared/index';
import { Field } from '@/components/form/Field';
import { NumberInput, TextArea } from '@/components/form/controls';

interface ForecastEditorProps {
  value: ForecastInput;
  onChange: (value: ForecastInput) => void;
}

/** Section 12 — Confiance dans la date prévue (calculée : fin de la WBS corrigée par l'indice de délai). */
export function ForecastEditor({ value, onChange }: ForecastEditorProps) {
  const set = (partial: Partial<ForecastInput>) => onChange({ ...value, ...partial });

  return (
    <fieldset className="editor-section">
      <legend>Confiance dans la prévision</legend>
      <p className="editor-section__note">
        La date de livraison prévue est calculée : fin prévue de la WBS, corrigée par l'indice de délai (SPI).
      </p>
      <div className="editor-grid editor-grid--narrow-wide">
        <Field label="Confiance (%)">
          <NumberInput
            value={value.confidencePercentage}
            onChange={(confidencePercentage) => set({ confidencePercentage })}
            min={0}
            max={100}
          />
        </Field>
        <Field label="Explication">
          <TextArea value={value.statement} onChange={(statement) => set({ statement })} rows={3} />
        </Field>
      </div>
    </fieldset>
  );
}
