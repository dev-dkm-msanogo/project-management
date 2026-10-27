import { useState } from 'react';
import type { LessonCategory, LessonsLearnedDto } from '@shared/index';
import { SelectInput } from '@/components/form/controls';
import { PersonName } from '@/components/people/People';
import { EditCell, EditHeader } from '@/components/ui/EditEntry';
import { formatLongDate, formatShortDate } from '@/lib/format';
import { LESSON_CATEGORIES, LESSON_CATEGORY_LABELS } from '@/lib/lessons-format';

type CategoryFilter = LessonCategory | 'ALL';

/** Registre des leçons apprises : pratiques récurrentes, puis leçons filtrables par catégorie. */
export function LessonsView({ register, onEdit }: { register: LessonsLearnedDto; onEdit?: (code: string) => void }) {
  const [filter, setFilter] = useState<CategoryFilter>('ALL');
  const used = LESSON_CATEGORIES.filter((category) => register.lessons.some((lesson) => lesson.category === category));
  const lessons = register.lessons
    .filter((lesson) => filter === 'ALL' || lesson.category === filter)
    .sort((a, b) => a.recordedOn.localeCompare(b.recordedOn) || a.code.localeCompare(b.code));
  const titleOf = (code: string) => register.lessons.find((lesson) => lesson.code === code)?.lesson;

  return (
    <>
      <p className={`doc-status${register.transferredOn ? ' doc-status--done' : ''}`}>
        {register.transferredOn
          ? `Registre transféré au référentiel de l'organisation le ${formatLongDate(register.transferredOn)}.`
          : "À transférer au référentiel de l'organisation à la clôture du projet."}
      </p>

      <section className="doc-panel">
        <h2 className="plan__section-title">Pratiques récurrentes</h2>
        {register.patterns.length === 0 ? (
          <p className="plan__empty">Aucune pratique récurrente dégagée.</p>
        ) : (
          <ul className="pattern-cards">
            {register.patterns.map((pattern) => (
              <li key={pattern.name} className="pattern-card">
                <strong>{pattern.name}</strong>
                <span className="pattern-card__codes">
                  {pattern.lessonCodes.map((code) => (
                    <span key={code} className="matrix-chip" title={titleOf(code)}>
                      {code}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="doc-panel">
        <div className="doc-panel-head">
          <h2 className="plan__section-title">Leçons ({lessons.length})</h2>
          {used.length > 1 && (
            <label className="lessons-filter">
              <span className="visually-hidden">Catégorie</span>
              <SelectInput<CategoryFilter>
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'ALL', label: 'Toutes les catégories' },
                  ...used.map((category) => ({ value: category, label: LESSON_CATEGORY_LABELS[category] })),
                ]}
              />
            </label>
          )}
        </div>
        {lessons.length === 0 ? (
          <p className="plan__empty">Aucune leçon enregistrée.</p>
        ) : (
          <div className="wbs-scroll">
            <table className="register-table register-table--lessons">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Catégorie</th>
                  <th>Date</th>
                  <th>Situation</th>
                  <th>Leçon apprise</th>
                  <th>Porteur</th>
                  <th>Commentaires</th>
                  {onEdit && <EditHeader />}
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => (
                  <tr key={lesson.code}>
                    <td className="register-table__code">{lesson.code}</td>
                    <td>
                      <span className="skill-chip">{LESSON_CATEGORY_LABELS[lesson.category]}</span>
                    </td>
                    <td className="register-table__muted-cell">{formatShortDate(lesson.recordedOn)}</td>
                    <td className="register-table__response">{lesson.trigger}</td>
                    <td className="register-table__response">
                      <strong className="lesson-headline">{lesson.lesson}</strong>
                      {lesson.details && <span className="lesson-details">{lesson.details}</span>}
                    </td>
                    <td>
                      <PersonName id={lesson.responsibleId} />
                    </td>
                    <td className="register-table__muted-cell lesson-comments">{lesson.comments || '—'}</td>
                    {onEdit && <EditCell label={lesson.code} onEdit={() => onEdit(lesson.code)} />}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
