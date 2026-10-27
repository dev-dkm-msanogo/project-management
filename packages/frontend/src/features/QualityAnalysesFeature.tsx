import { useState } from 'react';
import { qualityAnalysesApi } from '@/api/project-documents';
import { QualityAnalysesEditor } from '@/components/quality/QualityAnalysesEditor';
import { QualityAnalysesView } from '@/components/quality/QualityAnalysesView';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useQualityAnalyses } from '@/hooks/useProjectDocuments';
import { blankQualityAnalyses, qualityAnalysesDtoToInput, type AnalysisTab } from '@/lib/quality-tools-format';

const EDIT_LABELS: Record<AnalysisTab, string> = {
  affinity: 'Éditer le diagramme',
  causes: 'Éditer les analyses',
  flowcharts: 'Éditer les logigrammes',
};

/** Page « Outils d'analyse qualité » : affinités, causes et effets, logigrammes ; chaque onglet édite son outil. */
export function QualityAnalysesFeature({ projectId }: { projectId: string }) {
  const resource = useQualityAnalyses(projectId);
  const [tab, setTab] = useState<AnalysisTab>('affinity');

  return (
    <DocumentFeature
      projectId={projectId}
      history={qualityAnalysesApi}
      deletion={{
        title: "Supprimer les outils d'analyse qualité ?",
        message: 'Le diagramme des affinités, les diagrammes de causes et effets et les logigrammes seront supprimés définitivement, pour tous les utilisateurs du projet.',
        run: () => qualityAnalysesApi.remove(projectId),
      }}
      resource={resource}
      toInput={qualityAnalysesDtoToInput}
      blank={blankQualityAnalyses}
      labels={{
        edit: EDIT_LABELS[tab],
        create: "+ Commencer l'analyse",
        loading: "Chargement des outils d'analyse…",
        emptyTitle: "Aucun outil d'analyse qualité",
        emptyText:
          "Regroupez les idées par thème, recherchez les causes d'un problème et décrivez les processus pas à pas.",
      }}
      renderView={(analyses) => (
        <article className="doc-page">
          <QualityAnalysesView analyses={analyses} tab={tab} onTabChange={setTab} />
        </article>
      )}
      renderEditor={({ initialInput, onCancel, onSaved }) => (
        <QualityAnalysesEditor projectId={projectId} section={tab} initialInput={initialInput} onCancel={onCancel} onSaved={onSaved} />
      )}
    />
  );
}
