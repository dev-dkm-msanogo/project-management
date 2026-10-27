import type { SelectionCriterionInput } from '@shared/index';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { Field } from '@/components/form/Field';
import { NumberInput, SelectInput, TextInput } from '@/components/form/controls';
import { DEFAULT_RATING, draftTotals, MAX_SCORE, RATING_LABELS, TOTAL_WEIGHT, weightTotal } from '@/lib/scoring';

const RATING_OPTIONS = Object.entries(RATING_LABELS).map(([value, label]) => ({ value, label }));

interface ScoringCriteriaEditorProps {
  /** Libellé de chaque option notée (candidat, alternative), dans l'ordre des notes. */
  options: readonly string[];
  criteria: SelectionCriterionInput[];
  onChange: (criteria: SelectionCriterionInput[]) => void;
}

/** Critères pondérés notés pour chaque option, avec l'aperçu des pondérations et des totaux. */
export function ScoringCriteriaEditor({ options, criteria, onChange }: ScoringCriteriaEditorProps) {
  const total = weightTotal(criteria);
  const totals = draftTotals(options.length, criteria);
  const best = Math.max(...totals);

  return (
    <>
      <ArrayEditor<SelectionCriterionInput>
        items={criteria}
        onChange={onChange}
        addLabel="Ajouter un critère"
        emptyLabel="Aucun critère."
        makeEmpty={() => ({
          name: '',
          description: '',
          weight: Math.max(1, TOTAL_WEIGHT - total),
          ratings: options.map(() => DEFAULT_RATING),
        })}
        renderItem={(criterion, change) => (
          <div className="criterion-form">
            <div className="editor-grid editor-grid--wide-narrow">
              <Field label="Critère">
                <TextInput value={criterion.name} onChange={(name) => change({ name })} required />
              </Field>
              <Field label="Pondération (%)">
                <NumberInput value={criterion.weight} onChange={(weight) => change({ weight })} min={1} max={TOTAL_WEIGHT} step={1} />
              </Field>
            </div>
            <Field label="Description">
              <TextInput value={criterion.description} onChange={(description) => change({ description })} />
            </Field>
            <div className="rating-fields">
              {options.map((option, index) => (
                <Field key={index} label={option}>
                  <SelectInput
                    value={String(criterion.ratings[index] ?? DEFAULT_RATING)}
                    options={RATING_OPTIONS}
                    onChange={(value) =>
                      change({ ratings: criterion.ratings.map((rating, i) => (i === index ? Number(value) : rating)) })
                    }
                  />
                </Field>
              ))}
            </div>
          </div>
        )}
      />
      {criteria.length > 0 && (
        <div className="selection-preview" aria-live="polite">
          <p className={`selection-preview__weights${total === TOTAL_WEIGHT ? '' : ' selection-preview__weights--off'}`}>
            Pondérations : {total} % {total === TOTAL_WEIGHT ? '✓' : `— le total doit faire ${TOTAL_WEIGHT} %`}
          </p>
          <ul className="selection-preview__totals">
            {options.map((option, index) => (
              <li key={index} className={totals[index] === best && total === TOTAL_WEIGHT ? 'selection-preview__best' : ''}>
                {option} : <strong>{totals[index]}</strong> / {MAX_SCORE}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
