import type { CostBaseline } from '@domain/entities/cost-baseline';
import type { FundingStrategy } from '@domain/entities/funding-strategy';

export interface FundingRequirementRow {
  name: string;
  releaseOn: Date;
  amount: number;
  cumulativeFunded: number;
  cumulativeSpend: number;
  surplus: number;
}

const monthKey = (date: Date): string =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

/**
 * Besoins de financement (template « Project Funding Requirements »), calculés : chaque tranche
 * de la stratégie face à la dépense cumulée prévue par la référence des coûts jusqu'au déblocage
 * de la tranche suivante (au mois près) ; la dernière couvre l'ensemble des coûts directs.
 */
export class FundingRequirements {
  private constructor(
    readonly rows: readonly FundingRequirementRow[],
    readonly baseline: CostBaseline,
  ) {}

  static from(strategy: FundingStrategy, baseline: CostBaseline): FundingRequirements {
    const { tranches } = strategy.props;
    let funded = 0;
    const rows = tranches.map((tranche, index) => {
      funded += tranche.amount;
      const next = tranches[index + 1];
      const spend = next
        ? (baseline.periods.filter((period) => period.period < monthKey(next.releaseOn)).at(-1)?.cumulative ?? 0)
        : baseline.summary.direct;
      return {
        name: tranche.name,
        releaseOn: tranche.releaseOn,
        amount: tranche.amount,
        cumulativeFunded: funded,
        cumulativeSpend: spend,
        surplus: funded - spend,
      };
    });
    return new FundingRequirements(rows, baseline);
  }

  get tranchesTotal(): number {
    return this.rows.at(-1)?.cumulativeFunded ?? 0;
  }

  /** Tranches dont les fonds ne couvrent pas la dépense prévue. */
  get shortfalls(): string[] {
    return this.rows.filter((row) => row.surplus < 0).map((row) => row.name);
  }
}
