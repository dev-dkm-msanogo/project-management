import type { FundingStrategyDto } from '@shared/index';
import { TextSections } from '@/components/ui/TextSections';
import { formatPercent } from '@/lib/cost-format';
import { formatFcfaMillions, formatLongDate, formatMillionsValue, formatShortDate } from '@/lib/format';
import { shareOf } from '@/lib/funding-format';
import type { AppView } from '@/navigation/pmp';

interface FundingStrategyViewProps {
  strategy: FundingStrategyDto;
  onNavigate: (view: AppView) => void;
}

/** Stratégie de financement : source, budget approuvé, tranches, déblocage, catégories, risques. */
export function FundingStrategyView({ strategy, onNavigate }: FundingStrategyViewProps) {
  const budget = strategy.charterBudget;
  const over = budget !== null && strategy.tranchesTotal > budget;

  return (
    <>
      <p className={`doc-status${over ? '' : ' doc-status--done'}`}>
        Préparée le {formatLongDate(strategy.preparedOn)}.{' '}
        {budget === null
          ? 'Budget approuvé : à fixer dans la charte.'
          : over
            ? `Les tranches (${formatFcfaMillions(strategy.tranchesTotal)}) dépassent le budget approuvé de la charte (${formatFcfaMillions(budget)}).`
            : `Les tranches couvrent ${formatPercent(shareOf(strategy.tranchesTotal, budget))} du budget approuvé de la charte.`}{' '}
        <button type="button" className="ref-link" onClick={() => onNavigate('funding-requirements')}>
          Besoins de financement →
        </button>
      </p>

      <section className="doc-panel">
        <TextSections
          sections={[
            { key: 'source', label: 'Source des fonds et autorité', text: strategy.source },
            {
              key: 'approved',
              label: `Financement approuvé${budget === null ? '' : ` : ${formatFcfaMillions(budget)}`}`,
              text: strategy.approvedFundingNote,
            },
          ]}
        />
      </section>

      <section className="doc-panel">
        <h2 className="plan__section-title">Tranches de financement ({strategy.tranches.length})</h2>
        {strategy.tranches.length === 0 ? (
          <p className="plan__empty">Aucune tranche définie.</p>
        ) : (
          <div className="wbs-scroll">
            <p className="table-unit">Montants en millions de FCFA</p>
            <table className="register-table register-table--funding">
              <thead>
                <tr>
                  <th>Tranche</th>
                  <th>Période</th>
                  <th>Déblocage</th>
                  <th>Activités financées</th>
                  <th className="num">Montant</th>
                  <th className="num">Part</th>
                </tr>
              </thead>
              <tbody>
                {strategy.tranches.map((tranche) => (
                  <tr key={tranche.name}>
                    <td className="register-table__title">{tranche.name}</td>
                    <td>{tranche.period || '—'}</td>
                    <td className="register-table__muted-cell">{formatShortDate(tranche.releaseOn)}</td>
                    <td className="register-table__response">{tranche.activities || '—'}</td>
                    <td className="num">{formatMillionsValue(tranche.amount)}</td>
                    <td className="num">{formatPercent(shareOf(tranche.amount, budget ?? strategy.tranchesTotal))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>Total des tranches</td>
                  <td className="num">{formatMillionsValue(strategy.tranchesTotal)}</td>
                  <td className="num">{formatPercent(shareOf(strategy.tranchesTotal, budget ?? strategy.tranchesTotal))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <div className="doc-columns">
        <section className="doc-panel">
          <h2 className="plan__section-title">Catégories de coûts</h2>
          {strategy.costCategories.length === 0 ? (
            <p className="plan__empty">Aucune catégorie.</p>
          ) : (
            <ul className="doc-refs">
              {strategy.costCategories.map((category) => (
                <li key={category.name}>
                  <strong>{category.name}</strong>
                  {category.description}
                  <span>
                    {formatFcfaMillions(category.amount)} ·{' '}
                    {formatPercent(shareOf(category.amount, budget ?? strategy.categoriesTotal))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="doc-panel">
          <h2 className="plan__section-title">Mécanisme de déblocage</h2>
          {strategy.releaseMechanism ? <p className="doc-text">{strategy.releaseMechanism}</p> : <p className="plan__empty">À rédiger.</p>}
        </section>
      </div>

      <section className="doc-panel">
        <h2 className="plan__section-title">Risques de financement et parades</h2>
        {strategy.risks.length === 0 ? (
          <p className="plan__empty">Aucun risque de financement identifié.</p>
        ) : (
          <ul className="quality-recommendations funding-risks">
            {strategy.risks.map((item) => (
              <li key={item.risk}>
                <strong>{item.risk} : </strong>
                {item.mitigation}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
