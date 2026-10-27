import { fundingStrategyApi } from '@/api/project-documents';
import { FundingStrategyEditor } from '@/components/costs/FundingStrategyEditor';
import { FundingStrategyView } from '@/components/costs/FundingStrategyView';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useFundingStrategy } from '@/hooks/useProjectDocuments';
import { blankFundingStrategy, fundingStrategyDtoToInput } from '@/lib/funding-format';
import type { AppView } from '@/navigation/pmp';

interface FundingStrategyFeatureProps {
  projectId: string;
  onNavigate: (view: AppView) => void;
}

const millions = (amount: number) => Math.round(amount / 1_000_000);

/** Page « Stratégie de financement » : d'où viennent les fonds, quand et à quelles conditions. */
export function FundingStrategyFeature({ projectId, onNavigate }: FundingStrategyFeatureProps) {
  const resource = useFundingStrategy(projectId);
  return (
    <DocumentFeature
      projectId={projectId}
      history={fundingStrategyApi}
      approval={{ subject: 'PROJECT_MANAGEMENT_PLAN', segment: 'funding-strategy', component: true }}
      deletion={{
        title: 'Supprimer la stratégie de financement ?',
        message: "La stratégie et ses tranches seront supprimées définitivement, pour tous les utilisateurs du projet. Les besoins de financement, calculés à partir d'elle, redeviendront vides.",
        run: () => fundingStrategyApi.remove(projectId),
      }}
      resource={resource}
      toInput={fundingStrategyDtoToInput}
      blank={blankFundingStrategy}
      labels={{
        edit: 'Éditer la stratégie',
        create: '+ Rédiger la stratégie de financement',
        loading: 'Chargement de la stratégie de financement…',
        emptyTitle: "La stratégie de financement n'a pas encore été rédigée",
        emptyText: "Source des fonds, tranches et conditions de déblocage, répartition par catégorie de coûts et risques de financement.",
      }}
      renderView={(strategy) => (
        <article className="doc-page">
          <SummaryTiles
            tiles={[
              { label: 'Budget approuvé (M FCFA)', value: millions(strategy.charterBudget ?? 0) },
              { label: 'Tranches (M FCFA)', value: millions(strategy.tranchesTotal) },
              { label: 'Tranches', value: strategy.tranches.length },
              { label: 'Risques de financement', value: strategy.risks.length, tone: 'warning' },
            ]}
          />
          <FundingStrategyView strategy={strategy} onNavigate={onNavigate} />
        </article>
      )}
      renderEditor={(props) => (
        <FundingStrategyEditor projectId={projectId} charterBudget={resource.data?.charterBudget ?? null} {...props} />
      )}
    />
  );
}
