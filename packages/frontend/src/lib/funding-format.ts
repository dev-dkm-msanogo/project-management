import type { FundingRequirementsDto, FundingStrategyDto, FundingStrategyInput, FundingTrancheInput } from '@shared/index';
import { todayIso } from '@/lib/format';

/** Valeurs par défaut, conversions et série mensuelle du financement. */

export function blankFundingStrategy(): FundingStrategyInput {
  return {
    preparedOn: todayIso(),
    source: '',
    approvedFundingNote: '',
    tranches: [],
    releaseMechanism: '',
    costCategories: [],
    risks: [],
  };
}

export function fundingStrategyDtoToInput(dto: FundingStrategyDto): FundingStrategyInput {
  const { projectId: _projectId, charterBudget: _budget, tranchesTotal: _tranches, categoriesTotal: _categories, ...input } = dto;
  return structuredClone(input);
}

export const blankTranche = (index: number): FundingTrancheInput => ({
  name: `Tranche ${index}`,
  period: '',
  releaseOn: todayIso(),
  activities: '',
  amount: 0,
});

/** Part d'un montant dans un total, en pourcentage (0 si le total est nul). */
export const shareOf = (amount: number, total: number | null) => (total ? (amount / total) * 100 : 0);

export interface FundingMonth {
  /** Mois au format YYYY-MM. */
  month: string;
  /** Fonds disponibles cumulés (tranches débloquées ce mois-ci ou avant). */
  funded: number;
  /** Dépense cumulée prévue en fin de mois. */
  spend: number;
}

const addMonth = (month: string): string => {
  const [year, value] = month.split('-').map(Number) as [number, number];
  return value === 12 ? `${year + 1}-01` : `${year}-${String(value + 1).padStart(2, '0')}`;
};

/** Série mensuelle continue, du premier déblocage ou de la première dépense jusqu'au dernier des deux. */
export function fundingMonths(dto: FundingRequirementsDto): FundingMonth[] {
  const releaseMonths = dto.rows.map((row) => row.releaseOn.slice(0, 7));
  const spendMonths = dto.periods.map((period) => period.period);
  const all = [...releaseMonths, ...spendMonths].sort();
  if (all.length === 0) return [];
  const months: FundingMonth[] = [];
  let spend = 0;
  for (let month = all[0]!; month <= all.at(-1)!; month = addMonth(month)) {
    spend = dto.periods.find((period) => period.period === month)?.cumulative ?? spend;
    const funded = dto.rows.filter((row) => row.releaseOn.slice(0, 7) <= month).reduce((total, row) => total + row.amount, 0);
    months.push({ month, funded, spend });
  }
  return months;
}
