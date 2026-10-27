import {
  actualCostsApi,
  assumptionLogApi,
  benefitsPlanApi,
  businessCaseApi,
  changeLogApi,
  charterApi,
  closureReportApi,
  communicationPlanApi,
  costBaselineApi,
  costEstimatesApi,
  deliverablesApi,
  engagementPlanApi,
  fundingRequirementsApi,
  fundingStrategyApi,
  issueLogApi,
  lessonsLearnedApi,
  managementPlansApi,
  procurementPlanApi,
  procurementStrategyApi,
  projectManagementPlanApi,
  qualityAnalysesApi,
  qualityMetricsApi,
  qualityPlanApi,
  qualityReportApi,
  raciApi,
  requirementsApi,
  resourcePlanApi,
  resourceRequirementsApi,
  riskPlanApi,
  riskRegisterApi,
  scheduleModelApi,
  scopeStatementApi,
  sourceSelectionsApi,
  stakeholderMappingApi,
  stakeholderQuestionnaireApi,
  stakeholderRegisterApi,
  teamApi,
  teamCharterApi,
  wbsDictionaryApi,
} from '@/api/project-documents';
import { useProjectResource } from '@/hooks/useProjectResource';

/** Hooks de chargement des documents d'un projet (registres, charte). */

/** Registre : vide tant qu'aucune dépense n'a été saisie. */
export const useActualCosts = (projectId: string) => useProjectResource(projectId, actualCostsApi.fetch);

export const useRiskRegister = (projectId: string) => useProjectResource(projectId, riskRegisterApi.fetch);

/** `data` vaut `null` tant que la charte n'a pas été rédigée. */
export const useProjectCharter = (projectId: string) => useProjectResource(projectId, charterApi.fetchOptional);

export const useStakeholderRegister = (projectId: string) =>
  useProjectResource(projectId, stakeholderRegisterApi.fetch);

export const useAssumptionLog = (projectId: string) => useProjectResource(projectId, assumptionLogApi.fetch);

/** Documents rédigés : `data` vaut `null` tant qu'ils n'existent pas. */
export const useBusinessCase = (projectId: string) => useProjectResource(projectId, businessCaseApi.fetchOptional);

export const useBenefitsPlan = (projectId: string) => useProjectResource(projectId, benefitsPlanApi.fetchOptional);

export const useResponsibilityMatrix = (projectId: string) => useProjectResource(projectId, raciApi.fetchOptional);

export const useCostEstimates = (projectId: string) => useProjectResource(projectId, costEstimatesApi.fetchOptional);

/** `data` vaut `null` tant qu'aucune estimation des coûts n'a été saisie. */
export const useCostBaseline = (projectId: string) => useProjectResource(projectId, costBaselineApi.fetchOptional);

/** Registre : vide tant qu'aucun besoin n'a été saisi. */
export const useResourceRequirements = (projectId: string) =>
  useProjectResource(projectId, resourceRequirementsApi.fetch);

export const useResourcePlan = (projectId: string) => useProjectResource(projectId, resourcePlanApi.fetchOptional);

export const useTeamCharter = (projectId: string) => useProjectResource(projectId, teamCharterApi.fetchOptional);

export const useEngagementPlan = (projectId: string) => useProjectResource(projectId, engagementPlanApi.fetchOptional);

export const useCommunicationPlan = (projectId: string) =>
  useProjectResource(projectId, communicationPlanApi.fetchOptional);

export const useProcurementPlan = (projectId: string) =>
  useProjectResource(projectId, procurementPlanApi.fetchOptional);

export const useProcurementStrategy = (projectId: string) =>
  useProjectResource(projectId, procurementStrategyApi.fetchOptional);

/** Registre : vide tant qu'aucune grille n'a été saisie. */
export const useSourceSelections = (projectId: string) => useProjectResource(projectId, sourceSelectionsApi.fetch);

/** Registre : vide tant qu'aucune demande n'a été saisie. */
export const useChangeLog = (projectId: string) => useProjectResource(projectId, changeLogApi.fetch);

/** Registre : vide tant qu'aucun problème n'a été signalé. */
export const useIssueLog = (projectId: string) => useProjectResource(projectId, issueLogApi.fetch);

/** Registre : vide tant qu'aucune leçon n'a été consignée. */
export const useLessonsLearned = (projectId: string) => useProjectResource(projectId, lessonsLearnedApi.fetch);

export const useQualityPlan = (projectId: string) => useProjectResource(projectId, qualityPlanApi.fetchOptional);

export const useRiskPlan = (projectId: string) => useProjectResource(projectId, riskPlanApi.fetchOptional);

export const useProjectManagementPlan = (projectId: string) =>
  useProjectResource(projectId, projectManagementPlanApi.fetchOptional);

export const useScopeStatement = (projectId: string) => useProjectResource(projectId, scopeStatementApi.fetchOptional);

/** Plans de gestion rédigés du projet, par type (document vide tant qu'aucun n'est rédigé). */
export const useManagementPlans = (projectId: string) => useProjectResource(projectId, managementPlansApi.fetch);

export const useRequirementsRegister = (projectId: string) => useProjectResource(projectId, requirementsApi.fetch);

/** `data` vaut `null` tant que le modèle d'ordonnancement n'a pas été établi. */
export const useScheduleModel = (projectId: string) => useProjectResource(projectId, scheduleModelApi.fetchOptional);

/** `data` vaut `null` tant que le questionnaire n'a pas été rempli. */
export const useStakeholderQuestionnaire = (projectId: string) =>
  useProjectResource(projectId, stakeholderQuestionnaireApi.fetchOptional);

/** `data` vaut `null` tant que la cartographie n'a pas été établie. */
export const useStakeholderMapping = (projectId: string) => useProjectResource(projectId, stakeholderMappingApi.fetchOptional);

/** `data` vaut `null` tant que la stratégie n'a pas été rédigée. */
export const useFundingStrategy = (projectId: string) => useProjectResource(projectId, fundingStrategyApi.fetchOptional);
/** `data` vaut `null` tant que la stratégie ou les estimations des coûts manquent. */
export const useFundingRequirements = (projectId: string) =>
  useProjectResource(projectId, fundingRequirementsApi.fetchOptional);

/** `data` vaut `null` tant que le document n'a pas été établi. */
export const useQualityMetrics = (projectId: string) => useProjectResource(projectId, qualityMetricsApi.fetchOptional);
export const useQualityReport = (projectId: string) => useProjectResource(projectId, qualityReportApi.fetchOptional);
export const useQualityAnalyses = (projectId: string) => useProjectResource(projectId, qualityAnalysesApi.fetchOptional);

export const useWbsDictionary = (projectId: string) => useProjectResource(projectId, wbsDictionaryApi.fetch);

/** Livrables : relus dans la WBS et son dictionnaire, même sans suivi consigné. */
export const useDeliverables = (projectId: string) => useProjectResource(projectId, deliverablesApi.fetch);

/** Équipe : relue dans le projet, même sans évaluation. */
export const useTeam = (projectId: string) => useProjectResource(projectId, teamApi.fetch);

export const useClosureReport = (projectId: string) => useProjectResource(projectId, closureReportApi.fetchOptional);
