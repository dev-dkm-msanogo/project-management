import { qualityMetricsApi } from '@/api/project-documents';
import { QualityMetricsEditor } from '@/components/quality/QualityMetricsEditor';
import { QualityMetricsView } from '@/components/quality/QualityMetricsView';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useQualityMetrics } from '@/hooks/useProjectDocuments';
import { blankQualityMetrics, qualityMetricsDtoToInput } from '@/lib/quality-tools-format';

/** Page « Métriques qualité » : ce qui est mesuré, comment, et la cible visée. */
export function QualityMetricsFeature({ projectId }: { projectId: string }) {
  const resource = useQualityMetrics(projectId);
  return (
    <DocumentFeature
      projectId={projectId}
      history={qualityMetricsApi}
      deletion={{
        title: 'Supprimer les métriques qualité ?',
        run: () => qualityMetricsApi.remove(projectId),
      }}
      resource={resource}
      toInput={qualityMetricsDtoToInput}
      blank={blankQualityMetrics}
      labels={{
        edit: 'Éditer les métriques',
        create: '+ Définir les métriques',
        loading: 'Chargement des métriques qualité…',
        emptyTitle: "Les métriques qualité n'ont pas encore été définies",
        emptyText: 'Pour chaque élément à surveiller : la métrique, sa méthode de mesure et la cible visée.',
      }}
      renderView={(metrics) => (
        <article className="doc-page">
          <SummaryTiles
            tiles={[
              { label: 'Métriques', value: metrics.metrics.length },
              { label: 'Sans cible', value: metrics.metrics.filter((metric) => !metric.target).length, tone: 'warning' },
            ]}
          />
          <QualityMetricsView metrics={metrics} />
        </article>
      )}
      renderEditor={(props) => <QualityMetricsEditor projectId={projectId} {...props} />}
    />
  );
}
