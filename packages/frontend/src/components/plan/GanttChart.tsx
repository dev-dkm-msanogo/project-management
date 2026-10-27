import type { ProjectPlanDto } from '@shared/index';
import { barOpacity, daysBetween, parsePlanDate, phasePalette } from '@/lib/plan-format';

const LABEL_W = 220;
const CHART_W = 760;
const ROW_H = 26;
const PAD_TOP = 30;
const PAD_BOTTOM = 8;
const RIGHT = 14;

const MONTH_FMT = new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' });

interface MonthTick {
  date: Date;
  label: string;
}

function monthTicks(min: Date, max: Date): MonthTick[] {
  const ticks: MonthTick[] = [{ date: min, label: MONTH_FMT.format(min) }];
  let cursor = new Date(Date.UTC(min.getUTCFullYear(), min.getUTCMonth() + 1, 1));
  while (cursor.getTime() <= max.getTime()) {
    ticks.push({ date: new Date(cursor), label: MONTH_FMT.format(cursor) });
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }
  return ticks;
}

function truncate(text: string, max = 32): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Diagramme de Gantt en SVG pur : une barre par tâche sur l'axe temporel. */
export function GanttChart({ plan }: { plan: ProjectPlanDto }) {
  const dated = plan.tasks.filter((task) => task.start && task.end);

  if (!plan.startDate || !plan.endDate || plan.durationDays === null || dated.length === 0) {
    return <p className="plan__empty">Aucune tâche datée à représenter.</p>;
  }

  const min = parsePlanDate(plan.startDate);
  const max = parsePlanDate(plan.endDate);
  const total = plan.durationDays;

  const width = LABEL_W + CHART_W + RIGHT;
  const height = PAD_TOP + dated.length * ROW_H + PAD_BOTTOM;

  const xForOffset = (offsetDays: number): number =>
    LABEL_W + (offsetDays / total) * CHART_W;

  const ticks = monthTicks(min, max);

  return (
    <div className="gantt-scroll">
      <svg className="gantt" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Diagramme de Gantt">
        {/* Axe des mois + lignes de repère */}
        {ticks.map((tick) => {
          const x = xForOffset(daysBetween(min, tick.date));
          return (
            <g key={tick.date.toISOString()}>
              <line x1={x} y1={PAD_TOP - 6} x2={x} y2={height} className="gantt__grid" />
              <text className="gantt__axis" x={x + 3} y={16}>
                {tick.label}
              </text>
            </g>
          );
        })}

        {/* Lignes et barres des tâches */}
        {dated.map((task, index) => {
          const y = PAD_TOP + index * ROW_H;
          const offset = daysBetween(min, parsePlanDate(task.start as string));
          const barX = xForOffset(offset);
          const barW = Math.max(((task.durationDays ?? 1) / total) * CHART_W, 3);
          const palette = phasePalette(task.wbs);
          return (
            <g key={task.wbs}>
              {index % 2 === 1 && (
                <rect className="gantt__stripe" x={0} y={y} width={width} height={ROW_H} />
              )}
              <text
                className={`gantt__label${task.level === 1 ? ' gantt__label--phase' : ''}`}
                x={8}
                y={y + ROW_H / 2}
                dominantBaseline="middle"
              >
                {truncate(`${task.wbs}  ${task.name}`)}
              </text>
              <rect
                x={barX}
                y={y + 6}
                width={barW}
                height={ROW_H - 12}
                rx={4}
                fill={palette.solid}
                fillOpacity={barOpacity(task.level)}
              />
              {task.percentComplete > 0 && (
                <rect
                  className="gantt__progress"
                  x={barX}
                  y={y + ROW_H / 2 - 2}
                  width={(barW * task.percentComplete) / 100}
                  height={4}
                  rx={2}
                >
                  <title>{`${task.wbs} ${task.name} : ${task.percentComplete} % réalisé`}</title>
                </rect>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
