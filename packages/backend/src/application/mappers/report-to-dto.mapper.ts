import type { ExecutiveStatusReport } from '@domain/entities/executive-status-report';
import type { RequirementsMetrics } from '@domain/entities/requirements-register';
import type {
  ChangeSummaryView,
  CostView,
  DimensionView,
  ForecastView,
  MilestoneView,
  PendingDecision,
} from '@domain/entities/report-status';
import type { RiskRegister } from '@domain/entities/risk-register';
import { RagStatus, type RagLevel } from '@domain/value-objects/rag-status';
import { toMajorRisksDto } from '@application/mappers/risk-register.mappers';
import { COMPUTED_KPI_KEYS, type ExecutiveStatusReportDto, type KpiDto, type MoneyDto } from '@shared/index';

/** Éléments du projet calculés à la date du rapport (voir `executiveReportReader`). */
export interface ReportFacts {
  projectName: string;
  progressMeasuredOn: Date | null;
  progressStale: boolean;
  computedRag: RagLevel;
  milestones: MilestoneView[];
  scope: DimensionView;
  schedule: DimensionView;
  cost: CostView;
  risks: RiskRegister;
  pendingDecisions: PendingDecision[];
  changes: ChangeSummaryView;
  measures: {
    progressPct: number | null;
    spi: number | null;
    cpi: number | null;
    eac: number | null;
    bac: number | null;
    lateTasks: number | null;
    leafTasks: number;
    criticalRisks: number;
    openIssues: number;
    requirements: RequirementsMetrics | null;
  };
  forecast: ForecastView;
}

const CURRENCY = 'XOF';
const isoDate = (date: Date): string => date.toISOString().slice(0, 10);
const isoDateOrNull = (date: Date | null): string | null => (date ? isoDate(date) : null);
const money = (amount: number): MoneyDto => ({ amount, currency: CURRENCY });

const INTEGER_FR = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const DECIMAL_FR = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MILLIONS_FR = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const millions = (amount: number) => `${MILLIONS_FR.format(amount / 1_000_000)} M FCFA`;
const signed = (value: number, text: string) => `${value > 0 ? '+' : ''}${text}`;

/** Impact d'une demande à décider : coût et délai estimés, s'ils ne sont pas nuls. */
function changeImpact(decision: PendingDecision): string | null {
  const parts = [
    decision.costImpact ? signed(decision.costImpact, `${INTEGER_FR.format(decision.costImpact)} FCFA`) : null,
    decision.scheduleImpactDays ? signed(decision.scheduleImpactDays, `${decision.scheduleImpactDays} j ouvrés`) : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

/** Indicateurs calculés, présents seulement quand leur source existe. */
function computedKpis({ measures }: ReportFacts): KpiDto[] {
  const kpis: (KpiDto | null)[] = [
    measures.progressPct === null
      ? null
      : { key: 'PROGRESS', label: 'Réalisé', value: `${MILLIONS_FR.format(measures.progressPct)} %`, hint: 'Valeur acquise / budget', computed: true },
    measures.spi === null ? null : { key: 'SPI', label: 'SPI (délai)', value: DECIMAL_FR.format(measures.spi), hint: '≥ 0,95 : dans les clous', computed: true },
    measures.cpi === null ? null : { key: 'CPI', label: 'CPI (coût)', value: DECIMAL_FR.format(measures.cpi), hint: '≥ 0,95 : dans les clous', computed: true },
    measures.eac === null || measures.bac === null
      ? null
      : { key: 'EAC', label: "Estimation à l'achèvement", value: millions(measures.eac), hint: `Budget ${millions(measures.bac)}`, computed: true },
    measures.lateTasks === null
      ? null
      : { key: 'LATE_TASKS', label: 'Tâches en retard', value: INTEGER_FR.format(measures.lateTasks), hint: `Sur ${measures.leafTasks} tâches élémentaires`, computed: true },
    { key: 'CRITICAL_RISKS', label: 'Risques critiques ouverts', value: INTEGER_FR.format(measures.criticalRisks), hint: null, computed: true },
    { key: 'OPEN_ISSUES', label: 'Problèmes ouverts', value: INTEGER_FR.format(measures.openIssues), hint: null, computed: true },
    measures.requirements === null
      ? null
      : {
          key: 'VERIFIED_REQUIREMENTS',
          label: 'Exigences vérifiées',
          value: `${measures.requirements.verified} / ${measures.requirements.active}`,
          hint: 'Exigences actives',
          computed: true,
        },
  ];
  return kpis.filter((kpi): kpi is KpiDto => kpi !== null);
}

const FORECAST_LABELS = {
  none: 'Pas de WBS datée',
  onPlan: 'Livraison prévue dans les délais',
  late: 'Livraison prévue après la date planifiée',
};

/** Rapport exécutif : parties rédigées + sections calculées à la date du rapport. */
export function toExecutiveStatusReportDto(report: ExecutiveStatusReport, facts: ReportFacts): ExecutiveStatusReportDto {
  const published = report.overall.levelFrom(RagStatus.of(facts.computedRag)).level;
  const computedKeys = new Set<string>(COMPUTED_KPI_KEYS);
  const { cost, changes, forecast } = facts;

  return {
    period: report.period,
    publication: null,
    header: {
      projectId: report.projectId,
      projectName: facts.projectName,
      reportTitle: 'Rapport de statut exécutif',
      reportingPeriod: { from: isoDate(report.reportingPeriod.from), to: isoDate(report.reportingPeriod.to) },
      reportDate: isoDate(report.reportDate),
      progressMeasuredOn: isoDateOrNull(facts.progressMeasuredOn),
      progressStale: facts.progressStale,
    },
    overall: {
      rag: published,
      computedRag: facts.computedRag,
      overridden: report.overall.override !== null,
      overrideReason: report.overall.overrideReason,
      headline: published,
      statement: report.overall.statement,
    },
    executiveSummary: { narrative: report.executiveSummary.narrative },
    milestones: facts.milestones.map((milestone) => ({
      code: milestone.code,
      name: milestone.name,
      planned: isoDate(milestone.planned),
      actual: isoDateOrNull(milestone.actual),
      status: milestone.state,
    })),
    scope: facts.scope,
    schedule: facts.schedule,
    cost: {
      budgetLabel: cost.budgetLabel,
      cpi: cost.cpi,
      eac: cost.eac === null ? null : money(cost.eac),
      rag: cost.rag,
      headlinePercentage: Math.round(cost.spentPct),
      headlineLabel: 'du budget dépensé',
      budget: money(cost.budget),
      spent: money(cost.spent),
      committed: money(0),
      remaining: money(cost.remaining),
      spentPct: cost.spentPct,
      committedPct: 0,
      remainingPct: cost.remainingPct,
    },
    majorRisks: toMajorRisksDto(facts.risks),
    decisions: [
      ...facts.pendingDecisions.map((decision) => ({
        source: decision.source,
        code: decision.code,
        description: decision.description,
        impact: decision.source === 'CHANGE' ? changeImpact(decision) : decision.impact,
        neededBy: null,
      })),
      ...report.decisions.map((decision) => ({
        source: null,
        code: null,
        description: decision.description,
        impact: decision.impact,
        neededBy: isoDateOrNull(decision.neededBy),
      })),
    ],
    changeSummary: {
      approved: { count: changes.approved.count, impact: money(changes.approved.cost) },
      pending: { count: changes.pending.count, impact: money(changes.pending.cost) },
      rejected: { count: changes.rejected.count, impact: money(changes.rejected.cost) },
      netCostImpact: money(changes.netCostImpact),
      netScheduleImpactDays: changes.netScheduleImpactDays,
    },
    priorities: report.priorities.map((priority) => ({ description: priority.description, done: priority.done })),
    kpis: [
      ...computedKpis(facts),
      ...report.kpis
        .filter((kpi) => !computedKeys.has(kpi.key))
        .map((kpi) => ({ key: kpi.key, label: kpi.label, value: kpi.displayValue, hint: kpi.hint, computed: false })),
    ],
    forecast: {
      forecastLabel: !forecast.forecast ? FORECAST_LABELS.none : forecast.onPlan ? FORECAST_LABELS.onPlan : FORECAST_LABELS.late,
      plannedDate: isoDateOrNull(forecast.planned),
      forecastDate: isoDateOrNull(forecast.forecast),
      onPlan: forecast.onPlan,
      confidencePercentage: report.forecast.confidence.value,
      confidenceLabel: report.forecast.label,
      statement: report.forecast.statement,
    },
  };
}
