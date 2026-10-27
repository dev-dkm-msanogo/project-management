import type { AssumptionEntry } from '@domain/entities/assumption-entry';
import type { AssumptionLog } from '@domain/entities/assumption-log';
import { ProcurementPlan } from '@domain/entities/procurement-plan';
import { ProcurementStrategy } from '@domain/entities/procurement-strategy';
import { SourceSelection, SourceSelections } from '@domain/entities/source-selections';
import { toAssumptionEntryDto } from '@application/mappers/assumption-log.mappers';
import { isoDate, parseIsoDate } from '@application/mappers/iso-date';
import type {
  ProcurementPlanDto,
  ProcurementPlanInput,
  ProcurementStrategyDto,
  ProcurementStrategyInput,
  SourceSelectionInput,
  SourceSelectionsDto,
  SourceSelectionsInput,
} from '@shared/index';

/** Traductions des documents d'approvisionnement : domaine ⇄ saisie ⇄ lecture. */

// --- Plan de gestion des approvisionnements ---

export function procurementPlanToInput(plan: ProcurementPlan): ProcurementPlanInput {
  const { props } = plan;
  return {
    preparedOn: isoDate(props.preparedOn),
    integration: { ...props.integration },
    activities: props.activities.map((item) => ({ date: isoDate(item.date), activity: item.activity })),
    metrics: props.metrics.map((item) => ({ ...item })),
    roles: props.roles.map((item) => ({ ...item })),
    jurisdiction: props.jurisdiction,
    independentEstimates: props.independentEstimates,
    riskManagement: props.riskManagement,
    sellers: props.sellers.map((item) => ({ ...item })),
  };
}

export function inputToProcurementPlan(projectId: string, input: ProcurementPlanInput): ProcurementPlan {
  return ProcurementPlan.create({
    ...input,
    projectId,
    preparedOn: parseIsoDate(input.preparedOn),
    activities: input.activities.map((item) => ({ ...item, date: parseIsoDate(item.date) })),
  });
}

/** Domaine → lecture, avec les contraintes et hypothèses « Approvisionnements » en vigueur du registre. */
export function toProcurementPlanDto(plan: ProcurementPlan, assumptions: AssumptionLog): ProcurementPlanDto {
  const procurement = (entries: readonly AssumptionEntry[]) =>
    entries.filter((entry) => entry.props.category === 'PROCUREMENT').map(toAssumptionEntryDto);
  return {
    projectId: plan.projectId,
    ...procurementPlanToInput(plan),
    references: {
      constraints: procurement(assumptions.constraints),
      assumptions: procurement(assumptions.currentAssumptions),
    },
  };
}

// --- Stratégie d'approvisionnement ---

export function procurementStrategyToInput(strategy: ProcurementStrategy): ProcurementStrategyInput {
  const { props } = strategy;
  return {
    preparedOn: isoDate(props.preparedOn),
    deliveryMethod: props.deliveryMethod,
    makeOrBuy: props.makeOrBuy,
    contractTypes: props.contractTypes.map((item) => ({ ...item })),
    incentiveCriteria: props.incentiveCriteria,
    lifecycle: props.lifecycle.map((item) => ({ ...item })),
    knowledgeTransfer: props.knowledgeTransfer,
  };
}

export function inputToProcurementStrategy(projectId: string, input: ProcurementStrategyInput): ProcurementStrategy {
  return ProcurementStrategy.create({ ...input, projectId, preparedOn: parseIsoDate(input.preparedOn) });
}

export function toProcurementStrategyDto(strategy: ProcurementStrategy): ProcurementStrategyDto {
  return { projectId: strategy.projectId, ...procurementStrategyToInput(strategy) };
}

// --- Sélection des fournisseurs ---

function selectionToInput(selection: SourceSelection): SourceSelectionInput {
  const { props } = selection;
  return {
    procurement: props.procurement,
    preparedOn: isoDate(props.preparedOn),
    candidates: [...props.candidates],
    criteria: props.criteria.map((criterion) => ({ ...criterion, ratings: [...criterion.ratings] })),
    recommendation: props.recommendation,
    award: props.award ? { ...props.award, decidedOn: isoDate(props.award.decidedOn) } : null,
  };
}

export function sourceSelectionsToInput(selections: SourceSelections): SourceSelectionsInput {
  return { evaluations: selections.evaluations.map(selectionToInput) };
}

export function inputToSourceSelections(projectId: string, input: SourceSelectionsInput): SourceSelections {
  return SourceSelections.create({
    projectId,
    evaluations: input.evaluations.map((evaluation) =>
      SourceSelection.create({
        ...evaluation,
        preparedOn: parseIsoDate(evaluation.preparedOn),
        // Grilles enregistrées avant l'attribution par un valideur : pas encore attribuées.
        award: evaluation.award ? { ...evaluation.award, decidedOn: parseIsoDate(evaluation.award.decidedOn) } : null,
      }),
    ),
  });
}

/** Domaine → lecture, avec le total pondéré de chaque candidat et le(s) candidat(s) en tête. */
export function toSourceSelectionsDto(selections: SourceSelections): SourceSelectionsDto {
  return {
    projectId: selections.projectId,
    evaluations: selections.evaluations.map((evaluation) => ({
      ...selectionToInput(evaluation),
      result: evaluation.result,
    })),
  };
}
