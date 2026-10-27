import { BurndownChart, BurnupChart, VelocityChart } from '@/components/agile/AgileCharts';
import { useProductBacklog } from '@/hooks/useProjectDocuments';
import type { AppView } from '@/navigation/pmp';

const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

interface AgileMetricsFeatureProps {
  projectId: string;
  onNavigate: (view: AppView) => void;
}

/** Page « Vélocité et burndown » : rythme de l'équipe, reste à faire et prévision d'achèvement. */
export function AgileMetricsFeature({ projectId, onNavigate }: AgileMetricsFeatureProps) {
  const { data, loading, error } = useProductBacklog(projectId);
  const metrics = data?.metrics;
  const current = data?.iterations.find((iteration) => iteration.code === metrics?.currentIteration);

  return (
    <>
      {loading && <p className="app__status">Chargement des indicateurs…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && metrics && (
        <article className="doc-page">
          <div className="summary-tiles">
            <div className="summary-tile">
              <span className="summary-tile__value">{metrics.averageVelocity === null ? '—' : NUMBER.format(metrics.averageVelocity)}</span>
              <span className="summary-tile__label">Vélocité moyenne (points par itération)</span>
            </div>
            <div className="summary-tile">
              <span className="summary-tile__value">{metrics.remainingPoints}</span>
              <span className="summary-tile__label">Points restants sur {metrics.totalPoints}</span>
            </div>
            <div className="summary-tile">
              <span className="summary-tile__value">{metrics.forecastIterations ?? '—'}</span>
              <span className="summary-tile__label">Itérations encore nécessaires au rythme moyen</span>
            </div>
            <div className={`summary-tile${metrics.unestimated > 0 ? ' summary-tile--warning' : ''}`}>
              <span className="summary-tile__value">{metrics.unestimated}</span>
              <span className="summary-tile__label">Éléments non estimés (hors prévision)</span>
            </div>
          </div>

          <section className="doc-panel">
            <div className="doc-panel-head">
              <h2 className="plan__section-title">
                Burndown {current ? `· ${current.name}` : ''}
              </h2>
            </div>
            {current ? (
              <BurndownChart points={current.burndown} />
            ) : (
              <p className="plan__empty">Aucune itération en cours.</p>
            )}
            <button type="button" className="ref-link" onClick={() => onNavigate('iterations')}>
              Itérations →
            </button>
          </section>

          <section className="doc-panel">
            <div className="doc-panel-head">
              <h2 className="plan__section-title">Vélocité</h2>
            </div>
            <VelocityChart velocity={metrics.velocity} average={metrics.averageVelocity} />
          </section>
          <section className="doc-panel">
            <div className="doc-panel-head">
              <h2 className="plan__section-title">Burnup du carnet</h2>
            </div>
            <BurnupChart points={metrics.burnup} />
          </section>
        </article>
      )}
    </>
  );
}
