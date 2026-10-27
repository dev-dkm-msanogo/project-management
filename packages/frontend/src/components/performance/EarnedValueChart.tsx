import { useState } from 'react';
import type { EarnedValuePeriodDto } from '@shared/index';
import { formatPeriod } from '@/lib/cost-format';
import { formatFcfaMillions, formatMillionsValue, formatShortDate } from '@/lib/format';

const WIDTH = 720;
const HEIGHT = 300;
const MARGIN = { top: 24, right: 84, bottom: 32, left: 64 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;

/** Pas « rond » (1, 2, 2,5 ou 5 × 10ⁿ) pour environ cinq graduations. */
function niceStep(max: number): number {
  const rough = max / 5;
  const power = 10 ** Math.floor(Math.log10(rough));
  return ([1, 2, 2.5, 5, 10].find((factor) => factor * power >= rough) ?? 10) * power;
}

interface EarnedValueChartProps {
  periods: readonly EarnedValuePeriodDto[];
  bac: number;
  statusDate: string;
  pv: number;
  ev: number;
  ac: number;
}

/**
 * Courbes de la valeur acquise, sur un seul axe en FCFA : valeur planifiée cumulée (toute la
 * référence), coût réel cumulé jusqu'à la date d'état, valeur acquise à la date d'état (point
 * étiqueté), budget à l'achèvement en repère. Les cumuls sont portés en fin de mois ; le tableau
 * des éléments reste la vue texte. Survol ou focus d'un mois : infobulle.
 */
export function EarnedValueChart({ periods, bac, statusDate, pv, ev, ac }: EarnedValueChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const count = Math.max(periods.length, 1);
  const top = Math.max(bac, ...periods.map((period) => Math.max(period.pv, period.ac ?? 0)));
  const step = niceStep(top || 1);
  const yMax = Math.ceil((top * 1.05) / step) * step || step;
  const ticks = Array.from({ length: Math.round(yMax / step) + 1 }, (_, index) => index * step);
  const y = (value: number) => MARGIN.top + PLOT_H - (value / yMax) * PLOT_H;
  const xEnd = (index: number) => MARGIN.left + ((index + 1) / count) * PLOT_W;
  const xMid = (index: number) => MARGIN.left + ((index + 0.5) / count) * PLOT_W;

  const statusMonth = statusDate.slice(0, 7);
  const statusIndex = Math.max(0, periods.findIndex((period) => period.period === statusMonth));
  const day = Number(statusDate.slice(8, 10));
  const daysInMonth = new Date(Date.UTC(Number(statusDate.slice(0, 4)), Number(statusDate.slice(5, 7)), 0)).getUTCDate();
  const xStatus = MARGIN.left + ((statusIndex + day / daysInMonth) / count) * PLOT_W;

  const origin = `${MARGIN.left},${y(0)}`;
  // La PV passe par sa valeur exacte à la date d'état (calculée au jour près, pas interpolée au mois).
  const pvPoints = [
    origin,
    ...periods.flatMap((period, index) => [
      ...(index === statusIndex ? [`${xStatus},${y(pv)}`] : []),
      `${xEnd(index)},${y(period.pv)}`,
    ]),
  ].join(' ');
  const acPoints = [
    origin,
    ...periods.flatMap((period, index) => (index < statusIndex && period.ac !== null ? [`${xEnd(index)},${y(period.ac)}`] : [])),
    `${xStatus},${y(ac)}`,
  ].join(' ');
  const labelEvery = Math.ceil(periods.length / 12);
  const hovered = active === null ? null : periods[active];
  // Étiquettes directes à droite des points de la date d'état, espacées d'au moins 14 px.
  const labels = [
    { key: 'PV', value: pv },
    { key: 'AC', value: ac },
    { key: 'EV', value: ev },
  ]
    .map((label) => ({ ...label, y: y(label.value) }))
    .sort((a, b) => a.y - b.y)
    .reduce<{ key: string; value: number; y: number }[]>(
      (placed, label) => [...placed, { ...label, y: placed.length > 0 ? Math.max(label.y, placed[placed.length - 1]!.y + 14) : label.y }],
      [],
    );

  return (
    <figure className="s-curve ev-chart">
      <ul className="s-curve__legend">
        <li>
          <span className="ev-chart__key ev-chart__key--pv" aria-hidden="true" />
          Valeur planifiée cumulée (PV)
        </li>
        <li>
          <span className="ev-chart__key ev-chart__key--ac" aria-hidden="true" />
          Coût réel cumulé (AC)
        </li>
        <li>
          <span className="ev-chart__key ev-chart__key--ev" aria-hidden="true" />
          Valeur acquise (EV)
        </li>
        <li>
          <span className="s-curve__key s-curve__key--bac" aria-hidden="true" />
          Budget à l'achèvement (BAC)
        </li>
      </ul>

      <div className="s-curve__scroll">
        <div className="s-curve__plot">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={`Au ${formatShortDate(statusDate)} : valeur planifiée ${formatFcfaMillions(pv)}, valeur acquise ${formatFcfaMillions(ev)}, coût réel ${formatFcfaMillions(ac)}, pour un budget de ${formatFcfaMillions(bac)}.`}
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line className="s-curve__grid" x1={MARGIN.left} x2={MARGIN.left + PLOT_W} y1={y(tick)} y2={y(tick)} />
                <text className="s-curve__tick" x={MARGIN.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle">
                  {formatMillionsValue(tick)} M
                </text>
              </g>
            ))}
            {periods.map((period, index) =>
              index % labelEvery === 0 ? (
                <text key={period.period} className="s-curve__tick" x={xMid(index)} y={HEIGHT - 10} textAnchor="middle">
                  {formatPeriod(period.period, periods.length > 6)}
                </text>
              ) : null,
            )}

            {hovered && active !== null && (
              <line className="s-curve__crosshair" x1={xEnd(active)} x2={xEnd(active)} y1={MARGIN.top} y2={MARGIN.top + PLOT_H} />
            )}

            <line className="s-curve__bac" x1={MARGIN.left} x2={MARGIN.left + PLOT_W} y1={y(bac)} y2={y(bac)} />
            <text className="s-curve__annotation" x={MARGIN.left + PLOT_W + 6} y={y(bac)} dominantBaseline="middle">
              BAC {formatMillionsValue(bac)} M
            </text>

            <line className="ev-chart__status" x1={xStatus} x2={xStatus} y1={MARGIN.top - 6} y2={MARGIN.top + PLOT_H} />
            <text className="s-curve__annotation" x={xStatus} y={MARGIN.top - 10} textAnchor="middle">
              Date d'état
            </text>

            <polyline className="ev-chart__line ev-chart__line--pv" points={pvPoints} />
            <polyline className="ev-chart__line ev-chart__line--ac" points={acPoints} />
            <circle className="ev-chart__dot ev-chart__dot--pv" cx={xStatus} cy={y(pv)} r={4} />
            <circle className="ev-chart__dot ev-chart__dot--ac" cx={xStatus} cy={y(ac)} r={4} />
            <circle className="ev-chart__dot ev-chart__dot--ev" cx={xStatus} cy={y(ev)} r={6} />
            {labels.map((label) => (
              <text key={label.key} className="ev-chart__label" x={xStatus + 10} y={label.y} dominantBaseline="middle">
                {label.key} {formatMillionsValue(label.value)} M
              </text>
            ))}

            {periods.map((period, index) => (
              <rect
                key={period.period}
                className="s-curve__hit"
                x={MARGIN.left + (index / count) * PLOT_W}
                y={MARGIN.top}
                width={PLOT_W / count}
                height={PLOT_H}
                tabIndex={0}
                aria-label={`${formatPeriod(period.period)} : valeur planifiée cumulée ${formatFcfaMillions(period.pv)}${period.ac === null ? '' : `, coût réel cumulé ${formatFcfaMillions(period.ac)}`}`}
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
              />
            ))}
          </svg>

          {hovered && active !== null && (
            <div
              className={`s-curve__tooltip${xEnd(active) > WIDTH / 2 ? ' s-curve__tooltip--left' : ''}`}
              style={{ left: `${(xEnd(active) / WIDTH) * 100}%` }}
              role="status"
            >
              <span className="s-curve__tooltip-title">Fin {formatPeriod(hovered.period)}</span>
              <span className="s-curve__tooltip-row">
                <span className="ev-chart__key ev-chart__key--pv" aria-hidden="true" />
                <strong>{formatFcfaMillions(hovered.pv)}</strong> planifiés
              </span>
              {hovered.ac !== null && (
                <span className="s-curve__tooltip-row">
                  <span className="ev-chart__key ev-chart__key--ac" aria-hidden="true" />
                  <strong>{formatFcfaMillions(hovered.ac)}</strong> dépensés
                  {hovered.period === statusMonth ? ` au ${formatShortDate(statusDate)}` : ''}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </figure>
  );
}
