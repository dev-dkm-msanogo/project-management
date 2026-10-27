import { projectManagementPlanApi } from '@/api/project-documents';
import { ProjectManagementPlanEditor } from '@/components/pm-plan/ProjectManagementPlanEditor';
import { ProjectManagementPlanView } from '@/components/pm-plan/ProjectManagementPlanView';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useProjectManagementPlan } from '@/hooks/useProjectDocuments';
import { blankProjectManagementPlan, projectManagementPlanDtoToInput } from '@/lib/pm-plan-format';
import type { AppView } from '@/navigation/pmp';

interface ProjectManagementPlanFeatureProps {
  projectId: string;
  projectName: string;
  onNavigate: (view: AppView) => void;
}

/** Page « Plan de management du projet » : intègre plans subsidiaires et références de base. */
export function ProjectManagementPlanFeature({ projectId, projectName, onNavigate }: ProjectManagementPlanFeatureProps) {
  return (
    <DocumentFeature
      projectId={projectId}
      history={projectManagementPlanApi}
      approval={{ subject: 'PROJECT_MANAGEMENT_PLAN', segment: 'project-management-plan' }}
      deletion={{
        title: 'Supprimer le plan de management du projet ?',
        run: () => projectManagementPlanApi.remove(projectId),
      }}
      resource={useProjectManagementPlan(projectId)}
      toInput={projectManagementPlanDtoToInput}
      blank={blankProjectManagementPlan}
      labels={{
        edit: 'Éditer le plan',
        create: '+ Rédiger le plan de management',
        loading: 'Chargement du plan de management…',
        emptyTitle: "Le plan de management du projet n'a pas encore été rédigé",
        emptyText:
          "Il rassemble les plans de gestion et les références de base du projet, et décrit le cycle de vie, l'approche de développement, la gestion des modifications et celle de la configuration.",
      }}
      renderView={(plan, context) => (
        <ProjectManagementPlanView
          plan={plan}
          projectName={projectName}
          onNavigate={onNavigate}
          approval={context.approval}
          archived={context.archived}
        />
      )}
      renderEditor={(props) => <ProjectManagementPlanEditor projectId={projectId} {...props} />}
    />
  );
}
