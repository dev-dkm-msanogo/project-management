import type { CostStatusDto } from '@shared/contracts/executive-status-report';
import { Donut } from '@/components/ui/Donut';
import { SectionCard } from '@/components/ui/SectionCard';
import { formatMillions } from '@/lib/format';
import { formatIndex } from '@/lib/performance-format';

const SPENT_COLOR = 'var(--rag-green)';
const COMMITTED_COLOR = 'var(--rag-grey)';
const REMAINING_COLOR = 'var(--track)';

/** Section 6 — Statut coût / budget : donut (dépensé / engagé / reste) + tableau. */
export function CostStatusCard({ cost }: { cost: CostStatusDto }) {
  const segments = [
    { value: cost.spentPct, color: SPENT_COLOR },
    { value: cost.committedPct, color: COMMITTED_COLOR },
    { value: cost.remainingPct, color: 'transparent' },
  ];

  return (
    <SectionCard number={6} title="Statut coût / budget" className="col-4" source={`${cost.budgetLabel ?? 'Aucun budget'} · dépenses réelles · valeur acquise`}>
      {cost.budgetLabel === null ? (
        <p className="plan__empty">Ni charte avec budget, ni estimations des coûts : rien à comparer.</p>
      ) : (
      <div className="cost">
        <Donut
          segments={segments}
          centerPrimary={`${cost.headlinePercentage}%`}
          centerSecondary={cost.headlineLabel}
        />
        <table className="cost-table">
          <tbody>
            <tr>
              <td>
                <span className="dot" style={{ background: SPENT_COLOR }} />
                Dépensé
              </td>
              <td>{formatMillions(cost.spent)}</td>
              <td>({cost.spentPct}%)</td>
            </tr>
            {cost.committed.amount > 0 && (
            <tr>
              <td>
                <span className="dot" style={{ background: COMMITTED_COLOR }} />
                Engagé
              </td>
              <td>{formatMillions(cost.committed)}</td>
              <td>({cost.committedPct}%)</td>
            </tr>
            )}
            <tr>
              <td>
                <span className="dot" style={{ background: REMAINING_COLOR }} />
                Reste
              </td>
              <td>{formatMillions(cost.remaining)}</td>
              <td>({cost.remainingPct}%)</td>
            </tr>
            <tr className="cost-table__total">
              <td>{cost.budgetLabel}</td>
              <td>{formatMillions(cost.budget)}</td>
              <td />
            </tr>
          </tbody>
        </table>
        {cost.eac && (
          <p className="cost__forecast">
            CPI {formatIndex(cost.cpi)} · estimation à l'achèvement des lots de travaux (hors réserves) : {formatMillions(cost.eac)}
          </p>
        )}
      </div>
      )}
    </SectionCard>
  );
}
