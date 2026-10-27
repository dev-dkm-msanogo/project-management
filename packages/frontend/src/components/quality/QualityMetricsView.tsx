import type { QualityMetricsDto } from '@shared/index';
import { formatLongDate } from '@/lib/format';

/** Métriques qualité : élément mesuré, métrique, méthode de mesure et cible. */
export function QualityMetricsView({ metrics }: { metrics: QualityMetricsDto }) {
  return (
    <>
      <p className="doc-status">Établies le {formatLongDate(metrics.preparedOn)}.</p>
      <section className="doc-panel">
        {metrics.metrics.length === 0 ? (
          <p className="plan__empty">Aucune métrique définie.</p>
        ) : (
          <div className="wbs-scroll">
            <table className="register-table register-table--metrics">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Élément</th>
                  <th>Métrique</th>
                  <th>Méthode de mesure</th>
                  <th>Cible</th>
                </tr>
              </thead>
              <tbody>
                {metrics.metrics.map((metric) => (
                  <tr key={metric.code}>
                    <td className="register-table__code">{metric.code}</td>
                    <td>
                      <strong className="quality-item">{metric.item}</strong>
                    </td>
                    <td className="register-table__response">{metric.metric}</td>
                    <td className="register-table__response register-table__muted-cell">{metric.method}</td>
                    <td className="quality-target">{metric.target || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
