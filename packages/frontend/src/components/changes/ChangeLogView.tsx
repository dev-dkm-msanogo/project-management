import type { ChangeLogDto } from '@shared/index';
import { DispositionBadge } from '@/components/changes/ChangeRequestView';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { CHANGE_CATEGORY_LABELS, CHANGE_STATUS_LABELS } from '@/lib/change-format';
import { formatFcfaMillions, formatShortDate } from '@/lib/format';

/** Réserve pour aléas et part consommée par les modifications approuvées. */
function Contingency({ contingency }: { contingency: NonNullable<ChangeLogDto['summary']['contingency']> }) {
  const share = contingency.reserve > 0 ? Math.min(100, (contingency.consumed / contingency.reserve) * 100) : 0;
  const exceeded = contingency.remaining < 0;
  return (
    <section className="doc-panel">
      <div className="doc-panel-head">
        <h2 className="plan__section-title">Réserve pour aléas</h2>
        <span className="doc-meta">Issue des estimations des coûts</span>
      </div>
      <div className="contingency-meter" aria-hidden="true">
        <span className={`contingency-meter__bar${exceeded ? ' contingency-meter__bar--over' : ''}`} style={{ width: `${share}%` }} />
      </div>
      <p className="contingency-figures">
        <span>
          Réserve : <strong>{formatFcfaMillions(contingency.reserve)}</strong>
        </span>
        <span>
          Consommée par les modifications approuvées : <strong>{formatFcfaMillions(contingency.consumed)}</strong>
        </span>
        <span className={exceeded ? 'contingency-figures--over' : ''}>
          Restante : <strong>{formatFcfaMillions(contingency.remaining)}</strong>
        </span>
      </p>
    </section>
  );
}

/** Registre des modifications (template « Change Log ») : une ligne par demande, de la soumission à la décision. */
export function ChangeLogView({ log, onOpen }: { log: ChangeLogDto; onOpen: (code: string) => void }) {
  const { summary } = log;

  return (
    <>
      <SummaryTiles
        tiles={[
          { label: 'Demandes', value: summary.total },
          { label: 'En attente de décision', value: summary.pending, tone: 'warning' },
          { label: 'Approuvées', value: summary.approved, tone: 'success' },
          { label: 'Reportées ou rejetées', value: summary.deferred + summary.rejected },
        ]}
      />
      {summary.contingency && <Contingency contingency={summary.contingency} />}

      <section className="doc-panel">
        <div className="doc-panel-head">
          <h2 className="plan__section-title">Demandes de modification</h2>
          {summary.averageDecisionDays !== null && (
            <span className="doc-meta">
              Décision en {new Intl.NumberFormat('fr-FR').format(summary.averageDecisionDays)} jours en moyenne
            </span>
          )}
        </div>
        {log.requests.length === 0 ? (
          <p className="plan__empty">Aucune demande de modification.</p>
        ) : (
          <div className="wbs-scroll">
            <table className="register-table register-table--changes">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Modification demandée</th>
                  <th>Catégories</th>
                  <th>Demandeur</th>
                  <th>Soumise le</th>
                  <th>Statut</th>
                  <th>Décision</th>
                  <th>Décidée le</th>
                </tr>
              </thead>
              <tbody>
                {log.requests.map((request) => (
                  <tr key={request.code}>
                    <td>
                      <button type="button" className="change-link" onClick={() => onOpen(request.code)}>
                        {request.code}
                      </button>
                    </td>
                    <td className="register-table__title">
                      <button type="button" className="change-link change-link--title" onClick={() => onOpen(request.code)}>
                        {request.title}
                      </button>
                    </td>
                    <td className="register-table__muted-cell">
                      {request.categories.map((category) => CHANGE_CATEGORY_LABELS[category]).join(', ')}
                    </td>
                    <td>{request.requestor}</td>
                    <td className="register-table__muted-cell">{formatShortDate(request.submittedOn)}</td>
                    <td>{CHANGE_STATUS_LABELS[request.status]}</td>
                    <td>
                      <DispositionBadge request={request} />
                    </td>
                    <td className="register-table__muted-cell">{formatShortDate(request.decidedOn)}</td>
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
