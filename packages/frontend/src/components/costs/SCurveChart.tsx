import { useState } from 'react';
import type { CostPeriodDto } from '@shared/index';
import { formatPercent, formatPeriod } from '@/lib/cost-format';
import { formatFcfaMillions, formatMillionsValue } from '@/lib/format';

const WIDTH = 720;
const HEIGHT = 300;
const MARGIN = { top: 16, right: 72, bottom: 32, left: 64 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;
const BAR_MAX = 24;
const RADIUS = 4;

/** Pas « rond » (1, 2, 2,5 ou 5 × 10ⁿ) pour environ cinq graduations. */
function niceStep(max: number): number {
  const rough = max / 5;
  const power = 10 ** Math.floor(Math.log10(rough));
  return ([1, 2, 2.5, 5, 10].find((factor) => factor * power >= rough) ?? 10) * power;
}

/** Colonne à extrémité arrondie (4 px), base carrée sur l'axe. */
function columnPath(x: number, width: number, top: number, bottom: number): string {
  const r = Math.min(RADIUS, width / 2, bottom - top);
  return `M${x},${bottom} V${top + r} Q${x},${top} ${x + r},${top} H${x + width - r} Q${x + width},${top} ${x + width},${top + r} V${bottom} Z`;
}

interface SCurveChartProps {
  periods: readonly CostPeriodDto[];
  /** Référence des coûts (BAC), tracée en ligne de référence. */
  bac: number;
}

/**
 * Courbe en S de la référence des coûts : coût planifié de chaque mois (colonnes) et
 * cumul (ligne), sur un seul axe en FCFA, avec la référence des coûts (BAC) en repère.
 * Survol ou focus d'un mois : réticule et infobulle ; le tableau voisin reste la vue texte.
 */
export function SCurveChart({ periods, bac }: SCurveChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const top = Math.max(bac, ...periods.map((period) => period.cumulative));
  const step = niceStep(top || 1);
  const yMax = Math.ceil((top * 1.05) / step) * step || step;
  const ticks = Array.from({ length: Math.round(yMax / step) + 1 }, (_, index) => index * step);
  const y = (value: number) => MARGIN.top + PLOT_H - (value / yMax) * PLOT_H;
  const band = PLOT_W / periods.length;
  const barWidth = Math.min(BAR_MAX, band * 0.5);
  const cx = (index: number) => MARGIN.left + band * index + band / 2;
  const labelEvery = Math.ceil(periods.length / 12);
  const linePoints = periods.map((period, index) => `${cx(index)},${y(period.cumulative)}`).join(' ');
  const last = periods[periods.length - 1];
  const hovered = active === null ? null : periods[active];

  return (
    <figure className="s-curve">
      <ul className="s-curve__legend">
        <li>
          <span className="s-curve__key s-curve__key--bar" aria-hidden="true" />
          Coût de la période (valeur planifiée)
        </li>
        <li>
          <span className="s-curve__key s-curve__key--line" aria-hidden="true" />
          Cumul (courbe en S)
        </li>
        <li>
          <span className="s-curve__key s-curve__key--bac" aria-hidden="true" />
          Référence des coûts (BAC)
        </li>
      </ul>

      {/* Largeur minimale (lisibilité sur mobile) : défilement horizontal au besoin. */}
      <div className="s-curve__scroll">
        <div className="s-curve__plot">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={`Courbe en S : ${periods.length} mois, cumul final ${formatFcfaMillions(last?.cumulative ?? 0)} pour une référence de ${formatFcfaMillions(bac)}.`}
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
                <text key={period.period} className="s-curve__tick" x={cx(index)} y={HEIGHT - 10} textAnchor="middle">
                  {formatPeriod(period.period, periods.length > 6)}
                </text>
              ) : null,
            )}

            {hovered && active !== null && (
              <line className="s-curve__crosshair" x1={cx(active)} x2={cx(active)} y1={MARGIN.top} y2={MARGIN.top + PLOT_H} />
            )}

            {periods.map((period, index) =>
              period.plannedValue > 0 ? (
                <path
                  key={period.period}
                  className={`s-curve__bar${active === index ? ' s-curve__bar--active' : ''}`}
                  d={columnPath(cx(index) - barWidth / 2, barWidth, y(period.plannedValue), y(0))}
                />
              ) : null,
            )}

            <line className="s-curve__bac" x1={MARGIN.left} x2={MARGIN.left + PLOT_W} y1={y(bac)} y2={y(bac)} />
            <text className="s-curve__annotation" x={MARGIN.left + PLOT_W + 6} y={y(bac)} dominantBaseline="middle">
              BAC {formatMillionsValue(bac)} M
            </text>

            <polyline className="s-curve__line" points={linePoints} />
            {periods.map((period, index) => (
              <circle key={period.period} className="s-curve__dot" cx={cx(index)} cy={y(period.cumulative)} r={4} />
            ))}
            {last && Math.abs(y(last.cumulative) - y(bac)) > 14 && (
              <text
                className="s-curve__annotation"
                x={MARGIN.left + PLOT_W + 6}
                y={y(last.cumulative)}
                dominantBaseline="middle"
              >
                {formatMillionsValue(last.cumulative)} M
              </text>
            )}

            {periods.map((period, index) => (
              <rect
                key={period.period}
                className="s-curve__hit"
                x={MARGIN.left + band * index}
                y={MARGIN.top}
                width={band}
                height={PLOT_H}
                tabIndex={0}
                aria-label={`${formatPeriod(period.period)} : ${formatFcfaMillions(period.plannedValue)}, cumul ${formatFcfaMillions(period.cumulative)} (${formatPercent(period.percentOfDirect)})`}
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
              />
            ))}
          </svg>

          {hovered && active !== null && (
            <div
              className={`s-curve__tooltip${cx(active) > WIDTH / 2 ? ' s-curve__tooltip--left' : ''}`}
              style={{ left: `${(cx(active) / WIDTH) * 100}%` }}
              role="status"
            >
              <span className="s-curve__tooltip-title">{formatPeriod(hovered.period)}</span>
              <span className="s-curve__tooltip-row">
                <span className="s-curve__key s-curve__key--bar" aria-hidden="true" />
                <strong>{formatFcfaMillions(hovered.plannedValue)}</strong> sur le mois
              </span>
              <span className="s-curve__tooltip-row">
                <span className="s-curve__key s-curve__key--line" aria-hidden="true" />
                <strong>{formatFcfaMillions(hovered.cumulative)}</strong> cumulés ({formatPercent(hovered.percentOfDirect)})
              </span>
            </div>
          )}
        </div>
      </div>
    </figure>
  );
}
