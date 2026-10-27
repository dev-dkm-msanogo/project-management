import { procurementPlanApi } from '@/api/project-documents';
import { ProcurementPlanEditor } from '@/components/procurement/ProcurementPlanEditor';
import { ProcurementPlanView } from '@/components/procurement/ProcurementPlanView';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useProcurementPlan } from '@/hooks/useProjectDocuments';
import { blankProcurementPlan, procurementPlanDtoToInput } from '@/lib/procurement-format';
import type { AppView } from '@/navigation/pmp';

interface ProcurementPlanFeatureProps {
  projectId: string;
  projectName: string;
  onNavigate: (view: AppView) => void;
}

/** Page « Plan de gestion des approvisionnements » : calendrier, rôles, indicateurs et fournisseurs. */
export function ProcurementPlanFeature({ projectId, projectName, onNavigate }: ProcurementPlanFeatureProps) {
  return (
    <DocumentFeature
      projectId={projectId}
      history={procurementPlanApi}
      approval={{ subject: 'PROJECT_MANAGEMENT_PLAN', segment: 'procurement-plan', component: true }}
      deletion={{
        title: 'Supprimer le plan de gestion des approvisionnements ?',
        run: () => procurementPlanApi.remove(projectId),
      }}
      resource={useProcurementPlan(projectId)}
      toInput={procurementPlanDtoToInput}
      blank={blankProcurementPlan}
      labels={{
        edit: 'Éditer le plan',
        create: '+ Rédiger le plan des approvisionnements',
        loading: 'Chargement du plan de gestion des approvisionnements…',
        emptyTitle: "Le plan de gestion des approvisionnements n'a pas encore été rédigé",
        emptyText:
          "Planifiez les activités d'achat, leur intégration au projet, les rôles, les indicateurs de performance des fournisseurs et les fournisseurs présélectionnés.",
      }}
      renderView={(plan) => <ProcurementPlanView plan={plan} projectName={projectName} onNavigate={onNavigate} />}
      renderEditor={(props) => <ProcurementPlanEditor projectId={projectId} {...props} />}
    />
  );
}
