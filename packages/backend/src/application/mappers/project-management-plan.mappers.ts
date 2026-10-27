import { ProjectManagementPlan } from '@domain/entities/project-management-plan';
import type { PerformanceMeasurementBaseline } from '@domain/entities/performance-baseline';
import { isoDate, isoDateOrNull, parseIsoDate } from '@application/mappers/iso-date';
import type {
  PlanBaselinesDto,
  PlanComponentKey,
  ProjectManagementPlanDto,
  ProjectManagementPlanInput,
} from '@shared/index';

/** Traductions du plan de management du projet : domaine ⇄ saisie ⇄ lecture. */

export function projectManagementPlanToInput(plan: ProjectManagementPlan): ProjectManagementPlanInput {
  const { props } = plan;
  return {
    preparedOn: isoDate(props.preparedOn),
    lifeCycle: { ...props.lifeCycle, phases: props.lifeCycle.phases.map((phase) => ({ ...phase })) },
    developmentApproach: { ...props.developmentApproach },
    changeManagement: { ...props.changeManagement },
    configurationManagement: { ...props.configurationManagement },
  };
}

export function inputToProjectManagementPlan(projectId: string, input: ProjectManagementPlanInput): ProjectManagementPlan {
  return ProjectManagementPlan.create({
    ...input,
    projectId,
    preparedOn: parseIsoDate(input.preparedOn),
  });
}

export function toPerformanceBaselineDto(baseline: PerformanceMeasurementBaseline): PlanBaselinesDto['performance'] {
  return {
    rows: baseline.rows.map((row) => ({
      ...row,
      start: isoDateOrNull(row.start),
      finish: isoDateOrNull(row.finish),
    })),
    unallocated: baseline.unallocated,
    contingencyReserve: baseline.contingencyReserve,
    total: baseline.total,
    managementReserve: baseline.managementReserve,
  };
}

/** Domaine → lecture, avec le contexte relu dans les autres documents du projet. */
export function toProjectManagementPlanDto(
  plan: ProjectManagementPlan,
  context: {
    references: ProjectManagementPlanDto['references'];
    methodology: ProjectManagementPlanDto['developmentApproach']['kind'];
    components: Omit<Record<PlanComponentKey, boolean>, keyof ProjectManagementPlan['drafted']>;
    baselines: PlanBaselinesDto;
  },
): ProjectManagementPlanDto {
  const input = projectManagementPlanToInput(plan);
  return {
    projectId: plan.projectId,
    ...input,
    developmentApproach: { ...input.developmentApproach, kind: context.methodology },
    references: context.references,
    components: { ...context.components, ...plan.drafted },
    baselines: context.baselines,
  };
}
