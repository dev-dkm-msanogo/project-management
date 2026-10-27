import { useState } from 'react';
import type { ManagementPlanInput, PlanDefinition } from '@shared/index';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { DateInput, TextArea } from '@/components/form/controls';
import type { DocumentEditorProps } from '@/features/DocumentFeature';
import { todayIso } from '@/lib/format';

interface ManagementPlanEditorProps extends DocumentEditorProps<ManagementPlanInput> {
  definition: PlanDefinition;
  save: (plan: ManagementPlanInput) => Promise<unknown>;
}

/** Rédaction d'un plan de gestion, section par section, avec l'aide du template. */
export function ManagementPlanEditor({
  definition,
  save,
  mode,
  initialInput,
  onCancel,
  onSaved,
}: ManagementPlanEditorProps) {
  const [plan, setPlan] = useState<ManagementPlanInput>(initialInput);
  const setSection = (key: string, text: string) =>
    setPlan((current) => ({ ...current, sections: { ...current.sections, [key]: text } }));

  return (
    <EditorShell
      title={mode === 'create' ? `Nouveau ${definition.title.toLowerCase()}` : definition.title}
      save={() => save(plan)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <fieldset className="editor-section">
        <legend>Sections du plan</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput
              value={plan.preparedOn}
              onChange={(date) => setPlan((current) => ({ ...current, preparedOn: date ?? todayIso() }))}
              required
            />
          </Field>
        </div>
        {definition.sections.map((section) => (
          <Field key={section.key} label={section.label} hint={section.hint}>
            <TextArea
              value={plan.sections[section.key] ?? ''}
              onChange={(text) => setSection(section.key, text)}
              rows={4}
            />
          </Field>
        ))}
      </fieldset>
    </EditorShell>
  );
}
