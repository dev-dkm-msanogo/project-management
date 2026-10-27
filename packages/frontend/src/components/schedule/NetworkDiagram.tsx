import type { ScheduleModelDto } from '@shared/index';
import { formatMonthDay } from '@/lib/format';
import { relationLabel } from '@/lib/schedule-format';

const NODE_W = 186;
const NODE_H = 66;
const COL = NODE_W + 56;
const ROW = NODE_H + 22;
const PAD = 12;
const NAME_MAX = 28;

interface Placed {
  code: string;
  x: number;
  y: number;
}

/**
 * Réseau du projet (antécédents sur les nœuds) : une colonne par rang dans le réseau, le chemin
 * critique en rouge. Chaque nœud porte durée, début et fin au plus tôt, et marge totale.
 */
export function NetworkDiagram({ model }: { model: ScheduleModelDto }) {
  const activities = new Map(model.activities.map((activity) => [activity.code, activity]));
  const scheduled = new Map(model.network.activities.map((item) => [item.code, item]));

  // Rang = plus long enchaînement de prédécesseurs (le réseau est déjà dans l'ordre topologique).
  const rank = new Map<string, number>();
  for (const { code } of model.network.activities) {
    const predecessors = activities.get(code)!.predecessors;
    rank.set(code, predecessors.length === 0 ? 0 : Math.max(...predecessors.map((p) => rank.get(p.activity)! + 1)));
  }
  const columns: string[][] = [];
  for (const { code } of model.network.activities) (columns[rank.get(code)!] ??= []).push(code);

  const placed = new Map<string, Placed>();
  columns.forEach((codes, column) =>
    codes.forEach((code, row) => placed.set(code, { code, x: PAD + column * COL, y: PAD + row * ROW })),
  );
  const width = PAD * 2 + (columns.length - 1) * COL + NODE_W;
  const height = PAD * 2 + (Math.max(...columns.map((codes) => codes.length)) - 1) * ROW + NODE_H;

  const edges = model.activities.flatMap((activity) =>
    activity.predecessors.map((dependency) => {
      const from = placed.get(dependency.activity)!;
      const to = placed.get(activity.code)!;
      const critical = scheduled.get(dependency.activity)!.critical && scheduled.get(activity.code)!.critical;
      return { key: `${dependency.activity}-${activity.code}`, from, to, critical, label: relationLabel(dependency) };
    }),
  );

  return (
    <div className="network-scroll">
      <svg
        className="network-diagram"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Réseau du projet : ${model.activities.length} activités, chemin critique ${model.network.criticalPath.join(', ')}`}
      >
        <defs>
          <marker id="network-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0 8 4 0 8z" className="network-arrow" />
          </marker>
          <marker id="network-arrow-critical" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0 8 4 0 8z" className="network-arrow network-arrow--critical" />
          </marker>
        </defs>

        {edges.map(({ key, from, to, critical, label }) => {
          const x1 = from.x + NODE_W;
          const y1 = from.y + NODE_H / 2;
          const x2 = to.x - 2;
          const y2 = to.y + NODE_H / 2;
          const bend = Math.max(24, (x2 - x1) / 2);
          return (
            <g key={key}>
              <path
                d={`M${x1} ${y1} C${x1 + bend} ${y1} ${x2 - bend} ${y2} ${x2} ${y2}`}
                className={`network-edge${critical ? ' network-edge--critical' : ''}`}
                markerEnd={`url(#${critical ? 'network-arrow-critical' : 'network-arrow'})`}
              />
              {label && (
                <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 4} className="network-edge__label" textAnchor="middle">
                  {label}
                </text>
              )}
            </g>
          );
        })}

        {[...placed.values()].map(({ code, x, y }) => {
          const activity = activities.get(code)!;
          const item = scheduled.get(code)!;
          const name = activity.name.length > NAME_MAX ? `${activity.name.slice(0, NAME_MAX - 1)}…` : activity.name;
          return (
            <g key={code} transform={`translate(${x} ${y})`} className={`network-node${item.critical ? ' network-node--critical' : ''}`}>
              <title>{`${code} · ${activity.name} (WBS ${activity.wbsCode})`}</title>
              <rect width={NODE_W} height={NODE_H} rx="6" />
              <text x="10" y="18" className="network-node__code">
                {code}
              </text>
              <text x={NODE_W - 10} y="18" className="network-node__duration" textAnchor="end">
                {activity.durationDays} j
              </text>
              <text x="10" y="36" className="network-node__name">
                {name}
              </text>
              <text x="10" y="56" className="network-node__dates">
                {formatMonthDay(item.earlyStart)} → {formatMonthDay(item.earlyFinish)}
              </text>
              <text x={NODE_W - 10} y="56" className="network-node__float" textAnchor="end">
                {item.critical ? 'Critique' : `Marge ${item.totalFloat} j`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
