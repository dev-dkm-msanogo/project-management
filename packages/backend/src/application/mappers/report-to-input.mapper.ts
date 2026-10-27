import type { ExecutiveStatusReport } from '@domain/entities/executive-status-report';
import type { ExecutiveStatusReportInput } from '@shared/index';

/** Sérialise les parties rédigées du rapport vers leur modèle de saisie (forme de persistance). */

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function reportToInput(report: ExecutiveStatusReport): ExecutiveStatusReportInput {
  return {
    reportDate: isoDate(report.reportDate),
    reportingPeriod: { from: isoDate(report.reportingPeriod.from), to: isoDate(report.reportingPeriod.to) },
    overall: {
      statement: report.overall.statement,
      ragOverride: report.overall.override?.level ?? null,
      overrideReason: report.overall.overrideReason,
    },
    executiveSummary: { narrative: report.executiveSummary.narrative },
    decisions: report.decisions.map((decision) => ({
      description: decision.description,
      impact: decision.impact,
      neededBy: decision.neededBy ? isoDate(decision.neededBy) : null,
    })),
    priorities: report.priorities.map((priority) => ({ description: priority.description, done: priority.done })),
    kpis: report.kpis.map((kpi) => ({ key: kpi.key, label: kpi.label, value: kpi.displayValue, hint: kpi.hint })),
    forecast: {
      confidencePercentage: report.forecast.confidence.value,
      statement: report.forecast.statement,
    },
  };
}
