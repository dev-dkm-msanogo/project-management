import { Decision } from '@domain/entities/decision';
import { ExecutiveStatusReport } from '@domain/entities/executive-status-report';
import { Kpi } from '@domain/entities/kpi';
import {
  ExecutiveSummary,
  ForecastConfidence,
  NextPeriodPriority,
  OverallStatus,
} from '@domain/entities/report-blocks';
import { DateRange } from '@domain/value-objects/date-range';
import { RagStatus } from '@domain/value-objects/rag-status';
import type { ExecutiveStatusReportInput } from '@shared/index';

/**
 * Traduit le modèle de saisie vers l'agrégat du domaine (parties rédigées du rapport). Chaque
 * factory revalide ses invariants : période inversée, ajustement du statut sans justification…
 */

function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function parseIsoDateOrNull(iso: string | null): Date | null {
  return iso ? parseIsoDate(iso) : null;
}

export function inputToReport(projectId: string, input: ExecutiveStatusReportInput): ExecutiveStatusReport {
  return ExecutiveStatusReport.create({
    projectId,
    reportDate: parseIsoDate(input.reportDate),
    reportingPeriod: DateRange.of(parseIsoDate(input.reportingPeriod.from), parseIsoDate(input.reportingPeriod.to)),
    overall: OverallStatus.create({
      statement: input.overall.statement,
      override: input.overall.ragOverride ? RagStatus.of(input.overall.ragOverride) : null,
      overrideReason: input.overall.overrideReason,
    }),
    executiveSummary: ExecutiveSummary.create(input.executiveSummary.narrative),
    decisions: input.decisions.map((decision) =>
      Decision.create({
        description: decision.description,
        impact: decision.impact,
        neededBy: parseIsoDateOrNull(decision.neededBy),
      }),
    ),
    priorities: input.priorities.map((priority) => NextPeriodPriority.create(priority.description, priority.done)),
    kpis: input.kpis.map((kpi) => Kpi.create({ key: kpi.key, label: kpi.label, displayValue: kpi.value, hint: kpi.hint })),
    forecast: ForecastConfidence.create(input.forecast.confidencePercentage, input.forecast.statement),
  });
}
