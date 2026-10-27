import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { ProjectMethodology } from '@shared/index';
import { useAuth } from '@/auth/AuthContext';
import { AppBrand } from '@/components/brand/AppBrand';
import {
  IconActualCosts,
  IconBacklog,
  IconBoard,
  IconIterations,
  IconVelocity,
  IconApprovals,
  IconAudit,
  IconAssumptions,
  IconBenefits,
  IconBusinessCase,
  IconChangeLog,
  IconCharter,
  IconClosure,
  IconCommunication,
  IconCostBaseline,
  IconCostEstimates,
  IconDeliverables,
  IconDirectory,
  IconEarnedValue,
  IconEngagement,
  IconFinancialPlan,
  IconChevron,
  IconActivities,
  IconFundingRequirements,
  IconFundingStrategy,
  IconGantt,
  IconIssueLog,
  IconMyTasks,
  IconLessons,
  IconMenu,
  IconProcurement,
  IconProjectPlan,
  IconProjects,
  IconQualityAnalyses,
  IconQualityMetrics,
  IconQualityPlan,
  IconQualityReport,
  IconRaci,
  IconReport,
  IconResourcePlan,
  IconResources,
  IconRequirements,
  IconRequirementsPlan,
  IconRisk,
  IconRiskPlan,
  IconSchedulePlan,
  IconScope,
  IconScopePlan,
  IconSelection,
  IconQuestionnaire,
  IconStakeholderAnalysis,
  IconStakeholderMap,
  IconStakeholders,
  IconStrategy,
  IconTeam,
  IconTeamCharter,
  IconUsers,
  IconMilestones,
  IconNetwork,
  IconScheduleBaseline,
  IconWbs,
  IconWbsDictionary,
  IconTaskProgress,
} from '@/components/nav/icons';
import {
  navSections,
  outputForView,
  outputGroup,
  processByNumber,
  type AppView,
  type OutputView,
  STANDALONE_VIEWS,
  type StandaloneView,
  type PmbokOutput,
  type ProcessGroupId,
} from '@/navigation/pmp';

const VIEW_ICONS: Record<OutputView, ReactNode> = {
  'business-case': <IconBusinessCase />,
  benefits: <IconBenefits />,
  charter: <IconCharter />,
  raci: <IconRaci />,
  assumptions: <IconAssumptions />,
  'stakeholder-questionnaire': <IconQuestionnaire />,
  stakeholders: <IconStakeholders />,
  'stakeholder-analysis': <IconStakeholderAnalysis />,
  'stakeholder-mapping': <IconStakeholderMap />,
  'scope-plan': <IconScopePlan />,
  'requirements-plan': <IconRequirementsPlan />,
  requirements: <IconRequirements />,
  'scope-statement': <IconScope />,
  'schedule-plan': <IconSchedulePlan />,
  'schedule-activities': <IconActivities />,
  'schedule-network': <IconNetwork />,
  'schedule-milestones': <IconMilestones />,
  'schedule-baseline': <IconScheduleBaseline />,
  'quality-plan': <IconQualityPlan />,
  'quality-metrics': <IconQualityMetrics />,
  'quality-report': <IconQualityReport />,
  'quality-analyses': <IconQualityAnalyses />,
  'risk-plan': <IconRiskPlan />,
  'financial-plan': <IconFinancialPlan />,
  'cost-estimates': <IconCostEstimates />,
  'cost-baseline': <IconCostBaseline />,
  'funding-strategy': <IconFundingStrategy />,
  'funding-requirements': <IconFundingRequirements />,
  'resource-plan': <IconResourcePlan />,
  'resource-requirements': <IconResources />,
  'team-charter': <IconTeamCharter />,
  'engagement-plan': <IconEngagement />,
  'communication-plan': <IconCommunication />,
  'procurement-plan': <IconProcurement />,
  'procurement-strategy': <IconStrategy />,
  'source-selection': <IconSelection />,
  'project-management-plan': <IconProjectPlan />,
  'change-log': <IconChangeLog />,
  'issue-log': <IconIssueLog />,
  'lessons-learned': <IconLessons />,
  wbs: <IconWbs />,
  'wbs-dictionary': <IconWbsDictionary />,
  gantt: <IconGantt />,
  report: <IconReport />,
  risks: <IconRisk />,
  'task-progress': <IconTaskProgress />,
  'actual-costs': <IconActualCosts />,
  'earned-value': <IconEarnedValue />,
  deliverables: <IconDeliverables />,
  team: <IconTeam />,
  'closure-report': <IconClosure />,
  backlog: <IconBacklog />,
  iterations: <IconIterations />,
  board: <IconBoard />,
  'agile-metrics': <IconVelocity />,
};

/** Infobulle : processus PMBOK 8 qui produisent l'output. */
function producedHint(output: PmbokOutput): string {
  return `Produit par : ${output.produced
    .map((number) => `${number}. ${processByNumber(number).label}`)
    .join(' ; ')}`;
}

interface SidebarProps {
  active: AppView;
  /** Méthodologie du projet courant : elle choisit les outils proposés. */
  methodology: ProjectMethodology;
  onNavigate: (view: AppView) => void;
}

/** Menu latéral : portefeuille, puis les outputs du PMBOK 8 classés par groupe de processus. */
export function Sidebar({ active, methodology, onNavigate }: SidebarProps) {
  const { canAdminister } = useAuth();
  const activeOutput = outputForView(active);
  const [expanded, setExpanded] = useState<ReadonlySet<ProcessGroupId>>(
    () => new Set(activeOutput ? [outputGroup(activeOutput)] : []),
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  // Déplie automatiquement le groupe de la page active.
  useEffect(() => {
    const output = outputForView(active);
    if (!output) return;
    const group = outputGroup(output);
    setExpanded((previous) => (previous.has(group) ? previous : new Set(previous).add(group)));
  }, [active]);

  const toggleGroup = (id: ProcessGroupId) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const navigate = (view: AppView) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  /** Entrée hors livrables (référentiel, administration). */
  const standaloneItem = (view: StandaloneView, icon: ReactNode) => {
    const isActive = active === view;
    return (
      <button
        type="button"
        className={`nav-item${isActive ? ' nav-item--active' : ''}`}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => navigate(view)}
      >
        <span className="nav-item__icon">{icon}</span>
        <span className="nav-item__label">{STANDALONE_VIEWS[view].title}</span>
      </button>
    );
  };

  const renderOutput = (output: PmbokOutput) => {
    const view = output.view;
    const isActive = active === view;
    return (
      <li key={output.id}>
        <button
          type="button"
          className={`nav-item${isActive ? ' nav-item--active' : ''}`}
          aria-current={isActive ? 'page' : undefined}
          title={producedHint(output)}
          onClick={() => navigate(view)}
        >
          <span className="nav-item__icon">{VIEW_ICONS[view]}</span>
          <span className="nav-item__label">{output.label}</span>
        </button>
      </li>
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        <AppBrand className="sidebar__brand" />
        <button
          type="button"
          className="sidebar__toggle"
          aria-expanded={mobileOpen}
          aria-controls="main-navigation"
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setMobileOpen((open) => !open)}
        >
          <IconMenu />
        </button>
      </div>

      <nav
        id="main-navigation"
        className={`sidebar__nav${mobileOpen ? ' sidebar__nav--open' : ''}`}
        aria-label="Navigation principale"
      >
        <div className="nav-group">
          <span className="nav-group__title">Portefeuille</span>
          <button
            type="button"
            className={`nav-item${active === 'projects' ? ' nav-item--active' : ''}`}
            aria-current={active === 'projects' ? 'page' : undefined}
            onClick={() => navigate('projects')}
          >
            <span className="nav-item__icon">
              <IconProjects />
            </span>
            <span className="nav-item__label">Tableau de bord</span>
          </button>
          {standaloneItem('my-tasks', <IconMyTasks />)}
          {standaloneItem('approvals', <IconApprovals />)}
        </div>

        <div className="nav-group">
          <span className="nav-group__title">Organisation</span>
          {standaloneItem('resource-directory', <IconDirectory />)}
        </div>

        <div className="nav-groups">
          {navSections(methodology).map((section) => {
            const isOpen = expanded.has(section.id);
            const listId = `nav-group-${section.id}`;
            return (
              <div className="nav-section" key={section.id}>
                <button
                  type="button"
                  className="nav-section__head"
                  aria-expanded={isOpen}
                  aria-controls={listId}
                  onClick={() => toggleGroup(section.id)}
                >
                  <span
                    className="nav-section__badge"
                    style={{ '--section-color': section.color, '--section-ink': section.ink } as CSSProperties}
                    aria-hidden="true"
                  >
                    {section.number}
                  </span>
                  <span className="nav-section__title">{section.label}</span>
                  <span className="nav-section__count" aria-label={`${section.outputs.length} livrables`}>
                    {section.outputs.length}
                  </span>
                  <span className={`nav-section__chevron${isOpen ? '' : ' is-collapsed'}`}>
                    <IconChevron />
                  </span>
                </button>
                {isOpen && (
                  <ul className="nav-section__items" id={listId}>
                    {section.outputs.map(renderOutput)}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {canAdminister && (
          <div className="nav-group nav-group--admin">
            <span className="nav-group__title">Administration</span>
            {standaloneItem('users', <IconUsers />)}
            {standaloneItem('audit', <IconAudit />)}
          </div>
        )}

      </nav>
    </aside>
  );
}
