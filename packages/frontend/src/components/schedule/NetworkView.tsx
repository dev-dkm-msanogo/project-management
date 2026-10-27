import type { ScheduleModelDto } from '@shared/index';
import { NetworkDiagram } from '@/components/schedule/NetworkDiagram';
import { formatShortDate } from '@/lib/format';

/** Réseau du projet : diagramme, chemin critique et dates au plus tôt / au plus tard. */
export function NetworkView({ model }: { model: ScheduleModelDto }) {
  const { network } = model;
  const names = new Map(model.activities.map((activity) => [activity.code, activity]));

  if (model.activities.length === 0) {
    return (
      <section className="doc-panel">
        <p className="plan__empty">Aucune activité : définissez les activités et leurs prédécesseurs pour tracer le réseau.</p>
      </section>
    );
  }

  return (
    <>
      <section className="doc-panel">
        <div className="doc-panel-head">
          <h2 className="plan__section-title">Diagramme du réseau</h2>
          <span className="network-legend">
            <span className="network-legend__item network-legend__item--critical">Chemin critique</span>
            <span className="network-legend__item">Activité avec marge</span>
          </span>
        </div>
        <NetworkDiagram model={model} />
        <p className="network-path">
          <strong>Chemin critique :</strong> {network.criticalPath.join(' → ')}
        </p>
      </section>

      <section className="doc-panel">
        <h2 className="plan__section-title">Dates au plus tôt et au plus tard</h2>
        <div className="wbs-scroll">
          <table className="register-table register-table--network">
            <thead>
              <tr>
                <th>Code</th>
                <th>Activité</th>
                <th className="num">Durée</th>
                <th>Début au plus tôt</th>
                <th>Fin au plus tôt</th>
                <th>Début au plus tard</th>
                <th>Fin au plus tard</th>
                <th className="num">Marge totale</th>
              </tr>
            </thead>
            <tbody>
              {network.activities.map((item) => (
                <tr key={item.code} className={item.critical ? 'schedule-row--critical' : undefined}>
                  <td className="register-table__code">{item.code}</td>
                  <td>{names.get(item.code)!.name}</td>
                  <td className="num">{names.get(item.code)!.durationDays} j</td>
                  <td>{formatShortDate(item.earlyStart)}</td>
                  <td>{formatShortDate(item.earlyFinish)}</td>
                  <td className="register-table__muted-cell">{formatShortDate(item.lateStart)}</td>
                  <td className="register-table__muted-cell">{formatShortDate(item.lateFinish)}</td>
                  <td className="num">
                    {item.critical ? <span className="status-badge status-badge--red">Critique</span> : `${item.totalFloat} j`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
