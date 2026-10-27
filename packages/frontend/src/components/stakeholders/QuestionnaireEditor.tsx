import { useState } from 'react';
import { STAKEHOLDER_QUESTIONS, type StakeholderQuestionnaireInput } from '@shared/index';
import { stakeholderQuestionnaireApi } from '@/api/project-documents';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { DateInput, TextArea } from '@/components/form/controls';
import type { DocumentEditorProps } from '@/features/DocumentFeature';
import { todayIso } from '@/lib/format';

/** Rédaction du questionnaire d'identification : une réponse libre par question (facultative). */
export function QuestionnaireEditor({
  projectId,
  initialInput,
  onCancel,
  onSaved,
}: DocumentEditorProps<StakeholderQuestionnaireInput> & { projectId: string }) {
  const [input, setInput] = useState<StakeholderQuestionnaireInput>(initialInput);
  const answer = (key: keyof StakeholderQuestionnaireInput['answers'], value: string) =>
    setInput((current) => ({ ...current, answers: { ...current.answers, [key]: value } }));

  return (
    <EditorShell
      title="Questionnaire d'identification"
      save={() => stakeholderQuestionnaireApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <fieldset className="editor-section">
        <legend>Questionnaire</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput
              value={input.preparedOn}
              onChange={(preparedOn) => setInput((current) => ({ ...current, preparedOn: preparedOn ?? todayIso() }))}
              required
            />
          </Field>
        </div>
      </fieldset>

      <p className="editor__info">
        Répondez largement, même en cas de doute : l'équipe analyse et consolide ensuite la liste dans le registre.
      </p>

      <fieldset className="editor-section">
        <legend>Questions</legend>
        {STAKEHOLDER_QUESTIONS.map(({ key, label }, index) => (
          <Field key={key} label={`${index + 1}. ${label}`}>
            <TextArea value={input.answers[key]} onChange={(value) => answer(key, value)} rows={2} />
          </Field>
        ))}
      </fieldset>
    </EditorShell>
  );
}
