import { CostActivity } from '@domain/entities/cost-activity';
import type { CostBaseline } from '@domain/entities/cost-baseline';
import { CostEstimates } from '@domain/entities/cost-estimates';
import { isoDate, parseIsoDate } from '@application/mappers/iso-date';
import type { CostBaselineDto, CostEstimatesDto, CostEstimatesInput } from '@shared/index';

/** Traductions des estimations des coûts et de la référence des coûts : domaine ⇄ saisie ⇄ lecture. */

export function costEstimatesToInput(estimates: CostEstimates): CostEstimatesInput {
  const { props } = estimates;
  return {
    preparedOn: isoDate(props.preparedOn),
    activities: props.activities.map((activity) => ({
      ...activity.props,
      basis: activity.props.basis ? { ...activity.props.basis } : null,
    })),
    contingencyReserve: props.contingencyReserve,
    managementReserve: props.managementReserve,
    narrative: { ...props.narrative },
  };
}

export function inputToCostEstimates(projectId: string, input: CostEstimatesInput): CostEstimates {
  return CostEstimates.create({
    ...input,
    projectId,
    preparedOn: parseIsoDate(input.preparedOn),
    activities: input.activities.map(CostActivity.create),
  });
}

/** Domaine → lecture, avec le budget de la charte en référence. */
export function toCostEstimatesDto(estimates: CostEstimates, charterBudget: number | null): CostEstimatesDto {
  return {
    projectId: estimates.projectId,
    ...costEstimatesToInput(estimates),
    summary: estimates.summary,
    basisEstimates: Object.fromEntries(
      estimates.props.activities
        .filter((activity) => activity.basisEstimate !== null)
        .map((activity) => [activity.code, activity.basisEstimate!]),
    ),
    charterBudget,
  };
}

export function toCostBaselineDto(
  projectId: string,
  baseline: CostBaseline,
  charterBudget: number | null,
): CostBaselineDto {
  return {
    projectId,
    periods: baseline.periods.map((period) => ({ ...period })),
    unscheduled: baseline.unscheduled.map((item) => ({ ...item })),
    summary: baseline.summary,
    charterBudget,
  };
}
