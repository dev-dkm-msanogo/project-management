import { useState } from 'react';
import type { FundingRequirementsDto } from '@shared/index';
import { formatPeriod } from '@/lib/cost-format';
import { formatFcfaMillions, formatMillionsValue } from '@/lib/format';
import { fundingMonths } from '@/lib/funding-format';

const WIDTH = 720;
const HEIGHT = 300;
const MARGIN = { top: 16, right: 96, bottom: 32, left: 64 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;

/** Pas « rond » (1, 2, 2,5 ou 5 × 10ⁿ) pour environ cinq graduations. */
function niceStep(max: number): number {
  const rough = max / 5;
  const power = 10 ** Math.floor(Math.log10(rough));
  return ([1, 2, 2.5, 5, 10].find((factor) => factor * power >= rough) ?? 10) * power;
}

/**
 * Besoins de financement : fonds disponibles (escalier, une marche par tranche) et dépense
 * cumulée prévue en fin de mois (courbe), sur un seul axe en FCFA, avec la référence des coûts et
 * le financement total requis en repères. L'escalier doit rester au-dessus de la courbe.
 */
export function FundingChart({ requirements }: { requirements: FundingRequirementsDto }) {
  const [active, setActive] = useState<number | null>(null);
  const months = fundingMonths(requirements);
  if (months.length === 0) return null;

  const top = Math.max(requirements.totalRequired, ...months.map((month) => Math.max(month.funded, month.spend)));
  const step = niceStep(top || 1);
  const yMax = Math.ceil((top * 1.05) / step) * step || step;
  const ticks = Array.from({ length: Math.round(yMax / step) + 1 }, (_, index) => index * step);
  const y = (value: number) => MARGIN.top + PLOT_H - (value / yMax) * PLOT_H;
  const band = PLOT_W / months.length;
  const left = (index: number) => MARGIN.left + band * index;
  const labelEvery = Math.ceil(months.length / 12);

  // Escalier : un palier par mois, une marche au début du mois de déblocage.
  const stairs = months
    .map((month, index) => `${index === 0 ? 'M' : 'L'}${left(index)},${y(month.funded)} H${left(index + 1)}`)
    .join(' ');
  // Dépense : 0 au début de la période, puis cumul en fin de chaque mois.
  const spendPoints = [`${left(0)},${y(0)}`, ...months.map((month, index) => `${left(index + 1)},${y(month.spend)}`)].join(' ');

  const references = [
    { key: 'bac', label: `BAC ${formatMillionsValue(requirements.costBaseline)} M`, value: requirements.costBaseline },
    { key: 'total', label: `Total ${formatMillionsValue(requirements.totalRequired)} M`, value: requirements.totalRequired },
  ];
  // Repères proches : l'étiquette du plus haut monte, celle du plus bas descend.
  const tooClose = Math.abs(y(references[0]!.value) - y(references[1]!.value)) < 14;
  const labelY = (value: number) => {
    if (!tooClose) return y(value);
    const higher = value === Math.max(...references.map((reference) => reference.value));
    return y(value) + (higher ? -7 : 7);
  };
  const hovered = active === null ? null : months[active];

  return (
    <figure className="s-curve funding-chart">
      <ul className="s-curve__legend">
        <li>
          <span className="s-curve__key funding-chart__key--funded" aria-hidden="true" />
          Fonds disponibles (tranches cumulées)
        </li>
        <li>
          <span className="s-curve__key s-curve__key--line" aria-hidden="true" />
          Dépense cumulée prévue
        </li>
        <li>
          <span className="s-curve__key s-curve__key--bac" aria-hidden="true" />
          Référence des coûts et financement total requis
        </li>
      </ul>

      <div className="s-curve__scroll">
        <div className="s-curve__plot">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={`Financement : ${requirements.rows.length} tranches pour ${formatFcfaMillions(requirements.tranchesTotal)}, dépense prévue ${formatFcfaMillions(requirements.direct)}.`}
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line className="s-curve__grid" x1={MARGIN.left} x2={MARGIN.left + PLOT_W} y1={y(tick)} y2={y(tick)} />
                <text className="s-curve__tick" x={MARGIN.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle">
                  {formatMillionsValue(tick)} M
                </text>
              </g>
            ))}

            {months.map((month, index) =>
              index % labelEvery === 0 ? (
                <text key={month.month} className="s-curve__tick" x={left(index) + band / 2} y={HEIGHT - 10} textAnchor="middle">
                  {formatPeriod(month.month, months.length > 6)}
                </text>
              ) : null,
            )}

            {references.map((reference) => (
              <g key={reference.key}>
                <line className="s-curve__bac" x1={MARGIN.left} x2={MARGIN.left + PLOT_W} y1={y(reference.value)} y2={y(reference.value)} />
                <text className="s-curve__annotation" x={MARGIN.left + PLOT_W + 6} y={labelY(reference.value)} dominantBaseline="middle">
                  {reference.label}
                </text>
              </g>
            ))}

            {hovered && active !== null && (
              <line
                className="s-curve__crosshair"
                x1={left(active) + band / 2}
                x2={left(active) + band / 2}
                y1={MARGIN.top}
                y2={MARGIN.top + PLOT_H}
              />
            )}

            <path className="funding-chart__stairs" d={stairs} />
            <polyline className="s-curve__line" points={spendPoints} />
            {months.map((month, index) => (
              <circle key={month.month} className="s-curve__dot" cx={left(index + 1)} cy={y(month.spend)} r={4} />
            ))}

            {months.map((month, index) => (
              <rect
                key={month.month}
                className="s-curve__hit"
                x={left(index)}
                y={MARGIN.top}
                width={band}
                height={PLOT_H}
                tabIndex={0}
                aria-label={`${formatPeriod(month.month)} : fonds disponibles ${formatFcfaMillions(month.funded)}, dépense cumulée ${formatFcfaMillions(month.spend)}`}
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
              />
            ))}
          </svg>

          {hovered && active !== null && (
            <div
              className={`s-curve__tooltip${left(active) + band / 2 > WIDTH / 2 ? ' s-curve__tooltip--left' : ''}`}
              style={{ left: `${((left(active) + band / 2) / WIDTH) * 100}%` }}
              role="status"
            >
              <span className="s-curve__tooltip-title">{formatPeriod(hovered.month)}</span>
              <span className="s-curve__tooltip-row">
                <span className="s-curve__key funding-chart__key--funded" aria-hidden="true" />
                <strong>{formatFcfaMillions(hovered.funded)}</strong> disponibles
              </span>
              <span className="s-curve__tooltip-row">
                <span className="s-curve__key s-curve__key--line" aria-hidden="true" />
                <strong>{formatFcfaMillions(hovered.spend)}</strong> dépensés fin de mois
              </span>
              <span className="s-curve__tooltip-row">
                <strong>{formatFcfaMillions(hovered.funded - hovered.spend)}</strong>
                {hovered.funded >= hovered.spend ? "d'excédent" : 'manquants'}
              </span>
            </div>
          )}
        </div>
      </div>
    </figure>
  );
}
