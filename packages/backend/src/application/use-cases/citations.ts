import type { ActualCosts } from '@domain/entities/actual-costs';
import type { DeliverablesRegister } from '@domain/entities/deliverables-register';
import type { ProductBacklog } from '@domain/entities/product-backlog';
import type { IssueLog } from '@domain/entities/issue-log';
import type { QualityReport } from '@domain/entities/quality-report';
import type { ScheduleModel } from '@domain/entities/schedule-model';
import type { StakeholderEngagementPlan } from '@domain/entities/stakeholder-engagement-plan';
import type { StakeholderMapping } from '@domain/entities/stakeholder-mapping';
import type { WbsDictionary } from '@domain/entities/wbs-dictionary';
import type { AssumptionLogRepository } from '@application/ports/out/assumption-log.repository';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import type { TaskProgressRepository } from '@application/ports/out/task-progress.repository';
import type { Citation, CitationSource } from '@application/use-cases/reference-guard';

/**
 * Citations entre documents d'un projet, lues dans le document qui cite : elles alimentent les
 * contrôles « RESTRICT » des documents cités (voir `referenceGuard`).
 */

const cite = (code: string | null, document: string, from?: string): Citation[] =>
  code === null ? [] : [{ code, document, ...(from ? { from } : {}) }];

export const risksCitedByAssumptions =
  (assumptions: AssumptionLogRepository): CitationSource =>
  async (projectId) =>
    ((await assumptions.findByProjectId(projectId))?.entries ?? []).flatMap((entry) =>
      cite(entry.props.riskCode, 'le registre des hypothèses et contraintes', entry.code),
    );

export const risksCitedByIssues =
  (issueLogs: ProjectDocumentRepository<IssueLog>): CitationSource =>
  async (projectId) =>
    ((await issueLogs.findByProjectId(projectId))?.issues ?? []).flatMap((issue) =>
      cite(issue.props.riskCode, 'le journal des problèmes', issue.code),
    );

export const changesCitedByIssues =
  (issueLogs: ProjectDocumentRepository<IssueLog>): CitationSource =>
  async (projectId) =>
    ((await issueLogs.findByProjectId(projectId))?.issues ?? []).flatMap((issue) =>
      cite(issue.props.changeCode, 'le journal des problèmes', issue.code),
    );

export const stakeholdersCitedByEngagementPlan =
  (plans: ProjectDocumentRepository<StakeholderEngagementPlan>): CitationSource =>
  async (projectId) =>
    ((await plans.findByProjectId(projectId))?.props.approaches ?? []).flatMap((approach) =>
      cite(approach.stakeholderCode, "le plan d'engagement des parties prenantes"),
    );

export const stakeholdersCitedByMapping =
  (mappings: ProjectDocumentRepository<StakeholderMapping>): CitationSource =>
  async (projectId) =>
    ((await mappings.findByProjectId(projectId))?.props.entries ?? []).flatMap((entry) =>
      cite(entry.stakeholderCode, 'la cartographie des parties prenantes'),
    );

export const metricsCitedByQualityReport =
  (reports: ProjectDocumentRepository<QualityReport>): CitationSource =>
  async (projectId) =>
    ((await reports.findByProjectId(projectId))?.props.statuses ?? []).flatMap((entry) =>
      cite(entry.metricCode, 'le rapport qualité'),
    );

export const wbsCitedByScheduleModel =
  (models: ProjectDocumentRepository<ScheduleModel>): CitationSource =>
  async (projectId) =>
    ((await models.findByProjectId(projectId))?.props.activities ?? []).flatMap((activity) =>
      cite(activity.wbsCode, "le modèle d'ordonnancement", activity.code),
    );

export const wbsCitedByDictionary =
  (dictionaries: ProjectDocumentRepository<WbsDictionary>): CitationSource =>
  async (projectId) =>
    ((await dictionaries.findByProjectId(projectId))?.entries ?? []).flatMap((entry) =>
      cite(entry.wbsCode, 'le dictionnaire de la WBS'),
    );

export const wbsCitedByActualCosts =
  (costs: ProjectDocumentRepository<ActualCosts>): CitationSource =>
  async (projectId) =>
    ((await costs.findByProjectId(projectId))?.entries ?? []).flatMap((entry) =>
      cite(entry.props.wbsCode, 'les dépenses réelles', entry.code),
    );

/** Seules les mesures commencées citent leur tâche : une tâche jamais commencée se retire librement. */
export const wbsCitedByProgress =
  (progress: TaskProgressRepository): CitationSource =>
  async (projectId) =>
    (await progress.listByProject(projectId)).flatMap((measure) =>
      measure.started ? cite(measure.wbs, "l'avancement des tâches") : [],
    );

export const wbsCitedByDeliverables =
  (deliverables: ProjectDocumentRepository<DeliverablesRegister>): CitationSource =>
  async (projectId) =>
    ((await deliverables.findByProjectId(projectId))?.records ?? []).flatMap((record) =>
      cite(record.wbsCode, 'le registre des livrables'),
    );

export const changesCitedByDeliverables =
  (deliverables: ProjectDocumentRepository<DeliverablesRegister>): CitationSource =>
  async (projectId) =>
    ((await deliverables.findByProjectId(projectId))?.records ?? []).flatMap((record) =>
      cite(record.props.acceptance?.changeCode ?? null, 'le registre des livrables', `livrable ${record.wbsCode}`),
    );

export const wbsCitedByBacklog =
  (backlogs: ProjectDocumentRepository<ProductBacklog>): CitationSource =>
  async (projectId) =>
    ((await backlogs.findByProjectId(projectId))?.items ?? []).flatMap((item) =>
      cite(item.props.wbsCode, 'le carnet de produit', item.code),
    );

export const requirementsCitedByBacklog =
  (backlogs: ProjectDocumentRepository<ProductBacklog>): CitationSource =>
  async (projectId) =>
    ((await backlogs.findByProjectId(projectId))?.items ?? []).flatMap((item) =>
      cite(item.props.requirementCode, 'le carnet de produit', item.code),
    );
