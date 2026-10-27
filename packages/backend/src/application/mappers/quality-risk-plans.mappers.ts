import { QualityManagementPlan } from '@domain/entities/quality-management-plan';
import { RiskManagementPlan } from '@domain/entities/risk-management-plan';
import { RISK_CATEGORIES, type RiskCategory } from '@domain/value-objects/risk-classifications';
import { isoDate, parseIsoDate } from '@application/mappers/iso-date';
import type {
  QualityManagementPlanDto,
  QualityManagementPlanInput,
  RiskManagementPlanDto,
  RiskManagementPlanInput,
} from '@shared/index';

/** Traductions des plans de gestion de la qualité et des risques : domaine ⇄ saisie ⇄ lecture. */

// --- Qualité ---

export function qualityPlanToInput(plan: QualityManagementPlan): QualityManagementPlanInput {
  const { props } = plan;
  return {
    preparedOn: isoDate(props.preparedOn),
    standards: [...props.standards],
    objectives: props.objectives.map((item) => ({ ...item })),
    roles: props.roles.map((item) => ({ ...item })),
    deliverables: [...props.deliverables],
    processes: [...props.processes],
    managementApproach: props.managementApproach,
    controlApproach: props.controlApproach,
    procedures: props.procedures,
  };
}

export function inputToQualityPlan(projectId: string, input: QualityManagementPlanInput): QualityManagementPlan {
  return QualityManagementPlan.create({ ...input, projectId, preparedOn: parseIsoDate(input.preparedOn) });
}

export function toQualityPlanDto(plan: QualityManagementPlan): QualityManagementPlanDto {
  return { projectId: plan.projectId, ...qualityPlanToInput(plan) };
}

// --- Risques ---

export function riskPlanToInput(plan: RiskManagementPlan): RiskManagementPlanInput {
  const { props } = plan;
  return {
    preparedOn: isoDate(props.preparedOn),
    strategy: props.strategy,
    methodology: props.methodology,
    roles: props.roles.map((item) => ({ ...item })),
    breakdown: Object.fromEntries(
      RISK_CATEGORIES.map((category) => [category, [...props.breakdown[category]]]),
    ) as Record<RiskCategory, string[]>,
    funding: props.funding,
    contingencyProtocols: props.contingencyProtocols,
    timing: props.timing,
    tolerances: props.tolerances,
    tracking: props.tracking,
    probability: props.probability.map((item) => ({ ...item })),
    impact: props.impact.map((item) => ({ ...item })),
  };
}

export function inputToRiskPlan(projectId: string, input: RiskManagementPlanInput): RiskManagementPlan {
  return RiskManagementPlan.create({ ...input, projectId, preparedOn: parseIsoDate(input.preparedOn) });
}

export function toRiskPlanDto(plan: RiskManagementPlan): RiskManagementPlanDto {
  return { projectId: plan.projectId, ...riskPlanToInput(plan) };
}
