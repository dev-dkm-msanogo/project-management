import type { Pool } from 'pg';
import type { BenefitsPlan } from '@domain/entities/benefits-plan';
import type { BusinessCase } from '@domain/entities/business-case';
import { ChangeLog } from '@domain/entities/change-log';
import type { CommunicationPlan } from '@domain/entities/communication-plan';
import { IssueLog } from '@domain/entities/issue-log';
import { LessonsLearned } from '@domain/entities/lessons-learned';
import type { ScheduleModel } from '@domain/entities/schedule-model';
import { WbsDictionary } from '@domain/entities/wbs-dictionary';
import type { StakeholderMapping } from '@domain/entities/stakeholder-mapping';
import type { StakeholderQuestionnaire } from '@domain/entities/stakeholder-questionnaire';
import type { QualityAnalyses } from '@domain/entities/quality-analyses';
import type { QualityMetrics } from '@domain/entities/quality-metrics';
import type { QualityReport } from '@domain/entities/quality-report';
import type { FundingStrategy } from '@domain/entities/funding-strategy';
import type { CostEstimates } from '@domain/entities/cost-estimates';
import type { ProcurementPlan } from '@domain/entities/procurement-plan';
import type { ProcurementStrategy } from '@domain/entities/procurement-strategy';
import type { ProjectManagementPlan } from '@domain/entities/project-management-plan';
import type { QualityManagementPlan } from '@domain/entities/quality-management-plan';
import type { RiskManagementPlan } from '@domain/entities/risk-management-plan';
import { SourceSelections } from '@domain/entities/source-selections';
import type { StakeholderEngagementPlan } from '@domain/entities/stakeholder-engagement-plan';
import type { ResourceManagementPlan } from '@domain/entities/resource-management-plan';
import { ResourceRequirements } from '@domain/entities/resource-requirements';
import type { TeamCharter } from '@domain/entities/team-charter';
import { ManagementPlans } from '@domain/entities/management-plans';
import { RequirementsRegister } from '@domain/entities/requirements-register';
import type { ResponsibilityMatrix } from '@domain/entities/responsibility-matrix';
import type { ScopeStatement } from '@domain/entities/scope-statement';
import { DocumentNotFoundError, NotFoundError } from '@application/errors/application-errors';
import { planToInput } from '@application/mappers/plan-to-input.mapper';
import { peopleRule, resourceCitations, type PeopleOf, type PeopleRule } from '@application/use-cases/known-people';
import {
  benefitsPlanToInput,
  inputToBenefitsPlan,
  toBenefitsPlanDto,
} from '@application/mappers/benefits-plan.mappers';
import {
  businessCaseToInput,
  inputToBusinessCase,
  toBusinessCaseDto,
} from '@application/mappers/business-case.mappers';
import {
  inputToResourcePlan,
  inputToResourceRequirements,
  inputToTeamCharter,
  resourcePlanToInput,
  resourceRequirementsToInput,
  teamCharterToInput,
  toResourceRequirementsDto,
  toTeamCharterDto,
} from '@application/mappers/resources.mappers';
import {
  communicationPlanToInput,
  engagementPlanToInput,
  inputToCommunicationPlan,
  inputToEngagementPlan,
  toCommunicationPlanDto,
} from '@application/mappers/communication.mappers';
import {
  costEstimatesToInput,
  inputToCostEstimates,
} from '@application/mappers/cost-estimates.mappers';
import {
  inputToManagementPlans,
  managementPlansToInput,
  toManagementPlansDto,
} from '@application/mappers/management-plans.mappers';
import {
  inputToRequirementsRegister,
  requirementsRegisterToInput,
  toRequirementsRegisterDto,
} from '@application/mappers/requirements-register.mappers';
import { inputToScopeStatement, scopeStatementToInput } from '@application/mappers/scope-statement.mappers';
import {
  inputToResponsibilityMatrix,
  responsibilityMatrixToInput,
  toResponsibilityMatrixDto,
} from '@application/mappers/responsibility-matrix.mappers';
import type {
  DeleteProjectDocumentUseCase,
  GetProjectDocumentUseCase,
  SaveProjectDocumentUseCase,
} from '@application/ports/in/project-document.use-cases';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import {
  DeleteProjectDocumentService,
  GetProjectDocumentService,
  GetProjectRegisterService,
  SaveProjectDocumentService,
} from '@application/use-cases/project-document.services';
import { referenceGuard } from '@application/use-cases/reference-guard';
import {
  actualCostsServices,
  GetEarnedValueService,
  GetMyTasksService,
  baselineCapture,
  GetPortfolioService,
  projectPlanReader,
  UpdateTaskProgressService,
} from '@application/use-cases/performance.services';
import { actualCostsToInput, inputToActualCosts } from '@application/mappers/performance.mappers';
import type {
  GetEarnedValueUseCase,
  GetMyTasksUseCase,
  GetPortfolioUseCase,
  UpdateTaskProgressUseCase,
} from '@application/ports/in/performance.use-cases';
import type { TaskProgressRepository } from '@application/ports/out/task-progress.repository';
import { ActualCosts } from '@domain/entities/actual-costs';
import { InMemoryTaskProgressRepository } from '@infrastructure/adapters/out/persistence/in-memory-task-progress.repository';
import { PostgresTaskProgressRepository } from '@infrastructure/adapters/out/persistence/postgres/postgres-task-progress.repository';
import {
  buildProjectAlphaActualCosts,
  buildProjectAlphaTaskProgress,
} from '@infrastructure/adapters/out/persistence/seed/project-alpha-performance.seed';
import {
  changesCitedByIssues,
  metricsCitedByQualityReport,
  risksCitedByAssumptions,
  risksCitedByIssues,
  stakeholdersCitedByEngagementPlan,
  stakeholdersCitedByMapping,
  wbsCitedByActualCosts,
  wbsCitedByDictionary,
  wbsCitedByProgress,
  wbsCitedByScheduleModel,
} from '@application/use-cases/citations';
import { scopeStatementReader } from '@application/use-cases/scope-statement.reader';
import { costEstimatesReader, GetCostBaselineService } from '@application/use-cases/cost.services';
import { resourcePlanReader } from '@application/use-cases/resource-plan.reader';
import { engagementPlanServices } from '@application/use-cases/engagement-plan.services';
import { procurementPlanReader } from '@application/use-cases/procurement-plan.reader';
import { projectManagementPlanReader } from '@application/use-cases/project-management-plan.reader';
import { changeLogReader } from '@application/use-cases/change-log.reader';
import { issueLogServices } from '@application/use-cases/issue-log.services';
import { scheduleModelServices, wbsDictionaryServices } from '@application/use-cases/schedule-model.services';
import { stakeholderMappingServices } from '@application/use-cases/stakeholder-mapping.services';
import { qualityReportServices } from '@application/use-cases/quality-report.services';
import { fundingStrategyReader, GetFundingRequirementsService } from '@application/use-cases/funding.services';
import { GetProjectTeamService, ProjectAccess, SaveProjectTeamService } from '@application/use-cases/project-access.services';
import type { ProjectMemberRepository } from '@application/ports/out/project-member.repository';
import type { AuditLogRepository, DocumentVersionLog } from '@application/ports/out/governance.repository';
import type { BaselineRepository } from '@application/ports/out/baseline.repository';
import { PostgresBaselineRepository } from '@infrastructure/adapters/out/persistence/postgres/postgres-baseline.repository';
import { InMemoryBaselineRepository } from '@infrastructure/adapters/out/persistence/in-memory-baseline.repository';
import type {
  GetAuditLogUseCase,
  ListDocumentVersionsUseCase,
  RecordAuditEventUseCase,
} from '@application/ports/in/governance.use-cases';
import {
  GetAuditLogService,
  ListDocumentVersionsService,
  RecordAuditEventService,
} from '@application/use-cases/governance.services';
import {
  PostgresAuditLogRepository,
  PostgresDocumentVersionLog,
} from '@infrastructure/adapters/out/persistence/postgres/postgres-governance.repository';
import {
  InMemoryAuditLogRepository,
  InMemoryDocumentVersionLog,
} from '@infrastructure/adapters/out/persistence/in-memory-governance.repository';
import { PostgresProjectMemberRepository } from '@infrastructure/adapters/out/persistence/postgres/postgres-project-member.repository';
import { InMemoryProjectMemberRepository } from '@infrastructure/adapters/out/persistence/in-memory-project-member.repository';
import { buildDemoProjectTeams, DEMO_PROJECT_IDS } from '@infrastructure/adapters/out/persistence/seed/project-members.seed';
import { fundingStrategyToInput, inputToFundingStrategy } from '@application/mappers/funding.mappers';
import {
  inputToQualityAnalyses,
  inputToQualityMetrics,
  inputToQualityReport,
  qualityAnalysesToInput,
  qualityMetricsToInput,
  qualityReportToInput,
  toQualityAnalysesDto,
  toQualityMetricsDto,
} from '@application/mappers/quality-tools.mappers';
import {
  inputToMapping,
  inputToQuestionnaire,
  mappingToInput,
  questionnaireToInput,
  toQuestionnaireDto,
} from '@application/mappers/stakeholder-tools.mappers';
import {
  inputToScheduleModel,
  inputToWbsDictionary,
  scheduleModelToInput,
  wbsDictionaryToInput,
} from '@application/mappers/schedule-model.mappers';
import { inputToIssueLog, issueLogToInput } from '@application/mappers/issue-log.mappers';
import {
  inputToLessonsLearned,
  lessonsLearnedToInput,
  toLessonsLearnedDto,
} from '@application/mappers/lessons-learned.mappers';
import { changeLogToInput, inputToChangeLog } from '@application/mappers/change-log.mappers';
import {
  inputToQualityPlan,
  inputToRiskPlan,
  qualityPlanToInput,
  riskPlanToInput,
  toQualityPlanDto,
  toRiskPlanDto,
} from '@application/mappers/quality-risk-plans.mappers';
import {
  inputToProjectManagementPlan,
  projectManagementPlanToInput,
} from '@application/mappers/project-management-plan.mappers';
import {
  inputToProcurementPlan,
  inputToProcurementStrategy,
  inputToSourceSelections,
  procurementPlanToInput,
  procurementStrategyToInput,
  sourceSelectionsToInput,
  toProcurementStrategyDto,
  toSourceSelectionsDto,
} from '@application/mappers/procurement.mappers';
import type {
  ActualCostsDto,
  ActualCostsInput,
  BenefitsPlanDto,
  BenefitsPlanInput,
  BusinessCaseDto,
  BusinessCaseInput,
  ChangeLogDto,
  ChangeLogInput,
  CommunicationPlanDto,
  CommunicationPlanInput,
  CostBaselineDto,
  FundingRequirementsDto,
  FundingStrategyDto,
  FundingStrategyInput,
  CostEstimatesDto,
  CostEstimatesInput,
  IssueLogDto,
  IssueLogInput,
  LessonsLearnedDto,
  LessonsLearnedInput,
  ManagementPlansDto,
  ManagementPlansInput,
  ProcurementPlanDto,
  ProcurementPlanInput,
  ProcurementStrategyDto,
  ProcurementStrategyInput,
  ProjectManagementPlanDto,
  ProjectManagementPlanInput,
  QualityAnalysesDto,
  QualityAnalysesInput,
  QualityManagementPlanDto,
  QualityMetricsDto,
  QualityMetricsInput,
  QualityReportDto,
  QualityReportInput,
  QualityManagementPlanInput,
  RequirementsRegisterDto,
  RequirementsRegisterInput,
  ResourceManagementPlanDto,
  ResourceManagementPlanInput,
  ResourceRequirementsDto,
  ResourceRequirementsInput,
  ResponsibilityMatrixDto,
  ResponsibilityMatrixInput,
  RiskManagementPlanDto,
  RiskManagementPlanInput,
  ScheduleModelDto,
  ScheduleModelInput,
  ScopeStatementDto,
  ScopeStatementInput,
  SourceSelectionsDto,
  SourceSelectionsInput,
  StakeholderMappingDto,
  StakeholderMappingInput,
  StakeholderQuestionnaireDto,
  StakeholderQuestionnaireInput,
  StakeholderEngagementPlanDto,
  StakeholderEngagementPlanInput,
  TeamCharterDto,
  WbsDictionaryDto,
  WbsDictionaryInput,
  TeamCharterInput,
} from '@shared/index';
import type { GetCurrentUserUseCase, LoginUseCase } from '@application/ports/in/auth.use-cases';
import type {
  ChangeOwnPasswordUseCase,
  ResolveSessionUseCase,
  ResourceDirectoryAdministration,
  UserAdministration,
} from '@application/ports/in/admin.use-cases';
import type { ResourceDirectoryRepository } from '@application/ports/out/resource-directory.repository';
import { ResourceDirectoryService } from '@application/use-cases/resource-directory.services';
import {
  ChangeOwnPasswordService,
  ResolveSessionService,
  UserAdministrationService,
} from '@application/use-cases/user-admin.services';
import { InMemoryResourceDirectoryRepository } from '@infrastructure/adapters/out/persistence/in-memory-resource-directory.repository';
import { PostgresResourceDirectoryRepository } from '@infrastructure/adapters/out/persistence/postgres/postgres-resource-directory.repository';
import { buildResourceDirectory } from '@infrastructure/adapters/out/persistence/seed/resource-directory.seed';
import { CryptoIdGenerator, CryptoPasswordGenerator } from '@infrastructure/security/crypto-generators';
import type {
  DeleteExecutiveReportUseCase,
  GetExecutiveReportUseCase,
  ListExecutiveReportsUseCase,
  PublishExecutiveReportUseCase,
  SaveExecutiveReportUseCase,
} from '@application/ports/in/executive-report.use-cases';
import type { GetProjectPlanUseCase } from '@application/ports/in/get-project-plan.use-case';
import type {
  CreateProjectUseCase,
  DeleteProjectUseCase,
  GetProjectTeamUseCase,
  ListProjectsUseCase,
  ResolveProjectAccessUseCase,
  SaveProjectTeamUseCase,
  UpdateProjectUseCase,
} from '@application/ports/in/project.use-cases';
import type {
  GetAssumptionLogUseCase,
  SaveAssumptionLogUseCase,
} from '@application/ports/in/assumption-log.use-cases';
import type {
  GetProjectCharterUseCase,
  SaveProjectCharterUseCase,
} from '@application/ports/in/project-charter.use-cases';
import type {
  GetRiskRegisterUseCase,
  SaveRiskRegisterUseCase,
} from '@application/ports/in/risk-register.use-cases';
import type {
  GetStakeholderRegisterUseCase,
  SaveStakeholderRegisterUseCase,
} from '@application/ports/in/stakeholder-register.use-cases';
import type { SaveProjectPlanUseCase } from '@application/ports/in/save-project-plan.use-case';
import { assumptionLogToInput, inputToAssumptionLog } from '@application/mappers/assumption-log.mappers';
import { charterToInput, inputToCharter } from '@application/mappers/project-charter.mappers';
import { inputToRiskRegister, riskRegisterToInput } from '@application/mappers/risk-register.mappers';
import {
  inputToStakeholderRegister,
  stakeholderRegisterToInput,
} from '@application/mappers/stakeholder-register.mappers';
import type { AssumptionLogRepository } from '@application/ports/out/assumption-log.repository';
import type { PasswordHasher } from '@application/ports/out/password-hasher';
import type { ProjectCharterRepository } from '@application/ports/out/project-charter.repository';
import type { ProjectPlanRepository } from '@application/ports/out/project-plan.repository';
import type { ProjectRepository } from '@application/ports/out/project.repository';
import type { RiskRegisterRepository } from '@application/ports/out/risk-register.repository';
import type { StakeholderRegisterRepository } from '@application/ports/out/stakeholder-register.repository';
import type { StatusReportRepository } from '@application/ports/out/status-report.repository';
import type { UserRepository } from '@application/ports/out/user.repository';
import { CreateProjectService } from '@application/use-cases/create-project.service';
import { UpdateProjectService } from '@application/use-cases/update-project.service';
import {
  DeleteExecutiveReportService,
  GetExecutiveReportService,
  ListExecutiveReportsService,
  PublishExecutiveReportService,
  SaveExecutiveReportService,
} from '@application/use-cases/executive-report.services';
import { DeleteProjectService } from '@application/use-cases/delete-project.service';
import { GetAssumptionLogService } from '@application/use-cases/get-assumption-log.service';
import { GetCurrentUserService } from '@application/use-cases/get-current-user.service';
import { executiveReportReader } from '@application/use-cases/executive-report.reader';
import { GetProjectCharterService } from '@application/use-cases/get-project-charter.service';
import { GetProjectPlanService } from '@application/use-cases/get-project-plan.service';
import { GetRiskRegisterService } from '@application/use-cases/get-risk-register.service';
import { GetStakeholderRegisterService } from '@application/use-cases/get-stakeholder-register.service';
import { ListProjectsService } from '@application/use-cases/list-projects.service';
import { LoginService } from '@application/use-cases/login.service';
import { SaveAssumptionLogService } from '@application/use-cases/save-assumption-log.service';
import { SaveProjectCharterService } from '@application/use-cases/save-project-charter.service';
import {
  ActOnApprovalService,
  GetApprovalSnapshotService,
  GetProjectApprovalsService,
  SetProjectApproversService,
  lockedRepository,
  type ApprovalSources,
} from '@application/use-cases/approval.services';
import {
  AwardSourceSelectionService,
  DecideChangeRequestService,
  GetMyApprovalsService,
  awardGuard,
  changeDecisionGuard,
} from '@application/use-cases/decision.services';
import type {
  ActOnApprovalUseCase,
  AwardSourceSelectionUseCase,
  DecideChangeRequestUseCase,
  GetApprovalSnapshotUseCase,
  GetMyApprovalsUseCase,
  GetProjectApprovalsUseCase,
  SetProjectApproversUseCase,
} from '@application/ports/in/approval.use-cases';
import type {
  ApprovalRepository,
  ApprovalSnapshotRepository,
  ProjectApproverRepository,
} from '@application/ports/out/approval.repository';
import type { ApprovalSubject } from '@domain/entities/document-approval';
import { SaveProjectPlanService } from '@application/use-cases/save-project-plan.service';
import { SaveRiskRegisterService } from '@application/use-cases/save-risk-register.service';
import { SaveStakeholderRegisterService } from '@application/use-cases/save-stakeholder-register.service';
import {
  upgradeAssumptionLogInput,
  upgradeCharterInput,
  upgradeRiskRegisterInput,
  upgradeStakeholderRegisterInput,
} from '@infrastructure/adapters/out/persistence/document-upgrades';
import { InMemoryProjectDocumentRepository } from '@infrastructure/adapters/out/persistence/in-memory-project-document.repository';
import { InMemoryProjectPlanRepository } from '@infrastructure/adapters/out/persistence/in-memory-project-plan.repository';
import { InMemoryProjectRepository } from '@infrastructure/adapters/out/persistence/in-memory-project.repository';
import { InMemoryStatusReportRepository } from '@infrastructure/adapters/out/persistence/in-memory-status-report.repository';
import { InMemoryUserRepository } from '@infrastructure/adapters/out/persistence/in-memory-user.repository';
import { migrate } from '@infrastructure/adapters/out/persistence/postgres/migrate';
import { createPool } from '@infrastructure/adapters/out/persistence/postgres/pool';
import { PostgresDocumentRepository } from '@infrastructure/adapters/out/persistence/postgres/postgres-document.repository';
import { PostgresProjectPlanRepository } from '@infrastructure/adapters/out/persistence/postgres/postgres-project-plan.repository';
import { PostgresProjectRepository } from '@infrastructure/adapters/out/persistence/postgres/postgres-project.repository';
import { PostgresStatusReportRepository } from '@infrastructure/adapters/out/persistence/postgres/postgres-status-report.repository';
import { PostgresUserRepository } from '@infrastructure/adapters/out/persistence/postgres/postgres-user.repository';
import { buildProjectAlphaAssumptions } from '@infrastructure/adapters/out/persistence/seed/project-alpha-assumptions.seed';
import { buildProjectAlphaCharter } from '@infrastructure/adapters/out/persistence/seed/project-alpha-charter.seed';
import {
  buildProjectAlphaCommunicationPlan,
  buildProjectAlphaEngagementPlan,
} from '@infrastructure/adapters/out/persistence/seed/project-alpha-communication.seed';
import { buildProjectAlphaCostEstimates } from '@infrastructure/adapters/out/persistence/seed/project-alpha-finance.seed';
import {
  buildProjectAlphaBenefitsPlan,
  buildProjectAlphaBusinessCase,
  buildProjectAlphaResponsibilityMatrix,
} from '@infrastructure/adapters/out/persistence/seed/project-alpha-initiating.seed';
import { buildProjectAlphaPlan } from '@infrastructure/adapters/out/persistence/seed/project-alpha-plan.seed';
import {
  buildProjectAlphaProcurementPlan,
  buildProjectAlphaProcurementStrategy,
  buildProjectAlphaSourceSelections,
} from '@infrastructure/adapters/out/persistence/seed/project-alpha-procurement.seed';
import { buildProjectAlphaManagementPlan } from '@infrastructure/adapters/out/persistence/seed/project-alpha-pm-plan.seed';
import {
  buildProjectAlphaQualityPlan,
  buildProjectAlphaRiskPlan,
} from '@infrastructure/adapters/out/persistence/seed/project-alpha-quality-risk.seed';
import { buildProjectAlphaChangeLog } from '@infrastructure/adapters/out/persistence/seed/project-alpha-changes.seed';
import { buildProjectAlphaIssueLog } from '@infrastructure/adapters/out/persistence/seed/project-alpha-issues.seed';
import { buildProjectAlphaLessonsLearned } from '@infrastructure/adapters/out/persistence/seed/project-alpha-lessons.seed';
import {
  buildProjectAlphaScheduleModel,
  buildProjectAlphaWbsDictionary,
} from '@infrastructure/adapters/out/persistence/seed/project-alpha-schedule-model.seed';
import {
  buildProjectAlphaQuestionnaire,
  buildProjectAlphaStakeholderMapping,
} from '@infrastructure/adapters/out/persistence/seed/project-alpha-stakeholder-tools.seed';
import {
  buildProjectAlphaQualityAnalyses,
  buildProjectAlphaQualityMetrics,
  buildProjectAlphaQualityReport,
} from '@infrastructure/adapters/out/persistence/seed/project-alpha-quality-tools.seed';
import { buildProjectAlphaFundingStrategy } from '@infrastructure/adapters/out/persistence/seed/project-alpha-funding.seed';
import {
  buildProjectAlphaResourcePlan,
  buildProjectAlphaResourceRequirements,
  buildProjectAlphaTeamCharter,
} from '@infrastructure/adapters/out/persistence/seed/project-alpha-resources.seed';
import { buildProjectAlphaRiskRegister } from '@infrastructure/adapters/out/persistence/seed/project-alpha-risks.seed';
import {
  buildProjectAlphaManagementPlans,
  buildProjectAlphaRequirements,
  buildProjectAlphaScopeStatement,
} from '@infrastructure/adapters/out/persistence/seed/project-alpha-scope.seed';
import { buildProjectAlphaStakeholders } from '@infrastructure/adapters/out/persistence/seed/project-alpha-stakeholders.seed';
import { buildProjectAlphaReport } from '@infrastructure/adapters/out/persistence/seed/project-alpha.seed';
import { buildProjectRecords } from '@infrastructure/adapters/out/persistence/seed/projects.seed';
import { seedUsers } from '@infrastructure/adapters/out/persistence/seed/users.seed';
import {
  ALPHA_APPROVERS,
  buildProjectAlphaApprovals,
} from '@infrastructure/adapters/out/persistence/seed/project-alpha-approvals.seed';
import {
  PostgresApprovalRepository,
  PostgresApprovalSnapshotRepository,
  PostgresProjectApproverRepository,
} from '@infrastructure/adapters/out/persistence/postgres/postgres-approval.repository';
import {
  InMemoryApprovalRepository,
  InMemoryApprovalSnapshotRepository,
  InMemoryProjectApproverRepository,
} from '@infrastructure/adapters/out/persistence/in-memory-approval.repository';
import type { AppEnv } from '@infrastructure/config/env';
import { BcryptPasswordHasher } from '@infrastructure/security/bcrypt-password-hasher';

/**
 * Composition root : seul endroit où l'on instancie les classes concrètes.
 * Choisit l'adaptateur de persistance (PostgreSQL si DATABASE_URL, sinon mémoire)
 * sans que le domaine ni l'application ne changent (architecture hexagonale).
 */
/** Documents rédigés que l'on peut supprimer en entier (un registre se vide entrée par entrée). */
type RemovableDocument =
  | 'charters'
  | 'businessCases'
  | 'benefitsPlans'
  | 'responsibilityMatrices'
  | 'scopeStatements'
  | 'costEstimates'
  | 'fundingStrategies'
  | 'resourcePlans'
  | 'teamCharters'
  | 'engagementPlans'
  | 'communicationPlans'
  | 'procurementPlans'
  | 'procurementStrategies'
  | 'projectManagementPlans'
  | 'qualityPlans'
  | 'riskPlans'
  | 'scheduleModels'
  | 'stakeholderQuestionnaires'
  | 'stakeholderMappings'
  | 'qualityMetrics'
  | 'qualityReports'
  | 'qualityAnalyses';

export interface AppContainer {
  login: LoginUseCase;
  getCurrentUser: GetCurrentUserUseCase;
  resolveSession: ResolveSessionUseCase;
  changeOwnPassword: ChangeOwnPasswordUseCase;
  userAdministration: UserAdministration;
  resourceDirectory: ResourceDirectoryAdministration;
  listExecutiveReports: ListExecutiveReportsUseCase;
  getExecutiveReport: GetExecutiveReportUseCase;
  saveExecutiveReport: SaveExecutiveReportUseCase;
  publishExecutiveReport: PublishExecutiveReportUseCase;
  deleteExecutiveReport: DeleteExecutiveReportUseCase;
  getProjectPlan: GetProjectPlanUseCase;
  saveProjectPlan: SaveProjectPlanUseCase;
  listProjects: ListProjectsUseCase;
  createProject: CreateProjectUseCase;
  updateProject: UpdateProjectUseCase;
  deleteProject: DeleteProjectUseCase;
  getRiskRegister: GetRiskRegisterUseCase;
  saveRiskRegister: SaveRiskRegisterUseCase;
  getProjectCharter: GetProjectCharterUseCase;
  saveProjectCharter: SaveProjectCharterUseCase;
  getStakeholderRegister: GetStakeholderRegisterUseCase;
  saveStakeholderRegister: SaveStakeholderRegisterUseCase;
  getAssumptionLog: GetAssumptionLogUseCase;
  saveAssumptionLog: SaveAssumptionLogUseCase;
  getBusinessCase: GetProjectDocumentUseCase<BusinessCaseDto>;
  saveBusinessCase: SaveProjectDocumentUseCase<BusinessCaseInput, BusinessCaseDto>;
  getBenefitsPlan: GetProjectDocumentUseCase<BenefitsPlanDto>;
  saveBenefitsPlan: SaveProjectDocumentUseCase<BenefitsPlanInput, BenefitsPlanDto>;
  getResponsibilityMatrix: GetProjectDocumentUseCase<ResponsibilityMatrixDto>;
  saveResponsibilityMatrix: SaveProjectDocumentUseCase<ResponsibilityMatrixInput, ResponsibilityMatrixDto>;
  getManagementPlans: GetProjectDocumentUseCase<ManagementPlansDto>;
  saveManagementPlans: SaveProjectDocumentUseCase<ManagementPlansInput, ManagementPlansDto>;
  getRequirementsRegister: GetProjectDocumentUseCase<RequirementsRegisterDto>;
  saveRequirementsRegister: SaveProjectDocumentUseCase<RequirementsRegisterInput, RequirementsRegisterDto>;
  getScopeStatement: GetProjectDocumentUseCase<ScopeStatementDto>;
  saveScopeStatement: SaveProjectDocumentUseCase<ScopeStatementInput, ScopeStatementDto>;
  getCostEstimates: GetProjectDocumentUseCase<CostEstimatesDto>;
  saveCostEstimates: SaveProjectDocumentUseCase<CostEstimatesInput, CostEstimatesDto>;
  getCostBaseline: GetProjectDocumentUseCase<CostBaselineDto>;
  getResourceRequirements: GetProjectDocumentUseCase<ResourceRequirementsDto>;
  saveResourceRequirements: SaveProjectDocumentUseCase<ResourceRequirementsInput, ResourceRequirementsDto>;
  getResourcePlan: GetProjectDocumentUseCase<ResourceManagementPlanDto>;
  saveResourcePlan: SaveProjectDocumentUseCase<ResourceManagementPlanInput, ResourceManagementPlanDto>;
  getTeamCharter: GetProjectDocumentUseCase<TeamCharterDto>;
  saveTeamCharter: SaveProjectDocumentUseCase<TeamCharterInput, TeamCharterDto>;
  getEngagementPlan: GetProjectDocumentUseCase<StakeholderEngagementPlanDto>;
  saveEngagementPlan: SaveProjectDocumentUseCase<StakeholderEngagementPlanInput, StakeholderEngagementPlanDto>;
  getCommunicationPlan: GetProjectDocumentUseCase<CommunicationPlanDto>;
  saveCommunicationPlan: SaveProjectDocumentUseCase<CommunicationPlanInput, CommunicationPlanDto>;
  getProcurementPlan: GetProjectDocumentUseCase<ProcurementPlanDto>;
  saveProcurementPlan: SaveProjectDocumentUseCase<ProcurementPlanInput, ProcurementPlanDto>;
  getProcurementStrategy: GetProjectDocumentUseCase<ProcurementStrategyDto>;
  saveProcurementStrategy: SaveProjectDocumentUseCase<ProcurementStrategyInput, ProcurementStrategyDto>;
  getSourceSelections: GetProjectDocumentUseCase<SourceSelectionsDto>;
  saveSourceSelections: SaveProjectDocumentUseCase<SourceSelectionsInput, SourceSelectionsDto>;
  getProjectManagementPlan: GetProjectDocumentUseCase<ProjectManagementPlanDto>;
  saveProjectManagementPlan: SaveProjectDocumentUseCase<ProjectManagementPlanInput, ProjectManagementPlanDto>;
  getQualityPlan: GetProjectDocumentUseCase<QualityManagementPlanDto>;
  saveQualityPlan: SaveProjectDocumentUseCase<QualityManagementPlanInput, QualityManagementPlanDto>;
  getRiskPlan: GetProjectDocumentUseCase<RiskManagementPlanDto>;
  saveRiskPlan: SaveProjectDocumentUseCase<RiskManagementPlanInput, RiskManagementPlanDto>;
  getChangeLog: GetProjectDocumentUseCase<ChangeLogDto>;
  saveChangeLog: SaveProjectDocumentUseCase<ChangeLogInput, ChangeLogDto>;
  getIssueLog: GetProjectDocumentUseCase<IssueLogDto>;
  saveIssueLog: SaveProjectDocumentUseCase<IssueLogInput, IssueLogDto>;
  getLessonsLearned: GetProjectDocumentUseCase<LessonsLearnedDto>;
  saveLessonsLearned: SaveProjectDocumentUseCase<LessonsLearnedInput, LessonsLearnedDto>;
  getScheduleModel: GetProjectDocumentUseCase<ScheduleModelDto>;
  saveScheduleModel: SaveProjectDocumentUseCase<ScheduleModelInput, ScheduleModelDto>;
  getWbsDictionary: GetProjectDocumentUseCase<WbsDictionaryDto>;
  saveWbsDictionary: SaveProjectDocumentUseCase<WbsDictionaryInput, WbsDictionaryDto>;
  getStakeholderQuestionnaire: GetProjectDocumentUseCase<StakeholderQuestionnaireDto>;
  saveStakeholderQuestionnaire: SaveProjectDocumentUseCase<StakeholderQuestionnaireInput, StakeholderQuestionnaireDto>;
  getStakeholderMapping: GetProjectDocumentUseCase<StakeholderMappingDto>;
  saveStakeholderMapping: SaveProjectDocumentUseCase<StakeholderMappingInput, StakeholderMappingDto>;
  getQualityMetrics: GetProjectDocumentUseCase<QualityMetricsDto>;
  saveQualityMetrics: SaveProjectDocumentUseCase<QualityMetricsInput, QualityMetricsDto>;
  getQualityReport: GetProjectDocumentUseCase<QualityReportDto>;
  saveQualityReport: SaveProjectDocumentUseCase<QualityReportInput, QualityReportDto>;
  getQualityAnalyses: GetProjectDocumentUseCase<QualityAnalysesDto>;
  saveQualityAnalyses: SaveProjectDocumentUseCase<QualityAnalysesInput, QualityAnalysesDto>;
  getFundingStrategy: GetProjectDocumentUseCase<FundingStrategyDto>;
  saveFundingStrategy: SaveProjectDocumentUseCase<FundingStrategyInput, FundingStrategyDto>;
  getFundingRequirements: GetProjectDocumentUseCase<FundingRequirementsDto>;
  getActualCosts: GetProjectDocumentUseCase<ActualCostsDto>;
  saveActualCosts: SaveProjectDocumentUseCase<ActualCostsInput, ActualCostsDto>;
  updateTaskProgress: UpdateTaskProgressUseCase;
  getMyTasks: GetMyTasksUseCase;
  getEarnedValue: GetEarnedValueUseCase;
  getPortfolio: GetPortfolioUseCase;
  deleteDocument: Record<RemovableDocument, DeleteProjectDocumentUseCase>;
  projectAccess: ResolveProjectAccessUseCase;
  listDocumentVersions: ListDocumentVersionsUseCase;
  recordAuditEvent: RecordAuditEventUseCase;
  getAuditLog: GetAuditLogUseCase;
  getProjectTeam: GetProjectTeamUseCase;
  saveProjectTeam: SaveProjectTeamUseCase;
  getProjectApprovals: GetProjectApprovalsUseCase;
  actOnApproval: ActOnApprovalUseCase;
  getApprovalSnapshot: GetApprovalSnapshotUseCase;
  setProjectApprovers: SetProjectApproversUseCase;
  getMyApprovals: GetMyApprovalsUseCase;
  decideChangeRequest: DecideChangeRequestUseCase;
  awardSourceSelection: AwardSourceSelectionUseCase;
}

/** Cas d'usage du circuit de validation, câblés après les autres (ils lisent les documents). */
type ApprovalUseCaseKey =
  | 'getProjectApprovals'
  | 'actOnApproval'
  | 'getApprovalSnapshot'
  | 'setProjectApprovers'
  | 'getMyApprovals'
  | 'decideChangeRequest'
  | 'awardSourceSelection';

interface Repositories {
  reports: StatusReportRepository;
  plans: ProjectPlanRepository;
  projects: ProjectRepository;
  users: UserRepository;
  risks: RiskRegisterRepository;
  charters: ProjectCharterRepository;
  stakeholders: StakeholderRegisterRepository;
  assumptions: AssumptionLogRepository;
  businessCases: ProjectDocumentRepository<BusinessCase>;
  benefitsPlans: ProjectDocumentRepository<BenefitsPlan>;
  responsibilityMatrices: ProjectDocumentRepository<ResponsibilityMatrix>;
  managementPlans: ProjectDocumentRepository<ManagementPlans>;
  requirements: ProjectDocumentRepository<RequirementsRegister>;
  scopeStatements: ProjectDocumentRepository<ScopeStatement>;
  costEstimates: ProjectDocumentRepository<CostEstimates>;
  resourceRequirements: ProjectDocumentRepository<ResourceRequirements>;
  resourcePlans: ProjectDocumentRepository<ResourceManagementPlan>;
  teamCharters: ProjectDocumentRepository<TeamCharter>;
  engagementPlans: ProjectDocumentRepository<StakeholderEngagementPlan>;
  communicationPlans: ProjectDocumentRepository<CommunicationPlan>;
  procurementPlans: ProjectDocumentRepository<ProcurementPlan>;
  procurementStrategies: ProjectDocumentRepository<ProcurementStrategy>;
  sourceSelections: ProjectDocumentRepository<SourceSelections>;
  projectManagementPlans: ProjectDocumentRepository<ProjectManagementPlan>;
  qualityPlans: ProjectDocumentRepository<QualityManagementPlan>;
  riskPlans: ProjectDocumentRepository<RiskManagementPlan>;
  changeLogs: ProjectDocumentRepository<ChangeLog>;
  issueLogs: ProjectDocumentRepository<IssueLog>;
  lessonsLearned: ProjectDocumentRepository<LessonsLearned>;
  scheduleModels: ProjectDocumentRepository<ScheduleModel>;
  wbsDictionaries: ProjectDocumentRepository<WbsDictionary>;
  stakeholderQuestionnaires: ProjectDocumentRepository<StakeholderQuestionnaire>;
  stakeholderMappings: ProjectDocumentRepository<StakeholderMapping>;
  qualityMetrics: ProjectDocumentRepository<QualityMetrics>;
  qualityReports: ProjectDocumentRepository<QualityReport>;
  qualityAnalyses: ProjectDocumentRepository<QualityAnalyses>;
  fundingStrategies: ProjectDocumentRepository<FundingStrategy>;
  actualCosts: ProjectDocumentRepository<ActualCosts>;
  taskProgress: TaskProgressRepository;
  resourceDirectory: ResourceDirectoryRepository;
  approvals: ApprovalRepository;
  approvalSnapshots: ApprovalSnapshotRepository;
  approvers: ProjectApproverRepository;
  projectMembers: ProjectMemberRepository;
  versionLog: DocumentVersionLog;
  auditLog: AuditLogRepository;
  baselines: BaselineRepository;
}

/**
 * Documents qui désignent des personnes : chacune est une ressource du référentiel, choisie par son
 * identifiant (contrôlé à l'enregistrement ; une ressource désignée ne se supprime pas).
 */
function peopleRules(repos: Repositories) {
  const rule = <T>(label: string, repository: ProjectDocumentRepository<T>, peopleOf: PeopleOf<T>) =>
    peopleRule(label, repository, repos.resourceDirectory, peopleOf);
  return {
    charters: rule('charte', repos.charters, ({ props }) => [
      { id: props.sponsor.resourceId, role: 'sponsor' },
      { id: props.projectManager.resourceId, role: 'chef de projet' },
    ]),
    plans: rule('WBS', repos.plans, (plan) => [
      { id: plan.managerId, role: 'chef de projet' },
      ...plan.tasks.map((task) => ({ id: task.assigneeId, role: `affecté(e) à ${task.wbs.value}` })),
    ]),
    risks: rule('registre des risques', repos.risks, (register) => register.risks.map((risk) => ({ id: risk.ownerId, role: `responsable de ${risk.code}` }))),
    assumptions: rule('registre des hypothèses', repos.assumptions, (log) =>
      log.entries.map((entry) => ({ id: entry.props.ownerId, role: `responsable de ${entry.code}` })),
    ),
    issueLogs: rule('journal des problèmes', repos.issueLogs, (log) => log.issues.map((issue) => ({ id: issue.props.ownerId, role: `responsable de ${issue.code}` }))),
    lessonsLearned: rule('leçons apprises', repos.lessonsLearned, (register) =>
      register.lessons.map((lesson) => ({ id: lesson.props.responsibleId, role: `porteur de ${lesson.code}` })),
    ),
    benefitsPlans: rule('plan de gestion des bénéfices', repos.benefitsPlans, ({ props }) =>
      props.benefits.flatMap((benefit) => benefit.metrics.map((metric) => ({ id: metric.ownerId, role: `responsable (${benefit.name})` }))),
    ),
    scheduleModels: rule('activités', repos.scheduleModels, ({ props }) =>
      props.activities.map((activity) => ({ id: activity.ownerId, role: `responsable de ${activity.code}` })),
    ),
    wbsDictionaries: rule('dictionnaire de la WBS', repos.wbsDictionaries, (dictionary) =>
      dictionary.entries.map((entry) => ({ id: entry.responsibleId, role: `responsable de ${entry.wbsCode}` })),
    ),
    resourcePlans: rule('plan de management des ressources', repos.resourcePlans, ({ props }) => props.roles.map((role) => ({ id: role.holderId, role: `titulaire (${role.role})` }))),
    teamCharters: rule("charte d'équipe", repos.teamCharters, ({ props }) =>
      props.signatures.map((signature, index) => ({ id: signature.resourceId, role: `signataire n° ${index + 1}` })),
    ),
    responsibilityMatrices: rule('matrice RACI', repos.responsibilityMatrices, ({ props }) =>
      props.participants.map((participant) => ({ id: participant.resourceId, role: `participant (${participant.role})` })),
    ),
    costEstimates: rule('estimations des coûts', repos.costEstimates, ({ props }) =>
      props.activities.map((activity) => ({ id: activity.props.resourceId, role: `ressource de ${activity.code}` })),
    ),
    communicationPlans: rule('plan de management des communications', repos.communicationPlans, ({ props }) =>
      props.communications.map((item, index) => ({ id: item.senderId, role: `émetteur de la communication n° ${index + 1}` })),
    ),
    changeLogs: rule('registre des modifications', repos.changeLogs, (log) =>
      log.requests.map((request) => ({ id: request.props.assessment?.assessedById ?? null, role: `évaluateur de ${request.code}` })),
    ),
  };
}

/** Dépôts contrôlés des règles « personnes », sous les mêmes clés que les dépôts d'origine. */
function checkedRepositories<R extends Record<string, PeopleRule<unknown>>>(rules: R) {
  return Object.fromEntries(Object.entries(rules).map(([key, rule]) => [key, rule.checked])) as {
    [K in keyof R]: R[K]['checked'];
  };
}

/**
 * Dépôts des documents validés : une version soumise ou approuvée est figée. Le plan de
 * management l'est avec ses plans et ses références de base ; le suivi reste libre (affectations et
 * statut des tâches de la WBS, jalons atteints, avancement et recette des exigences).
 */
function lockedRepositories(repos: Repositories) {
  const lock = <T extends { readonly projectId: string }>(
    repository: ProjectDocumentRepository<T>,
    subject: ApprovalSubject,
    frozen: (document: T) => unknown,
  ) =>
    lockedRepository(repository, repos.approvals, {
      subject,
      frozen,
      component: subject === 'PROJECT_MANAGEMENT_PLAN',
      projectIdOf: (document) => document.projectId,
    });
  const plan = 'PROJECT_MANAGEMENT_PLAN';
  return {
    businessCases: lock(repos.businessCases, 'BUSINESS_CASE', businessCaseToInput),
    charters: lock(repos.charters, 'CHARTER', charterToInput),
    benefitsPlans: lock(repos.benefitsPlans, 'BENEFITS_PLAN', benefitsPlanToInput),
    requirements: lock(repos.requirements, 'REQUIREMENTS', (register) =>
      requirementsRegisterToInput(register).requirements.map(
        ({ status: _status, validation: _validation, ...content }) => content,
      ),
    ),
    projectManagementPlans: lockedRepository(repos.projectManagementPlans, repos.approvals, {
      subject: plan,
      frozen: projectManagementPlanToInput,
      projectIdOf: (document) => document.projectId,
    }),
    managementPlans: lock(repos.managementPlans, plan, managementPlansToInput),
    resourcePlans: lock(repos.resourcePlans, plan, resourcePlanToInput),
    communicationPlans: lock(repos.communicationPlans, plan, communicationPlanToInput),
    engagementPlans: lock(repos.engagementPlans, plan, engagementPlanToInput),
    procurementPlans: lock(repos.procurementPlans, plan, procurementPlanToInput),
    procurementStrategies: lock(repos.procurementStrategies, plan, procurementStrategyToInput),
    qualityPlans: lock(repos.qualityPlans, plan, qualityPlanToInput),
    riskPlans: lock(repos.riskPlans, plan, riskPlanToInput),
    scopeStatements: lock(repos.scopeStatements, plan, scopeStatementToInput),
    wbsDictionaries: lock(repos.wbsDictionaries, plan, wbsDictionaryToInput),
    costEstimates: lock(repos.costEstimates, plan, costEstimatesToInput),
    fundingStrategies: lock(repos.fundingStrategies, plan, fundingStrategyToInput),
    scheduleModels: lock(repos.scheduleModels, plan, (model) => {
      const input = scheduleModelToInput(model);
      return { ...input, milestones: input.milestones.map(({ achievedOn: _achievedOn, ...milestone }) => milestone) };
    }),
    plans: lockedRepository(repos.plans, repos.approvals, {
      subject: plan,
      component: true,
      projectIdOf: (document) => document.project.id,
      frozen: (document) => {
        const input = planToInput(document);
        // Affectations et statut initial (l'avancement saisi fait foi) relèvent du suivi.
        return { ...input, tasks: input.tasks.map(({ assigneeId: _assigneeId, status: _status, ...task }) => task) };
      },
    }),
  };
}

/** Lecture d'un document pour l'archivage ; absent s'il n'a pas été rédigé. */
const readOrSkip =
  (useCase: { execute(query: { projectId: string }): Promise<unknown> }) =>
  async (projectId: string): Promise<unknown> => {
    try {
      return await useCase.execute({ projectId });
    } catch (error) {
      if (error instanceof NotFoundError) return undefined;
      throw error;
    }
  };

async function documentsOf(
  projectId: string,
  readers: Record<string, (projectId: string) => Promise<unknown>>,
): Promise<Record<string, unknown>> {
  const entries = await Promise.all(
    Object.entries(readers).map(async ([segment, read]) => [segment, await read(projectId)] as const),
  );
  return Object.fromEntries(entries.filter(([, document]) => document !== undefined));
}

/**
 * Circuit de validation : ce qui manque pour soumettre chaque document, et sa lecture archivée à
 * l'approbation (par segment d'API, pour l'afficher tel qu'il a été approuvé).
 */
function approvalUseCases(
  repos: Repositories,
  useCases: Omit<AppContainer, ApprovalUseCaseKey>,
  clock: () => Date,
): Pick<AppContainer, ApprovalUseCaseKey> {
  const written = async (repository: { findByProjectId(projectId: string): Promise<unknown> }, projectId: string, label: string) =>
    (await repository.findByProjectId(projectId)) ? [] : [label];
  const sources: ApprovalSources = {
    BUSINESS_CASE: {
      missingForSubmission: (projectId) => written(repos.businessCases, projectId, 'le business case rédigé'),
      snapshot: (projectId) => documentsOf(projectId, { 'business-case': readOrSkip(useCases.getBusinessCase) }),
    },
    CHARTER: {
      missingForSubmission: async (projectId) =>
        (await repos.charters.findByProjectId(projectId))?.missingForSubmission ?? ['la charte rédigée'],
      snapshot: (projectId) => documentsOf(projectId, { charter: readOrSkip(useCases.getProjectCharter) }),
    },
    BENEFITS_PLAN: {
      missingForSubmission: (projectId) => written(repos.benefitsPlans, projectId, 'le plan de gestion des bénéfices rédigé'),
      snapshot: (projectId) => documentsOf(projectId, { 'benefits-plan': readOrSkip(useCases.getBenefitsPlan) }),
    },
    REQUIREMENTS: {
      missingForSubmission: async (projectId) =>
        ((await repos.requirements.findByProjectId(projectId))?.requirements.length ?? 0) > 0
          ? []
          : ['au moins une exigence au registre'],
      snapshot: (projectId) => documentsOf(projectId, { requirements: readOrSkip(useCases.getRequirementsRegister) }),
    },
    PROJECT_MANAGEMENT_PLAN: {
      missingForSubmission: async (projectId) => [
        ...(await written(repos.projectManagementPlans, projectId, 'le plan de management rédigé')),
        ...(await written(repos.scopeStatements, projectId, "l'énoncé du périmètre")),
        ...(await written(repos.plans, projectId, 'la WBS')),
        ...(await written(repos.costEstimates, projectId, 'les estimations des coûts')),
      ],
      // Références de base de performance figées avec la version approuvée.
      archive: baselineCapture(repos.plans, repos.costEstimates, repos.baselines),
      snapshot: (projectId) =>
        documentsOf(projectId, {
          'project-management-plan': readOrSkip(useCases.getProjectManagementPlan),
          'management-plans': readOrSkip(useCases.getManagementPlans),
          'resource-plan': readOrSkip(useCases.getResourcePlan),
          'communication-plan': readOrSkip(useCases.getCommunicationPlan),
          'engagement-plan': readOrSkip(useCases.getEngagementPlan),
          'procurement-plan': readOrSkip(useCases.getProcurementPlan),
          'procurement-strategy': readOrSkip(useCases.getProcurementStrategy),
          'quality-plan': readOrSkip(useCases.getQualityPlan),
          'risk-plan': readOrSkip(useCases.getRiskPlan),
          'scope-statement': readOrSkip(useCases.getScopeStatement),
          plan: readOrSkip(useCases.getProjectPlan),
          'wbs-dictionary': readOrSkip(useCases.getWbsDictionary),
          'schedule-model': readOrSkip(useCases.getScheduleModel),
          'cost-estimates': readOrSkip(useCases.getCostEstimates),
          'cost-baseline': readOrSkip(useCases.getCostBaseline),
          'funding-strategy': readOrSkip(useCases.getFundingStrategy),
        }),
    },
  };
  const deps = {
    approvals: repos.approvals,
    approvers: repos.approvers,
    snapshots: repos.approvalSnapshots,
    users: repos.users,
    sources,
    changeLogs: repos.changeLogs,
  };
  const getProjectApprovals = new GetProjectApprovalsService(deps);
  return {
    getProjectApprovals,
    actOnApproval: new ActOnApprovalService(deps, getProjectApprovals, clock),
    getApprovalSnapshot: new GetApprovalSnapshotService(repos.approvals, repos.approvalSnapshots),
    setProjectApprovers: new SetProjectApproversService(repos.approvers, repos.users),
    getMyApprovals: new GetMyApprovalsService(
      repos.projects,
      repos.approvers,
      repos.approvals,
      repos.changeLogs,
      repos.sourceSelections,
    ),
    decideChangeRequest: new DecideChangeRequestService(
      repos.changeLogs,
      repos.approvers,
      repos.users,
      changeLogReader(repos.costEstimates),
      clock,
    ),
    awardSourceSelection: new AwardSourceSelectionService(
      repos.sourceSelections,
      repos.approvers,
      repos.users,
      toSourceSelectionsDto,
      clock,
    ),
  };
}

function wireUseCases(repos: Repositories, hasher: PasswordHasher): AppContainer {
  const ids = new CryptoIdGenerator();
  const engagement = engagementPlanServices(repos.stakeholders);
  const issues = issueLogServices(repos.risks, repos.changeLogs);
  const schedule = scheduleModelServices(repos.plans);
  const dictionary = wbsDictionaryServices(repos.plans, repos.scheduleModels, repos.costEstimates);
  const mapping = stakeholderMappingServices(repos.stakeholders);
  const qualityReport = qualityReportServices(repos.qualityMetrics);
  // Intégrité référentielle « RESTRICT » : une entrée encore citée ailleurs ne se retire pas.
  const riskGuard = referenceGuard(repos.risks, (register) => register.risks.map((risk) => risk.code), [
    risksCitedByAssumptions(repos.assumptions),
    risksCitedByIssues(repos.issueLogs),
  ]);
  const stakeholderGuard = referenceGuard(
    repos.stakeholders,
    (register) => register.stakeholders.map((stakeholder) => stakeholder.code),
    [stakeholdersCitedByEngagementPlan(repos.engagementPlans), stakeholdersCitedByMapping(repos.stakeholderMappings)],
  );
  const changeGuard = referenceGuard(repos.changeLogs, (log) => log.requests.map((request) => request.code), [
    changesCitedByIssues(repos.issueLogs),
  ]);
  const metricGuard = referenceGuard(repos.qualityMetrics, (metrics) => metrics.props.metrics.map((metric) => metric.code), [
    metricsCitedByQualityReport(repos.qualityReports),
  ]);
  const wbsGuard = referenceGuard(repos.plans, (plan) => plan.tasks.map((task) => task.wbs.value), [
    wbsCitedByScheduleModel(repos.scheduleModels),
    wbsCitedByDictionary(repos.wbsDictionaries),
    wbsCitedByActualCosts(repos.actualCosts),
    wbsCitedByProgress(repos.taskProgress),
  ]);
  // Personnes choisies dans le référentiel ; circuit de validation : une version soumise ou
  // approuvée est figée (le suivi reste libre).
  const people = peopleRules(repos);
  const checked: Repositories = { ...repos, ...checkedRepositories(people) };
  const locked = lockedRepositories(checked);
  const changeDecisions = changeDecisionGuard(repos.changeLogs);
  // Pilotage du réel : « aujourd'hui » des contrôles, retards et dates d'état.
  const clock = () => new Date();
  // Gouvernance : un projet n'est visible que de ses membres (et des administrateurs).
  const access = new ProjectAccess(repos.projects, repos.projectMembers, repos.approvers);
  const projectTeam = new GetProjectTeamService(repos.projectMembers, repos.users);
  const planDto = projectPlanReader(repos.resourceDirectory, repos.taskProgress, clock);
  const costs = actualCostsServices(repos.plans, repos.costEstimates, clock);
  const performance = {
    plans: repos.plans,
    estimates: repos.costEstimates,
    baselines: repos.baselines,
    progress: repos.taskProgress,
    actualCosts: repos.actualCosts,
  };
  // Rapport exécutif alimenté par les éléments du projet, calculés à sa date.
  const reportDto = executiveReportReader({
    ...performance,
    projects: repos.projects,
    risks: repos.risks,
    charters: repos.charters,
    requirements: repos.requirements,
    scheduleModels: repos.scheduleModels,
    changeLogs: repos.changeLogs,
    issueLogs: repos.issueLogs,
  });
  const readFundingStrategy = fundingStrategyReader(repos.charters);
  const readProjectManagementPlan = projectManagementPlanReader({
    charters: repos.charters,
    managementPlans: repos.managementPlans,
    qualityPlans: repos.qualityPlans,
    resourcePlans: repos.resourcePlans,
    communicationPlans: repos.communicationPlans,
    riskPlans: repos.riskPlans,
    procurementPlans: repos.procurementPlans,
    engagementPlans: repos.engagementPlans,
    scopeStatements: repos.scopeStatements,
    schedules: repos.plans,
    costEstimates: repos.costEstimates,
  });
  const useCases: Omit<AppContainer, ApprovalUseCaseKey> = {
    login: new LoginService(repos.users, hasher),
    getCurrentUser: new GetCurrentUserService(repos.users),
    resolveSession: new ResolveSessionService(repos.users),
    changeOwnPassword: new ChangeOwnPasswordService(repos.users, hasher),
    userAdministration: new UserAdministrationService(repos.users, hasher, new CryptoPasswordGenerator(), ids),
    resourceDirectory: new ResourceDirectoryService(
      repos.resourceDirectory,
      repos.users,
      ids,
      resourceCitations(repos.projects, Object.values(people)),
    ),
    listExecutiveReports: new ListExecutiveReportsService(repos.reports),
    getExecutiveReport: new GetExecutiveReportService(repos.reports, reportDto),
    saveExecutiveReport: new SaveExecutiveReportService(repos.reports, reportDto),
    publishExecutiveReport: new PublishExecutiveReportService(repos.reports, repos.users, reportDto, clock),
    deleteExecutiveReport: new DeleteExecutiveReportService(repos.reports),
    getProjectPlan: new GetProjectPlanService(repos.plans, planDto),
    saveProjectPlan: new SaveProjectPlanService(
      locked.plans,
      (projectId, plan) => wbsGuard.beforeSave(projectId, plan),
      planDto,
    ),
    listProjects: new ListProjectsService(access),
    createProject: new CreateProjectService(repos.projects, repos.projectMembers),
    updateProject: new UpdateProjectService(repos.projects),
    deleteProject: new DeleteProjectService(repos.projects, [
      repos.reports,
      repos.plans,
      repos.risks,
      repos.charters,
      repos.stakeholders,
      repos.assumptions,
      repos.businessCases,
      repos.benefitsPlans,
      repos.responsibilityMatrices,
      repos.managementPlans,
      repos.requirements,
      repos.scopeStatements,
      repos.costEstimates,
      repos.resourceRequirements,
      repos.resourcePlans,
      repos.teamCharters,
      repos.engagementPlans,
      repos.communicationPlans,
      repos.procurementPlans,
      repos.procurementStrategies,
      repos.sourceSelections,
      repos.projectManagementPlans,
      repos.qualityPlans,
      repos.riskPlans,
      repos.changeLogs,
      repos.issueLogs,
      repos.lessonsLearned,
      repos.scheduleModels,
      repos.wbsDictionaries,
      repos.stakeholderQuestionnaires,
      repos.stakeholderMappings,
      repos.qualityMetrics,
      repos.qualityReports,
      repos.qualityAnalyses,
      repos.fundingStrategies,
      repos.actualCosts,
      repos.taskProgress,
      repos.approvals,
      repos.approvalSnapshots,
      repos.approvers,
      repos.projectMembers,
      repos.baselines,
    ]),
    getRiskRegister: new GetRiskRegisterService(repos.risks),
    saveRiskRegister: new SaveRiskRegisterService(checked.risks, riskGuard.beforeSave),
    getProjectCharter: new GetProjectCharterService(repos.charters, repos.stakeholders, repos.assumptions),
    saveProjectCharter: new SaveProjectCharterService(locked.charters, repos.stakeholders, repos.assumptions),
    getStakeholderRegister: new GetStakeholderRegisterService(repos.stakeholders),
    saveStakeholderRegister: new SaveStakeholderRegisterService(repos.stakeholders, stakeholderGuard.beforeSave),
    getAssumptionLog: new GetAssumptionLogService(repos.assumptions),
    saveAssumptionLog: new SaveAssumptionLogService(checked.assumptions, repos.risks),
    getBusinessCase: new GetProjectDocumentService(
      repos.businessCases,
      toBusinessCaseDto,
      (projectId) => new DocumentNotFoundError(`Aucun business case pour le projet "${projectId}".`),
    ),
    saveBusinessCase: new SaveProjectDocumentService(locked.businessCases, {
      fromInput: inputToBusinessCase,
      toDto: toBusinessCaseDto,
    }),
    getBenefitsPlan: new GetProjectDocumentService(
      repos.benefitsPlans,
      toBenefitsPlanDto,
      (projectId) => new DocumentNotFoundError(`Aucun plan de gestion des bénéfices pour le projet "${projectId}".`),
    ),
    saveBenefitsPlan: new SaveProjectDocumentService(locked.benefitsPlans, {
      fromInput: inputToBenefitsPlan,
      toDto: toBenefitsPlanDto,
    }),
    getResponsibilityMatrix: new GetProjectDocumentService(
      repos.responsibilityMatrices,
      toResponsibilityMatrixDto,
      (projectId) => new DocumentNotFoundError(`Aucune matrice RACI pour le projet "${projectId}".`),
    ),
    saveResponsibilityMatrix: new SaveProjectDocumentService(checked.responsibilityMatrices, {
      fromInput: inputToResponsibilityMatrix,
      toDto: toResponsibilityMatrixDto,
    }),
    getManagementPlans: new GetProjectRegisterService(
      repos.managementPlans,
      toManagementPlansDto,
      ManagementPlans.empty,
    ),
    saveManagementPlans: new SaveProjectDocumentService(locked.managementPlans, {
      fromInput: inputToManagementPlans,
      toDto: toManagementPlansDto,
    }),
    getRequirementsRegister: new GetProjectRegisterService(
      repos.requirements,
      toRequirementsRegisterDto,
      RequirementsRegister.empty,
    ),
    saveRequirementsRegister: new SaveProjectDocumentService(locked.requirements, {
      fromInput: inputToRequirementsRegister,
      toDto: toRequirementsRegisterDto,
    }),
    getScopeStatement: new GetProjectDocumentService(
      repos.scopeStatements,
      scopeStatementReader(repos.assumptions),
      (projectId) => new DocumentNotFoundError(`Aucun énoncé du périmètre pour le projet "${projectId}".`),
    ),
    saveScopeStatement: new SaveProjectDocumentService(locked.scopeStatements, {
      fromInput: inputToScopeStatement,
      toDto: scopeStatementReader(repos.assumptions),
    }),
    getCostEstimates: new GetProjectDocumentService(
      repos.costEstimates,
      costEstimatesReader(repos.charters),
      (projectId) => new DocumentNotFoundError(`Aucune estimation des coûts pour le projet "${projectId}".`),
    ),
    saveCostEstimates: new SaveProjectDocumentService(locked.costEstimates, {
      fromInput: inputToCostEstimates,
      toDto: costEstimatesReader(repos.charters),
    }),
    getCostBaseline: new GetCostBaselineService(repos.costEstimates, repos.plans, repos.charters),
    getResourceRequirements: new GetProjectRegisterService(
      repos.resourceRequirements,
      toResourceRequirementsDto,
      ResourceRequirements.empty,
    ),
    saveResourceRequirements: new SaveProjectDocumentService(repos.resourceRequirements, {
      fromInput: inputToResourceRequirements,
      toDto: toResourceRequirementsDto,
    }),
    getResourcePlan: new GetProjectDocumentService(
      repos.resourcePlans,
      resourcePlanReader(repos.resourceRequirements),
      (projectId) => new DocumentNotFoundError(`Aucun plan de gestion des ressources pour le projet "${projectId}".`),
    ),
    saveResourcePlan: new SaveProjectDocumentService(locked.resourcePlans, {
      fromInput: inputToResourcePlan,
      toDto: resourcePlanReader(repos.resourceRequirements),
    }),
    getTeamCharter: new GetProjectDocumentService(
      repos.teamCharters,
      toTeamCharterDto,
      (projectId) => new DocumentNotFoundError(`Aucune charte d'équipe pour le projet "${projectId}".`),
    ),
    saveTeamCharter: new SaveProjectDocumentService(checked.teamCharters, {
      fromInput: inputToTeamCharter,
      toDto: toTeamCharterDto,
    }),
    getEngagementPlan: new GetProjectDocumentService(
      repos.engagementPlans,
      engagement.toDto,
      (projectId) => new DocumentNotFoundError(`Aucun plan d'engagement des parties prenantes pour le projet "${projectId}".`),
    ),
    saveEngagementPlan: new SaveProjectDocumentService(locked.engagementPlans, {
      fromInput: inputToEngagementPlan,
      toDto: engagement.toDto,
      beforeSave: engagement.beforeSave,
    }),
    getCommunicationPlan: new GetProjectDocumentService(
      repos.communicationPlans,
      toCommunicationPlanDto,
      (projectId) => new DocumentNotFoundError(`Aucun plan de communication pour le projet "${projectId}".`),
    ),
    saveCommunicationPlan: new SaveProjectDocumentService(locked.communicationPlans, {
      fromInput: inputToCommunicationPlan,
      toDto: toCommunicationPlanDto,
    }),
    getProcurementPlan: new GetProjectDocumentService(
      repos.procurementPlans,
      procurementPlanReader(repos.assumptions),
      (projectId) => new DocumentNotFoundError(`Aucun plan de gestion des approvisionnements pour le projet "${projectId}".`),
    ),
    saveProcurementPlan: new SaveProjectDocumentService(locked.procurementPlans, {
      fromInput: inputToProcurementPlan,
      toDto: procurementPlanReader(repos.assumptions),
    }),
    getProcurementStrategy: new GetProjectDocumentService(
      repos.procurementStrategies,
      toProcurementStrategyDto,
      (projectId) => new DocumentNotFoundError(`Aucune stratégie d'approvisionnement pour le projet "${projectId}".`),
    ),
    saveProcurementStrategy: new SaveProjectDocumentService(locked.procurementStrategies, {
      fromInput: inputToProcurementStrategy,
      toDto: toProcurementStrategyDto,
    }),
    getSourceSelections: new GetProjectRegisterService(
      repos.sourceSelections,
      toSourceSelectionsDto,
      SourceSelections.empty,
    ),
    saveSourceSelections: new SaveProjectDocumentService(repos.sourceSelections, {
      fromInput: inputToSourceSelections,
      toDto: toSourceSelectionsDto,
      beforeSave: awardGuard(repos.sourceSelections),
    }),
    getProjectManagementPlan: new GetProjectDocumentService(
      repos.projectManagementPlans,
      readProjectManagementPlan,
      (projectId) => new DocumentNotFoundError(`Aucun plan de management pour le projet "${projectId}".`),
    ),
    saveProjectManagementPlan: new SaveProjectDocumentService(locked.projectManagementPlans, {
      fromInput: inputToProjectManagementPlan,
      toDto: readProjectManagementPlan,
    }),
    getQualityPlan: new GetProjectDocumentService(
      repos.qualityPlans,
      toQualityPlanDto,
      (projectId) => new DocumentNotFoundError(`Aucun plan de gestion de la qualité pour le projet "${projectId}".`),
    ),
    saveQualityPlan: new SaveProjectDocumentService(locked.qualityPlans, {
      fromInput: inputToQualityPlan,
      toDto: toQualityPlanDto,
    }),
    getRiskPlan: new GetProjectDocumentService(
      repos.riskPlans,
      toRiskPlanDto,
      (projectId) => new DocumentNotFoundError(`Aucun plan de gestion des risques pour le projet "${projectId}".`),
    ),
    saveRiskPlan: new SaveProjectDocumentService(locked.riskPlans, {
      fromInput: inputToRiskPlan,
      toDto: toRiskPlanDto,
    }),
    getChangeLog: new GetProjectRegisterService(repos.changeLogs, changeLogReader(repos.costEstimates), ChangeLog.empty),
    saveChangeLog: new SaveProjectDocumentService(checked.changeLogs, {
      fromInput: inputToChangeLog,
      toDto: changeLogReader(repos.costEstimates),
      beforeSave: async (log) => {
        await changeGuard.beforeSave(log.projectId, log);
        await changeDecisions(log);
      },
    }),
    getIssueLog: new GetProjectRegisterService(repos.issueLogs, issues.toDto, IssueLog.empty),
    saveIssueLog: new SaveProjectDocumentService(checked.issueLogs, {
      fromInput: inputToIssueLog,
      toDto: issues.toDto,
      beforeSave: issues.beforeSave,
    }),
    getLessonsLearned: new GetProjectRegisterService(repos.lessonsLearned, toLessonsLearnedDto, LessonsLearned.empty),
    saveLessonsLearned: new SaveProjectDocumentService(checked.lessonsLearned, {
      fromInput: inputToLessonsLearned,
      toDto: toLessonsLearnedDto,
    }),
    getScheduleModel: new GetProjectDocumentService(
      repos.scheduleModels,
      schedule.toDto,
      (projectId) => new DocumentNotFoundError(`Aucun modèle d'ordonnancement pour le projet "${projectId}".`),
    ),
    saveScheduleModel: new SaveProjectDocumentService(locked.scheduleModels, {
      fromInput: inputToScheduleModel,
      toDto: schedule.toDto,
      beforeSave: schedule.beforeSave,
    }),
    getWbsDictionary: new GetProjectRegisterService(repos.wbsDictionaries, dictionary.toDto, WbsDictionary.empty),
    saveWbsDictionary: new SaveProjectDocumentService(locked.wbsDictionaries, {
      fromInput: inputToWbsDictionary,
      toDto: dictionary.toDto,
      beforeSave: dictionary.beforeSave,
    }),
    getStakeholderQuestionnaire: new GetProjectDocumentService(
      repos.stakeholderQuestionnaires,
      toQuestionnaireDto,
      (projectId) => new DocumentNotFoundError(`Aucun questionnaire d'identification pour le projet "${projectId}".`),
    ),
    saveStakeholderQuestionnaire: new SaveProjectDocumentService(repos.stakeholderQuestionnaires, {
      fromInput: inputToQuestionnaire,
      toDto: toQuestionnaireDto,
    }),
    getStakeholderMapping: new GetProjectDocumentService(
      repos.stakeholderMappings,
      mapping.toDto,
      (projectId) => new DocumentNotFoundError(`Aucune cartographie des parties prenantes pour le projet "${projectId}".`),
    ),
    saveStakeholderMapping: new SaveProjectDocumentService(repos.stakeholderMappings, {
      fromInput: inputToMapping,
      toDto: mapping.toDto,
      beforeSave: mapping.beforeSave,
    }),
    getQualityMetrics: new GetProjectDocumentService(
      repos.qualityMetrics,
      toQualityMetricsDto,
      (projectId) => new DocumentNotFoundError(`Aucune métrique qualité pour le projet "${projectId}".`),
    ),
    saveQualityMetrics: new SaveProjectDocumentService(repos.qualityMetrics, {
      fromInput: inputToQualityMetrics,
      toDto: toQualityMetricsDto,
      beforeSave: (metrics) => metricGuard.beforeSave(metrics.projectId, metrics),
    }),
    getQualityReport: new GetProjectDocumentService(
      repos.qualityReports,
      qualityReport.toDto,
      (projectId) => new DocumentNotFoundError(`Aucun rapport qualité pour le projet "${projectId}".`),
    ),
    saveQualityReport: new SaveProjectDocumentService(repos.qualityReports, {
      fromInput: inputToQualityReport,
      toDto: qualityReport.toDto,
      beforeSave: qualityReport.beforeSave,
    }),
    getQualityAnalyses: new GetProjectDocumentService(
      repos.qualityAnalyses,
      toQualityAnalysesDto,
      (projectId) => new DocumentNotFoundError(`Aucun outil d'analyse qualité pour le projet "${projectId}".`),
    ),
    saveQualityAnalyses: new SaveProjectDocumentService(repos.qualityAnalyses, {
      fromInput: inputToQualityAnalyses,
      toDto: toQualityAnalysesDto,
    }),
    getFundingStrategy: new GetProjectDocumentService(
      repos.fundingStrategies,
      readFundingStrategy,
      (projectId) => new DocumentNotFoundError(`Aucune stratégie de financement pour le projet "${projectId}".`),
    ),
    saveFundingStrategy: new SaveProjectDocumentService(locked.fundingStrategies, {
      fromInput: inputToFundingStrategy,
      toDto: readFundingStrategy,
    }),
    getFundingRequirements: new GetFundingRequirementsService(repos.fundingStrategies, repos.costEstimates, repos.plans),
    getActualCosts: new GetProjectRegisterService(repos.actualCosts, costs.toDto, ActualCosts.empty),
    saveActualCosts: new SaveProjectDocumentService(repos.actualCosts, {
      fromInput: inputToActualCosts,
      toDto: costs.toDto,
      beforeSave: costs.beforeSave,
    }),
    updateTaskProgress: new UpdateTaskProgressService(
      repos.plans,
      repos.taskProgress,
      repos.resourceDirectory,
      repos.users,
      clock,
    ),
    getMyTasks: new GetMyTasksService(access, repos.plans, repos.taskProgress, repos.resourceDirectory, clock),
    getEarnedValue: new GetEarnedValueService(performance, clock),
    getPortfolio: new GetPortfolioService(
      {
        ...performance,
        reports: repos.reports,
        risks: repos.risks,
        issueLogs: repos.issueLogs,
        scheduleModels: repos.scheduleModels,
        reportDto,
      },
      access,
      clock,
    ),
    deleteDocument: {
      charters: new DeleteProjectDocumentService(locked.charters),
      businessCases: new DeleteProjectDocumentService(locked.businessCases),
      benefitsPlans: new DeleteProjectDocumentService(locked.benefitsPlans),
      responsibilityMatrices: new DeleteProjectDocumentService(repos.responsibilityMatrices),
      scopeStatements: new DeleteProjectDocumentService(locked.scopeStatements),
      costEstimates: new DeleteProjectDocumentService(locked.costEstimates),
      fundingStrategies: new DeleteProjectDocumentService(locked.fundingStrategies),
      resourcePlans: new DeleteProjectDocumentService(locked.resourcePlans),
      teamCharters: new DeleteProjectDocumentService(repos.teamCharters),
      engagementPlans: new DeleteProjectDocumentService(locked.engagementPlans),
      communicationPlans: new DeleteProjectDocumentService(locked.communicationPlans),
      procurementPlans: new DeleteProjectDocumentService(locked.procurementPlans),
      procurementStrategies: new DeleteProjectDocumentService(locked.procurementStrategies),
      projectManagementPlans: new DeleteProjectDocumentService(locked.projectManagementPlans),
      qualityPlans: new DeleteProjectDocumentService(locked.qualityPlans),
      riskPlans: new DeleteProjectDocumentService(locked.riskPlans),
      scheduleModels: new DeleteProjectDocumentService(locked.scheduleModels),
      stakeholderQuestionnaires: new DeleteProjectDocumentService(repos.stakeholderQuestionnaires),
      stakeholderMappings: new DeleteProjectDocumentService(repos.stakeholderMappings),
      qualityMetrics: new DeleteProjectDocumentService(repos.qualityMetrics, metricGuard.beforeDelete),
      qualityReports: new DeleteProjectDocumentService(repos.qualityReports),
      qualityAnalyses: new DeleteProjectDocumentService(repos.qualityAnalyses),
    },
    projectAccess: access,
    listDocumentVersions: new ListDocumentVersionsService(repos.versionLog, repos.users),
    recordAuditEvent: new RecordAuditEventService(repos.auditLog, repos.users),
    getAuditLog: new GetAuditLogService(repos.auditLog, repos.projects),
    getProjectTeam: projectTeam,
    saveProjectTeam: new SaveProjectTeamService(repos.projectMembers, repos.users, projectTeam),
  };
  return { ...useCases, ...approvalUseCases(repos, useCases, clock) };
}

async function isEmpty(pool: Pool, table: string): Promise<boolean> {
  const result = await pool.query(`SELECT 1 FROM ${table} LIMIT 1`);
  return result.rowCount === 0;
}

/** Insère les données de démonstration dans les tables vides (premier démarrage). */
async function seedIfEmpty(pool: Pool, repos: Repositories, hasher: PasswordHasher): Promise<void> {
  if (await isEmpty(pool, 'users')) {
    await seedUsers(repos.users, hasher);
  }
  if (await isEmpty(pool, 'projects')) {
    for (const record of buildProjectRecords()) {
      await repos.projects.save(record);
    }
  }
  if (await isEmpty(pool, 'executive_status_reports')) {
    await repos.reports.save(buildProjectAlphaReport());
  }
  if (await isEmpty(pool, 'project_plans')) {
    await repos.plans.save(buildProjectAlphaPlan());
  }
  if (await isEmpty(pool, 'risk_registers')) {
    await repos.risks.save(buildProjectAlphaRiskRegister());
  }
  if (await isEmpty(pool, 'project_charters')) {
    await repos.charters.save(buildProjectAlphaCharter());
  }
  if (await isEmpty(pool, 'stakeholder_registers')) {
    await repos.stakeholders.save(buildProjectAlphaStakeholders());
  }
  if (await isEmpty(pool, 'assumption_logs')) {
    await repos.assumptions.save(buildProjectAlphaAssumptions());
  }
  if (await isEmpty(pool, 'business_cases')) {
    await repos.businessCases.save(buildProjectAlphaBusinessCase());
  }
  if (await isEmpty(pool, 'benefits_plans')) {
    await repos.benefitsPlans.save(buildProjectAlphaBenefitsPlan());
  }
  if (await isEmpty(pool, 'responsibility_matrices')) {
    await repos.responsibilityMatrices.save(buildProjectAlphaResponsibilityMatrix());
  }
  if (await isEmpty(pool, 'management_plans')) {
    await repos.managementPlans.save(buildProjectAlphaManagementPlans());
  }
  if (await isEmpty(pool, 'requirements_registers')) {
    await repos.requirements.save(buildProjectAlphaRequirements());
  }
  if (await isEmpty(pool, 'scope_statements')) {
    await repos.scopeStatements.save(buildProjectAlphaScopeStatement());
  }
  if (await isEmpty(pool, 'cost_estimates')) {
    await repos.costEstimates.save(buildProjectAlphaCostEstimates());
  }
  if (await isEmpty(pool, 'resource_requirements')) {
    await repos.resourceRequirements.save(buildProjectAlphaResourceRequirements());
  }
  if (await isEmpty(pool, 'resource_management_plans')) {
    await repos.resourcePlans.save(buildProjectAlphaResourcePlan());
  }
  if (await isEmpty(pool, 'team_charters')) {
    await repos.teamCharters.save(buildProjectAlphaTeamCharter());
  }
  if (await isEmpty(pool, 'stakeholder_engagement_plans')) {
    await repos.engagementPlans.save(buildProjectAlphaEngagementPlan());
  }
  if (await isEmpty(pool, 'communication_plans')) {
    await repos.communicationPlans.save(buildProjectAlphaCommunicationPlan());
  }
  if (await isEmpty(pool, 'procurement_plans')) {
    await repos.procurementPlans.save(buildProjectAlphaProcurementPlan());
  }
  if (await isEmpty(pool, 'procurement_strategies')) {
    await repos.procurementStrategies.save(buildProjectAlphaProcurementStrategy());
  }
  if (await isEmpty(pool, 'source_selections')) {
    await repos.sourceSelections.save(buildProjectAlphaSourceSelections());
  }
  if (await isEmpty(pool, 'project_management_plans')) {
    await repos.projectManagementPlans.save(buildProjectAlphaManagementPlan());
  }
  if (await isEmpty(pool, 'quality_management_plans')) {
    await repos.qualityPlans.save(buildProjectAlphaQualityPlan());
  }
  if (await isEmpty(pool, 'risk_management_plans')) {
    await repos.riskPlans.save(buildProjectAlphaRiskPlan());
  }
  if (await isEmpty(pool, 'change_logs')) {
    await repos.changeLogs.save(buildProjectAlphaChangeLog());
  }
  if (await isEmpty(pool, 'issue_logs')) {
    await repos.issueLogs.save(buildProjectAlphaIssueLog());
  }
  if (await isEmpty(pool, 'lessons_learned')) {
    await repos.lessonsLearned.save(buildProjectAlphaLessonsLearned());
  }
  if (await isEmpty(pool, 'schedule_models')) {
    await repos.scheduleModels.save(buildProjectAlphaScheduleModel());
  }
  if (await isEmpty(pool, 'wbs_dictionaries')) {
    await repos.wbsDictionaries.save(buildProjectAlphaWbsDictionary());
  }
  if (await isEmpty(pool, 'stakeholder_questionnaires')) {
    await repos.stakeholderQuestionnaires.save(buildProjectAlphaQuestionnaire());
  }
  if (await isEmpty(pool, 'stakeholder_mappings')) {
    await repos.stakeholderMappings.save(buildProjectAlphaStakeholderMapping());
  }
  if (await isEmpty(pool, 'quality_metrics')) {
    await repos.qualityMetrics.save(buildProjectAlphaQualityMetrics());
  }
  if (await isEmpty(pool, 'quality_reports')) {
    await repos.qualityReports.save(buildProjectAlphaQualityReport());
  }
  if (await isEmpty(pool, 'quality_analyses')) {
    await repos.qualityAnalyses.save(buildProjectAlphaQualityAnalyses());
  }
  if (await isEmpty(pool, 'funding_strategies')) {
    await repos.fundingStrategies.save(buildProjectAlphaFundingStrategy());
  }
  if (await isEmpty(pool, 'actual_costs')) {
    await repos.actualCosts.save(buildProjectAlphaActualCosts());
  }
  if (await isEmpty(pool, 'task_progress')) {
    for (const measure of buildProjectAlphaTaskProgress()) await repos.taskProgress.save(measure);
  }
  // Circuit de validation d'Alpha : historique cohérent avec la simulation, sponsor valideuse.
  if (await isEmpty(pool, 'document_approvals')) {
    for (const approval of buildProjectAlphaApprovals()) await repos.approvals.save(approval, 0);
  }
  if (await isEmpty(pool, 'project_members')) {
    const demo = await Promise.all(DEMO_PROJECT_IDS.map((projectId) => repos.projects.findById(projectId)));
    for (const team of buildDemoProjectTeams()) {
      if (demo.some((project) => project?.id === team.projectId)) await repos.projectMembers.replace(team);
    }
  }
  if (await isEmpty(pool, 'project_approvers')) {
    for (const [projectId, userIds] of Object.entries(ALPHA_APPROVERS)) await repos.approvers.replace(projectId, userIds);
  }
  if (await isEmpty(pool, 'directory_resources')) {
    for (const resource of buildResourceDirectory()) {
      await repos.resourceDirectory.save(resource);
    }
  }
  // Plans de management approuvés avant la capture des références de base : en vigueur et figé, le
  // contenu actuel est celui de la version approuvée.
  if (await isEmpty(pool, 'project_baselines')) {
    const capture = baselineCapture(repos.plans, repos.costEstimates, repos.baselines);
    for (const project of await repos.projects.list()) {
      const approval = await repos.approvals.find(project.id, 'PROJECT_MANAGEMENT_PLAN');
      const approved = approval?.status === 'APPROVED' ? approval.lastApproval : null;
      if (approved) await capture(project.id, approved.revision, approved.at);
    }
  }
}

export async function buildContainer(env: AppEnv): Promise<AppContainer> {
  const hasher = new BcryptPasswordHasher();

  if (env.DATABASE_URL) {
    const pool = createPool(env.DATABASE_URL);
    await migrate(pool);
    const repos: Repositories = {
      reports: new PostgresStatusReportRepository(pool),
      plans: new PostgresProjectPlanRepository(pool),
      projects: new PostgresProjectRepository(pool),
      users: new PostgresUserRepository(pool),
      risks: new PostgresDocumentRepository(pool, 'risk_registers', {
        toInput: riskRegisterToInput,
        fromInput: (projectId, data) => inputToRiskRegister(projectId, upgradeRiskRegisterInput(data)),
      }),
      charters: new PostgresDocumentRepository(pool, 'project_charters', {
        toInput: charterToInput,
        fromInput: (projectId, data) => inputToCharter(projectId, upgradeCharterInput(data)),
      }),
      stakeholders: new PostgresDocumentRepository(pool, 'stakeholder_registers', {
        toInput: stakeholderRegisterToInput,
        fromInput: (projectId, data) =>
          inputToStakeholderRegister(projectId, upgradeStakeholderRegisterInput(data)),
      }),
      assumptions: new PostgresDocumentRepository(pool, 'assumption_logs', {
        toInput: assumptionLogToInput,
        fromInput: (projectId, data) => inputToAssumptionLog(projectId, upgradeAssumptionLogInput(data)),
      }),
      businessCases: new PostgresDocumentRepository(pool, 'business_cases', {
        toInput: businessCaseToInput,
        fromInput: inputToBusinessCase,
      }),
      benefitsPlans: new PostgresDocumentRepository(pool, 'benefits_plans', {
        toInput: benefitsPlanToInput,
        fromInput: inputToBenefitsPlan,
      }),
      responsibilityMatrices: new PostgresDocumentRepository(pool, 'responsibility_matrices', {
        toInput: responsibilityMatrixToInput,
        fromInput: inputToResponsibilityMatrix,
      }),
      managementPlans: new PostgresDocumentRepository(pool, 'management_plans', {
        toInput: managementPlansToInput,
        fromInput: inputToManagementPlans,
      }),
      requirements: new PostgresDocumentRepository(pool, 'requirements_registers', {
        toInput: requirementsRegisterToInput,
        fromInput: inputToRequirementsRegister,
      }),
      scopeStatements: new PostgresDocumentRepository(pool, 'scope_statements', {
        toInput: scopeStatementToInput,
        fromInput: inputToScopeStatement,
      }),
      costEstimates: new PostgresDocumentRepository(pool, 'cost_estimates', {
        toInput: costEstimatesToInput,
        fromInput: inputToCostEstimates,
      }),
      resourceRequirements: new PostgresDocumentRepository(pool, 'resource_requirements', {
        toInput: resourceRequirementsToInput,
        fromInput: inputToResourceRequirements,
      }),
      resourcePlans: new PostgresDocumentRepository(pool, 'resource_management_plans', {
        toInput: resourcePlanToInput,
        fromInput: inputToResourcePlan,
      }),
      teamCharters: new PostgresDocumentRepository(pool, 'team_charters', {
        toInput: teamCharterToInput,
        fromInput: inputToTeamCharter,
      }),
      engagementPlans: new PostgresDocumentRepository(pool, 'stakeholder_engagement_plans', {
        toInput: engagementPlanToInput,
        fromInput: inputToEngagementPlan,
      }),
      communicationPlans: new PostgresDocumentRepository(pool, 'communication_plans', {
        toInput: communicationPlanToInput,
        fromInput: inputToCommunicationPlan,
      }),
      procurementPlans: new PostgresDocumentRepository(pool, 'procurement_plans', {
        toInput: procurementPlanToInput,
        fromInput: inputToProcurementPlan,
      }),
      procurementStrategies: new PostgresDocumentRepository(pool, 'procurement_strategies', {
        toInput: procurementStrategyToInput,
        fromInput: inputToProcurementStrategy,
      }),
      sourceSelections: new PostgresDocumentRepository(pool, 'source_selections', {
        toInput: sourceSelectionsToInput,
        fromInput: inputToSourceSelections,
      }),
      projectManagementPlans: new PostgresDocumentRepository(pool, 'project_management_plans', {
        toInput: projectManagementPlanToInput,
        fromInput: inputToProjectManagementPlan,
      }),
      qualityPlans: new PostgresDocumentRepository(pool, 'quality_management_plans', {
        toInput: qualityPlanToInput,
        fromInput: inputToQualityPlan,
      }),
      riskPlans: new PostgresDocumentRepository(pool, 'risk_management_plans', {
        toInput: riskPlanToInput,
        fromInput: inputToRiskPlan,
      }),
      changeLogs: new PostgresDocumentRepository(pool, 'change_logs', {
        toInput: changeLogToInput,
        fromInput: inputToChangeLog,
      }),
      issueLogs: new PostgresDocumentRepository(pool, 'issue_logs', {
        toInput: issueLogToInput,
        fromInput: inputToIssueLog,
      }),
      lessonsLearned: new PostgresDocumentRepository(pool, 'lessons_learned', {
        toInput: lessonsLearnedToInput,
        fromInput: inputToLessonsLearned,
      }),
      scheduleModels: new PostgresDocumentRepository(pool, 'schedule_models', {
        toInput: scheduleModelToInput,
        fromInput: inputToScheduleModel,
      }),
      wbsDictionaries: new PostgresDocumentRepository(pool, 'wbs_dictionaries', {
        toInput: wbsDictionaryToInput,
        fromInput: inputToWbsDictionary,
      }),
      stakeholderQuestionnaires: new PostgresDocumentRepository(pool, 'stakeholder_questionnaires', {
        toInput: questionnaireToInput,
        fromInput: inputToQuestionnaire,
      }),
      stakeholderMappings: new PostgresDocumentRepository(pool, 'stakeholder_mappings', {
        toInput: mappingToInput,
        fromInput: inputToMapping,
      }),
      qualityMetrics: new PostgresDocumentRepository(pool, 'quality_metrics', {
        toInput: qualityMetricsToInput,
        fromInput: inputToQualityMetrics,
      }),
      qualityReports: new PostgresDocumentRepository(pool, 'quality_reports', {
        toInput: qualityReportToInput,
        fromInput: inputToQualityReport,
      }),
      qualityAnalyses: new PostgresDocumentRepository(pool, 'quality_analyses', {
        toInput: qualityAnalysesToInput,
        fromInput: inputToQualityAnalyses,
      }),
      fundingStrategies: new PostgresDocumentRepository(pool, 'funding_strategies', {
        toInput: fundingStrategyToInput,
        fromInput: inputToFundingStrategy,
      }),
      actualCosts: new PostgresDocumentRepository(pool, 'actual_costs', {
        toInput: actualCostsToInput,
        fromInput: inputToActualCosts,
      }),
      taskProgress: new PostgresTaskProgressRepository(pool),
      resourceDirectory: new PostgresResourceDirectoryRepository(pool),
      approvals: new PostgresApprovalRepository(pool),
      approvalSnapshots: new PostgresApprovalSnapshotRepository(pool),
      approvers: new PostgresProjectApproverRepository(pool),
      projectMembers: new PostgresProjectMemberRepository(pool),
      versionLog: new PostgresDocumentVersionLog(pool),
      baselines: new PostgresBaselineRepository(pool),
      auditLog: new PostgresAuditLogRepository(pool),
    };
    await seedIfEmpty(pool, repos, hasher);
    return wireUseCases(repos, hasher);
  }

  // Repli en mémoire : données volatiles (perdues au redémarrage).
  const repos: Repositories = {
    reports: new InMemoryStatusReportRepository([buildProjectAlphaReport()]),
    plans: new InMemoryProjectPlanRepository([buildProjectAlphaPlan()]),
    projects: new InMemoryProjectRepository(buildProjectRecords()),
    users: new InMemoryUserRepository(),
    risks: new InMemoryProjectDocumentRepository([buildProjectAlphaRiskRegister()]),
    charters: new InMemoryProjectDocumentRepository([buildProjectAlphaCharter()]),
    stakeholders: new InMemoryProjectDocumentRepository([buildProjectAlphaStakeholders()]),
    assumptions: new InMemoryProjectDocumentRepository([buildProjectAlphaAssumptions()]),
    businessCases: new InMemoryProjectDocumentRepository([buildProjectAlphaBusinessCase()]),
    benefitsPlans: new InMemoryProjectDocumentRepository([buildProjectAlphaBenefitsPlan()]),
    responsibilityMatrices: new InMemoryProjectDocumentRepository([buildProjectAlphaResponsibilityMatrix()]),
    managementPlans: new InMemoryProjectDocumentRepository([buildProjectAlphaManagementPlans()]),
    requirements: new InMemoryProjectDocumentRepository([buildProjectAlphaRequirements()]),
    scopeStatements: new InMemoryProjectDocumentRepository([buildProjectAlphaScopeStatement()]),
    costEstimates: new InMemoryProjectDocumentRepository([buildProjectAlphaCostEstimates()]),
    resourceRequirements: new InMemoryProjectDocumentRepository([buildProjectAlphaResourceRequirements()]),
    resourcePlans: new InMemoryProjectDocumentRepository([buildProjectAlphaResourcePlan()]),
    teamCharters: new InMemoryProjectDocumentRepository([buildProjectAlphaTeamCharter()]),
    engagementPlans: new InMemoryProjectDocumentRepository([buildProjectAlphaEngagementPlan()]),
    communicationPlans: new InMemoryProjectDocumentRepository([buildProjectAlphaCommunicationPlan()]),
    procurementPlans: new InMemoryProjectDocumentRepository([buildProjectAlphaProcurementPlan()]),
    procurementStrategies: new InMemoryProjectDocumentRepository([buildProjectAlphaProcurementStrategy()]),
    sourceSelections: new InMemoryProjectDocumentRepository([buildProjectAlphaSourceSelections()]),
    projectManagementPlans: new InMemoryProjectDocumentRepository([buildProjectAlphaManagementPlan()]),
    qualityPlans: new InMemoryProjectDocumentRepository([buildProjectAlphaQualityPlan()]),
    riskPlans: new InMemoryProjectDocumentRepository([buildProjectAlphaRiskPlan()]),
    changeLogs: new InMemoryProjectDocumentRepository([buildProjectAlphaChangeLog()]),
    issueLogs: new InMemoryProjectDocumentRepository([buildProjectAlphaIssueLog()]),
    lessonsLearned: new InMemoryProjectDocumentRepository([buildProjectAlphaLessonsLearned()]),
    scheduleModels: new InMemoryProjectDocumentRepository([buildProjectAlphaScheduleModel()]),
    wbsDictionaries: new InMemoryProjectDocumentRepository([buildProjectAlphaWbsDictionary()]),
    stakeholderQuestionnaires: new InMemoryProjectDocumentRepository([buildProjectAlphaQuestionnaire()]),
    stakeholderMappings: new InMemoryProjectDocumentRepository([buildProjectAlphaStakeholderMapping()]),
    qualityMetrics: new InMemoryProjectDocumentRepository([buildProjectAlphaQualityMetrics()]),
    qualityReports: new InMemoryProjectDocumentRepository([buildProjectAlphaQualityReport()]),
    qualityAnalyses: new InMemoryProjectDocumentRepository([buildProjectAlphaQualityAnalyses()]),
    fundingStrategies: new InMemoryProjectDocumentRepository([buildProjectAlphaFundingStrategy()]),
    actualCosts: new InMemoryProjectDocumentRepository([buildProjectAlphaActualCosts()]),
    taskProgress: new InMemoryTaskProgressRepository(buildProjectAlphaTaskProgress()),
    resourceDirectory: new InMemoryResourceDirectoryRepository(buildResourceDirectory()),
    approvals: new InMemoryApprovalRepository(buildProjectAlphaApprovals()),
    approvalSnapshots: new InMemoryApprovalSnapshotRepository(),
    approvers: new InMemoryProjectApproverRepository(ALPHA_APPROVERS),
    projectMembers: new InMemoryProjectMemberRepository(buildDemoProjectTeams()),
    versionLog: new InMemoryDocumentVersionLog(),
    baselines: new InMemoryBaselineRepository(),
    auditLog: new InMemoryAuditLogRepository(),
  };
  await seedUsers(repos.users, hasher);
  return wireUseCases(repos, hasher);
}
