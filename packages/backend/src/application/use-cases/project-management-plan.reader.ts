import type { CommunicationPlan } from '@domain/entities/communication-plan';
import type { ProjectRepository } from '@application/ports/out/project.repository';
import type { CostEstimates } from '@domain/entities/cost-estimates';
import type { ManagementPlans } from '@domain/entities/management-plans';
import { PerformanceMeasurementBaseline } from '@domain/entities/performance-baseline';
import type { ProcurementPlan } from '@domain/entities/procurement-plan';
import type { ProjectManagementPlan } from '@domain/entities/project-management-plan';
import type { QualityManagementPlan } from '@domain/entities/quality-management-plan';
import type { ResourceManagementPlan } from '@domain/entities/resource-management-plan';
import type { RiskManagementPlan } from '@domain/entities/risk-management-plan';
import type { ScopeStatement } from '@domain/entities/scope-statement';
import type { StakeholderEngagementPlan } from '@domain/entities/stakeholder-engagement-plan';
import { isoDate } from '@application/mappers/iso-date';
import {
  toPerformanceBaselineDto,
  toProjectManagementPlanDto,
} from '@application/mappers/project-management-plan.mappers';
import type { ProjectCharterRepository } from '@application/ports/out/project-charter.repository';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import type { ProjectPlanRepository } from '@application/ports/out/project-plan.repository';
import type { PlanBaselinesDto, ProjectManagementPlanDto } from '@shared/index';

/** Documents dont le plan de management intègre l'état ou les références de base. */
export interface PlanComponentSources {
  projects: ProjectRepository;
  charters: ProjectCharterRepository;
  managementPlans: ProjectDocumentRepository<ManagementPlans>;
  qualityPlans: ProjectDocumentRepository<QualityManagementPlan>;
  resourcePlans: ProjectDocumentRepository<ResourceManagementPlan>;
  communicationPlans: ProjectDocumentRepository<CommunicationPlan>;
  procurementPlans: ProjectDocumentRepository<ProcurementPlan>;
  riskPlans: ProjectDocumentRepository<RiskManagementPlan>;
  engagementPlans: ProjectDocumentRepository<StakeholderEngagementPlan>;
  scopeStatements: ProjectDocumentRepository<ScopeStatement>;
  schedules: ProjectPlanRepository;
  costEstimates: ProjectDocumentRepository<CostEstimates>;
}

/**
 * Lecture du plan de management : chaque composant tenu ailleurs (plans subsidiaires,
 * énoncé du périmètre, échéancier, estimations) est relu à chaque lecture, ainsi que le chef
 * de projet et le sponsor de la charte. Les références de base en sont déduites.
 */
export function projectManagementPlanReader(sources: PlanComponentSources) {
  return async (plan: ProjectManagementPlan): Promise<ProjectManagementPlanDto> => {
    const id = plan.projectId;
    const [
      project,
      charter,
      managementPlans,
      quality,
      resource,
      communication,
      risk,
      procurement,
      engagement,
      statement,
      schedule,
      estimates,
    ] = await Promise.all([
      sources.projects.findById(id),
      sources.charters.findByProjectId(id),
      sources.managementPlans.findByProjectId(id),
      sources.qualityPlans.findByProjectId(id),
      sources.resourcePlans.findByProjectId(id),
      sources.communicationPlans.findByProjectId(id),
      sources.riskPlans.findByProjectId(id),
      sources.procurementPlans.findByProjectId(id),
      sources.engagementPlans.findByProjectId(id),
      sources.scopeStatements.findByProjectId(id),
      sources.schedules.findByProjectId(id),
      sources.costEstimates.findByProjectId(id),
    ]);

    const tasks = schedule?.tasks ?? [];
    const codes = tasks.map((task) => task.wbs.value);
    // Lot de travaux : élément de la WBS sans descendant.
    const workPackages = codes.filter((code) => !codes.some((other) => other.startsWith(`${code}.`))).length;
    const start = schedule?.startDate ?? null;
    const finish = schedule?.endDate ?? null;

    const baselines: PlanBaselinesDto = {
      scope: {
        statementDrafted: statement !== null,
        deliverables: statement?.props.deliverables.length ?? 0,
        wbsElements: codes.length,
        workPackages,
      },
      schedule:
        start && finish
          ? { start: isoDate(start), finish: isoDate(finish), durationDays: schedule!.durationDays!, tasks: tasks.length }
          : null,
      cost: estimates ? estimates.summary : null,
      performance:
        estimates && tasks.length > 0 ? toPerformanceBaselineDto(PerformanceMeasurementBaseline.from(estimates, tasks)) : null,
    };

    const plans = managementPlans?.plans ?? {};
    return toProjectManagementPlanDto(plan, {
      methodology: project?.methodology ?? 'PREDICTIVE',
      references: {
        projectManagerId: charter?.props.projectManager.resourceId ?? null,
        sponsorId: charter?.props.sponsor.resourceId ?? null,
      },
      components: {
        SCOPE_MANAGEMENT: Boolean(plans.SCOPE_MANAGEMENT),
        REQUIREMENTS_MANAGEMENT: Boolean(plans.REQUIREMENTS_MANAGEMENT),
        SCHEDULE_MANAGEMENT: Boolean(plans.SCHEDULE_MANAGEMENT),
        FINANCIAL_MANAGEMENT: Boolean(plans.FINANCIAL_MANAGEMENT),
        QUALITY_MANAGEMENT: quality !== null,
        RESOURCE_MANAGEMENT: resource !== null,
        COMMUNICATIONS_MANAGEMENT: communication !== null,
        RISK_MANAGEMENT: risk !== null,
        PROCUREMENT_MANAGEMENT: procurement !== null,
        STAKEHOLDER_ENGAGEMENT: engagement !== null,
        SCOPE_BASELINE: statement !== null && codes.length > 0,
        SCHEDULE_BASELINE: baselines.schedule !== null,
        COST_BASELINE: estimates !== null,
        PERFORMANCE_BASELINE: statement !== null && baselines.schedule !== null && estimates !== null,
      },
      baselines,
    });
  };
}
