import type { ExecutiveStatusReport } from '@domain/entities/executive-status-report';
import { DomainError } from '@domain/errors/domain-errors';
import { ConflictError, NotFoundError } from '@application/errors/application-errors';
import { inputToReport } from '@application/mappers/input-to-report.mapper';
import type {
  DeleteExecutiveReportUseCase,
  GetExecutiveReportUseCase,
  ListExecutiveReportsUseCase,
  PublishExecutiveReportUseCase,
  SaveExecutiveReportUseCase,
} from '@application/ports/in/executive-report.use-cases';
import type { StatusReportRepository, StoredReport } from '@application/ports/out/status-report.repository';
import type { UserRepository } from '@application/ports/out/user.repository';
import type { ExecutiveReportSummaryDto, ExecutiveStatusReportDto, ExecutiveStatusReportInput } from '@shared/index';

/** Rapport complété des éléments du projet calculés à sa date (voir `executiveReportReader`). */
export type ReportComposer = (report: ExecutiveStatusReport) => Promise<ExecutiveStatusReportDto>;

const MONTHS = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const monthName = (period: string): string => MONTHS.format(new Date(`${period}-01T00:00:00Z`));
/** « de février 2025 », « d'octobre 2026 » (élision devant avril, août, octobre). */
const ofMonth = (period: string): string => {
  const name = monthName(period);
  return /^[aeiou]/.test(name) ? "d'" + name : `de ${name}`;
};

/** Rapport tel qu'il se lit : figé s'il est publié, sinon recalculé à sa date. */
export async function readReport(stored: StoredReport, compose: ReportComposer): Promise<ExecutiveStatusReportDto> {
  const { publication } = stored;
  if (!publication) return compose(stored.report);
  return { ...publication.report, publication: { at: publication.at.toISOString(), by: publication.by } };
}

async function findReport(reports: StatusReportRepository, projectId: string, period: string): Promise<StoredReport> {
  const stored = await reports.find(projectId, period);
  if (!stored) throw new NotFoundError(`Aucun rapport exécutif pour ${monthName(period)}.`);
  return stored;
}

const frozen = (period: string) =>
  `Le rapport ${ofMonth(period)} est publié : il est figé et reste dans l'historique. Rédigez celui du mois suivant.`;

/** Historique : les rapports du projet, du mois le plus récent au plus ancien. */
export class ListExecutiveReportsService implements ListExecutiveReportsUseCase {
  constructor(private readonly reports: StatusReportRepository) {}

  async execute(query: { projectId: string }): Promise<ExecutiveReportSummaryDto[]> {
    return (await this.reports.list(query.projectId)).map(({ report, publication }) => ({
      period: report.period,
      reportDate: report.reportDate.toISOString().slice(0, 10),
      publishedRag: publication?.report.overall.rag ?? null,
      publishedAt: publication?.at.toISOString() ?? null,
      publishedBy: publication?.by ?? null,
    }));
  }
}

export class GetExecutiveReportService implements GetExecutiveReportUseCase {
  constructor(
    private readonly reports: StatusReportRepository,
    private readonly compose: ReportComposer,
  ) {}

  async execute(query: { projectId: string; period: string }): Promise<ExecutiveStatusReportDto> {
    return readReport(await findReport(this.reports, query.projectId, query.period), this.compose);
  }
}

/** Rédige le rapport d'un mois (brouillon) ; un rapport publié est figé. */
export class SaveExecutiveReportService implements SaveExecutiveReportUseCase {
  constructor(
    private readonly reports: StatusReportRepository,
    private readonly compose: ReportComposer,
  ) {}

  async execute(command: { projectId: string; period: string; input: ExecutiveStatusReportInput }): Promise<ExecutiveStatusReportDto> {
    const report = inputToReport(command.projectId, command.input);
    if (report.period !== command.period) {
      throw new DomainError(`La période saisie (${monthName(report.period)}) ne correspond pas au rapport ${ofMonth(command.period)}.`);
    }
    if ((await this.reports.find(command.projectId, command.period))?.publication) {
      throw new ConflictError(frozen(command.period));
    }
    await this.reports.save(report);
    return this.compose(report);
  }
}

/** Publie le rapport d'un mois : ses chiffres sont figés tels que calculés à la publication. */
export class PublishExecutiveReportService implements PublishExecutiveReportUseCase {
  constructor(
    private readonly reports: StatusReportRepository,
    private readonly users: UserRepository,
    private readonly compose: ReportComposer,
    private readonly clock: () => Date,
  ) {}

  async execute(command: { projectId: string; period: string; actorId: string }): Promise<ExecutiveStatusReportDto> {
    const stored = await findReport(this.reports, command.projectId, command.period);
    if (stored.publication) throw new ConflictError(frozen(command.period));
    const [report, user] = await Promise.all([this.compose(stored.report), this.users.findById(command.actorId)]);
    const publication = { at: this.clock(), by: user?.name ?? command.actorId, report };
    await this.reports.publish(command.projectId, command.period, publication);
    return readReport({ ...stored, publication }, this.compose);
  }
}

/** Supprime le brouillon d'un mois ; un rapport publié reste dans l'historique. */
export class DeleteExecutiveReportService implements DeleteExecutiveReportUseCase {
  constructor(private readonly reports: StatusReportRepository) {}

  async execute(command: { projectId: string; period: string }): Promise<void> {
    const stored = await findReport(this.reports, command.projectId, command.period);
    if (stored.publication) throw new ConflictError(frozen(command.period));
    await this.reports.deleteDraft(command.projectId, command.period);
  }
}
