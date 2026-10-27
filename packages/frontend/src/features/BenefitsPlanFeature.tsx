import { benefitsPlanApi } from '@/api/project-documents';
import { BenefitsPlanEditor } from '@/components/benefits/BenefitsPlanEditor';
import { BenefitsPlanView } from '@/components/benefits/BenefitsPlanView';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useBenefitsPlan } from '@/hooks/useProjectDocuments';
import { benefitsPlanDtoToInput, blankBenefitsPlan } from '@/lib/benefits-format';

/** Page « Plan de gestion des bénéfices » : bénéfices visés, calendrier, indicateurs, gouvernance. */
export function BenefitsPlanFeature({ projectId, projectName }: { projectId: string; projectName: string }) {
  return (
    <DocumentFeature
      projectId={projectId}
      history={benefitsPlanApi}
      approval={{ subject: 'BENEFITS_PLAN', segment: 'benefits-plan' }}
      deletion={{
        title: 'Supprimer le plan de gestion des bénéfices ?',
        run: () => benefitsPlanApi.remove(projectId),
      }}
      resource={useBenefitsPlan(projectId)}
      toInput={benefitsPlanDtoToInput}
      blank={blankBenefitsPlan}
      labels={{
        edit: 'Éditer le plan',
        create: '+ Rédiger le plan des bénéfices',
        loading: 'Chargement du plan des bénéfices…',
        emptyTitle: "Le plan de gestion des bénéfices n'a pas encore été rédigé",
        emptyText:
          'Il précise les bénéfices attendus, quand ils se réalisent, comment on les mesure et qui en est responsable.',
      }}
      renderView={(document) => <BenefitsPlanView document={document} projectName={projectName} />}
      renderEditor={(props) => <BenefitsPlanEditor projectId={projectId} {...props} />}
    />
  );
}
