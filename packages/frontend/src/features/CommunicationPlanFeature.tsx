import { communicationPlanApi } from '@/api/project-documents';
import { CommunicationPlanEditor } from '@/components/communication/CommunicationPlanEditor';
import { CommunicationPlanView } from '@/components/communication/CommunicationPlanView';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useCommunicationPlan } from '@/hooks/useProjectDocuments';
import { blankCommunicationPlan, communicationPlanDtoToInput } from '@/lib/communication-format';

/** Page « Plan de communication » : qui reçoit quoi, comment, quand et de qui. */
export function CommunicationPlanFeature({ projectId, projectName }: { projectId: string; projectName: string }) {
  return (
    <DocumentFeature
      projectId={projectId}
      history={communicationPlanApi}
      approval={{ subject: 'PROJECT_MANAGEMENT_PLAN', segment: 'communication-plan', component: true }}
      deletion={{
        title: 'Supprimer le plan de communication ?',
        run: () => communicationPlanApi.remove(projectId),
      }}
      resource={useCommunicationPlan(projectId)}
      toInput={communicationPlanDtoToInput}
      blank={blankCommunicationPlan}
      labels={{
        edit: 'Éditer le plan',
        create: '+ Rédiger le plan de communication',
        loading: 'Chargement du plan de communication…',
        emptyTitle: "Le plan de communication n'a pas encore été rédigé",
        emptyText:
          "Pour chaque partie prenante ou groupe : l'information à transmettre, le moyen, la fréquence et l'émetteur ; puis les hypothèses, contraintes et le glossaire.",
      }}
      renderView={(plan) => <CommunicationPlanView plan={plan} projectName={projectName} />}
      renderEditor={(props) => <CommunicationPlanEditor projectId={projectId} {...props} />}
    />
  );
}
