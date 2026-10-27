import type { QualityMetrics } from '@domain/entities/quality-metrics';
import type { QualityReport } from '@domain/entities/quality-report';
import { DomainError } from '@domain/errors/domain-errors';
import { toQualityReportDto } from '@application/mappers/quality-tools.mappers';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import type { QualityReportDto } from '@shared/index';

/**
 * Rapport qualité : chaque statut porte sur une métrique qualité du projet ; intitulés et cibles
 * des métriques sont relus à chaque lecture.
 */
export function qualityReportServices(metrics: ProjectDocumentRepository<QualityMetrics>) {
  return {
    toDto: async (report: QualityReport): Promise<QualityReportDto> =>
      toQualityReportDto(report, await metrics.findByProjectId(report.projectId)),

    beforeSave: async (report: QualityReport): Promise<void> => {
      const defined = await metrics.findByProjectId(report.projectId);
      const unknown = defined ? report.unknownMetrics(defined) : report.props.statuses.map((entry) => entry.metricCode);
      if (unknown.length > 0) {
        throw new DomainError(`Métrique(s) absente(s) des métriques qualité : ${unknown.join(', ')}.`);
      }
    },
  };
}
