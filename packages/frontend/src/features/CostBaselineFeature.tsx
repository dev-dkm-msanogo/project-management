import { CostBaselineView } from '@/components/costs/CostBaselineView';
import { useCostBaseline } from '@/hooks/useProjectDocuments';
import type { AppView } from '@/navigation/pmp';

interface CostBaselineFeatureProps {
  projectId: string;
  projectName: string;
  onNavigate: (view: AppView) => void;
}

/**
 * Page « Référence des coûts » : lecture seule, calculée par le serveur à partir des
 * estimations des coûts et de l'échéancier (aucune saisie propre).
 */
export function CostBaselineFeature({ projectId, projectName, onNavigate }: CostBaselineFeatureProps) {
  const { data, loading, error } = useCostBaseline(projectId);
  const missing = !loading && !error && data === null;

  return (
    <>
      {loading && <p className="app__status">Chargement de la référence des coûts…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {missing && (
        <div className="doc-page">
          <section className="doc-panel empty-state">
            <h2 className="empty-state__title">Pas encore de référence des coûts</h2>
            <p className="empty-state__text">
              Elle se calcule à partir des estimations des coûts, réparties dans le temps selon l'échéancier.
            </p>
            <button type="button" className="btn btn--primary" onClick={() => onNavigate('cost-estimates')}>
              Estimer les coûts →
            </button>
          </section>
        </div>
      )}
      {data && <CostBaselineView baseline={data} projectName={projectName} onNavigate={onNavigate} />}
    </>
  );
}
