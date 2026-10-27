import type { EarnedValueDto } from '@shared/index';
import { EarnedValueChart } from '@/components/performance/EarnedValueChart';
import { IndexValue, MetricCard } from '@/components/performance/Indicators';
import { formatPercent } from '@/lib/cost-format';
import { formatFcfaMillions } from '@/lib/format';
import { formatIndex, indexHealth } from '@/lib/performance-format';

const signed = (amount: number) => `${amount > 0 ? '+' : ''}${formatFcfaMillions(amount)}`;

/**
 * Valeur acquise à la date d'état : où en est le projet (PV, EV, AC), ses indices de délai et
 * de coût, la projection à l'achèvement, puis le détail par élément de premier niveau de la WBS.
 */
export function EarnedValueView({ value }: { value: EarnedValueDto }) {
  const { indicators: kpi } = value;
  return (
    <>
      <div className="metric-row">
        <MetricCard label="Valeur planifiée (PV)" value={formatFcfaMillions(kpi.pv)} hint={`${formatPercent(kpi.plannedPct)} du budget`} />
        <MetricCard label="Valeur acquise (EV)" value={formatFcfaMillions(kpi.ev)} hint={`${formatPercent(kpi.earnedPct)} du budget réalisé`} />
        <MetricCard label="Coût réel (AC)" value={formatFcfaMillions(kpi.ac)} hint={`${formatPercent(kpi.spentPct)} du budget dépensé`} />
      </div>
      <div className="metric-row">
        <MetricCard
          label="Délai : SPI = EV / PV"
          value={formatIndex(kpi.spi)}
          hint={`Écart de délai ${signed(kpi.sv)}`}
          health={indexHealth(kpi.spi)}
        />
        <MetricCard
          label="Coût : CPI = EV / AC"
          value={formatIndex(kpi.cpi)}
          hint={`Écart de coût ${signed(kpi.cv)}`}
          health={indexHealth(kpi.cpi)}
        />
        <MetricCard
          label="Estimation à l'achèvement (EAC)"
          value={formatFcfaMillions(kpi.eac)}
          hint={`Reste à engager ${formatFcfaMillions(kpi.etc)} · écart ${signed(kpi.vac)}`}
        />
        <MetricCard
          label="Performance à tenir (TCPI)"
          value={formatIndex(kpi.tcpi)}
          hint="Sur le reste du budget, pour finir au BAC"
        />
      </div>

      <section className="doc-panel">
        <EarnedValueChart periods={value.periods} bac={value.bac} statusDate={value.statusDate} pv={kpi.pv} ev={kpi.ev} ac={kpi.ac} />
      </section>

      <section className="doc-panel">
        <h2 className="doc-subtitle">Par élément de la WBS</h2>
        <div className="wbs-scroll">
          <table className="register-table register-table--ev">
            <thead>
              <tr>
                <th>WBS</th>
                <th>Élément</th>
                <th className="num">Budget</th>
                <th className="num">PV</th>
                <th className="num">EV</th>
                <th className="num">AC</th>
                <th>SPI</th>
                <th>CPI</th>
              </tr>
            </thead>
            <tbody>
              {value.elements.map((element) => (
                <tr key={element.wbs}>
                  <td className="register-table__code">{element.wbs}</td>
                  <td className="register-table__title">{element.name}</td>
                  <td className="num">{formatFcfaMillions(element.budget)}</td>
                  <td className="num">{formatFcfaMillions(element.pv)}</td>
                  <td className="num">{formatFcfaMillions(element.ev)}</td>
                  <td className="num">{formatFcfaMillions(element.ac)}</td>
                  <td>
                    <IndexValue value={element.spi} />
                  </td>
                  <td>
                    <IndexValue value={element.cpi} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td />
                <td>Total des lots de travaux (BAC)</td>
                <td className="num">{formatFcfaMillions(value.bac)}</td>
                <td className="num">{formatFcfaMillions(kpi.pv)}</td>
                <td className="num">{formatFcfaMillions(kpi.ev)}</td>
                <td className="num">{formatFcfaMillions(kpi.ac)}</td>
                <td>
                  <IndexValue value={kpi.spi} />
                </td>
                <td>
                  <IndexValue value={kpi.cpi} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="heat-matrix__caption">
          Réserves hors mesure de performance : aléas {formatFcfaMillions(value.contingencyReserve)}, management{' '}
          {formatFcfaMillions(value.managementReserve)}. Seuils des indices : à partir de 0,95 dans les clous, de 0,90
          à surveiller, en dessous critique.
          {value.unmappedBudget > 0 &&
            ` ${formatFcfaMillions(value.unmappedBudget)} d'estimations ne sont rattachés à aucun élément de la WBS : ils restent hors mesure.`}
        </p>
      </section>
    </>
  );
}
