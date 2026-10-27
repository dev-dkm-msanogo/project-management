import { Fragment } from 'react';
import type { QualityReportDto } from '@shared/index';
import { formatLongDate, formatShortDate } from '@/lib/format';
import { METRIC_STATUS_LABELS, METRIC_STATUS_MODIFIERS, SEVERITY_LABELS } from '@/lib/quality-tools-format';
import type { AppView } from '@/navigation/pmp';

interface QualityReportViewProps {
  report: QualityReportDto;
  onNavigate: (view: AppView) => void;
}

/** Rapport qualité : statut des métriques, synthèse des anomalies, recommandations et constats d'audit. */
export function QualityReportView({ report, onNavigate }: QualityReportViewProps) {
  const { defects, audit } = report;
  const open = defects.logged - defects.resolved;
  const maxOpen = Math.max(1, ...defects.openBySeverity);

  return (
    <>
      <p className="doc-status">
        Période du {formatLongDate(report.periodStart)} au {formatLongDate(report.periodEnd)}, établi le{' '}
        {formatLongDate(report.preparedOn)}.
        {report.unreported.length > 0 && ` Sans statut : ${report.unreported.join(', ')}.`}{' '}
        <button type="button" className="ref-link" onClick={() => onNavigate('quality-metrics')}>
          Métriques qualité →
        </button>
      </p>

      <section className="doc-panel">
        <h2 className="plan__section-title">Statut des métriques</h2>
        {report.statuses.length === 0 ? (
          <p className="plan__empty">Aucune métrique renseignée.</p>
        ) : (
          <div className="wbs-scroll">
            <table className="register-table register-table--metric-status">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Métrique</th>
                  <th>Cible</th>
                  <th>Mesure actuelle</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {report.statuses.map((entry) => (
                  <tr key={entry.metricCode}>
                    <td className="register-table__code">{entry.metricCode}</td>
                    <td>
                      <strong className="quality-item">{entry.item}</strong>
                    </td>
                    <td className="quality-target">{entry.target || '—'}</td>
                    <td className="register-table__response">{entry.measurement || '—'}</td>
                    <td>
                      <span className={`status-badge status-badge--${METRIC_STATUS_MODIFIERS[entry.status]}`}>
                        {METRIC_STATUS_LABELS[entry.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="doc-columns">
        <section className="doc-panel">
          <h2 className="plan__section-title">Anomalies (cumul)</h2>
          <dl className="doc-facts">
            <div>
              <dt>Enregistrées</dt>
              <dd>{defects.logged}</dd>
            </div>
            <div>
              <dt>Résolues</dt>
              <dd>{defects.resolved}</dd>
            </div>
            <div>
              <dt>Ouvertes</dt>
              <dd>{open}</dd>
            </div>
          </dl>
          <ul className="severity-bars" aria-label="Anomalies ouvertes par sévérité">
            {defects.openBySeverity.map((value, index) => (
              <li key={SEVERITY_LABELS[index]} className={`severity-bars__row severity-bars__row--${index + 1}`}>
                <span className="severity-bars__label">{SEVERITY_LABELS[index]}</span>
                <span className="severity-bars__track">
                  <span className="severity-bars__fill" style={{ width: `${(value / maxOpen) * 100}%` }} />
                </span>
                <span className="severity-bars__value">{value}</span>
              </li>
            ))}
          </ul>
          {defects.trend && (
            <p className="doc-text">
              <strong>Tendance : </strong>
              {defects.trend}
            </p>
          )}
          {defects.categories && (
            <p className="doc-text">
              <strong>Répartition : </strong>
              {defects.categories}
            </p>
          )}
        </section>

        <section className="doc-panel">
          <h2 className="plan__section-title">
            Audit qualité{audit.name ? ` : ${audit.name}` : ''}
            {audit.heldOn ? ` (${formatShortDate(audit.heldOn)})` : ''}
          </h2>
          {[
            { label: 'Bonnes pratiques', text: audit.goodPractices },
            { label: 'Améliorations', text: audit.improvements },
            { label: 'Non-conformités', text: audit.deficiencies },
          ].map((item) => (
            <Fragment key={item.label}>
              <h3 className="doc-subtitle">{item.label}</h3>
              {item.text ? <p className="doc-text">{item.text}</p> : <p className="plan__empty">Aucun constat.</p>}
            </Fragment>
          ))}
        </section>
      </div>

      <section className="doc-panel">
        <h2 className="plan__section-title">Améliorations et recommandations</h2>
        {report.recommendations.length === 0 ? (
          <p className="plan__empty">Aucune recommandation.</p>
        ) : (
          <ol className="quality-recommendations">
            {report.recommendations.map((item) => (
              <li key={item.subject}>
                <strong>{item.subject} : </strong>
                {item.recommendation}
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
