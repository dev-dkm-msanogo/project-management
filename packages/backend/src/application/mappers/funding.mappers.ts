import type { FundingRequirements } from '@domain/entities/funding-requirements';
import { FundingStrategy } from '@domain/entities/funding-strategy';
import { isoDate, parseIsoDate } from '@application/mappers/iso-date';
import type { FundingRequirementsDto, FundingStrategyDto, FundingStrategyInput } from '@shared/index';

/** Traductions du financement : domaine ⇄ saisie ⇄ lecture. */

export function fundingStrategyToInput(strategy: FundingStrategy): FundingStrategyInput {
  const { props } = strategy;
  return {
    preparedOn: isoDate(props.preparedOn),
    source: props.source,
    approvedFundingNote: props.approvedFundingNote,
    tranches: props.tranches.map((tranche) => ({ ...tranche, releaseOn: isoDate(tranche.releaseOn) })),
    releaseMechanism: props.releaseMechanism,
    costCategories: props.costCategories.map((category) => ({ ...category })),
    risks: props.risks.map((item) => ({ ...item })),
  };
}

export function inputToFundingStrategy(projectId: string, input: FundingStrategyInput): FundingStrategy {
  return FundingStrategy.create({
    ...input,
    projectId,
    preparedOn: parseIsoDate(input.preparedOn),
    tranches: input.tranches.map((tranche) => ({ ...tranche, releaseOn: parseIsoDate(tranche.releaseOn) })),
  });
}

export function toFundingStrategyDto(strategy: FundingStrategy, charterBudget: number | null): FundingStrategyDto {
  return {
    projectId: strategy.projectId,
    ...fundingStrategyToInput(strategy),
    charterBudget,
    tranchesTotal: strategy.tranchesTotal,
    categoriesTotal: strategy.categoriesTotal,
  };
}

export function toFundingRequirementsDto(projectId: string, requirements: FundingRequirements): FundingRequirementsDto {
  const { summary } = requirements.baseline;
  return {
    projectId,
    rows: requirements.rows.map((row) => ({ ...row, releaseOn: isoDate(row.releaseOn) })),
    periods: requirements.baseline.periods.map((period) => ({ ...period })),
    direct: summary.direct,
    costBaseline: summary.costBaseline,
    managementReserve: summary.managementReserve,
    totalRequired: summary.totalFunding,
    tranchesTotal: requirements.tranchesTotal,
    shortfalls: requirements.shortfalls,
  };
}
