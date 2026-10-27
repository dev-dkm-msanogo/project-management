import { qualityPlanApi } from '@/api/project-documents';
import { QualityPlanEditor } from '@/components/quality/QualityPlanEditor';
import { QualityPlanView } from '@/components/quality/QualityPlanView';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useQualityPlan } from '@/hooks/useProjectDocuments';
import { blankQualityPlan, qualityPlanDtoToInput } from '@/lib/quality-risk-format';

/** Page « Plan de gestion de la qualité » : normes, objectifs mesurables, rôles, assurance et contrôle. */
export function QualityPlanFeature({ projectId, projectName }: { projectId: string; projectName: string }) {
  return (
    <DocumentFeature
      projectId={projectId}
      history={qualityPlanApi}
      approval={{ subject: 'PROJECT_MANAGEMENT_PLAN', segment: 'quality-plan', component: true }}
      deletion={{
        title: 'Supprimer le plan de gestion de la qualité ?',
        run: () => qualityPlanApi.remove(projectId),
      }}
      resource={useQualityPlan(projectId)}
      toInput={qualityPlanDtoToInput}
      blank={blankQualityPlan}
      labels={{
        edit: 'Éditer le plan',
        create: '+ Rédiger le plan de gestion de la qualité',
        loading: 'Chargement du plan de gestion de la qualité…',
        emptyTitle: "Le plan de gestion de la qualité n'a pas encore été rédigé",
        emptyText:
          "Normes applicables, objectifs qualité mesurables, rôles, livrables et processus soumis à revue, démarches d'assurance et de contrôle.",
      }}
      renderView={(plan) => <QualityPlanView plan={plan} projectName={projectName} />}
      renderEditor={(props) => <QualityPlanEditor projectId={projectId} {...props} />}
    />
  );
}
