import type { ExecutiveStatusReport } from '@domain/entities/executive-status-report';
import type {
  ReportPublication,
  StatusReportRepository,
  StoredReport,
} from '@application/ports/out/status-report.repository';

const key = (projectId: string, period: string): string => `${projectId}|${period}`;

/** Adaptateur SORTANT en mémoire (repli sans base) : un rapport par mois et par projet. */
export class InMemoryStatusReportRepository implements StatusReportRepository {
  private readonly reports = new Map<string, StoredReport>();

  constructor(seed: readonly ExecutiveStatusReport[] = []) {
    for (const report of seed) this.reports.set(key(report.projectId, report.period), { report, publication: null });
  }

  async list(projectId: string): Promise<StoredReport[]> {
    return [...this.reports.values()]
      .filter((stored) => stored.report.projectId === projectId)
      .sort((a, b) => b.report.period.localeCompare(a.report.period));
  }

  async find(projectId: string, period: string): Promise<StoredReport | null> {
    return this.reports.get(key(projectId, period)) ?? null;
  }

  async findLatest(projectId: string): Promise<StoredReport | null> {
    return (await this.list(projectId))[0] ?? null;
  }

  async save(report: ExecutiveStatusReport): Promise<void> {
    this.reports.set(key(report.projectId, report.period), { report, publication: null });
  }

  async publish(projectId: string, period: string, publication: ReportPublication): Promise<void> {
    const stored = this.reports.get(key(projectId, period));
    if (stored) this.reports.set(key(projectId, period), { ...stored, publication });
  }

  async deleteDraft(projectId: string, period: string): Promise<void> {
    this.reports.delete(key(projectId, period));
  }

  async delete(projectId: string): Promise<void> {
    for (const [id, stored] of this.reports) if (stored.report.projectId === projectId) this.reports.delete(id);
  }
}
