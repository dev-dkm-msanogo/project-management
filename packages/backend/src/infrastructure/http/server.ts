import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';
import { contentRoleOf } from '@domain/value-objects/project-role';
import { canAdminister } from '@domain/value-objects/role';
import { adminRoutes } from '@infrastructure/adapters/in/http/admin.routes';
import { approvalRoutes } from '@infrastructure/adapters/in/http/approval.routes';
import { registerAuth } from '@infrastructure/adapters/in/http/auth/auth-plugin';
import { authRoutes } from '@infrastructure/adapters/in/http/auth/auth.routes';
import { registerErrorHandler } from '@infrastructure/adapters/in/http/error-handler';
import { registerAuditTrail } from '@infrastructure/adapters/in/http/audit-trail';
import { governanceRoutes } from '@infrastructure/adapters/in/http/governance.routes';
import { runInRequestContext } from '@infrastructure/concurrency/request-context';
import { planRoutes } from '@infrastructure/adapters/in/http/plan.routes';
import { projectRoutes } from '@infrastructure/adapters/in/http/project.routes';
import {
  projectDocumentRoutes,
  type ProjectDocumentRouteOptions,
} from '@infrastructure/adapters/in/http/project-document.routes';
import { performanceRoutes } from '@infrastructure/adapters/in/http/performance.routes';
import { saveActualCostsBodySchema } from '@infrastructure/adapters/in/http/schemas/performance.schema';
import { reportRoutes } from '@infrastructure/adapters/in/http/report.routes';
import {
  saveBenefitsPlanBodySchema,
  saveBusinessCaseBodySchema,
  saveResponsibilityMatrixBodySchema,
} from '@infrastructure/adapters/in/http/schemas/save-initiating-documents.schema';
import {
  saveManagementPlansBodySchema,
  saveRequirementsRegisterBodySchema,
  saveScopeStatementBodySchema,
} from '@infrastructure/adapters/in/http/schemas/save-scope-documents.schema';
import {
  saveResourcePlanBodySchema,
  saveResourceRequirementsBodySchema,
  saveTeamCharterBodySchema,
} from '@infrastructure/adapters/in/http/schemas/save-resource-documents.schema';
import {
  saveCommunicationPlanBodySchema,
  saveEngagementPlanBodySchema,
} from '@infrastructure/adapters/in/http/schemas/save-communication-documents.schema';
import {
  saveProcurementPlanBodySchema,
  saveProcurementStrategyBodySchema,
  saveSourceSelectionsBodySchema,
} from '@infrastructure/adapters/in/http/schemas/save-procurement-documents.schema';
import {
  saveQualityPlanBodySchema,
  saveRiskPlanBodySchema,
} from '@infrastructure/adapters/in/http/schemas/save-quality-risk-plans.schema';
import { saveLessonsLearnedBodySchema } from '@infrastructure/adapters/in/http/schemas/save-lessons-learned.schema';
import {
  saveScheduleModelBodySchema,
  saveWbsDictionaryBodySchema,
} from '@infrastructure/adapters/in/http/schemas/save-schedule-model.schema';
import {
  saveStakeholderMappingBodySchema,
  saveStakeholderQuestionnaireBodySchema,
} from '@infrastructure/adapters/in/http/schemas/save-stakeholder-tools.schema';
import {
  saveQualityAnalysesBodySchema,
  saveQualityMetricsBodySchema,
  saveQualityReportBodySchema,
} from '@infrastructure/adapters/in/http/schemas/save-quality-tools.schema';
import { saveFundingStrategyBodySchema } from '@infrastructure/adapters/in/http/schemas/save-funding.schema';
import { saveIssueLogBodySchema } from '@infrastructure/adapters/in/http/schemas/save-issue-log.schema';
import {
  saveClosureReportBodySchema,
  saveDeliverablesBodySchema,
  saveTeamAssessmentBodySchema,
} from '@infrastructure/adapters/in/http/schemas/save-closing-documents.schema';
import { saveChangeLogBodySchema } from '@infrastructure/adapters/in/http/schemas/save-change-log.schema';
import { saveProjectManagementPlanBodySchema } from '@infrastructure/adapters/in/http/schemas/save-project-management-plan.schema';
import { saveCostEstimatesBodySchema } from '@infrastructure/adapters/in/http/schemas/save-cost-estimates.schema';
import { saveAssumptionLogBodySchema } from '@infrastructure/adapters/in/http/schemas/save-assumption-log.schema';
import { saveProjectCharterBodySchema } from '@infrastructure/adapters/in/http/schemas/save-project-charter.schema';
import { saveRiskRegisterBodySchema } from '@infrastructure/adapters/in/http/schemas/save-risk-register.schema';
import { saveStakeholderRegisterBodySchema } from '@infrastructure/adapters/in/http/schemas/save-stakeholder-register.schema';
import type { AppContainer } from '@infrastructure/config/container';
import type { AppEnv } from '@infrastructure/config/env';

const DEV_JWT_SECRET = 'dev-only-secret-change-me-0f9c2a7e4b1d';

/** Secret JWT : obligatoire en production, repli de développement sinon (avec avertissement). */
function resolveJwtSecret(env: AppEnv, app: FastifyInstance): string {
  if (env.JWT_SECRET) return env.JWT_SECRET;
  if (env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET est obligatoire en production.');
  }
  app.log.warn('JWT_SECRET absent : secret de développement utilisé (à ne jamais déployer).');
  return DEV_JWT_SECRET;
}

/**
 * Fabrique du serveur HTTP (adaptateur entrant).
 * Branche la sécurité, l'authentification, la gestion d'erreurs et les routes.
 */
export async function buildServer(
  container: AppContainer,
  env: AppEnv,
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
  });
  const isProduction = env.NODE_ENV === 'production';

  // --- Sécurité ---
  await app.register(helmet);
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
    // Version des documents (concurrence optimiste) lue par le client.
    exposedHeaders: ['ETag'],
  });
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
  });

  // Contexte de requête (compte qui agit), ouvert avant tout autre traitement.
  app.addHook('onRequest', (_request, _reply, done) => runInRequestContext(done));

  // --- Authentification (cookie httpOnly + JWT) et garde globale ---
  await registerAuth(app, resolveJwtSecret(env, app), container.resolveSession);

  registerErrorHandler(app);
  registerAuditTrail(app, container.recordAuditEvent);

  // Toute route qui désigne un projet le suppose existant et visible du compte (404 sinon, sans
  // révéler son existence) ; le rôle appliqué y est celui du compte sur ce projet : chef de projet et
  // contributeur rédigent, lecteur consulte (un administrateur garde le sien).
  app.decorateRequest('projectRole', null);
  app.addHook('preHandler', async (request) => {
    const { projectId } = (request.params ?? {}) as { projectId?: string };
    if (projectId === undefined) return;
    const role = await container.projectAccess.execute({ projectId, requester: request.user });
    request.projectRole = role;
    if (!canAdminister(request.user.role)) request.user = { ...request.user, role: contentRoleOf(role) };
  });

  // --- Sonde de santé (publique) ---
  app.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }));

  // --- Routes ---
  // Documents d'un projet, avec leur historique des versions.
  const documentRoutes = <Input, Dto>(options: ProjectDocumentRouteOptions<Input, Dto>) =>
    projectDocumentRoutes(options, container.listDocumentVersions);
  await app.register(
    authRoutes({
      login: container.login,
      getCurrentUser: container.getCurrentUser,
      changeOwnPassword: container.changeOwnPassword,
      isProduction,
      jwtExpiresIn: env.JWT_EXPIRES_IN,
    }),
  );
  await app.register(adminRoutes({ users: container.userAdministration, resources: container.resourceDirectory }));
  await app.register(governanceRoutes({ getAuditLog: container.getAuditLog }));
  await app.register(
    reportRoutes({
      listExecutiveReports: container.listExecutiveReports,
      getExecutiveReport: container.getExecutiveReport,
      saveExecutiveReport: container.saveExecutiveReport,
      publishExecutiveReport: container.publishExecutiveReport,
      deleteExecutiveReport: container.deleteExecutiveReport,
    }),
  );
  await app.register(
    planRoutes({
      getProjectPlan: container.getProjectPlan,
      saveProjectPlan: container.saveProjectPlan,
      listDocumentVersions: container.listDocumentVersions,
      previewSchedule: container.previewSchedule,
    }),
  );
  await app.register(
    projectRoutes({
      listProjects: container.listProjects,
      createProject: container.createProject,
      updateProject: container.updateProject,
      deleteProject: container.deleteProject,
      getProjectTeam: container.getProjectTeam,
      saveProjectTeam: container.saveProjectTeam,
    }),
  );
  // Documents d'un projet : GET (lecture), PUT et, pour les documents rédigés, DELETE (EDITOR+).
  await app.register(
    documentRoutes({
      segment: 'risks',
      table: 'risk_registers',
      bodySchema: saveRiskRegisterBodySchema,
      get: container.getRiskRegister,
      save: container.saveRiskRegister,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'charter',
      table: 'project_charters',
      remove: container.deleteDocument.charters,
      bodySchema: saveProjectCharterBodySchema,
      get: container.getProjectCharter,
      save: container.saveProjectCharter,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'stakeholders',
      table: 'stakeholder_registers',
      bodySchema: saveStakeholderRegisterBodySchema,
      get: container.getStakeholderRegister,
      save: container.saveStakeholderRegister,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'assumptions',
      table: 'assumption_logs',
      bodySchema: saveAssumptionLogBodySchema,
      get: container.getAssumptionLog,
      save: container.saveAssumptionLog,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'business-case',
      table: 'business_cases',
      remove: container.deleteDocument.businessCases,
      bodySchema: saveBusinessCaseBodySchema,
      get: container.getBusinessCase,
      save: container.saveBusinessCase,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'benefits-plan',
      table: 'benefits_plans',
      remove: container.deleteDocument.benefitsPlans,
      bodySchema: saveBenefitsPlanBodySchema,
      get: container.getBenefitsPlan,
      save: container.saveBenefitsPlan,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'raci',
      table: 'responsibility_matrices',
      remove: container.deleteDocument.responsibilityMatrices,
      bodySchema: saveResponsibilityMatrixBodySchema,
      get: container.getResponsibilityMatrix,
      save: container.saveResponsibilityMatrix,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'management-plans',
      table: 'management_plans',
      bodySchema: saveManagementPlansBodySchema,
      get: container.getManagementPlans,
      save: container.saveManagementPlans,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'requirements',
      table: 'requirements_registers',
      bodySchema: saveRequirementsRegisterBodySchema,
      get: container.getRequirementsRegister,
      save: container.saveRequirementsRegister,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'scope-statement',
      table: 'scope_statements',
      remove: container.deleteDocument.scopeStatements,
      bodySchema: saveScopeStatementBodySchema,
      get: container.getScopeStatement,
      save: container.saveScopeStatement,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'cost-estimates',
      table: 'cost_estimates',
      remove: container.deleteDocument.costEstimates,
      bodySchema: saveCostEstimatesBodySchema,
      get: container.getCostEstimates,
      save: container.saveCostEstimates,
    }),
  );
  // Référence des coûts : calculée (estimations × échéancier), lecture seule.
  await app.register(documentRoutes({ segment: 'cost-baseline', get: container.getCostBaseline }));
  await app.register(
    documentRoutes({
      segment: 'funding-strategy',
      table: 'funding_strategies',
      remove: container.deleteDocument.fundingStrategies,
      bodySchema: saveFundingStrategyBodySchema,
      get: container.getFundingStrategy,
      save: container.saveFundingStrategy,
    }),
  );
  // Besoins de financement : calculés (tranches × référence des coûts), lecture seule.
  await app.register(documentRoutes({ segment: 'funding-requirements', get: container.getFundingRequirements }));
  await app.register(
    documentRoutes({
      segment: 'actual-costs',
      table: 'actual_costs',
      bodySchema: saveActualCostsBodySchema,
      get: container.getActualCosts,
      save: container.saveActualCosts,
    }),
  );
  await app.register(
    performanceRoutes({
      updateTaskProgress: container.updateTaskProgress,
      getMyTasks: container.getMyTasks,
      getEarnedValue: container.getEarnedValue,
      getPortfolio: container.getPortfolio,
    }),
  );
  await app.register(
    approvalRoutes({
      getProjectApprovals: container.getProjectApprovals,
      actOnApproval: container.actOnApproval,
      getApprovalSnapshot: container.getApprovalSnapshot,
      setProjectApprovers: container.setProjectApprovers,
      getMyApprovals: container.getMyApprovals,
      decideChangeRequest: container.decideChangeRequest,
      awardSourceSelection: container.awardSourceSelection,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'resource-requirements',
      table: 'resource_requirements',
      bodySchema: saveResourceRequirementsBodySchema,
      get: container.getResourceRequirements,
      save: container.saveResourceRequirements,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'resource-plan',
      table: 'resource_management_plans',
      remove: container.deleteDocument.resourcePlans,
      bodySchema: saveResourcePlanBodySchema,
      get: container.getResourcePlan,
      save: container.saveResourcePlan,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'team-charter',
      table: 'team_charters',
      remove: container.deleteDocument.teamCharters,
      bodySchema: saveTeamCharterBodySchema,
      get: container.getTeamCharter,
      save: container.saveTeamCharter,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'engagement-plan',
      table: 'stakeholder_engagement_plans',
      remove: container.deleteDocument.engagementPlans,
      bodySchema: saveEngagementPlanBodySchema,
      get: container.getEngagementPlan,
      save: container.saveEngagementPlan,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'communication-plan',
      table: 'communication_plans',
      remove: container.deleteDocument.communicationPlans,
      bodySchema: saveCommunicationPlanBodySchema,
      get: container.getCommunicationPlan,
      save: container.saveCommunicationPlan,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'procurement-plan',
      table: 'procurement_plans',
      remove: container.deleteDocument.procurementPlans,
      bodySchema: saveProcurementPlanBodySchema,
      get: container.getProcurementPlan,
      save: container.saveProcurementPlan,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'procurement-strategy',
      table: 'procurement_strategies',
      remove: container.deleteDocument.procurementStrategies,
      bodySchema: saveProcurementStrategyBodySchema,
      get: container.getProcurementStrategy,
      save: container.saveProcurementStrategy,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'source-selections',
      table: 'source_selections',
      bodySchema: saveSourceSelectionsBodySchema,
      get: container.getSourceSelections,
      save: container.saveSourceSelections,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'project-management-plan',
      table: 'project_management_plans',
      remove: container.deleteDocument.projectManagementPlans,
      bodySchema: saveProjectManagementPlanBodySchema,
      get: container.getProjectManagementPlan,
      save: container.saveProjectManagementPlan,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'quality-plan',
      table: 'quality_management_plans',
      remove: container.deleteDocument.qualityPlans,
      bodySchema: saveQualityPlanBodySchema,
      get: container.getQualityPlan,
      save: container.saveQualityPlan,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'risk-plan',
      table: 'risk_management_plans',
      remove: container.deleteDocument.riskPlans,
      bodySchema: saveRiskPlanBodySchema,
      get: container.getRiskPlan,
      save: container.saveRiskPlan,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'change-log',
      table: 'change_logs',
      bodySchema: saveChangeLogBodySchema,
      get: container.getChangeLog,
      save: container.saveChangeLog,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'issue-log',
      table: 'issue_logs',
      bodySchema: saveIssueLogBodySchema,
      get: container.getIssueLog,
      save: container.saveIssueLog,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'lessons-learned',
      table: 'lessons_learned',
      bodySchema: saveLessonsLearnedBodySchema,
      get: container.getLessonsLearned,
      save: container.saveLessonsLearned,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'deliverables',
      table: 'deliverables_registers',
      bodySchema: saveDeliverablesBodySchema,
      get: container.getDeliverables,
      save: container.saveDeliverables,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'team',
      table: 'team_assessments',
      remove: container.deleteDocument.teamAssessments,
      bodySchema: saveTeamAssessmentBodySchema,
      get: container.getTeam,
      save: container.saveTeam,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'closure-report',
      table: 'closure_reports',
      remove: container.deleteDocument.closureReports,
      bodySchema: saveClosureReportBodySchema,
      get: container.getClosureReport,
      save: container.saveClosureReport,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'schedule-model',
      table: 'schedule_models',
      remove: container.deleteDocument.scheduleModels,
      bodySchema: saveScheduleModelBodySchema,
      get: container.getScheduleModel,
      save: container.saveScheduleModel,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'wbs-dictionary',
      table: 'wbs_dictionaries',
      bodySchema: saveWbsDictionaryBodySchema,
      get: container.getWbsDictionary,
      save: container.saveWbsDictionary,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'stakeholder-questionnaire',
      table: 'stakeholder_questionnaires',
      remove: container.deleteDocument.stakeholderQuestionnaires,
      bodySchema: saveStakeholderQuestionnaireBodySchema,
      get: container.getStakeholderQuestionnaire,
      save: container.saveStakeholderQuestionnaire,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'stakeholder-mapping',
      table: 'stakeholder_mappings',
      remove: container.deleteDocument.stakeholderMappings,
      bodySchema: saveStakeholderMappingBodySchema,
      get: container.getStakeholderMapping,
      save: container.saveStakeholderMapping,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'quality-metrics',
      table: 'quality_metrics',
      remove: container.deleteDocument.qualityMetrics,
      bodySchema: saveQualityMetricsBodySchema,
      get: container.getQualityMetrics,
      save: container.saveQualityMetrics,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'quality-report',
      table: 'quality_reports',
      remove: container.deleteDocument.qualityReports,
      bodySchema: saveQualityReportBodySchema,
      get: container.getQualityReport,
      save: container.saveQualityReport,
    }),
  );
  await app.register(
    documentRoutes({
      segment: 'quality-analyses',
      table: 'quality_analyses',
      remove: container.deleteDocument.qualityAnalyses,
      bodySchema: saveQualityAnalysesBodySchema,
      get: container.getQualityAnalyses,
      save: container.saveQualityAnalyses,
    }),
  );

  return app;
}
