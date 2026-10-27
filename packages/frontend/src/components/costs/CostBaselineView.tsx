import type { CostBaselineDto } from '@shared/index';
import { CostSummary } from '@/components/costs/CostSummary';
import { SCurveChart } from '@/components/costs/SCurveChart';
import { formatPercent, formatPeriod } from '@/lib/cost-format';
import { formatFcfaMillions, formatMillionsValue } from '@/lib/format';
import type { AppView } from '@/navigation/pmp';

interface CostBaselineViewProps {
  baseline: CostBaselineDto;
  projectName: string;
  onNavigate: (view: AppView) => void;
}

/** Référence des coûts (template « Cost Baseline ») : courbe en S, tableau mensuel, cascade. */
export function CostBaselineView({ baseline, projectName, onNavigate }: CostBaselineViewProps) {
  const { periods, unscheduled, summary } = baseline;
  const unscheduledTotal = unscheduled.reduce((total, item) => total + item.amount, 0);
  const share = (amount: number) => (summary.direct === 0 ? '—' : formatPercent((amount / summary.direct) * 100));

  return (
    <article className="doc-page">
      <section className="doc-panel">
        <div className="doc-heading">
          <h2 className="doc-title">{projectName}</h2>
          <span className="doc-sync">Calculée depuis les estimations et l'échéancier</span>
        </div>
        {periods.length > 0 ? (
          <SCurveChart periods={periods} bac={summary.costBaseline} />
        ) : (
          <p className="plan__empty">
            Aucune activité estimée n'est rattachée à une tâche datée de l'échéancier : la courbe ne peut pas être
            tracée.
          </p>
        )}
      </section>

      {unscheduled.length > 0 && (
        <section className="doc-panel cost-unscheduled" role="alert">
          <h2 className="plan__section-title">
            Non réparti dans le temps : {formatFcfaMillions(unscheduledTotal)} ({unscheduled.length} activité
            {unscheduled.length > 1 ? 's' : ''})
          </h2>
          <p className="doc-text">
            Leur code WBS ne correspond à aucune tâche datée de l'échéancier (ni à l'un de ses ancêtres). Corrigez le
            code dans les estimations ou datez la tâche dans la structure WBS.
          </p>
          <ul className="doc-refs">
            {unscheduled.map((item) => (
              <li key={item.code}>
                <strong>{item.code}</strong>
                {item.name}
                <span>
                  {item.wbsCode ? `WBS ${item.wbsCode}` : 'sans code WBS'} · {formatFcfaMillions(item.amount)}
                </span>
              </li>
            ))}
          </ul>
          <div className="cost-unscheduled__links">
            <button type="button" className="ref-link" onClick={() => onNavigate('cost-estimates')}>
              Estimations des coûts →
            </button>
            <button type="button" className="ref-link" onClick={() => onNavigate('wbs')}>
              Structure (WBS) →
            </button>
          </div>
        </section>
      )}

      <div className="doc-columns">
        <section className="doc-panel">
          <h2 className="plan__section-title">Répartition mensuelle (M FCFA)</h2>
          <div className="wbs-scroll">
            <table className="register-table register-table--periods">
              <thead>
                <tr>
                  <th>Période</th>
                  <th className="num">Coût de la période</th>
                  <th className="num">Cumul</th>
                  <th className="num">% des coûts directs</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((period) => (
                  <tr key={period.period}>
                    <td>{formatPeriod(period.period)}</td>
                    <td className="num">{formatMillionsValue(period.plannedValue)}</td>
                    <td className="num">{formatMillionsValue(period.cumulative)}</td>
                    <td className="num">{formatPercent(period.percentOfDirect)}</td>
                  </tr>
                ))}
                {unscheduledTotal > 0 && (
                  <tr className="register-row--flagged">
                    <td>Non réparti</td>
                    <td className="num">{formatMillionsValue(unscheduledTotal)}</td>
                    <td className="num">—</td>
                    <td className="num">{share(unscheduledTotal)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Coûts directs</th>
                  <td className="num">{formatMillionsValue(summary.direct)}</td>
                  <td />
                  <td className="num">{summary.direct > 0 ? formatPercent(100) : '—'}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
        <section className="doc-panel">
          <h2 className="plan__section-title">Référence et financement</h2>
          <CostSummary summary={summary} charterBudget={baseline.charterBudget} />
        </section>
      </div>
    </article>
  );
}
