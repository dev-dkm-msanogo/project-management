import { costEstimatesApi } from '@/api/project-documents';
import { CostEstimatesEditor } from '@/components/costs/editor/CostEstimatesEditor';
import { CostEstimatesView } from '@/components/costs/CostEstimatesView';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useCostEstimates } from '@/hooks/useProjectDocuments';
import { blankCostEstimates, costEstimatesDtoToInput } from '@/lib/cost-format';
import type { AppView } from '@/navigation/pmp';

interface CostEstimatesFeatureProps {
  projectId: string;
  projectName: string;
  onNavigate: (view: AppView) => void;
}

/** Page « Estimations des coûts » : activités, base des estimations, réserves et financement. */
export function CostEstimatesFeature({ projectId, projectName, onNavigate }: CostEstimatesFeatureProps) {
  return (
    <DocumentFeature
      projectId={projectId}
      history={costEstimatesApi}
      approval={{ subject: 'PROJECT_MANAGEMENT_PLAN', segment: 'cost-estimates', component: true }}
      deletion={{
        title: 'Supprimer les estimations des coûts ?',
        message: "Les estimations et leur base seront supprimées définitivement, pour tous les utilisateurs du projet. La référence des coûts et les besoins de financement, calculés à partir d'elles, redeviendront vides.",
        run: () => costEstimatesApi.remove(projectId),
      }}
      resource={useCostEstimates(projectId)}
      toInput={costEstimatesDtoToInput}
      blank={blankCostEstimates}
      labels={{
        edit: 'Éditer les estimations',
        create: '+ Estimer les coûts',
        loading: 'Chargement des estimations des coûts…',
        emptyTitle: "Les coûts du projet n'ont pas encore été estimés",
        emptyText:
          "Estimez chaque activité (main-d'œuvre, coûts physiques, méthode, fiabilité) et les réserves : la référence des coûts en découle, répartie selon l'échéancier.",
      }}
      renderView={(estimates) => (
        <CostEstimatesView estimates={estimates} projectName={projectName} onNavigate={onNavigate} />
      )}
      renderEditor={(props) => <CostEstimatesEditor projectId={projectId} {...props} />}
    />
  );
}
