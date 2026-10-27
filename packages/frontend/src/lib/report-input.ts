import type { ExecutiveStatusReportDto, ExecutiveStatusReportInput } from '@shared/index';

/**
 * Conversions entre le rapport lu (complété des éléments du projet) et ses parties rédigées : seules
 * les décisions et indicateurs saisis repartent dans le formulaire, jamais ceux que le projet calcule.
 */

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

export function reportDtoToInput(dto: ExecutiveStatusReportDto): ExecutiveStatusReportInput {
  const input: ExecutiveStatusReportInput = {
    reportDate: dto.header.reportDate,
    reportingPeriod: dto.header.reportingPeriod,
    overall: {
      statement: dto.overall.statement,
      ragOverride: dto.overall.overridden ? dto.overall.rag : null,
      overrideReason: dto.overall.overrideReason,
    },
    executiveSummary: { narrative: dto.executiveSummary.narrative },
    decisions: dto.decisions
      .filter((decision) => decision.source === null)
      .map(({ description, impact, neededBy }) => ({ description, impact, neededBy })),
    priorities: dto.priorities,
    kpis: dto.kpis.filter((kpi) => !kpi.computed).map(({ key, label, value, hint }) => ({ key, label, value, hint })),
    forecast: { confidencePercentage: dto.forecast.confidencePercentage, statement: dto.forecast.statement },
  };
  // Détache l'état du formulaire des objets du DTO (édition sans effet de bord).
  return structuredClone(input);
}

/** Nouveau rapport : le mois en cours, daté d'aujourd'hui. */
export function blankReportInput(): ExecutiveStatusReportInput {
  const today = new Date();
  const firstOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  return {
    reportDate: isoDay(today),
    reportingPeriod: { from: isoDay(firstOfMonth), to: isoDay(today) },
    overall: { statement: '', ragOverride: null, overrideReason: null },
    executiveSummary: { narrative: '' },
    decisions: [],
    priorities: [],
    kpis: [],
    forecast: { confidencePercentage: 70, statement: '' },
  };
}
