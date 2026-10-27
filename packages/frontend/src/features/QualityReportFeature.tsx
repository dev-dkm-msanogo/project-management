import { qualityReportApi } from '@/api/project-documents';
import { QualityReportEditor } from '@/components/quality/QualityReportEditor';
import { QualityReportView } from '@/components/quality/QualityReportView';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useQualityMetrics, useQualityReport } from '@/hooks/useProjectDocuments';
import { blankQualityReport, qualityReportDtoToInput } from '@/lib/quality-tools-format';
import type { AppView } from '@/navigation/pmp';

interface QualityReportFeatureProps {
  projectId: string;
  onNavigate: (view: AppView) => void;
}

/** Page « Rapport qualité » : où en est chaque métrique, anomalies, recommandations, audit. */
export function QualityReportFeature({ projectId, onNavigate }: QualityReportFeatureProps) {
  const resource = useQualityReport(projectId);
  const { data: metricsDocument } = useQualityMetrics(projectId);
  const metrics = metricsDocument?.metrics ?? [];

  return (
    <DocumentFeature
      projectId={projectId}
      history={qualityReportApi}
      deletion={{
        title: 'Supprimer le rapport qualité ?',
        run: () => qualityReportApi.remove(projectId),
      }}
      resource={resource}
      toInput={qualityReportDtoToInput}
      blank={() => blankQualityReport(metrics)}
      labels={{
        edit: 'Éditer le rapport',
        create: '+ Établir le rapport qualité',
        loading: 'Chargement du rapport qualité…',
        emptyTitle: "Aucun rapport qualité n'a encore été établi",
        emptyText:
          metrics.length > 0
            ? `Il part des ${metrics.length} métriques qualité : indiquez pour chacune la mesure actuelle et son statut.`
            : "Définissez d'abord les métriques qualité : le rapport en donne le statut.",
      }}
      renderView={(report) => (
        <article className="doc-page">
          <SummaryTiles
            tiles={[
              { label: 'Conformes', value: report.summary.ON_TRACK, tone: 'success' },
              { label: 'À risque', value: report.summary.AT_RISK, tone: 'warning' },
              { label: 'Hors cible', value: report.summary.OFF_TRACK, tone: 'danger' },
              { label: 'Non démarrées', value: report.summary.NOT_STARTED },
            ]}
          />
          <QualityReportView report={report} onNavigate={onNavigate} />
        </article>
      )}
      renderEditor={(props) => <QualityReportEditor projectId={projectId} metrics={metrics} {...props} />}
    />
  );
}
