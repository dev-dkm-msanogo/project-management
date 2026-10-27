import type {
  ActualCostsDto,
  ActualCostsInput,
  AssumptionLogDto,
  AssumptionLogInput,
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
  ProjectCharterDto,
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
  ProjectCharterInput,
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
  RiskRegisterDto,
  RiskRegisterInput,
  ScheduleModelDto,
  ScheduleModelInput,
  ScopeStatementDto,
  ScopeStatementInput,
  SourceSelectionsDto,
  SourceSelectionsInput,
  StakeholderRegisterDto,
  StakeholderEngagementPlanDto,
  StakeholderMappingDto,
  StakeholderMappingInput,
  StakeholderQuestionnaireDto,
  StakeholderQuestionnaireInput,
  StakeholderEngagementPlanInput,
  StakeholderRegisterInput,
  TeamCharterDto,
  TeamCharterInput,
  WbsDictionaryDto,
  WbsDictionaryInput,
  DocumentVersionsDto,
  ClosureReportDto,
  ClosureReportInput,
  DeliverablesDto,
  DeliverablesInput,
  TeamAssessmentInput,
  TeamDto,
} from '@shared/index';
import { API_BASE_URL, apiFetch, readErrorMessage } from '@/api/http';

/** Client générique des documents d'un projet : /api/v1/projects/:projectId/<segment>. */

/** Historique d'un document : ses versions enregistrées, et le contenu de l'une d'elles. */
export interface DocumentHistoryApi<Dto> {
  versions(projectId: string, signal?: AbortSignal): Promise<DocumentVersionsDto>;
  fetchVersion(projectId: string, version: number): Promise<Dto>;
}

interface DocumentApi<Dto, Input> extends DocumentHistoryApi<Dto> {
  /** Lecture ; échoue si le document est introuvable. */
  fetch(projectId: string, signal?: AbortSignal): Promise<Dto>;
  /** Lecture ; `null` si le document n'a pas encore été rédigé (404). */
  fetchOptional(projectId: string, signal?: AbortSignal): Promise<Dto | null>;
  /** Création ou remplacement. */
  save(projectId: string, input: Input): Promise<Dto>;
  /** Suppression du document entier (documents rédigés). */
  remove(projectId: string): Promise<void>;
}

/** `what` complète les messages d'erreur : « du registre des risques », « de la charte »… */
function documentApi<Dto, Input>(segment: string, what: string): DocumentApi<Dto, Input> {
  const url = (projectId: string) =>
    `${API_BASE_URL}/api/v1/projects/${encodeURIComponent(projectId)}/${segment}`;

  const fetchOptional = async (projectId: string, signal?: AbortSignal): Promise<Dto | null> => {
    const response = await apiFetch(url(projectId), { signal });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, `Échec du chargement ${what} (HTTP ${response.status}).`),
      );
    }
    return (await response.json()) as Dto;
  };

  return {
    fetchOptional,
    async versions(projectId, signal) {
      const response = await apiFetch(`${url(projectId)}/versions`, { signal });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, `Échec du chargement de l'historique ${what} (HTTP ${response.status}).`));
      }
      return (await response.json()) as DocumentVersionsDto;
    },
    async fetchVersion(projectId, version) {
      const response = await apiFetch(`${url(projectId)}?version=${version}`);
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, `Échec du chargement de la version ${version} ${what} (HTTP ${response.status}).`));
      }
      return (await response.json()) as Dto;
    },
    async fetch(projectId, signal) {
      const document = await fetchOptional(projectId, signal);
      if (!document) throw new Error(`Document introuvable : ${what}.`);
      return document;
    },
    async save(projectId, input) {
      const response = await apiFetch(url(projectId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, `Échec de l'enregistrement ${what} (HTTP ${response.status}).`),
        );
      }
      return (await response.json()) as Dto;
    },
    async remove(projectId) {
      const response = await apiFetch(url(projectId), { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, `Échec de la suppression ${what} (HTTP ${response.status}).`),
        );
      }
    },
  };
}

export const riskRegisterApi = documentApi<RiskRegisterDto, RiskRegisterInput>('risks', 'du registre des risques');
export const charterApi = documentApi<ProjectCharterDto, ProjectCharterInput>('charter', 'de la charte');
export const stakeholderRegisterApi = documentApi<StakeholderRegisterDto, StakeholderRegisterInput>(
  'stakeholders',
  'du registre des parties prenantes',
);
export const assumptionLogApi = documentApi<AssumptionLogDto, AssumptionLogInput>(
  'assumptions',
  'du registre des hypothèses et contraintes',
);
export const businessCaseApi = documentApi<BusinessCaseDto, BusinessCaseInput>('business-case', 'du business case');
export const benefitsPlanApi = documentApi<BenefitsPlanDto, BenefitsPlanInput>(
  'benefits-plan',
  'du plan de gestion des bénéfices',
);
export const raciApi = documentApi<ResponsibilityMatrixDto, ResponsibilityMatrixInput>('raci', 'de la matrice RACI');
export const managementPlansApi = documentApi<ManagementPlansDto, ManagementPlansInput>(
  'management-plans',
  'des plans de gestion',
);
export const requirementsApi = documentApi<RequirementsRegisterDto, RequirementsRegisterInput>(
  'requirements',
  'du registre des exigences',
);
export const costEstimatesApi = documentApi<CostEstimatesDto, CostEstimatesInput>(
  'cost-estimates',
  'des estimations des coûts',
);
/** Référence des coûts : calculée par le serveur, en lecture seule. */
export const costBaselineApi = documentApi<CostBaselineDto, never>('cost-baseline', 'de la référence des coûts');
export const resourceRequirementsApi = documentApi<ResourceRequirementsDto, ResourceRequirementsInput>(
  'resource-requirements',
  'des besoins en ressources',
);
export const resourcePlanApi = documentApi<ResourceManagementPlanDto, ResourceManagementPlanInput>(
  'resource-plan',
  'du plan de gestion des ressources',
);
export const teamCharterApi = documentApi<TeamCharterDto, TeamCharterInput>('team-charter', "de la charte de l'équipe");
export const engagementPlanApi = documentApi<StakeholderEngagementPlanDto, StakeholderEngagementPlanInput>(
  'engagement-plan',
  "du plan d'engagement des parties prenantes",
);
export const communicationPlanApi = documentApi<CommunicationPlanDto, CommunicationPlanInput>(
  'communication-plan',
  'du plan de communication',
);
export const procurementPlanApi = documentApi<ProcurementPlanDto, ProcurementPlanInput>(
  'procurement-plan',
  'du plan de gestion des approvisionnements',
);
export const procurementStrategyApi = documentApi<ProcurementStrategyDto, ProcurementStrategyInput>(
  'procurement-strategy',
  "de la stratégie d'approvisionnement",
);
export const sourceSelectionsApi = documentApi<SourceSelectionsDto, SourceSelectionsInput>(
  'source-selections',
  'des grilles de sélection des fournisseurs',
);
export const changeLogApi = documentApi<ChangeLogDto, ChangeLogInput>('change-log', 'du registre des modifications');
export const issueLogApi = documentApi<IssueLogDto, IssueLogInput>('issue-log', 'du journal des problèmes');
export const lessonsLearnedApi = documentApi<LessonsLearnedDto, LessonsLearnedInput>(
  'lessons-learned',
  'du registre des leçons apprises',
);
export const qualityPlanApi = documentApi<QualityManagementPlanDto, QualityManagementPlanInput>(
  'quality-plan',
  'du plan de gestion de la qualité',
);
export const riskPlanApi = documentApi<RiskManagementPlanDto, RiskManagementPlanInput>(
  'risk-plan',
  'du plan de gestion des risques',
);
export const projectManagementPlanApi = documentApi<ProjectManagementPlanDto, ProjectManagementPlanInput>(
  'project-management-plan',
  'du plan de management du projet',
);
export const fundingStrategyApi = documentApi<FundingStrategyDto, FundingStrategyInput>(
  'funding-strategy',
  'de la stratégie de financement',
);
export const actualCostsApi = documentApi<ActualCostsDto, ActualCostsInput>('actual-costs', 'des dépenses réelles');
export const fundingRequirementsApi = documentApi<FundingRequirementsDto, never>(
  'funding-requirements',
  'des besoins de financement',
);
export const qualityMetricsApi = documentApi<QualityMetricsDto, QualityMetricsInput>('quality-metrics', 'des métriques qualité');
export const qualityReportApi = documentApi<QualityReportDto, QualityReportInput>('quality-report', 'du rapport qualité');
export const qualityAnalysesApi = documentApi<QualityAnalysesDto, QualityAnalysesInput>(
  'quality-analyses',
  "des outils d'analyse qualité",
);
export const stakeholderQuestionnaireApi = documentApi<StakeholderQuestionnaireDto, StakeholderQuestionnaireInput>(
  'stakeholder-questionnaire',
  "du questionnaire d'identification",
);
export const stakeholderMappingApi = documentApi<StakeholderMappingDto, StakeholderMappingInput>(
  'stakeholder-mapping',
  'de la cartographie des parties prenantes',
);
export const scheduleModelApi = documentApi<ScheduleModelDto, ScheduleModelInput>(
  'schedule-model',
  "du modèle d'ordonnancement",
);
export const wbsDictionaryApi = documentApi<WbsDictionaryDto, WbsDictionaryInput>(
  'wbs-dictionary',
  'du dictionnaire de la WBS',
);
export const scopeStatementApi = documentApi<ScopeStatementDto, ScopeStatementInput>(
  'scope-statement',
  "de l'énoncé du périmètre",
);
export const deliverablesApi = documentApi<DeliverablesDto, DeliverablesInput>('deliverables', 'du registre des livrables');
export const teamApi = documentApi<TeamDto, TeamAssessmentInput>('team', "de l'équipe du projet");
export const closureReportApi = documentApi<ClosureReportDto, ClosureReportInput>('closure-report', 'du rapport de clôture');
