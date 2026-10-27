import type { ActualCosts } from '@domain/entities/actual-costs';
import type { CostBaseline } from '@domain/entities/cost-baseline';
import type { CostEstimates } from '@domain/entities/cost-estimates';
import type { TaskTracking } from '@domain/entities/plan-progress';

const MS_PER_DAY = 86_400_000;

export interface EarnedValueIndicators {
  pv: number;
  ev: number;
  ac: number;
  sv: number;
  cv: number;
  spi: number | null;
  cpi: number | null;
  eac: number;
  etc: number;
  vac: number;
  tcpi: number | null;
  plannedPct: number;
  earnedPct: number;
  spentPct: number;
}

export interface EarnedValueElement {
  wbs: string;
  name: string;
  budget: number;
  pv: number;
  ev: number;
  ac: number;
  spi: number | null;
  cpi: number | null;
}

export interface EarnedValuePeriod {
  period: string;
  pv: number;
  ac: number | null;
}

const day = (date: Date): string => date.toISOString().slice(0, 10);
const monthOf = (date: Date): string => day(date).slice(0, 7);
const inclusiveDays = (start: Date, end: Date) => Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
const ratio = (numerator: number, denominator: number): number | null =>
  denominator > 0 ? Math.round((numerator / denominator) * 100) / 100 : null;
const percent = (value: number, total: number): number => (total > 0 ? Math.round((value / total) * 1000) / 10 : 0);
const topLevel = (code: string): string => code.split('.')[0] ?? code;

/** Code lui-même, puis ses ancêtres : 1.2.3 → 1.2 → 1. */
function* lineage(code: string): Generator<string> {
  for (let current = code; current; current = current.includes('.') ? current.slice(0, current.lastIndexOf('.')) : '') {
    yield current;
  }
}

function nextMonth(period: string): string {
  const [year, month] = period.split('-').map(Number) as [number, number];
  const date = new Date(Date.UTC(year, month, 1));
  return date.toISOString().slice(0, 7);
}

/** Part du travail planifiée à la date d'état : 0 avant le début, 1 après la fin, au prorata des jours entre les deux. */
function plannedFraction(start: Date, end: Date, statusDate: Date): number {
  if (day(statusDate) < day(start)) return 0;
  if (day(statusDate) >= day(end)) return 1;
  return inclusiveDays(start, statusDate) / inclusiveDays(start, end);
}

/**
 * Mesure de la performance par la valeur acquise à une date d'état. Le budget à l'achèvement (BAC)
 * est celui des coûts directs estimés ; chaque activité estimée se rattache à son élément de la WBS
 * (même code, sinon le plus proche ancêtre) :
 * - valeur planifiée (PV) : son budget au prorata des jours écoulés de l'élément daté qui la situe ;
 * - valeur acquise (EV) : son budget × l'avancement de l'élément ;
 * - coût réel (AC) : les dépenses réelles datées jusqu'à la date d'état.
 * Les réserves (aléas, management) restent hors mesure.
 */
export class EarnedValue {
  private constructor(
    readonly bac: number,
    readonly indicators: EarnedValueIndicators,
    readonly elements: readonly EarnedValueElement[],
    readonly periods: readonly EarnedValuePeriod[],
    readonly unmappedBudget: number,
  ) {}

  static measure(params: {
    estimates: CostEstimates;
    baseline: CostBaseline;
    tracking: readonly TaskTracking[];
    actuals: ActualCosts;
    statusDate: Date;
  }): EarnedValue {
    const { estimates, baseline, tracking, actuals, statusDate } = params;
    const byCode = new Map(tracking.map((item) => [item.task.wbs.value, item]));
    const elements = new Map<string, { budget: number; pv: number; ev: number; ac: number }>();
    const element = (code: string) => {
      const key = topLevel(code);
      if (!elements.has(key)) elements.set(key, { budget: 0, pv: 0, ev: 0, ac: 0 });
      return elements.get(key)!;
    };

    let unmappedBudget = 0;
    for (const activity of estimates.props.activities) {
      const budget = activity.direct;
      if (budget === 0) continue;
      const code = activity.props.wbsCode;
      const measured = code ? [...lineage(code)].map((candidate) => byCode.get(candidate)).find(Boolean) : undefined;
      if (!measured) {
        unmappedBudget += budget;
        continue;
      }
      const dated = [...lineage(code)]
        .map((candidate) => byCode.get(candidate)?.task)
        .find((task) => task?.start && task.end);
      const target = element(code);
      target.budget += budget;
      target.pv += dated ? budget * plannedFraction(dated.start!, dated.end!, statusDate) : 0;
      target.ev += (budget * measured.percentComplete) / 100;
    }
    for (const entry of actuals.entries) {
      if (day(entry.props.date) <= day(statusDate)) element(entry.props.wbsCode).ac += entry.props.amount;
    }

    const bac = estimates.summary.direct;
    const totals = [...elements.values()].reduce(
      (sum, value) => ({ pv: sum.pv + value.pv, ev: sum.ev + value.ev, ac: sum.ac + value.ac }),
      { pv: 0, ev: 0, ac: 0 },
    );
    const pv = Math.round(totals.pv);
    const ev = Math.round(totals.ev);
    const ac = Math.round(totals.ac);
    const cpi = ratio(ev, ac);
    const eac = cpi ? Math.round((bac * ac) / ev) : bac;
    const indicators: EarnedValueIndicators = {
      pv,
      ev,
      ac,
      sv: ev - pv,
      cv: ev - ac,
      spi: ratio(ev, pv),
      cpi,
      eac,
      etc: eac - ac,
      vac: bac - eac,
      tcpi: ratio(bac - ev, bac - ac),
      plannedPct: percent(pv, bac),
      earnedPct: percent(ev, bac),
      spentPct: percent(ac, bac),
    };

    const names = new Map(tracking.map((item) => [item.task.wbs.value, item.task.name]));
    const breakdown = [...elements.entries()]
      .sort(([a], [b]) => Number(a) - Number(b) || a.localeCompare(b))
      .map(([wbs, value]) => ({
        wbs,
        name: names.get(wbs) ?? wbs,
        budget: Math.round(value.budget),
        pv: Math.round(value.pv),
        ev: Math.round(value.ev),
        ac: Math.round(value.ac),
        spi: ratio(value.ev, value.pv),
        cpi: ratio(value.ev, value.ac),
      }));

    return new EarnedValue(bac, indicators, breakdown, EarnedValue.periods(baseline, actuals, statusDate), unmappedBudget);
  }

  /** Cumuls mensuels continus : PV de la référence (prolongée), AC jusqu'au mois de la date d'état. */
  private static periods(baseline: CostBaseline, actuals: ActualCosts, statusDate: Date): EarnedValuePeriod[] {
    const statusMonth = monthOf(statusDate);
    const months = [
      ...baseline.periods.map((period) => period.period),
      ...actuals.entries.map((entry) => monthOf(entry.props.date)).filter((month) => month <= statusMonth),
      statusMonth,
    ].sort();
    if (months.length === 0) return [];
    const first = months[0]!;
    const last = months[months.length - 1]!;
    const planned = new Map(baseline.periods.map((period) => [period.period, period.cumulative]));
    const result: EarnedValuePeriod[] = [];
    let pv = 0;
    for (let month = first; month <= last; month = nextMonth(month)) {
      pv = planned.get(month) ?? pv;
      const ac =
        month <= statusMonth
          ? actuals.entries
              .filter((entry) => monthOf(entry.props.date) <= month && day(entry.props.date) <= day(statusDate))
              .reduce((sum, entry) => sum + entry.props.amount, 0)
          : null;
      result.push({ period: month, pv, ac });
    }
    return result;
  }
}
