import type { PriorityDto } from '@shared/index';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { Field } from '@/components/form/Field';
import { CheckboxInput, TextInput } from '@/components/form/controls';

interface PrioritiesEditorProps {
  value: PriorityDto[];
  onChange: (value: PriorityDto[]) => void;
}

/** Section 10 — Priorités de la période suivante. */
export function PrioritiesEditor({ value, onChange }: PrioritiesEditorProps) {
  return (
    <fieldset className="editor-section">
      <legend>Priorités de la période suivante</legend>
      <ArrayEditor
        items={value}
        onChange={onChange}
        addLabel="Ajouter une priorité"
        emptyLabel="Aucune priorité."
        makeEmpty={() => ({ description: '', done: false })}
        renderItem={(priority, update) => (
          <div className="editor-grid editor-grid--priority">
            <Field label="Priorité">
              <TextInput
                value={priority.description}
                onChange={(description) => update({ description })}
                required
              />
            </Field>
            <CheckboxInput
              checked={priority.done}
              onChange={(done) => update({ done })}
              label="Fait"
            />
          </div>
        )}
      />
    </fieldset>
  );
}
