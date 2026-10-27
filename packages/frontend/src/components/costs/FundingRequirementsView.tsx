import type { FundingRequirementsDto } from '@shared/index';
import { FundingChart } from '@/components/costs/FundingChart';
import { formatFcfaMillions, formatMillionsValue, formatShortDate } from '@/lib/format';
import type { AppView } from '@/navigation/pmp';

interface FundingRequirementsViewProps {
  requirements: FundingRequirementsDto;
  onNavigate: (view: AppView) => void;
}

/** Besoins de financement : tranches face à la dépense prévue, réserve de management, total requis. */
export function FundingRequirementsView({ requirements, onNavigate }: FundingRequirementsViewProps) {
  const { rows, shortfalls } = requirements;
  const gap = requirements.tranchesTotal - requirements.costBaseline;

  return (
    <>
      {shortfalls.length > 0 && (
        <section className="doc-panel cost-unscheduled" role="alert">
          <h2 className="plan__section-title">Fonds insuffisants : {shortfalls.join(', ')}</h2>
          <p className="doc-text">
            La dépense prévue dépasse les fonds disponibles avant le déblocage suivant. Avancez ou augmentez une tranche
            dans la stratégie de financement.
          </p>
        </section>
      )}

      <section className="doc-panel">
        <div className="doc-heading">
          <h2 className="plan__section-title">Fonds disponibles et dépense prévue</h2>
          <span className="doc-sync">Calculés depuis la stratégie de financement et la référence des coûts</span>
        </div>
        <FundingChart requirements={requirements} />
      </section>

      <section className="doc-panel">
        <h2 className="plan__section-title">Tranches</h2>
        <div className="wbs-scroll">
          <p className="table-unit">Montants en millions de FCFA</p>
          <table className="register-table register-table--funding">
            <thead>
              <tr>
                <th>Tranche</th>
                <th>Débloquée le</th>
                <th className="num">Montant</th>
                <th className="num">Cumul financé</th>
                <th className="num">Dépense cumulée prévue</th>
                <th className="num">Excédent</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name}>
                  <td className="register-table__title">{row.name}</td>
                  <td className="register-table__muted-cell">{formatShortDate(row.releaseOn)}</td>
                  <td className="num">{formatMillionsValue(row.amount)}</td>
                  <td className="num">{formatMillionsValue(row.cumulativeFunded)}</td>
                  <td className="num">{formatMillionsValue(row.cumulativeSpend)}</td>
                  <td className={`num${row.surplus < 0 ? ' financial-table__negative' : ''}`}>{formatMillionsValue(row.surplus)}</td>
                </tr>
              ))}
              <tr className="funding-reserve">
                <td className="register-table__title">Réserve de management</td>
                <td className="register-table__muted-cell">Sur demande au sponsor</td>
                <td className="num">{formatMillionsValue(requirements.managementReserve)}</td>
                <td className="num">{formatMillionsValue(requirements.tranchesTotal + requirements.managementReserve)}</td>
                <td className="num">—</td>
                <td className="num">—</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Financement total requis (référence des coûts + réserve de management)</td>
                <td className="num">{formatMillionsValue(requirements.totalRequired)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="doc-text funding-note">
          {gap === 0
            ? `Les tranches couvrent exactement la référence des coûts (${formatFcfaMillions(requirements.costBaseline)}).`
            : gap > 0
              ? `Les tranches dépassent la référence des coûts de ${formatFcfaMillions(gap)}.`
              : `Il manque ${formatFcfaMillions(-gap)} aux tranches pour couvrir la référence des coûts (${formatFcfaMillions(requirements.costBaseline)}).`}{' '}
          <button type="button" className="ref-link" onClick={() => onNavigate('funding-strategy')}>
            Stratégie de financement →
          </button>{' '}
          <button type="button" className="ref-link" onClick={() => onNavigate('cost-baseline')}>
            Référence des coûts →
          </button>
        </p>
      </section>
    </>
  );
}
