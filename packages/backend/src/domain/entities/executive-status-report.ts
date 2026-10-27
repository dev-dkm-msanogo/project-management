import { DomainError } from '@domain/errors/domain-errors';
import type { DateRange } from '@domain/value-objects/date-range';
import type { Decision } from '@domain/entities/decision';
import type { Kpi } from '@domain/entities/kpi';
import type {
  ExecutiveSummary,
  ForecastConfidence,
  NextPeriodPriority,
  OverallStatus,
} from '@domain/entities/report-blocks';

/** Propriétés de construction de l'agrégat : uniquement ce que rédige le chef de projet. */
export interface ExecutiveStatusReportProps {
  projectId: string;
  reportDate: Date;
  reportingPeriod: DateRange;
  overall: OverallStatus;
  executiveSummary: ExecutiveSummary;
  /** Décisions qu'aucun registre ne porte. */
  decisions: readonly Decision[];
  priorities: readonly NextPeriodPriority[];
  /** Indicateurs propres au projet, en plus des indicateurs calculés. */
  kpis: readonly Kpi[];
  forecast: ForecastConfidence;
}

const day = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Agrégat racine : le rapport de statut exécutif d'un mois, tel que le rédige le chef de projet (un
 * rapport par mois et par projet). Ses sections chiffrées (jalons, périmètre, délai, coût, risques,
 * changements, indicateurs, prévision) sont calculées à la date du rapport à partir des éléments du
 * projet, puis figées à sa publication.
 */
export class ExecutiveStatusReport {
  private constructor(private readonly props: ExecutiveStatusReportProps) {}

  static create(props: ExecutiveStatusReportProps): ExecutiveStatusReport {
    if (Number.isNaN(props.reportDate.getTime())) {
      throw new DomainError('La date du rapport doit être valide.');
    }
    if (day(props.reportDate) < day(props.reportingPeriod.from)) {
      throw new DomainError('La date du rapport ne peut pas précéder le début de la période.');
    }
    if (day(props.reportingPeriod.from).slice(0, 7) !== day(props.reportingPeriod.to).slice(0, 7)) {
      throw new DomainError("La période d'un rapport tient dans un mois : un rapport par mois.");
    }
    return new ExecutiveStatusReport({ ...props, reportDate: new Date(props.reportDate) });
  }

  /** Mois du rapport (AAAA-MM) : sa clé, un rapport par mois et par projet. */
  get period(): string {
    return day(this.props.reportingPeriod.from).slice(0, 7);
  }

  get projectId(): string {
    return this.props.projectId;
  }
  get reportDate(): Date {
    return new Date(this.props.reportDate);
  }
  get reportingPeriod(): DateRange {
    return this.props.reportingPeriod;
  }
  get overall(): OverallStatus {
    return this.props.overall;
  }
  get executiveSummary(): ExecutiveSummary {
    return this.props.executiveSummary;
  }
  get decisions(): readonly Decision[] {
    return this.props.decisions;
  }
  get priorities(): readonly NextPeriodPriority[] {
    return this.props.priorities;
  }
  get kpis(): readonly Kpi[] {
    return this.props.kpis;
  }
  get forecast(): ForecastConfidence {
    return this.props.forecast;
  }
}
