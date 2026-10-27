import { STAKEHOLDER_QUESTIONS, type StakeholderQuestionnaireDto } from '@shared/index';
import { formatLongDate } from '@/lib/format';
import type { AppView } from '@/navigation/pmp';

interface QuestionnaireViewProps {
  questionnaire: StakeholderQuestionnaireDto;
  onNavigate: (view: AppView) => void;
}

/** Questionnaire d'identification : chaque question du template et sa réponse. */
export function QuestionnaireView({ questionnaire, onNavigate }: QuestionnaireViewProps) {
  return (
    <>
      <p className="doc-status">
        Rempli le {formatLongDate(questionnaire.preparedOn)}. Les réponses sont ensuite analysées et consolidées dans le
        registre.{' '}
        <button type="button" className="ref-link" onClick={() => onNavigate('stakeholders')}>
          Registre des parties prenantes →
        </button>
      </p>
      <section className="doc-panel">
        <ol className="questionnaire">
          {STAKEHOLDER_QUESTIONS.map(({ key, label }) => {
            const answer = questionnaire.answers[key];
            return (
              <li key={key} className="questionnaire__item">
                <h3 className="questionnaire__question">{label}</h3>
                {answer ? <p className="questionnaire__answer">{answer}</p> : <p className="plan__empty">Sans réponse.</p>}
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
