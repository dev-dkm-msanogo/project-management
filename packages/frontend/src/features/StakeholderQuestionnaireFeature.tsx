import { stakeholderQuestionnaireApi } from '@/api/project-documents';
import { QuestionnaireEditor } from '@/components/stakeholders/QuestionnaireEditor';
import { QuestionnaireView } from '@/components/stakeholders/QuestionnaireView';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useStakeholderQuestionnaire } from '@/hooks/useProjectDocuments';
import { blankQuestionnaire, questionnaireDtoToInput } from '@/lib/stakeholder-tools-format';
import type { AppView } from '@/navigation/pmp';

interface StakeholderToolFeatureProps {
  projectId: string;
  onNavigate: (view: AppView) => void;
}

/** Page « Questionnaire d'identification » : qui affecte le projet ou en est affecté. */
export function StakeholderQuestionnaireFeature({ projectId, onNavigate }: StakeholderToolFeatureProps) {
  const resource = useStakeholderQuestionnaire(projectId);
  return (
    <DocumentFeature
      projectId={projectId}
      history={stakeholderQuestionnaireApi}
      deletion={{
        title: "Supprimer le questionnaire d'identification ?",
        run: () => stakeholderQuestionnaireApi.remove(projectId),
      }}
      resource={resource}
      toInput={questionnaireDtoToInput}
      blank={blankQuestionnaire}
      labels={{
        edit: 'Éditer le questionnaire',
        create: '+ Remplir le questionnaire',
        loading: "Chargement du questionnaire d'identification…",
        emptyTitle: "Le questionnaire d'identification n'a pas encore été rempli",
        emptyText:
          "Quatorze questions pour faire émerger toutes les personnes et instances qui affectent le projet ou en sont affectées, avant de les consolider dans le registre.",
      }}
      renderView={(questionnaire) => {
        const answered = Object.values(questionnaire.answers).filter(Boolean).length;
        const total = Object.keys(questionnaire.answers).length;
        return (
          <article className="doc-page">
            <SummaryTiles
              tiles={[
                { label: 'Questions renseignées', value: answered },
                { label: 'Sans réponse', value: total - answered, tone: 'warning' },
              ]}
            />
            <QuestionnaireView questionnaire={questionnaire} onNavigate={onNavigate} />
          </article>
        );
      }}
      renderEditor={(props) => <QuestionnaireEditor projectId={projectId} {...props} />}
    />
  );
}
