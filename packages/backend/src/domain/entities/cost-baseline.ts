import type { CostEstimates, CostSummary } from '@domain/entities/cost-estimates';

const MS_PER_DAY = 86_400_000;

/** Élément daté de l'échéancier (tâche du plan de projet). */
export interface ScheduledWork {
  wbs: string;
  start: Date | null;
  end: Date | null;
}

export interface CostPeriod {
  /** Mois au format YYYY-MM. */
  period: string;
  plannedValue: number;
  cumulative: number;
  percentOfDirect: number;
}

export interface UnscheduledCost {
  code: string;
  name: string;
  wbsCode: string;
  amount: number;
}

type DatedWork = { start: Date; end: Date };

const inclusiveDays = (start: Date, end: Date): number =>
  Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;

const monthKey = (date: Date): string =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

/** Tâche datée de même code WBS, sinon du plus proche ancêtre (1.2.3 → 1.2 → 1). */
function locate(wbsCode: string, dated: ReadonlyMap<string, DatedWork>): DatedWork | null {
  for (let code = wbsCode; code; code = code.includes('.') ? code.slice(0, code.lastIndexOf('.')) : '') {
    const work = dated.get(code);
    if (work) return work;
  }
  return null;
}

/** Répartit un montant sur les mois couverts par la tâche, au prorata des jours. */
function spread(amount: number, work: DatedWork, byMonth: Map<string, number>): void {
  const total = inclusiveDays(work.start, work.end);
  let cursor = work.start;
  while (cursor.getTime() <= work.end.getTime()) {
    const monthEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0));
    const sliceEnd = monthEnd.getTime() < work.end.getTime() ? monthEnd : work.end;
    const key = monthKey(cursor);
    byMonth.set(key, (byMonth.get(key) ?? 0) + (amount * inclusiveDays(cursor, sliceEnd)) / total);
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }
}

/** Tous les mois de `first` à `last` inclus (mois sans dépense compris : courbe continue). */
function monthsBetween(first: string, last: string): string[] {
  const months: string[] = [];
  const [year, month] = first.split('-').map(Number) as [number, number];
  for (let date = new Date(Date.UTC(year, month - 1, 1)); monthKey(date) <= last; ) {
    months.push(monthKey(date));
    date = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  }
  return months;
}

/**
 * Référence des coûts (template « Cost Baseline ») : les coûts directs estimés, répartis
 * par mois selon les dates de l'échéancier (valeur planifiée et cumul, la courbe en S),
 * puis la cascade aléas / management. Les activités qu'aucune tâche datée ne situe restent
 * « non réparties » : elles comptent dans les coûts directs, pas dans la courbe.
 */
export class CostBaseline {
  private constructor(
    readonly periods: readonly CostPeriod[],
    readonly unscheduled: readonly UnscheduledCost[],
    readonly summary: CostSummary,
  ) {}

  static from(estimates: CostEstimates, schedule: readonly ScheduledWork[]): CostBaseline {
    const dated = new Map<string, DatedWork>();
    for (const work of schedule) {
      if (work.start && work.end) dated.set(work.wbs, { start: work.start, end: work.end });
    }

    const byMonth = new Map<string, number>();
    const unscheduled: UnscheduledCost[] = [];
    for (const activity of estimates.props.activities) {
      if (activity.direct === 0) continue;
      const work = locate(activity.props.wbsCode, dated);
      if (work) {
        spread(activity.direct, work, byMonth);
      } else {
        unscheduled.push({
          code: activity.code,
          name: activity.props.name,
          wbsCode: activity.props.wbsCode,
          amount: activity.direct,
        });
      }
    }

    const summary = estimates.summary;
    const keys = [...byMonth.keys()].sort();
    // Arrondi au franc sur le cumul : la somme des mois retombe exactement sur le total.
    let raw = 0;
    let previous = 0;
    const periods = keys.length === 0 ? [] : monthsBetween(keys[0]!, keys[keys.length - 1]!).map((period) => {
      raw += byMonth.get(period) ?? 0;
      const cumulative = Math.round(raw);
      const plannedValue = cumulative - previous;
      previous = cumulative;
      const percentOfDirect = summary.direct === 0 ? 0 : Math.round((cumulative / summary.direct) * 1000) / 10;
      return { period, plannedValue, cumulative, percentOfDirect };
    });
    return new CostBaseline(periods, unscheduled, summary);
  }
}
