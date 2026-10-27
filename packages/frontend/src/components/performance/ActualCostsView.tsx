import type { ActualCostsDto } from '@shared/index';
import { MetricCard } from '@/components/performance/Indicators';
import { EditCell, EditHeader } from '@/components/ui/EditEntry';
import { formatPercent } from '@/lib/cost-format';
import { formatFcfa, formatFcfaMillions, formatShortDate } from '@/lib/format';
import { ACTUAL_COST_NATURE_LABELS } from '@/lib/performance-format';

/** Dépenses réelles : synthèse face au budget estimé, puis le registre daté (la plus récente en tête). */
export function ActualCostsView({ costs, onEdit }: { costs: ActualCostsDto; onEdit?: (code: string) => void }) {
  const { summary } = costs;
  const entries = [...costs.entries].reverse();
  return (
    <>
      <div className="metric-row">
        <MetricCard label="Coût réel cumulé" value={formatFcfaMillions(summary.total)} hint={`${costs.entries.length} dépense(s)`} />
        <MetricCard
          label="Budget consommé"
          value={summary.consumedPct === null ? '—' : formatPercent(summary.consumedPct)}
          hint={summary.budget === null ? 'Sans estimation des coûts' : `sur ${formatFcfaMillions(summary.budget)} de coûts directs`}
        />
        <MetricCard label="Main-d'œuvre" value={formatFcfaMillions(summary.labor)} />
        <MetricCard label="Coûts physiques" value={formatFcfaMillions(summary.physical)} />
      </div>
      <section className="doc-panel">
        {entries.length === 0 ? (
          <p className="plan__empty">Aucune dépense enregistrée.</p>
        ) : (
          <div className="wbs-scroll">
            <table className="register-table register-table--costs">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Date</th>
                  <th>Élément de la WBS</th>
                  <th>Nature</th>
                  <th>Dépense</th>
                  <th className="num">Montant</th>
                  {onEdit && <EditHeader />}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.code}>
                    <td className="register-table__code">{entry.code}</td>
                    <td className="register-table__muted-cell">{formatShortDate(entry.date)}</td>
                    <td>
                      <span className="register-table__code">{entry.wbsCode}</span> {costs.wbsNames[entry.wbsCode] ?? ''}
                    </td>
                    <td className="register-table__muted-cell">{ACTUAL_COST_NATURE_LABELS[entry.nature]}</td>
                    <td className="register-table__title">
                      {entry.description}
                      {(entry.supplier || entry.reference) && (
                        <span className="register-table__description">
                          {[entry.supplier, entry.reference].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </td>
                    <td className="num">{formatFcfa(entry.amount)}</td>
                    {onEdit && <EditCell label={entry.code} onEdit={() => onEdit(entry.code)} />}
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
