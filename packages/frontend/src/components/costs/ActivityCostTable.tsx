import type { CostActivityInput } from '@shared/index';
import { PersonName } from '@/components/people/People';
import { activityDirect, CONFIDENCE_LABELS, CONFIDENCE_MODIFIERS, METHOD_LABELS } from '@/lib/cost-format';
import { formatMillionsValue } from '@/lib/format';

const byWbsThenCode = (a: CostActivityInput, b: CostActivityInput): number =>
  a.wbsCode.localeCompare(b.wbsCode, 'fr', { numeric: true }) || a.code.localeCompare(b.code);

/** Estimations des coûts par activité (template « Activity Cost Estimates »), en M FCFA. */
export function ActivityCostTable({ activities }: { activities: readonly CostActivityInput[] }) {
  const rows = [...activities].sort(byWbsThenCode);
  const total = (pick: (activity: CostActivityInput) => number) =>
    activities.reduce((sum, activity) => sum + pick(activity), 0);

  return (
    <>
      <p className="table-unit">Montants en millions de FCFA</p>
      <div className="wbs-scroll">
        <table className="register-table register-table--costs">
          <thead>
            <tr>
              <th>WBS</th>
              <th>ID</th>
              <th>Activité</th>
              <th>Ressource</th>
              <th className="num">Main-d'œuvre</th>
              <th className="num">Coûts physiques</th>
              <th className="num">Total</th>
              <th>Méthode</th>
              <th>Fourchette</th>
              <th>Confiance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((activity) => (
              <tr key={activity.code}>
                <td className="register-table__muted-cell">{activity.wbsCode || '—'}</td>
                <td className="register-table__code">{activity.code}</td>
                <td className="register-table__title">{activity.name}</td>
                <td>
                  <PersonName id={activity.resourceId} />
                </td>
                <td className="num">{formatMillionsValue(activity.laborCost)}</td>
                <td className="num">
                  {activity.physicalCost > 0 ? formatMillionsValue(activity.physicalCost) : '—'}
                  {activity.physicalCostNote && <span className="register-table__muted">{activity.physicalCostNote}</span>}
                </td>
                <td className="num cost-total">{formatMillionsValue(activityDirect(activity))}</td>
                <td className="register-table__muted-cell">{METHOD_LABELS[activity.method]}</td>
                <td className="register-table__muted-cell">±{activity.rangePct} %</td>
                <td>
                  <span className={`status-badge status-badge--${CONFIDENCE_MODIFIERS[activity.confidence]}`}>
                    {CONFIDENCE_LABELS[activity.confidence]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={4} scope="row">
                Sous-total
              </th>
              <td className="num">{formatMillionsValue(total((activity) => activity.laborCost))}</td>
              <td className="num">{formatMillionsValue(total((activity) => activity.physicalCost))}</td>
              <td className="num">{formatMillionsValue(total(activityDirect))}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
