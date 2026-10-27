import type { BenefitsPlan } from '@domain/entities/benefits-plan';
import type { ClosureReport } from '@domain/entities/closure-report';
import type { IssueLog } from '@domain/entities/issue-log';
import type { LessonsLearned } from '@domain/entities/lessons-learned';
import type { ProjectPlan } from '@domain/entities/project-plan';
import { NotFoundError } from '@application/errors/application-errors';
import { closureReportToInput } from '@application/mappers/closure-report.mappers';
import { isoDate, isoDateOrNull, parseIsoDate } from '@application/mappers/iso-date';
import type { BaselineRepository } from '@application/ports/out/baseline.repository';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import type { ProjectPlanRepository } from '@application/ports/out/project-plan.repository';
import type { RiskRegisterRepository } from '@application/ports/out/risk-register.repository';
import type {
  ClosureCostFactsDto,
  ClosureReportDto,
  ClosureScheduleFactsDto,
  DeliverablesDto,
  EarnedValueDto,
  ProjectPlanDto,
} from '@shared/index';

interface ClosureSources {
  plans: ProjectPlanRepository;
  planDto: (plan: ProjectPlan) => Promise<ProjectPlanDto>;
  baselines: BaselineRepository;
  earnedValue: { execute(query: { projectId: string }): Promise<EarnedValueDto> };
  deliverables: (projectId: string) => Promise<DeliverablesDto>;
  risks: RiskRegisterRepository;
  issueLogs: ProjectDocumentRepository<IssueLog>;
  benefitsPlans: ProjectDocumentRepository<BenefitsPlan>;
  lessonsLearned: ProjectDocumentRepository<LessonsLearned>;
}

const MS_PER_DAY = 86_400_000;

/** Fin de la référence approuvée (sinon de la WBS), fin réelle si tout est terminé, sinon prévue. */
async function scheduleFacts(sources: ClosureSources, projectId: string): Promise<ClosureScheduleFactsDto> {
  const [plan, baseline] = await Promise.all([sources.plans.findByProjectId(projectId), sources.baselines.latest(projectId)]);
  const dto = plan ? await sources.planDto(plan) : null;
  const leaves = (dto?.tasks ?? []).filter((task) => task.isLeaf);
  const finished = leaves.length > 0 && leaves.every((task) => task.status === 'COMPLETE');
  const actual = leaves.map((task) => task.actualFinish ?? task.end).filter((date): date is string => date !== null);
  const finish = finished && actual.length > 0 ? actual.sort().at(-1)! : (dto?.endDate ?? null);
  const baselineFinish = isoDateOrNull((baseline?.plan ?? plan)?.endDate ?? null);
  const roots = (dto?.tasks ?? []).filter((task) => task.level === 1);
  const weight = roots.reduce((sum, task) => sum + (task.durationDays ?? 0), 0);
  return {
    baselineFinish,
    finish,
    finished,
    varianceDays:
      baselineFinish && finish ? Math.round((parseIsoDate(finish).getTime() - parseIsoDate(baselineFinish).getTime()) / MS_PER_DAY) : null,
    percentComplete:
      weight > 0
        ? Math.round(roots.reduce((sum, task) => sum + task.percentComplete * (task.durationDays ?? 0), 0) / weight)
        : null,
  };
}

/** Coûts à l'achèvement, tirés de la valeur acquise ; absents sans WBS datée ni estimations. */
async function costFacts(sources: ClosureSources, projectId: string): Promise<ClosureCostFactsDto | null> {
  try {
    const value = await sources.earnedValue.execute({ projectId });
    return {
      bac: value.bac,
      ac: value.indicators.ac,
      eac: value.indicators.eac,
      variance: value.indicators.ac - value.bac,
      contingencyReserve: value.contingencyReserve,
      managementReserve: value.managementReserve,
      cpi: value.indicators.cpi,
    };
  } catch (error) {
    if (error instanceof NotFoundError) return null;
    throw error;
  }
}

/**
 * Rapport de clôture : le bilan rédigé, complété des faits relus dans le projet — écarts de délai et
 * de coût, livrables acceptés, risques et problèmes encore ouverts, bénéfices et leçons apprises.
 */
export function closureReportServices(sources: ClosureSources) {
  return {
    toDto: async (report: ClosureReport): Promise<ClosureReportDto> => {
      const { projectId } = report;
      const [schedule, cost, deliverables, risks, issues, benefits, lessons] = await Promise.all([
        scheduleFacts(sources, projectId),
        costFacts(sources, projectId),
        sources.deliverables(projectId),
        sources.risks.findByProjectId(projectId),
        sources.issueLogs.findByProjectId(projectId),
        sources.benefitsPlans.findByProjectId(projectId),
        sources.lessonsLearned.findByProjectId(projectId),
      ]);
      const { summary } = deliverables;
      return {
        projectId,
        ...closureReportToInput(report),
        facts: {
          schedule,
          cost,
          deliverables: {
            total: summary.total,
            accepted: summary.accepted,
            rejected: summary.rejected,
            pending: summary.total - summary.accepted - summary.rejected,
          },
          openRisks: (risks?.openRisks ?? []).map((risk) => ({ code: risk.code, title: risk.title })),
          openIssues: (issues?.issues ?? [])
            .filter((issue) => issue.isOpen)
            .map((issue) => ({ code: issue.code, description: issue.props.description })),
          plannedBenefits: (benefits?.props.benefits ?? []).map((benefit) => benefit.name),
          lessons: {
            total: lessons?.lessons.length ?? 0,
            transferredOn: lessons?.transferredOn ? isoDate(lessons.transferredOn) : null,
          },
        },
      };
    },
  };
}
