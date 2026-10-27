import type { ReactNode } from 'react';
import type { BurndownPointDto, BurnupPointDto, VelocityDto } from '@shared/index';
import { formatShortDate } from '@/lib/format';

/** Graphiques du module agile, en SVG pur : burndown d'itération, vélocité, burnup du carnet. */

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 12, right: 12, bottom: 30, left: 36 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

/** Graduation lisible : 4 intervalles au plus, pas de 1, 2, 5 ou 10 × 10ⁿ. */
function ticksFor(max: number): number[] {
  const raw = Math.max(max, 1) / 4;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((factor) => factor * power).find((candidate) => candidate >= raw)!;
  const top = Math.ceil(Math.max(max, 1) / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step);
}

interface Legend {
  label: string;
  key: 'bar' | 'bar-muted' | 'line' | 'line-alt' | 'dashed';
}

function Frame({ title, legend, ticks, labels, children }: {
  title: string;
  legend: Legend[];
  ticks: number[];
  labels: { x: number; text: string }[];
  children: ReactNode;
}) {
  const top = ticks.at(-1)!;
  const y = (value: number) => PAD.top + PLOT_H - (value / top) * PLOT_H;
  return (
    <figure className="agile-chart">
      <ul className="agile-chart__legend">
        {legend.map((item) => (
          <li key={item.label}>
            <span className={`agile-chart__key agile-chart__key--${item.key}`} aria-hidden="true" />
            {item.label}
          </li>
        ))}
      </ul>
      <div className="agile-chart__scroll">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={title}>
          {ticks.map((tick) => (
            <g key={tick}>
              <line className="agile-chart__grid" x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} />
              <text className="agile-chart__tick" x={PAD.left - 6} y={y(tick) + 4} textAnchor="end">
                {tick}
              </text>
            </g>
          ))}
          {labels.map((label, index) => (
            <text key={index} className="agile-chart__tick" x={label.x} y={HEIGHT - 10} textAnchor="middle">
              {label.text}
            </text>
          ))}
          {children}
        </svg>
      </div>
    </figure>
  );
}

const scaleY = (top: number) => (value: number) => PAD.top + PLOT_H - (value / top) * PLOT_H;

/** Burndown : reste idéal (pointillés) et reste réel, chaque jour ouvré de l'itération. */
export function BurndownChart({ points }: { points: readonly BurndownPointDto[] }) {
  if (points.length === 0) return <p className="plan__empty">Aucun jour ouvré dans cette itération.</p>;
  const ticks = ticksFor(Math.max(...points.map((point) => Math.max(point.ideal, point.remaining ?? 0))));
  const y = scaleY(ticks.at(-1)!);
  const x = (index: number) => PAD.left + (points.length === 1 ? PLOT_W / 2 : (index / (points.length - 1)) * PLOT_W);
  const actual = points.map((point, index) => ({ ...point, index })).filter((point) => point.remaining !== null);
  const every = Math.ceil(points.length / 8);
  return (
    <Frame
      title="Burndown de l'itération"
      legend={[
        { label: 'Reste réel', key: 'line' },
        { label: 'Reste idéal', key: 'dashed' },
      ]}
      ticks={ticks}
      labels={points
        .map((point, index) => ({ x: x(index), text: formatShortDate(point.date).replace(/\s\d{4}$/, ''), index }))
        .filter((label) => label.index % every === 0)}
    >
      <polyline
        className="agile-chart__ideal"
        points={points.map((point, index) => `${x(index)},${y(point.ideal)}`).join(' ')}
      />
      {actual.length > 0 && (
        <polyline className="agile-chart__line" points={actual.map((point) => `${x(point.index)},${y(point.remaining!)}`).join(' ')} />
      )}
      {actual.map((point) => (
        <circle key={point.date} className="agile-chart__dot" cx={x(point.index)} cy={y(point.remaining!)} r={4}>
          <title>{`${formatShortDate(point.date)} : ${point.remaining} pts restants (idéal ${point.ideal})`}</title>
        </circle>
      ))}
    </Frame>
  );
}

/** Vélocité : points engagés et points terminés de chaque itération terminée. */
export function VelocityChart({ velocity, average }: { velocity: readonly VelocityDto[]; average: number | null }) {
  if (velocity.length === 0) return <p className="plan__empty">Aucune itération terminée pour l'instant.</p>;
  const ticks = ticksFor(Math.max(...velocity.map((item) => Math.max(item.committed, item.done))));
  const y = scaleY(ticks.at(-1)!);
  const slot = PLOT_W / velocity.length;
  const bar = Math.min(28, slot / 3);
  return (
    <Frame
      title="Vélocité par itération"
      legend={[
        { label: 'Points terminés', key: 'bar' },
        { label: 'Points engagés', key: 'bar-muted' },
        ...(average !== null ? [{ label: `Moyenne des trois dernières : ${average} pts`, key: 'dashed' as const }] : []),
      ]}
      ticks={ticks}
      labels={velocity.map((item, index) => ({ x: PAD.left + slot * (index + 0.5), text: item.code }))}
    >
      {velocity.map((item, index) => {
        const center = PAD.left + slot * (index + 0.5);
        return (
          <g key={item.code}>
            <title>{`${item.name} : ${item.done} pts terminés sur ${item.committed} engagés`}</title>
            <rect className="agile-chart__bar-muted" x={center - bar - 1} y={y(item.committed)} width={bar} height={PAD.top + PLOT_H - y(item.committed)} rx={3} />
            <rect className="agile-chart__bar" x={center + 1} y={y(item.done)} width={bar} height={PAD.top + PLOT_H - y(item.done)} rx={3} />
            <text className="agile-chart__value" x={center + 1 + bar / 2} y={y(item.done) - 4} textAnchor="middle">
              {item.done}
            </text>
          </g>
        );
      })}
      {average !== null && (
        <line className="agile-chart__ideal" x1={PAD.left} x2={WIDTH - PAD.right} y1={y(average)} y2={y(average)} />
      )}
    </Frame>
  );
}

/** Burnup : points terminés cumulés à la fin de chaque itération, face au périmètre du carnet. */
export function BurnupChart({ points }: { points: readonly BurnupPointDto[] }) {
  if (points.length === 0) return <p className="plan__empty">Aucune itération planifiée.</p>;
  const ticks = ticksFor(Math.max(...points.map((point) => Math.max(point.scope, point.done ?? 0))));
  const y = scaleY(ticks.at(-1)!);
  const x = (index: number) => PAD.left + (points.length === 1 ? PLOT_W / 2 : (index / (points.length - 1)) * PLOT_W);
  const done = points.map((point, index) => ({ ...point, index })).filter((point) => point.done !== null);
  return (
    <Frame
      title="Burnup du carnet"
      legend={[
        { label: 'Points terminés (cumul)', key: 'line' },
        { label: 'Périmètre du carnet', key: 'line-alt' },
      ]}
      ticks={ticks}
      labels={points.map((point, index) => ({ x: x(index), text: point.code }))}
    >
      <polyline className="agile-chart__line-alt" points={points.map((point, index) => `${x(index)},${y(point.scope)}`).join(' ')} />
      {done.length > 0 && (
        <polyline className="agile-chart__line" points={done.map((point) => `${x(point.index)},${y(point.done!)}`).join(' ')} />
      )}
      {done.map((point) => (
        <circle key={point.code} className="agile-chart__dot" cx={x(point.index)} cy={y(point.done!)} r={4}>
          <title>{`${point.name} (fin ${formatShortDate(point.end)}) : ${point.done} pts terminés sur ${point.scope}`}</title>
        </circle>
      ))}
    </Frame>
  );
}
