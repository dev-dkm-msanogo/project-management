import { resourcePlanApi } from '@/api/project-documents';
import { ResourcePlanEditor } from '@/components/resources/editor/ResourcePlanEditor';
import { ResourcePlanView } from '@/components/resources/ResourcePlanView';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useResourcePlan } from '@/hooks/useProjectDocuments';
import { blankResourcePlan, resourcePlanDtoToInput } from '@/lib/resource-format';
import type { AppView } from '@/navigation/pmp';

interface ResourcePlanFeatureProps {
  projectId: string;
  projectName: string;
  onNavigate: (view: AppView) => void;
}

/** Page « Plan de gestion des ressources » : rôles, organigramme, acquisition et gestion des ressources. */
export function ResourcePlanFeature({ projectId, projectName, onNavigate }: ResourcePlanFeatureProps) {
  return (
    <DocumentFeature
      projectId={projectId}
      history={resourcePlanApi}
      approval={{ subject: 'PROJECT_MANAGEMENT_PLAN', segment: 'resource-plan', component: true }}
      deletion={{
        title: 'Supprimer le plan de gestion des ressources ?',
        run: () => resourcePlanApi.remove(projectId),
      }}
      resource={useResourcePlan(projectId)}
      toInput={resourcePlanDtoToInput}
      blank={blankResourcePlan}
      labels={{
        edit: 'Éditer le plan',
        create: '+ Rédiger le plan de gestion des ressources',
        loading: 'Chargement du plan de gestion des ressources…',
        emptyTitle: "Le plan de gestion des ressources n'a pas encore été rédigé",
        emptyText:
          "Il précise les rôles et l'autorité de chacun, l'organisation du projet, comment l'équipe est constituée, formée et libérée, et comment les ressources physiques sont acquises et suivies.",
      }}
      renderView={(plan) => <ResourcePlanView plan={plan} projectName={projectName} onNavigate={onNavigate} />}
      renderEditor={(props) => <ResourcePlanEditor projectId={projectId} {...props} />}
    />
  );
}
