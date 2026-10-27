import type {
  AlternativeOutcome,
  BusinessCaseDto,
  BusinessCaseInput,
  FinancialLineInput,
  FinancialLineKind,
  FinancialSummaryDto,
} from '@shared/index';
import { todayIso } from '@/lib/format';

/** Libellés, calculs d'affichage et conversions du business case (template PMI). */

export const YEARS = [1, 2, 3] as const;

export const OUTCOME_LABELS: Record<AlternativeOutcome, string> = {
  SELECTED: 'Retenue',
  REJECTED: 'Rejetée',
};

export const LINE_KIND_LABELS: Record<FinancialLineKind, string> = {
  COST: 'Coût',
  BENEFIT: 'Bénéfice',
};

const FCFA = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/** Montant FCFA comme dans le template : « – » pour zéro, négatif entre parenthèses. */
export function formatAmount(amount: number): string {
  if (amount === 0) return '–';
  return amount < 0 ? `(${FCFA.format(-amount)})` : FCFA.format(amount);
}

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

// Miroir UX du calcul du domaine (BusinessCase.financialSummary) — le serveur reste l'autorité.
export function financialSummary(lines: readonly FinancialLineInput[]): FinancialSummaryDto {
  const yearly = (kind: FinancialLineKind) =>
    YEARS.map((_, year) => sum(lines.filter((line) => line.kind === kind).map((line) => line.amounts[year] ?? 0)));
  const totalCost = yearly('COST');
  const totalBenefits = yearly('BENEFIT');
  const netBenefit = totalBenefits.map((benefits, year) => benefits - totalCost[year]!);
  return {
    totalCost,
    totalBenefits,
    netBenefit,
    total: { cost: sum(totalCost), benefits: sum(totalBenefits), net: sum(netBenefit) },
  };
}

export function businessCaseDtoToInput(dto: BusinessCaseDto): BusinessCaseInput {
  const { projectId: _projectId, financialSummary: _summary, ...input } = dto;
  return structuredClone(input);
}

export function blankBusinessCase(): BusinessCaseInput {
  return {
    preparedOn: todayIso(),
    businessNeed: '',
    strategicAlignment: '',
    situation: [],
    alternatives: [],
    recommendedSolution: '',
    financialLines: [],
    financialNote: null,
    keyRisks: [],
    recommendation: '',
  };
}
