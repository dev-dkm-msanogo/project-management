import { procurementStrategyApi } from '@/api/project-documents';
import { ProcurementStrategyEditor } from '@/components/procurement/ProcurementStrategyEditor';
import { ProcurementStrategyView } from '@/components/procurement/ProcurementStrategyView';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useProcurementStrategy } from '@/hooks/useProjectDocuments';
import { blankProcurementStrategy, procurementStrategyDtoToInput } from '@/lib/procurement-format';

/** Page « Stratégie d'approvisionnement » : livraison, faire ou acheter, types de contrat, cycle d'achat. */
export function ProcurementStrategyFeature({ projectId, projectName }: { projectId: string; projectName: string }) {
  return (
    <DocumentFeature
      projectId={projectId}
      history={procurementStrategyApi}
      approval={{ subject: 'PROJECT_MANAGEMENT_PLAN', segment: 'procurement-strategy', component: true }}
      deletion={{
        title: "Supprimer la stratégie d'approvisionnement ?",
        run: () => procurementStrategyApi.remove(projectId),
      }}
      resource={useProcurementStrategy(projectId)}
      toInput={procurementStrategyDtoToInput}
      blank={blankProcurementStrategy}
      labels={{
        edit: 'Éditer la stratégie',
        create: "+ Rédiger la stratégie d'approvisionnement",
        loading: "Chargement de la stratégie d'approvisionnement…",
        emptyTitle: "La stratégie d'approvisionnement n'a pas encore été rédigée",
        emptyText:
          "Décidez ce que le projet fait lui-même ou achète, la méthode de livraison, les types de contrat et les phases du cycle d'achat.",
      }}
      renderView={(strategy) => <ProcurementStrategyView strategy={strategy} projectName={projectName} />}
      renderEditor={(props) => <ProcurementStrategyEditor projectId={projectId} {...props} />}
    />
  );
}
