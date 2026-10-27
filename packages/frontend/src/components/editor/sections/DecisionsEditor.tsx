import type { DecisionInput } from '@shared/index';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { Field } from '@/components/form/Field';
import { DateInput, TextInput } from '@/components/form/controls';

interface DecisionsEditorProps {
  value: DecisionInput[];
  onChange: (value: DecisionInput[]) => void;
}

/** Section 8 — Décisions attendues qu'aucun registre ne porte. Champs facultatifs vides → null. */
export function DecisionsEditor({ value, onChange }: DecisionsEditorProps) {
  return (
    <fieldset className="editor-section">
      <legend>Autres décisions attendues</legend>
      <p className="editor-section__note">
        Les demandes de modification à décider et les problèmes escaladés sont repris d'office de leurs registres.
      </p>
      <ArrayEditor
        items={value}
        onChange={onChange}
        addLabel="Ajouter une décision"
        emptyLabel="Aucune autre décision."
        makeEmpty={() => ({ description: '', impact: null, neededBy: null })}
        renderItem={(decision, update) => (
          <div className="editor-grid editor-grid--decision">
            <Field label="Décision">
              <TextInput value={decision.description} onChange={(description) => update({ description })} required />
            </Field>
            <Field label="Impact (facultatif)">
              <TextInput value={decision.impact ?? ''} onChange={(impact) => update({ impact: impact === '' ? null : impact })} />
            </Field>
            <Field label="À décider avant (facultatif)">
              <DateInput value={decision.neededBy} onChange={(neededBy) => update({ neededBy })} />
            </Field>
          </div>
        )}
      />
    </fieldset>
  );
}
