import type { CostEstimates } from '@domain/entities/cost-estimates';
import type { Task } from '@domain/entities/task';

export interface PerformanceBaselineRow {
  wbs: string;
  name: string;
  start: Date | null;
  finish: Date | null;
  durationDays: number | null;
  budget: number;
}

/** Élément de 1ᵉʳ niveau d'un code WBS (1.2.3 → 1). */
const rootOf = (wbsCode: string): string => wbsCode.split('.')[0]!;

/**
 * Référence de mesure de la performance (PMB) : périmètre, délai et coût intégrés. Chaque
 * élément de 1ᵉʳ niveau de la WBS porte ses dates (échéancier) et le budget des activités
 * estimées sous lui ; la réserve pour aléas complète le total (BAC). La réserve de
 * management, détenue par le sponsor, reste hors référence.
 */
export class PerformanceMeasurementBaseline {
  private constructor(
    readonly rows: readonly PerformanceBaselineRow[],
    readonly unallocated: number,
    readonly contingencyReserve: number,
    readonly total: number,
    readonly managementReserve: number,
  ) {}

  static from(estimates: CostEstimates, tasks: readonly Task[]): PerformanceMeasurementBaseline {
    const budgets = new Map<string, number>();
    for (const activity of estimates.props.activities) {
      const root = rootOf(activity.props.wbsCode);
      budgets.set(root, (budgets.get(root) ?? 0) + activity.direct);
    }

    const rows = tasks
      .filter((task) => task.level === 1)
      .map((task) => ({
        wbs: task.wbs.value,
        name: task.name,
        start: task.start,
        finish: task.end,
        durationDays: task.durationDays,
        budget: budgets.get(task.wbs.value) ?? 0,
      }));
    const allocated = rows.reduce((sum, row) => sum + row.budget, 0);

    const summary = estimates.summary;
    return new PerformanceMeasurementBaseline(
      rows,
      summary.direct - allocated,
      summary.contingencyReserve,
      summary.costBaseline,
      summary.managementReserve,
    );
  }
}
