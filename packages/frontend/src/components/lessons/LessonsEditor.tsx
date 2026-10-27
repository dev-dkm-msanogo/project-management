import { useState } from 'react';
import type { LessonCategory, LessonInput, LessonPatternInput, LessonsLearnedInput } from '@shared/index';
import { lessonsLearnedApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { FocusedEntry, useEntryFocus, type EntryTarget } from '@/components/form/EntryFocus';
import { Field } from '@/components/form/Field';
import { CheckboxInput, DateInput, SelectInput, TextArea, TextInput } from '@/components/form/controls';
import { PersonSelect } from '@/components/people/People';
import { nextCode } from '@/lib/codes';
import { todayIso } from '@/lib/format';
import { blankLesson, LESSON_CATEGORIES, LESSON_CATEGORY_LABELS } from '@/lib/lessons-format';

const CATEGORY_OPTIONS = LESSON_CATEGORIES.map((value) => ({ value, label: LESSON_CATEGORY_LABELS[value] }));

/** Retirer une leçon la retire aussi des pratiques qui la citent. */
function withLessons(input: LessonsLearnedInput, lessons: LessonInput[]): LessonsLearnedInput {
  const kept = new Set(lessons.map((lesson) => lesson.code.trim().toUpperCase()));
  return {
    ...input,
    lessons,
    patterns: input.patterns.map((pattern) => ({
      ...pattern,
      lessonCodes: pattern.lessonCodes.filter((code) => kept.has(code.toUpperCase())),
    })),
  };
}

interface LessonsEditorProps {
  projectId: string;
  initialInput: LessonsLearnedInput;
  /** Entrée éditée seule ; absente : tout le registre. */
  target?: EntryTarget;
  onCancel: () => void;
  onSaved: () => void;
}

/** Rédaction du registre des leçons apprises : leçons, pratiques récurrentes, transfert à la clôture. */
export function LessonsEditor({ projectId, initialInput, target, onCancel, onSaved }: LessonsEditorProps) {
  const focus = useEntryFocus({
    entries: initialInput.lessons,
    keyOf: (lesson) => lesson.code,
    target,
    blank: () => blankLesson(nextCode(initialInput.lessons, 'LL')),
    labels: {
      create: 'Nouvelle leçon',
      edit: (lesson) => `Leçon ${lesson.code}`,
      deleteMessage: 'La leçon disparaît du registre et des pratiques récurrentes qui la citent.',
    },
    remove: (code) =>
      lessonsLearnedApi.save(
        projectId,
        withLessons(initialInput, initialInput.lessons.filter((lesson) => lesson.code !== code)),
      ),
    onRemoved: onSaved,
  });
  const [input, setInput] = useState<LessonsLearnedInput>({ ...initialInput, lessons: focus.entries });
  const patch = (changes: Partial<LessonsLearnedInput>) => setInput((current) => ({ ...current, ...changes }));
  const codes = input.lessons.map((lesson) => lesson.code.trim()).filter(Boolean);

  const setLessons = (lessons: LessonInput[]) => setInput((current) => withLessons(current, lessons));

  const renderLesson = (lesson: LessonInput, update: (patch: Partial<LessonInput>) => void) => (
    <div className="entry-form">
      <section className="entry-form__step">
        <div className="editor-grid editor-grid--3">
          <Field label="Code">
            <TextInput value={lesson.code} onChange={(code) => update({ code })} required />
          </Field>
          <Field label="Catégorie">
            <SelectInput<LessonCategory>
              value={lesson.category}
              onChange={(category) => update({ category })}
              options={CATEGORY_OPTIONS}
            />
          </Field>
          <Field label="Date">
            <DateInput value={lesson.recordedOn} onChange={(date) => update({ recordedOn: date ?? todayIso() })} required />
          </Field>
        </div>
        <Field label="Situation">
          <TextArea value={lesson.trigger} onChange={(trigger) => update({ trigger })} rows={2} required />
        </Field>
        <Field label="Leçon apprise" hint="Une pratique à appliquer, en une phrase.">
          <TextInput value={lesson.lesson} onChange={(text) => update({ lesson: text })} required />
        </Field>
        <Field label="Explication">
          <TextArea value={lesson.details} onChange={(details) => update({ details })} rows={2} />
        </Field>
        <div className="editor-grid">
          <Field label="Porteur">
            <PersonSelect value={lesson.responsibleId || null} onChange={(id) => update({ responsibleId: id ?? '' })} />
          </Field>
          <Field label="Commentaires">
            <TextInput value={lesson.comments} onChange={(comments) => update({ comments })} />
          </Field>
        </div>
      </section>
    </div>
  );

  return (
    <EditorShell title={focus.title ?? 'Registre des leçons apprises'} save={() => lessonsLearnedApi.save(projectId, input)} onCancel={onCancel} onSaved={onSaved} extraActions={focus.deleteAction}>
      {focus.index === null ? (
        <>
          <fieldset className="editor-section">
            <legend>Leçons ({input.lessons.length})</legend>
            <ArrayEditor<LessonInput>
              items={input.lessons}
              onChange={setLessons}
              addLabel="Ajouter une leçon"
              emptyLabel="Aucune leçon."
              makeEmpty={() => blankLesson(nextCode(input.lessons, 'LL'))}
              renderItem={renderLesson}
            />
          </fieldset>

          <fieldset className="editor-section">
            <legend>Pratiques récurrentes ({input.patterns.length})</legend>
            <ArrayEditor<LessonPatternInput>
              items={input.patterns}
              onChange={(patterns) => patch({ patterns })}
              addLabel="Ajouter une pratique récurrente"
              emptyLabel="Aucune pratique récurrente."
              makeEmpty={() => ({ name: '', lessonCodes: [] })}
              renderItem={(pattern, update) => (
                <div className="entry-form">
                  <section className="entry-form__step">
                    <Field label="Pratique à ériger en standard">
                      <TextInput value={pattern.name} onChange={(name) => update({ name })} required />
                    </Field>
                    <div className="pattern-options" role="group" aria-label="Leçons rattachées">
                      {codes.map((code) => (
                        <CheckboxInput
                          key={code}
                          label={code}
                          checked={pattern.lessonCodes.includes(code)}
                          onChange={(checked) =>
                            update({
                              lessonCodes: checked
                                ? codes.filter((other) => other === code || pattern.lessonCodes.includes(other))
                                : pattern.lessonCodes.filter((other) => other !== code),
                            })
                          }
                        />
                      ))}
                    </div>
                  </section>
                </div>
              )}
            />
          </fieldset>

          <fieldset className="editor-section">
            <legend>Clôture</legend>
            <div className="editor-grid editor-grid--fluid">
              <Field label="Transfert au référentiel de l'organisation" hint="À renseigner à la clôture du projet.">
                <DateInput value={input.transferredOn} onChange={(transferredOn) => patch({ transferredOn })} />
              </Field>
            </div>
          </fieldset>
        </>
      ) : (
        <FocusedEntry
          entries={input.lessons}
          index={focus.index}
          onChange={setLessons}
          render={renderLesson}
        />
      )}
    </EditorShell>
  );
}
