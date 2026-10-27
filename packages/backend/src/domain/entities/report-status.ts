import type { ChangeLog } from '@domain/entities/change-log';
import type { IssueLog } from '@domain/entities/issue-log';
import type { TaskTracking } from '@domain/entities/plan-progress';
import type { RequirementsRegister } from '@domain/entities/requirements-register';
import type { ScheduleMilestone } from '@domain/entities/schedule-model';
import type { MilestoneState } from '@domain/value-objects/classifications';
import { RagStatus, type RagLevel } from '@domain/value-objects/rag-status';

/**
 * Sections chiffrées du rapport exécutif, calculées à la date du rapport à partir des éléments du
 * projet (fonctions pures). Les seuils sont ceux affichés dans le rapport.
 */

const MS_PER_DAY = 86_400_000;
const day = (date: Date): string => date.toISOString().slice(0, 10);
const inclusiveDays = (start: Date, end: Date) => Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;

export interface StatusLine {
  label: string;
  rag: RagLevel;
  percentage: number;
}

/** Statut d'une dimension : niveau, part principale et ventilation (parts entières qui totalisent 100). */
export interface DimensionView {
  rag: RagLevel;
  headlinePercentage: number;
  headlineLabel: string;
  breakdown: StatusLine[];
  /** Ce sur quoi porte la ventilation ; `null` : pas de données. */
  basis: string | null;
}

const UNAVAILABLE: DimensionView = { rag: 'NOT_APPLICABLE', headlinePercentage: 0, headlineLabel: '', breakdown: [], basis: null };

/** Indice de performance → niveau : à partir de 0,95 vert, de 0,90 ambre, sinon rouge ; sans indice : non applicable. */
export function ragFromIndex(value: number | null): RagLevel {
  if (value === null) return 'NOT_APPLICABLE';
  if (value >= 0.95) return 'GREEN';
  if (value >= 0.9) return 'AMBER';
  return 'RED';
}

/** Parts entières totalisant 100 (méthode des plus forts restes). */
function shares(counts: readonly number[]): number[] {
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total === 0) return counts.map(() => 0);
  const exact = counts.map((count) => (count * 100) / total);
  const floors = exact.map(Math.floor);
  let rest = 100 - floors.reduce((sum, value) => sum + value, 0);
  const order = exact.map((value, index) => ({ index, fraction: value - Math.floor(value) })).sort((a, b) => b.fraction - a.fraction);
  for (const { index } of order) {
    if (rest-- <= 0) break;
    floors[index] = floors[index]! + 1;
  }
  return floors;
}

function dimension(labels: readonly [string, string, string], counts: readonly [number, number, number], rag: RagLevel, basis: string): DimensionView {
  const [onTrack, atRisk, off] = shares(counts) as [number, number, number];
  return {
    rag,
    headlinePercentage: onTrack,
    headlineLabel: labels[0],
    breakdown: [
      { label: labels[0], rag: 'GREEN', percentage: onTrack },
      { label: labels[1], rag: 'AMBER', percentage: atRisk },
      { label: labels[2], rag: 'RED', percentage: off },
    ],
    basis,
  };
}

/**
 * 5. Délai : tâches élémentaires en retard (fin prévue dépassée à la date d'état sans être
 * terminées), à risque (suspendues, ou plus de 10 points sous l'avancement attendu au prorata du
 * temps écoulé), dans les délais sinon. Niveau : indice de délai (SPI) s'il est mesurable, sinon
 * rouge au-delà de 20 % de tâches en retard, ambre au-delà de 10 % en retard ou à risque.
 */
export function scheduleStatus(tracking: readonly TaskTracking[], statusDate: Date, spi: number | null): DimensionView {
  const leaves = tracking.filter((item) => item.isLeaf);
  if (leaves.length === 0) return UNAVAILABLE;
  let late = 0;
  let atRisk = 0;
  for (const item of leaves) {
    const { start, end } = item.task;
    if (item.status === 'COMPLETE') continue;
    if (end && day(end) < day(statusDate)) {
      late += 1;
      continue;
    }
    const expected =
      start && end && day(start) <= day(statusDate) ? (100 * inclusiveDays(start, statusDate)) / inclusiveDays(start, end) : 0;
    if (item.status === 'ON_HOLD' || item.percentComplete + 10 < expected) atRisk += 1;
  }
  const counts: [number, number, number] = [leaves.length - late - atRisk, atRisk, late];
  const fallback: RagLevel =
    late / leaves.length > 0.2 ? 'RED' : (late + atRisk) / leaves.length > 0.1 ? 'AMBER' : 'GREEN';
  return dimension(
    ['Dans les délais', 'À risque', 'En retard'],
    counts,
    spi === null ? fallback : ragFromIndex(spi),
    `${leaves.length} tâche(s) élémentaire(s) de la WBS`,
  );
}

/**
 * 4. Périmètre : exigences hors périmètre (reportées ou rejetées), à risque (encore proposées, ou
 * Must / Should sans critères d'acceptation ni méthode de vérification), dans le périmètre sinon.
 * Niveau : rouge au-delà de 25 % à risque ou si une exigence Must sort du périmètre, ambre au-delà
 * de 10 % à risque ou si un besoin n'est couvert par aucune exigence, vert sinon.
 */
export function scopeStatus(register: RequirementsRegister): DimensionView {
  const requirements = register.requirements;
  if (requirements.length === 0) return UNAVAILABLE;
  const out = requirements.filter((item) => !item.isActive);
  const atRisk = requirements.filter(
    (item) =>
      item.isActive &&
      (item.props.status === 'PROPOSED' ||
        (['MUST', 'SHOULD'].includes(item.props.priority) && (!item.props.acceptanceCriteria || !item.props.verification))),
  );
  const riskShare = atRisk.length / requirements.length;
  const mustOut = out.some((item) => item.props.priority === 'MUST');
  const rag: RagLevel =
    riskShare > 0.25 || mustOut ? 'RED' : riskShare > 0.1 || register.metrics.uncoveredNeeds.length > 0 ? 'AMBER' : 'GREEN';
  return dimension(
    ['Dans le périmètre', 'À risque', 'Hors périmètre'],
    [requirements.length - out.length - atRisk.length, atRisk.length, out.length],
    rag,
    `${requirements.length} exigence(s) du registre`,
  );
}

export interface CostView {
  budgetLabel: string | null;
  budget: number;
  spent: number;
  remaining: number;
  spentPct: number;
  remainingPct: number;
  rag: RagLevel;
  cpi: number | null;
  eac: number | null;
}

/** 6. Coût : budget de référence, dépensé à la date d'état, reste ; niveau par l'indice de coût (CPI). */
export function costStatus(
  budget: { amount: number; label: string } | null,
  spent: number,
  cpi: number | null,
  eac: number | null,
): CostView {
  const amount = budget?.amount ?? 0;
  const remaining = Math.max(amount - spent, 0);
  const pct = (value: number) => (amount > 0 ? Math.round((value / amount) * 1000) / 10 : 0);
  return {
    budgetLabel: budget?.label ?? null,
    budget: amount,
    spent,
    remaining,
    spentPct: pct(spent),
    remainingPct: pct(remaining),
    rag: ragFromIndex(cpi),
    cpi,
    eac,
  };
}

export interface MilestoneView {
  code: string;
  name: string;
  planned: Date;
  /** Atteint à la date d'état ; une atteinte postérieure ne compte pas encore. */
  actual: Date | null;
  state: MilestoneState;
}

/**
 * 3. Jalons à la date d'état : atteints, en retard (date cible dépassée sans être atteints), le
 * prochain (en cours), puis à venir.
 */
export function milestoneStatuses(milestones: readonly ScheduleMilestone[], statusDate: Date): MilestoneView[] {
  const sorted = [...milestones].sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());
  let nextFound = false;
  return sorted.map((milestone) => {
    const achieved = milestone.achievedOn && day(milestone.achievedOn) <= day(statusDate) ? milestone.achievedOn : null;
    let state: MilestoneState;
    if (achieved) state = 'COMPLETE';
    else if (day(milestone.targetDate) < day(statusDate)) state = 'AT_RISK';
    else if (!nextFound) {
      state = 'IN_PROGRESS';
      nextFound = true;
    } else state = 'NOT_STARTED';
    return { code: milestone.code, name: milestone.name, planned: milestone.targetDate, actual: achieved, state };
  });
}

export interface ChangeBucketView {
  count: number;
  cost: number;
}

export interface ChangeSummaryView {
  approved: ChangeBucketView;
  pending: ChangeBucketView;
  rejected: ChangeBucketView;
  /** Ce que les demandes approuvées ajoutent au coût et au délai. */
  netCostImpact: number;
  netScheduleImpactDays: number;
}

/** Une demande soumise est à décider tant que sa décision n'est pas prise à la date d'état (ou qu'elle est reportée). */
function changeStateAt(request: ChangeLog['requests'][number], statusDate: Date): 'APPROVED' | 'REJECTED' | 'PENDING' | null {
  const { submittedOn, disposition, decidedOn } = request.props;
  if (day(submittedOn) > day(statusDate)) return null;
  if (!disposition || !decidedOn || day(decidedOn) > day(statusDate) || disposition === 'DEFERRED') return 'PENDING';
  return disposition;
}

/** 9. Synthèse des changements connus à la date d'état. */
export function changeSummary(log: ChangeLog, statusDate: Date): ChangeSummaryView {
  const buckets = { APPROVED: { count: 0, cost: 0, days: 0 }, PENDING: { count: 0, cost: 0, days: 0 }, REJECTED: { count: 0, cost: 0, days: 0 } };
  for (const request of log.requests) {
    const state = changeStateAt(request, statusDate);
    if (!state) continue;
    buckets[state].count += 1;
    buckets[state].cost += request.props.costImpact;
    buckets[state].days += request.props.scheduleImpactDays;
  }
  const bucket = ({ count, cost }: { count: number; cost: number }) => ({ count, cost });
  return {
    approved: bucket(buckets.APPROVED),
    pending: bucket(buckets.PENDING),
    rejected: bucket(buckets.REJECTED),
    netCostImpact: buckets.APPROVED.cost,
    netScheduleImpactDays: buckets.APPROVED.days,
  };
}

export interface PendingDecision {
  source: 'CHANGE' | 'ISSUE';
  code: string;
  description: string;
  /** Demande : coût et délai estimés ; problème : son impact décrit. */
  costImpact: number | null;
  scheduleImpactDays: number | null;
  impact: string | null;
}

/** 8. Décisions attendues des registres : demandes de modification à décider, problèmes escaladés non résolus. */
export function pendingDecisions(log: ChangeLog, issues: IssueLog, statusDate: Date): PendingDecision[] {
  const changes = log.requests
    .filter((request) => changeStateAt(request, statusDate) === 'PENDING')
    .map((request) => ({
      source: 'CHANGE' as const,
      code: request.code,
      description: `Décider de la demande de modification « ${request.props.title} »`,
      costImpact: request.props.costImpact,
      scheduleImpactDays: request.props.scheduleImpactDays,
      impact: null,
    }));
  const escalated = issues.issues
    .filter(
      (issue) =>
        issue.props.status === 'ESCALATED' &&
        day(issue.props.raisedOn) <= day(statusDate) &&
        (!issue.props.resolvedOn || day(issue.props.resolvedOn) > day(statusDate)),
    )
    .map((issue) => ({
      source: 'ISSUE' as const,
      code: issue.code,
      description: issue.props.description,
      costImpact: null,
      scheduleImpactDays: null,
      impact: issue.props.impact || null,
    }));
  return [...changes, ...escalated];
}

export interface ForecastView {
  planned: Date | null;
  forecast: Date | null;
  onPlan: boolean;
}

/**
 * 12. Prévision : la durée prévue de la WBS divisée par l'indice de délai (au rythme constaté, le
 * projet finit à début + durée / SPI) ; sans indice, la fin prévue.
 */
export function deliveryForecast(start: Date | null, end: Date | null, spi: number | null): ForecastView {
  if (!start || !end) return { planned: null, forecast: null, onPlan: true };
  const duration = inclusiveDays(start, end);
  const forecast = spi && spi > 0 ? new Date(start.getTime() + (Math.round(duration / spi) - 1) * MS_PER_DAY) : end;
  return { planned: end, forecast, onPlan: day(forecast) <= day(end) };
}

/** 1. Niveau calculé du statut global : la pire des dimensions applicables. */
export function overallRag(levels: readonly RagLevel[]): RagLevel {
  return RagStatus.worst(levels.map((level) => RagStatus.of(level))).level;
}
