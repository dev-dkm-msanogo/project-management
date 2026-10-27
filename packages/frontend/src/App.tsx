import { useEffect, useState } from 'react';
import { ProjectRightsScope, useAuth } from '@/auth/AuthContext';
import { LoginScreen } from '@/auth/LoginScreen';
import { PasswordChangeScreen } from '@/auth/PasswordChangeScreen';
import { PageActionsSlot } from '@/components/header/PageActions';
import { UnsavedChangesProvider, useUnsavedChanges } from '@/components/form/UnsavedChanges';
import { PeopleProvider } from '@/components/people/People';
import { PageHeader } from '@/components/header/PageHeader';
import { TopBar } from '@/components/header/TopBar';
import { Sidebar } from '@/components/nav/Sidebar';
import { AccountFeature } from '@/features/AccountFeature';
import { AssumptionFeature } from '@/features/AssumptionFeature';
import { BenefitsPlanFeature } from '@/features/BenefitsPlanFeature';
import { BusinessCaseFeature } from '@/features/BusinessCaseFeature';
import { ChangeLogFeature } from '@/features/ChangeLogFeature';
import { CharterFeature } from '@/features/CharterFeature';
import { CommunicationPlanFeature } from '@/features/CommunicationPlanFeature';
import { CostBaselineFeature } from '@/features/CostBaselineFeature';
import { CostEstimatesFeature } from '@/features/CostEstimatesFeature';
import { EngagementPlanFeature } from '@/features/EngagementPlanFeature';
import { FundingRequirementsFeature } from '@/features/FundingRequirementsFeature';
import { FundingStrategyFeature } from '@/features/FundingStrategyFeature';
import { GanttFeature } from '@/features/GanttFeature';
import { IssueLogFeature } from '@/features/IssueLogFeature';
import { LessonsLearnedFeature } from '@/features/LessonsLearnedFeature';
import { ManagementPlanFeature } from '@/features/ManagementPlanFeature';
import { ProcurementPlanFeature } from '@/features/ProcurementPlanFeature';
import { ProcurementStrategyFeature } from '@/features/ProcurementStrategyFeature';
import { ProjectManagementPlanFeature } from '@/features/ProjectManagementPlanFeature';
import { ActualCostsFeature } from '@/features/ActualCostsFeature';
import { EarnedValueFeature } from '@/features/EarnedValueFeature';
import { MyTasksFeature } from '@/features/MyTasksFeature';
import { ApprovalsFeature } from '@/features/ApprovalsFeature';
import { AuditFeature } from '@/features/AuditFeature';
import { ProjectsFeature } from '@/features/ProjectsFeature';
import { TaskProgressFeature } from '@/features/TaskProgressFeature';
import { QualityAnalysesFeature } from '@/features/QualityAnalysesFeature';
import { QualityMetricsFeature } from '@/features/QualityMetricsFeature';
import { QualityPlanFeature } from '@/features/QualityPlanFeature';
import { QualityReportFeature } from '@/features/QualityReportFeature';
import { RaciFeature } from '@/features/RaciFeature';
import { ReportFeature } from '@/features/ReportFeature';
import { ResourceDirectoryFeature } from '@/features/ResourceDirectoryFeature';
import { RequirementsFeature } from '@/features/RequirementsFeature';
import { ResourcePlanFeature } from '@/features/ResourcePlanFeature';
import { ResourceRequirementsFeature } from '@/features/ResourceRequirementsFeature';
import { RiskFeature } from '@/features/RiskFeature';
import { RiskPlanFeature } from '@/features/RiskPlanFeature';
import { ScheduleModelFeature } from '@/features/ScheduleModelFeature';
import { ScopeStatementFeature } from '@/features/ScopeStatementFeature';
import { SourceSelectionFeature } from '@/features/SourceSelectionFeature';
import { StakeholderAnalysisFeature } from '@/features/StakeholderAnalysisFeature';
import { StakeholderFeature } from '@/features/StakeholderFeature';
import { StakeholderMappingFeature } from '@/features/StakeholderMappingFeature';
import { StakeholderQuestionnaireFeature } from '@/features/StakeholderQuestionnaireFeature';
import { TeamCharterFeature } from '@/features/TeamCharterFeature';
import { TeamFeature } from '@/features/TeamFeature';
import { DeliverablesFeature } from '@/features/DeliverablesFeature';
import { ClosureReportFeature } from '@/features/ClosureReportFeature';
import { AgileMetricsFeature } from '@/features/AgileMetricsFeature';
import { BacklogFeature } from '@/features/BacklogFeature';
import { BoardFeature } from '@/features/BoardFeature';
import { IterationsFeature } from '@/features/IterationsFeature';
import { CurrentProjectContext } from '@/hooks/useCurrentProject';
import { UsersFeature } from '@/features/UsersFeature';
import { WbsDictionaryFeature } from '@/features/WbsDictionaryFeature';
import { WbsFeature } from '@/features/WbsFeature';
import { useProjects } from '@/hooks/useProjects';
import { isViewOffered, viewTitle, type AppView } from '@/navigation/pmp';

const DEFAULT_PROJECT_ID = 'project-alpha';

/** Pages hors projet : les droits y sont ceux du compte, pas ceux d'un rôle sur le projet courant. */
const ACCOUNT_VIEWS: readonly AppView[] = ['projects', 'my-tasks', 'resource-directory', 'users', 'audit', 'account'];

/** Portail : écran de connexion tant qu'aucune session valide n'existe. */
export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="app__status">Vérification de la session…</p>;
  }
  if (!user) return <LoginScreen />;
  // Mot de passe provisoire : rien d'autre tant qu'il n'est pas remplacé (le serveur bloque aussi).
  return user.mustChangePassword ? (
    <PasswordChangeScreen />
  ) : (
    <UnsavedChangesProvider>
      <PeopleProvider>
        <AuthenticatedApp />
      </PeopleProvider>
    </UnsavedChangesProvider>
  );
}

/** Application, montée uniquement pour un utilisateur authentifié. */
function AuthenticatedApp() {
  const [projectId, setProjectId] = useState(DEFAULT_PROJECT_ID);
  const [view, setView] = useState<AppView>('projects');
  const [actionsSlot, setActionsSlot] = useState<HTMLDivElement | null>(null);
  const { data: projects, reload } = useProjects();
  const { canAdminister } = useAuth();
  const { confirmLeave } = useUnsavedChanges();

  // Changer de page ou de projet abandonne l'éditeur ouvert : confirmation s'il a des saisies.
  const guarded =
    <Args extends unknown[]>(action: (...args: Args) => void) =>
    (...args: Args) => {
      void confirmLeave().then((leave) => {
        if (leave) action(...args);
      });
    };
  const navigate = guarded(setView);

  // Titre de l'onglet du navigateur : la page courante.
  useEffect(() => {
    document.title = `${viewTitle(view)} · Gestion de projet`;
  }, [view]);

  // Garantit que le projet courant existe dans la liste (après chargement/suppression).
  useEffect(() => {
    if (projects.length === 0) return;
    if (!projects.some((project) => project.id === projectId)) {
      setProjectId(projects[0]!.id);
    }
  }, [projects, projectId]);

  const currentProject = projects.find((project) => project.id === projectId);
  const projectName = currentProject?.name ?? '';
  const methodology = currentProject?.methodology ?? 'PREDICTIVE';

  // Page absente du menu de la méthodologie du projet (changement de projet ou de méthodologie) : rapport.
  useEffect(() => {
    if (currentProject && !isViewOffered(view, currentProject.methodology)) setView('report');
  }, [currentProject, view]);

  const openProject = guarded((id: string) => {
    setProjectId(id);
    setView('report');
  });
  const openProjectProgress = guarded((id: string) => {
    setProjectId(id);
    setView('task-progress');
  });
  const openProjectView = guarded((id: string, target: AppView) => {
    setProjectId(id);
    setView(target);
  });

  return (
    <div className="layout">
      <Sidebar active={view} methodology={methodology} onNavigate={navigate} />

      {/* Le rapport, plus étroit, impose sa largeur à l'en-tête de page. */}
      <div className={`content${view === 'report' ? ' content--narrow' : ''}`}>
        <TopBar
          view={view}
          projects={projects}
          projectId={projectId}
          onSelectProject={guarded(setProjectId)}
          onNavigate={navigate}
        />
        <PageHeader view={view} actionsRef={setActionsSlot} />

        <PageActionsSlot.Provider value={actionsSlot}>
          <ProjectRightsScope access={ACCOUNT_VIEWS.includes(view) ? null : (currentProject?.access ?? 'READER')}>
            <CurrentProjectContext.Provider value={currentProject ?? null}>
            <main className="content__body">
              {view === 'projects' && (
                <ProjectsFeature currentProjectId={projectId} onOpen={openProject} onReload={reload} />
              )}
              {view === 'my-tasks' && <MyTasksFeature onOpenProject={openProjectProgress} />}
              {view === 'approvals' && (
                <ApprovalsFeature projectId={projectId} projectName={projectName} onOpen={openProjectView} />
              )}
              {view === 'audit' && canAdminister && <AuditFeature />}
              {view === 'resource-directory' && <ResourceDirectoryFeature />}
              {view === 'users' && canAdminister && <UsersFeature />}
              {view === 'account' && <AccountFeature />}
              {view === 'business-case' && <BusinessCaseFeature projectId={projectId} projectName={projectName} />}
              {view === 'benefits' && <BenefitsPlanFeature projectId={projectId} projectName={projectName} />}
              {view === 'charter' && (
                <CharterFeature projectId={projectId} projectName={projectName} onNavigate={navigate} />
              )}
              {view === 'raci' && <RaciFeature projectId={projectId} projectName={projectName} />}
              {view === 'assumptions' && (
                <AssumptionFeature projectId={projectId} onOpenRiskRegister={() => navigate('risks')} />
              )}
              {view === 'stakeholder-questionnaire' && (
                <StakeholderQuestionnaireFeature projectId={projectId} onNavigate={navigate} />
              )}
              {view === 'stakeholders' && <StakeholderFeature projectId={projectId} />}
              {view === 'stakeholder-analysis' && <StakeholderAnalysisFeature projectId={projectId} onNavigate={navigate} />}
              {view === 'stakeholder-mapping' && <StakeholderMappingFeature projectId={projectId} onNavigate={navigate} />}
              {view === 'scope-plan' && (
                <ManagementPlanFeature projectId={projectId} projectName={projectName} kind="SCOPE_MANAGEMENT" />
              )}
              {view === 'requirements-plan' && (
                <ManagementPlanFeature projectId={projectId} projectName={projectName} kind="REQUIREMENTS_MANAGEMENT" />
              )}
              {view === 'requirements' && <RequirementsFeature projectId={projectId} />}
              {view === 'scope-statement' && (
                <ScopeStatementFeature projectId={projectId} projectName={projectName} onNavigate={navigate} />
              )}
              {view === 'schedule-plan' && (
                <ManagementPlanFeature projectId={projectId} projectName={projectName} kind="SCHEDULE_MANAGEMENT" />
              )}
              {view === 'schedule-activities' && (
                <ScheduleModelFeature projectId={projectId} page="activities" onNavigate={navigate} />
              )}
              {view === 'schedule-network' && (
                <ScheduleModelFeature projectId={projectId} page="network" onNavigate={navigate} />
              )}
              {view === 'schedule-milestones' && (
                <ScheduleModelFeature projectId={projectId} page="milestones" onNavigate={navigate} />
              )}
              {view === 'schedule-baseline' && (
                <ScheduleModelFeature projectId={projectId} page="baseline" onNavigate={navigate} />
              )}
              {view === 'quality-plan' && <QualityPlanFeature projectId={projectId} projectName={projectName} />}
              {view === 'quality-metrics' && <QualityMetricsFeature projectId={projectId} />}
              {view === 'quality-report' && <QualityReportFeature projectId={projectId} onNavigate={navigate} />}
              {view === 'quality-analyses' && <QualityAnalysesFeature projectId={projectId} />}
              {view === 'risk-plan' && (
                <RiskPlanFeature projectId={projectId} projectName={projectName} onNavigate={navigate} />
              )}
              {view === 'financial-plan' && (
                <ManagementPlanFeature projectId={projectId} projectName={projectName} kind="FINANCIAL_MANAGEMENT" />
              )}
              {view === 'cost-estimates' && (
                <CostEstimatesFeature projectId={projectId} projectName={projectName} onNavigate={navigate} />
              )}
              {view === 'cost-baseline' && (
                <CostBaselineFeature projectId={projectId} projectName={projectName} onNavigate={navigate} />
              )}
              {view === 'funding-strategy' && <FundingStrategyFeature projectId={projectId} onNavigate={navigate} />}
              {view === 'funding-requirements' && <FundingRequirementsFeature projectId={projectId} onNavigate={navigate} />}
              {view === 'resource-plan' && (
                <ResourcePlanFeature projectId={projectId} projectName={projectName} onNavigate={navigate} />
              )}
              {view === 'resource-requirements' && <ResourceRequirementsFeature projectId={projectId} projectName={projectName} />}
              {view === 'team-charter' && <TeamCharterFeature projectId={projectId} projectName={projectName} />}
              {view === 'engagement-plan' && (
                <EngagementPlanFeature projectId={projectId} projectName={projectName} onNavigate={navigate} />
              )}
              {view === 'communication-plan' && <CommunicationPlanFeature projectId={projectId} projectName={projectName} />}
              {view === 'procurement-plan' && (
                <ProcurementPlanFeature projectId={projectId} projectName={projectName} onNavigate={navigate} />
              )}
              {view === 'procurement-strategy' && (
                <ProcurementStrategyFeature projectId={projectId} projectName={projectName} />
              )}
              {view === 'source-selection' && <SourceSelectionFeature projectId={projectId} />}
              {view === 'project-management-plan' && (
                <ProjectManagementPlanFeature projectId={projectId} projectName={projectName} onNavigate={navigate} />
              )}
              {view === 'change-log' && <ChangeLogFeature projectId={projectId} />}
              {view === 'issue-log' && <IssueLogFeature projectId={projectId} onNavigate={navigate} />}
              {view === 'lessons-learned' && <LessonsLearnedFeature projectId={projectId} />}
              {view === 'report' && (
                <ReportFeature projectId={projectId} onOpenRiskRegister={() => navigate('risks')} />
              )}
              {view === 'wbs' && <WbsFeature projectId={projectId} />}
              {view === 'wbs-dictionary' && <WbsDictionaryFeature projectId={projectId} />}
              {view === 'gantt' && <GanttFeature projectId={projectId} />}
              {view === 'risks' && <RiskFeature projectId={projectId} />}
              {view === 'task-progress' && <TaskProgressFeature projectId={projectId} onNavigate={navigate} />}
              {view === 'actual-costs' && <ActualCostsFeature projectId={projectId} />}
              {view === 'earned-value' && <EarnedValueFeature projectId={projectId} onNavigate={navigate} />}
              {view === 'deliverables' && <DeliverablesFeature projectId={projectId} onNavigate={navigate} />}
              {view === 'team' && <TeamFeature projectId={projectId} onNavigate={navigate} />}
              {view === 'closure-report' && (
                <ClosureReportFeature projectId={projectId} projectName={projectName} onNavigate={navigate} />
              )}
              {view === 'backlog' && <BacklogFeature projectId={projectId} onNavigate={navigate} />}
              {view === 'iterations' && <IterationsFeature projectId={projectId} onNavigate={navigate} />}
              {view === 'board' && <BoardFeature projectId={projectId} onNavigate={navigate} />}
              {view === 'agile-metrics' && <AgileMetricsFeature projectId={projectId} onNavigate={navigate} />}
            </main>
            </CurrentProjectContext.Provider>
          </ProjectRightsScope>
        </PageActionsSlot.Provider>
      </div>
    </div>
  );
}
