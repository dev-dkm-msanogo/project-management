import { FundingRequirementsView } from '@/components/costs/FundingRequirementsView';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { useFundingRequirements } from '@/hooks/useProjectDocuments';
import type { AppView } from '@/navigation/pmp';

interface FundingRequirementsFeatureProps {
  projectId: string;
  onNavigate: (view: AppView) => void;
}

const millions = (amount: number) => Math.round(amount / 1_000_000);

/**
 * Page « Besoins de financement » : lecture seule, calculée par le serveur à partir de la
 * stratégie de financement et de la référence des coûts (aucune saisie propre).
 */
export function FundingRequirementsFeature({ projectId, onNavigate }: FundingRequirementsFeatureProps) {
  const { data, loading, error } = useFundingRequirements(projectId);
  const missing = !loading && !error && data === null;

  return (
    <>
      {loading && <p className="app__status">Chargement des besoins de financement…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {missing && (
        <div className="doc-page">
          <section className="doc-panel empty-state">
            <h2 className="empty-state__title">Pas encore de besoins de financement</h2>
            <p className="empty-state__text">
              Ils se calculent à partir des tranches de la stratégie de financement et de la référence des coûts.
            </p>
            <div className="empty-state__actions">
              <button type="button" className="btn btn--primary" onClick={() => onNavigate('funding-strategy')}>
                Stratégie de financement →
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => onNavigate('cost-estimates')}>
                Estimations des coûts →
              </button>
            </div>
          </section>
        </div>
      )}
      {data && (
        <article className="doc-page">
          <SummaryTiles
            tiles={[
              { label: 'Financement total requis (M FCFA)', value: millions(data.totalRequired) },
              { label: 'Référence des coûts (M FCFA)', value: millions(data.costBaseline) },
              { label: 'Tranches (M FCFA)', value: millions(data.tranchesTotal) },
              { label: 'Tranches insuffisantes', value: data.shortfalls.length, tone: 'danger' },
            ]}
          />
          <FundingRequirementsView requirements={data} onNavigate={onNavigate} />
        </article>
      )}
    </>
  );
}
