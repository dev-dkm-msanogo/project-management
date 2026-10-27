import { ActualCosts } from '@domain/entities/actual-costs';
import { ChangeLog } from '@domain/entities/change-log';
import type { ExecutiveStatusReport } from '@domain/entities/executive-status-report';
import { IssueLog } from '@domain/entities/issue-log';
import { trackPlan } from '@domain/entities/plan-progress';
import { RequirementsRegister } from '@domain/entities/requirements-register';
import {
  changeSummary,
  costStatus,
  deliveryForecast,
  milestoneStatuses,
  overallRag,
  pendingDecisions,
  scheduleStatus,
  scopeStatus,
} from '@domain/entities/report-status';
import { RiskRegister } from '@domain/entities/risk-register';
import type { ScheduleModel } from '@domain/entities/schedule-model';
import { toExecutiveStatusReportDto, type ReportFacts } from '@application/mappers/report-to-dto.mapper';
import type { ProjectCharterRepository } from '@application/ports/out/project-charter.repository';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import type { ProjectRepository } from '@application/ports/out/project.repository';
import type { RiskRegisterRepository } from '@application/ports/out/risk-register.repository';
import { charterBudget } from '@application/use-cases/cost.services';
import { loadOrEmpty } from '@application/use-cases/load-or-empty';
import { measureProject, type PerformanceSources } from '@application/use-cases/performance.services';
import type { ExecutiveStatusReportDto } from '@shared/index';

export interface ReportSources extends PerformanceSources {
  projects: ProjectRepository;
  risks: RiskRegisterRepository;
  charters: ProjectCharterRepository;
  requirements: ProjectDocumentRepository<RequirementsRegister>;
  scheduleModels: ProjectDocumentRepository<ScheduleModel>;
  changeLogs: ProjectDocumentRepository<ChangeLog>;
  issueLogs: ProjectDocumentRepository<IssueLog>;
}

const day = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Lecture du rapport exécutif alimenté par les éléments du projet : chaque section chiffrée est
 * calculée à la date du rapport (jalons de l'échéancier, exigences, avancement et valeur acquise,
 * dépenses réelles, registres des risques, des modifications et des problèmes) ; les parties
 * rédigées viennent du rapport enregistré. Vue vivante : recalculée à chaque lecture.
 */
export function executiveReportReader(sources: ReportSources) {
  return async (report: ExecutiveStatusReport): Promise<ExecutiveStatusReportDto> => {
    const projectId = report.projectId;
    const statusDate = report.reportDate;
    const [project, plan, measured, measures, actuals, risks, requirements, model, changes, issues, approvedBudget, estimates] =
      await Promise.all([
        sources.projects.findById(projectId),
        sources.plans.findByProjectId(projectId),
        measureProject(sources, projectId, statusDate, statusDate),
        sources.progress.listByProject(projectId),
        loadOrEmpty(sources.actualCosts, projectId, ActualCosts.empty),
        loadOrEmpty(sources.risks, projectId, RiskRegister.empty),
        loadOrEmpty(sources.requirements, projectId, RequirementsRegister.empty),
        sources.scheduleModels.findByProjectId(projectId),
        loadOrEmpty(sources.changeLogs, projectId, ChangeLog.empty),
        loadOrEmpty(sources.issueLogs, projectId, IssueLog.empty),
        charterBudget(sources.charters, projectId),
        sources.estimates.findByProjectId(projectId),
      ]);

    // Avancement et retards évalués à la date du rapport.
    const tracking = measured?.tracking ?? (plan ? trackPlan(plan, measures, statusDate) : []);
    const indicators = measured?.value.indicators ?? null;
    const spi = indicators?.spi ?? null;
    const lastMeasure = measures.reduce<Date | null>(
      (latest, measure) => (!latest || measure.props.asOf > latest ? measure.props.asOf : latest),
      null,
    );
    const budget =
      approvedBudget !== null
        ? { amount: approvedBudget, label: 'Budget approuvé (charte)' }
        : estimates
          ? { amount: estimates.summary.costBaseline, label: 'Référence des coûts' }
          : null;

    const scope = scopeStatus(requirements);
    const schedule = scheduleStatus(tracking, statusDate, spi);
    const cost = costStatus(budget, actuals.totalUpTo(statusDate), indicators?.cpi ?? null, indicators ? indicators.eac : null);

    const facts: ReportFacts = {
      projectName: project?.name ?? projectId,
      progressMeasuredOn: lastMeasure,
      progressStale: plan !== null && (!lastMeasure || day(lastMeasure) < day(report.reportingPeriod.from)),
      computedRag: overallRag([scope.rag, schedule.rag, cost.rag]),
      milestones: model ? milestoneStatuses(model.props.milestones, statusDate) : [],
      scope,
      schedule,
      cost,
      risks,
      pendingDecisions: pendingDecisions(changes, issues, statusDate),
      changes: changeSummary(changes, statusDate),
      measures: {
        progressPct: indicators && measured!.value.bac > 0 ? indicators.earnedPct : null,
        spi,
        cpi: indicators?.cpi ?? null,
        eac: indicators?.eac ?? null,
        bac: measured?.value.bac ?? null,
        lateTasks: plan ? tracking.filter((item) => item.isLeaf && item.overdue).length : null,
        leafTasks: tracking.filter((item) => item.isLeaf).length,
        criticalRisks: risks.risks.filter((risk) => risk.isOpen && risk.level === 'CRITICAL').length,
        openIssues: issues.issues.filter((issue) => issue.isOpen && day(issue.props.raisedOn) <= day(statusDate)).length,
        requirements: requirements.requirements.length > 0 ? requirements.metrics : null,
      },
      forecast: deliveryForecast(plan?.startDate ?? null, plan?.endDate ?? null, spi),
    };
    return toExecutiveStatusReportDto(report, facts);
  };
}
