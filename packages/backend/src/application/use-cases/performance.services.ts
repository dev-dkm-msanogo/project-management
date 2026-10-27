import type { ActualCosts } from '@domain/entities/actual-costs';
import { ActualCosts as ActualCostsRegister } from '@domain/entities/actual-costs';
import { CostBaseline } from '@domain/entities/cost-baseline';
import type { CostEstimates } from '@domain/entities/cost-estimates';
import { EarnedValue } from '@domain/entities/earned-value';
import type { ExecutiveStatusReport } from '@domain/entities/executive-status-report';
import { IssueLog } from '@domain/entities/issue-log';
import { trackPlan, type TaskTracking } from '@domain/entities/plan-progress';
import type { ProjectPlan } from '@domain/entities/project-plan';
import { milestoneStatuses } from '@domain/entities/report-status';
import { RiskRegister } from '@domain/entities/risk-register';
import type { ScheduleModel } from '@domain/entities/schedule-model';
import { DomainError } from '@domain/errors/domain-errors';
import { canEditContent, type Role } from '@domain/value-objects/role';
import {
  DocumentNotFoundError,
  ForbiddenError,
  NotFoundError,
  PlanNotFoundError,
} from '@application/errors/application-errors';
import { toProjectPlanDto } from '@application/mappers/plan-to-dto.mapper';
import { inputToTaskProgress, toTaskProgressDto } from '@application/mappers/performance.mappers';
import type { Requester } from '@application/ports/in/project.use-cases';
import type { BaselineRepository } from '@application/ports/out/baseline.repository';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import type { ProjectPlanRepository } from '@application/ports/out/project-plan.repository';
import type { ResourceDirectoryRepository } from '@application/ports/out/resource-directory.repository';
import type { RiskRegisterRepository } from '@application/ports/out/risk-register.repository';
import type { StatusReportRepository } from '@application/ports/out/status-report.repository';
import type { TaskProgressRepository } from '@application/ports/out/task-progress.repository';
import type { UserRepository } from '@application/ports/out/user.repository';
import { readReport } from '@application/use-cases/executive-report.services';
import { loadOrEmpty } from '@application/use-cases/load-or-empty';
import type { ProjectAccess } from '@application/use-cases/project-access.services';
import type {
  ActualCostsDto,
  EarnedValueDto,
  ExecutiveStatusReportDto,
  MyTasksDto,
  PortfolioDto,
  PortfolioProjectDto,
  ProjectPlanDto,
  TaskProgressDto,
  TaskProgressInput,
} from '@shared/index';

/**
 * Pilotage du réel : avancement des tâches (saisi par la personne affectée ou un éditeur),
 * dépenses réelles, valeur acquise et tableau de bord du portefeuille.
 */

/** Horloge injectée : le « jour » des contrôles et des retards (testable). */
export type Clock = () => Date;

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);
const parseIsoDate = (iso: string): Date => new Date(`${iso}T00:00:00Z`);
const startOfDay = (date: Date): Date => parseIsoDate(isoDate(date));

async function resourceNames(directory: ResourceDirectoryRepository): Promise<Map<string, string>> {
  return new Map((await directory.list()).map((resource) => [resource.props.id, resource.props.name]));
}

/** Plan lu avec le nom des personnes affectées et l'avancement effectif de chaque élément. */
export function projectPlanReader(directory: ResourceDirectoryRepository, progress: TaskProgressRepository, clock: Clock) {
  return async (plan: ProjectPlan): Promise<ProjectPlanDto> => {
    const [names, measures] = await Promise.all([resourceNames(directory), progress.listByProject(plan.project.id)]);
    return toProjectPlanDto(plan, trackPlan(plan, measures, clock()), names);
  };
}

/**
 * Met à jour l'avancement d'une tâche élémentaire. Un éditeur met à jour toute tâche ; une autre
 * personne, seulement les tâches affectées à la ressource du référentiel rattachée à son compte.
 */
export class UpdateTaskProgressService {
  constructor(
    private readonly plans: ProjectPlanRepository,
    private readonly progress: TaskProgressRepository,
    private readonly directory: ResourceDirectoryRepository,
    private readonly users: UserRepository,
    private readonly clock: Clock,
  ) {}

  async execute(command: {
    projectId: string;
    wbs: string;
    input: TaskProgressInput;
    actor: { id: string; role: Role };
  }): Promise<TaskProgressDto> {
    const plan = await this.plans.findByProjectId(command.projectId);
    if (!plan) throw new PlanNotFoundError(command.projectId);
    const task = plan.tasks.find((candidate) => candidate.wbs.value === command.wbs);
    if (!task) throw new NotFoundError(`Aucune tâche ${command.wbs} dans la WBS du projet.`);
    if (plan.tasks.some((other) => other.wbs.value.startsWith(`${command.wbs}.`))) {
      throw new DomainError(
        `L'avancement de ${command.wbs} se calcule à partir de ses sous-tâches : mettez à jour les tâches élémentaires.`,
      );
    }
    if (!canEditContent(command.actor.role)) {
      const mine = (await this.directory.list()).filter((resource) => resource.props.userId === command.actor.id);
      if (!task.assigneeId || !mine.some((resource) => resource.props.id === task.assigneeId)) {
        throw new ForbiddenError("Vous ne pouvez mettre à jour que l'avancement des tâches qui vous sont affectées.");
      }
    }
    const user = await this.users.findById(command.actor.id);
    const now = this.clock();
    const progress = inputToTaskProgress(
      command.projectId,
      command.wbs,
      command.input,
      { by: user?.name ?? 'Utilisateur inconnu', at: now },
      startOfDay(now),
    );
    await this.progress.save(progress);
    return toTaskProgressDto(progress);
  }
}

/** « Mes tâches » : tâches élémentaires affectées à la ressource du compte, dans les projets qu'il voit. */
export class GetMyTasksService {
  constructor(
    private readonly access: ProjectAccess,
    private readonly plans: ProjectPlanRepository,
    private readonly progress: TaskProgressRepository,
    private readonly directory: ResourceDirectoryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(query: { requester: Requester }): Promise<MyTasksDto> {
    const mine = (await this.directory.list()).filter((resource) => resource.props.userId === query.requester.id);
    if (mine.length === 0) return { resourceName: null, tasks: [] };
    const ids = new Set(mine.map((resource) => resource.props.id));
    const today = this.clock();
    const tasks: MyTasksDto['tasks'] = [];
    for (const { project } of await this.access.visibleProjects(query.requester)) {
      const plan = await this.plans.findByProjectId(project.id);
      if (!plan) continue;
      const tracking = trackPlan(plan, await this.progress.listByProject(project.id), today);
      for (const item of tracking) {
        if (!item.isLeaf || !item.task.assigneeId || !ids.has(item.task.assigneeId)) continue;
        tasks.push({
          projectId: project.id,
          projectName: project.name,
          wbs: item.task.wbs.value,
          name: item.task.name,
          start: item.task.start ? isoDate(item.task.start) : null,
          end: item.task.end ? isoDate(item.task.end) : null,
          status: item.status,
          percentComplete: Math.round(item.percentComplete),
          progress: item.progress ? toTaskProgressDto(item.progress) : null,
          overdue: item.overdue,
        });
      }
    }
    return { resourceName: mine[0]!.props.name, tasks };
  }
}

/** Dépenses réelles : imputées à un élément de la WBS, jamais futures ; synthèse face au budget estimé. */
export function actualCostsServices(
  plans: ProjectPlanRepository,
  estimates: ProjectDocumentRepository<CostEstimates>,
  clock: Clock,
) {
  return {
    toDto: async (costs: ActualCosts): Promise<ActualCostsDto> => {
      const [plan, estimated] = await Promise.all([plans.findByProjectId(costs.projectId), estimates.findByProjectId(costs.projectId)]);
      const names = new Map((plan?.tasks ?? []).map((task) => [task.wbs.value, task.name]));
      const total = costs.totalUpTo();
      const budget = estimated ? estimated.summary.direct : null;
      return {
        projectId: costs.projectId,
        entries: costs.entries.map(({ props }) => ({ ...props, date: isoDate(props.date) })),
        summary: {
          total,
          labor: costs.totalOf('LABOR'),
          physical: costs.totalOf('PHYSICAL'),
          budget,
          consumedPct: budget ? Math.round((total / budget) * 1000) / 10 : null,
        },
        wbsNames: Object.fromEntries(costs.entries.map((entry) => [entry.props.wbsCode, names.get(entry.props.wbsCode) ?? entry.props.wbsCode])),
      };
    },
    beforeSave: async (costs: ActualCosts): Promise<void> => {
      const future = costs.datedAfter(clock());
      if (future.length > 0) {
        throw new DomainError(`Dépense(s) datée(s) dans le futur : ${future.join(', ')}.`);
      }
      const plan = await plans.findByProjectId(costs.projectId);
      const known = new Set((plan?.tasks ?? []).map((task) => task.wbs.value));
      const unknown = [...new Set(costs.entries.map((entry) => entry.props.wbsCode).filter((code) => !known.has(code)))];
      if (unknown.length > 0) {
        throw new DomainError(`Dépenses : élément(s) absent(s) de la WBS de l'échéancier : ${unknown.join(', ')}.`);
      }
    },
  };
}

export interface PerformanceSources {
  plans: ProjectPlanRepository;
  estimates: ProjectDocumentRepository<CostEstimates>;
  /** Références de base approuvées : la mesure s'y rapporte, même pendant une révision du plan. */
  baselines: BaselineRepository;
  progress: TaskProgressRepository;
  actualCosts: ProjectDocumentRepository<ActualCosts>;
}

/** Date d'état proposée : la mesure d'avancement la plus récente, sinon aujourd'hui. */
function defaultStatusDate(tracking: readonly TaskTracking[], today: Date): Date {
  const measured = tracking.flatMap((item) => (item.progress ? [item.progress.props.asOf.getTime()] : []));
  return measured.length > 0 ? new Date(Math.max(...measured)) : startOfDay(today);
}

/**
 * Valeur acquise d'un projet, mesurée contre la dernière référence de base approuvée (WBS datée et
 * estimations), sinon contre les documents en cours ; `null` sans WBS ou sans estimations.
 */
export async function measureProject(sources: PerformanceSources, projectId: string, today: Date, statusDate?: Date) {
  const [approved, current, currentEstimates] = await Promise.all([
    sources.baselines.latest(projectId),
    sources.plans.findByProjectId(projectId),
    sources.estimates.findByProjectId(projectId),
  ]);
  const plan = approved?.plan ?? current;
  const estimates = approved?.estimates ?? currentEstimates;
  if (!plan || !estimates) return null;
  const [measures, actuals] = await Promise.all([
    sources.progress.listByProject(projectId),
    loadOrEmpty(sources.actualCosts, projectId, ActualCostsRegister.empty),
  ]);
  const tracking = trackPlan(plan, measures, today);
  const fallback = defaultStatusDate(tracking, today);
  const at = statusDate ?? fallback;
  const baseline = CostBaseline.from(estimates, plan.tasks.map((task) => ({ wbs: task.wbs.value, start: task.start, end: task.end })));
  return {
    estimates,
    tracking,
    defaultDate: fallback,
    statusDate: at,
    approved: approved ? { revision: approved.revision, approvedAt: approved.approvedAt } : null,
    value: EarnedValue.measure({ estimates, baseline, tracking, actuals, statusDate: at }),
  };
}

export class GetEarnedValueService {
  constructor(
    private readonly sources: PerformanceSources,
    private readonly clock: Clock,
  ) {}

  async execute(query: { projectId: string; statusDate?: string }): Promise<EarnedValueDto> {
    const today = this.clock();
    if (query.statusDate && query.statusDate > isoDate(today)) {
      throw new DomainError("La date d'état ne peut pas être dans le futur.");
    }
    const measured = await measureProject(
      this.sources,
      query.projectId,
      today,
      query.statusDate ? parseIsoDate(query.statusDate) : undefined,
    );
    if (!measured) {
      throw new DocumentNotFoundError(
        "La valeur acquise s'appuie sur la WBS datée et les estimations des coûts : rédigez-les d'abord.",
      );
    }
    const { value, estimates } = measured;
    return {
      projectId: query.projectId,
      statusDate: isoDate(measured.statusDate),
      defaultStatusDate: isoDate(measured.defaultDate),
      baseline: measured.approved
        ? { revision: measured.approved.revision, approvedAt: measured.approved.approvedAt.toISOString() }
        : null,
      bac: value.bac,
      contingencyReserve: estimates.summary.contingencyReserve,
      managementReserve: estimates.summary.managementReserve,
      indicators: value.indicators,
      elements: [...value.elements],
      periods: [...value.periods],
      unmappedBudget: value.unmappedBudget,
    };
  }
}

interface PortfolioSources extends PerformanceSources {
  reports: StatusReportRepository;
  risks: RiskRegisterRepository;
  issueLogs: ProjectDocumentRepository<IssueLog>;
  scheduleModels: ProjectDocumentRepository<ScheduleModel>;
  /** Rapport exécutif du dernier mois : sa santé (figée s'il est publié, sinon calculée ou ajustée). */
  reportDto: (report: ExecutiveStatusReport) => Promise<ExecutiveStatusReportDto>;
}

/** Tableau de bord : santé, avancement, performance et alertes de chaque projet visible du compte. */
export class GetPortfolioService {
  constructor(
    private readonly sources: PortfolioSources,
    private readonly access: ProjectAccess,
    private readonly clock: Clock,
  ) {}

  async execute(query: { requester: Requester }): Promise<PortfolioDto> {
    const visible = await this.access.visibleProjects(query.requester);
    return { projects: await Promise.all(visible.map(({ project, access }) => this.summarize(project.id, project, access))) };
  }

  private async summarize(
    projectId: string,
    project: {
      name: string;
      description: string | null;
      status: PortfolioProjectDto['status'];
      methodology: PortfolioProjectDto['methodology'];
    },
    access: PortfolioProjectDto['access'],
  ): Promise<PortfolioProjectDto> {
    const today = this.clock();
    const { sources } = this;
    const [plan, measured, report, risks, issues, model] = await Promise.all([
      sources.plans.findByProjectId(projectId),
      measureProject(sources, projectId, today),
      sources.reports.findLatest(projectId),
      loadOrEmpty(sources.risks, projectId, RiskRegister.empty),
      loadOrEmpty(sources.issueLogs, projectId, IssueLog.empty),
      sources.scheduleModels.findByProjectId(projectId),
    ]);
    const tracking = plan ? trackPlan(plan, await sources.progress.listByProject(projectId), today) : [];
    const leaves = tracking.filter((item) => item.isLeaf);
    const durationWeighted = () => {
      const weight = leaves.reduce((sum, item) => sum + (item.task.durationDays ?? 1), 0);
      return weight === 0 ? 0 : leaves.reduce((sum, item) => sum + (item.task.durationDays ?? 1) * item.percentComplete, 0) / weight;
    };
    const actuals = await loadOrEmpty(sources.actualCosts, projectId, ActualCostsRegister.empty);
    const openRisks = risks.risks.filter((risk) => risk.isOpen);

    return {
      id: projectId,
      name: project.name,
      description: project.description,
      status: project.status,
      methodology: project.methodology,
      access,
      rag: report ? (await readReport(report, sources.reportDto)).overall.rag : null,
      plannedStart: plan?.startDate ? isoDate(plan.startDate) : null,
      plannedEnd: plan?.endDate ? isoDate(plan.endDate) : null,
      percentComplete: !plan
        ? null
        : Math.round(measured && measured.value.bac > 0 ? measured.value.indicators.earnedPct : durationWeighted()),
      spi: measured?.value.indicators.spi ?? null,
      cpi: measured?.value.indicators.cpi ?? null,
      bac: measured?.value.bac ?? null,
      ac: actuals.totalUpTo(),
      overdueTasks: leaves.filter((item) => item.overdue).length,
      openRisks: openRisks.length,
      criticalRisks: openRisks.filter((risk) => risk.level === 'CRITICAL').length,
      openIssues: issues.issues.filter((issue) => issue.isOpen).length,
      nextMilestone: nextMilestone(model, today),
    };
  }
}

/** Prochain jalon de l'échéancier : le premier non atteint aujourd'hui (en retard ou à venir). */
function nextMilestone(model: ScheduleModel | null, today: Date): { name: string; date: string } | null {
  const next = milestoneStatuses(model?.props.milestones ?? [], today).find((milestone) => milestone.state !== 'COMPLETE');
  return next ? { name: next.name, date: isoDate(next.planned) } : null;
}

/**
 * Fige les références de base de performance à l'approbation du plan de management : la WBS datée et
 * les estimations des coûts telles qu'approuvées (sans WBS, rien à figer).
 */
export function baselineCapture(
  plans: ProjectPlanRepository,
  estimates: ProjectDocumentRepository<CostEstimates>,
  baselines: BaselineRepository,
) {
  return async (projectId: string, revision: number, approvedAt: Date): Promise<void> => {
    const [plan, costs] = await Promise.all([plans.findByProjectId(projectId), estimates.findByProjectId(projectId)]);
    if (plan) await baselines.save({ projectId, revision, approvedAt, plan, estimates: costs });
  };
}
