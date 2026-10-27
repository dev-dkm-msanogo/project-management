import type { ScheduleModelDto } from '@shared/index';
import { scheduleModelApi } from '@/api/project-documents';
import { ActivitiesView } from '@/components/schedule/ActivitiesView';
import { MilestonesView } from '@/components/schedule/MilestonesView';
import { NetworkView } from '@/components/schedule/NetworkView';
import { ScheduleBaselineView } from '@/components/schedule/ScheduleBaselineView';
import { ScheduleModelEditor, type ScheduleSection } from '@/components/schedule/ScheduleModelEditor';
import { SummaryTiles, type SummaryTile } from '@/components/ui/SummaryTiles';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useScheduleModel } from '@/hooks/useProjectDocuments';
import { blankScheduleModel, isNonWorkingDay, scheduleModelDtoToInput } from '@/lib/schedule-format';
import type { AppView } from '@/navigation/pmp';

export type SchedulePage = 'activities' | 'network' | 'milestones' | 'baseline';

/** Le réseau se modifie par ses activités et leurs prédécesseurs. */
const SECTION: Record<SchedulePage, ScheduleSection> = {
  activities: 'activities',
  network: 'activities',
  milestones: 'milestones',
  baseline: 'baseline',
};

const EDIT_LABELS: Record<SchedulePage, string> = {
  activities: 'Éditer les activités',
  network: 'Éditer les prédécesseurs',
  milestones: 'Éditer les jalons et le calendrier',
  baseline: 'Éditer la référence',
};

function tilesOf(page: SchedulePage, model: ScheduleModelDto): SummaryTile[] {
  const critical = model.network.criticalPath.length;
  switch (page) {
    case 'activities':
      return [
        { label: 'Activités', value: model.activities.length },
        { label: 'Activités critiques', value: critical, tone: 'danger' },
        { label: "Avec feuille d'estimation", value: model.activities.filter((activity) => activity.basis).length },
        { label: 'Jours ouvrés', value: model.network.workingDays },
      ];
    case 'network':
      return [
        { label: 'Jours ouvrés', value: model.network.workingDays },
        { label: 'Activités critiques', value: critical, tone: 'danger' },
        { label: 'Relations', value: model.activities.reduce((total, activity) => total + activity.predecessors.length, 0) },
      ];
    case 'milestones':
      return [
        { label: 'Jalons', value: model.milestones.length },
        { label: 'Revues de phase', value: model.milestones.filter((milestone) => milestone.type === 'PHASE_GATE').length },
        { label: 'Jours fériés', value: model.calendar.holidays.length },
        {
          label: 'Jalons sur un jour non ouvré',
          value: model.milestones.filter((milestone) => isNonWorkingDay(milestone.targetDate, model.calendar)).length,
          tone: 'warning',
        },
      ];
    case 'baseline':
      return [];
  }
}

interface ScheduleModelFeatureProps {
  projectId: string;
  page: SchedulePage;
  onNavigate: (view: AppView) => void;
}

/** Pages du modèle d'ordonnancement : activités et durées, réseau, jalons et calendrier, référence. */
export function ScheduleModelFeature({ projectId, page, onNavigate }: ScheduleModelFeatureProps) {
  const resource = useScheduleModel(projectId);
  return (
    <DocumentFeature
      projectId={projectId}
      history={scheduleModelApi}
      approval={{
        subject: 'PROJECT_MANAGEMENT_PLAN',
        segment: 'schedule-model',
        component: true,
        // Plan approuvé : les dates d'atteinte des jalons restent à saisir.
        trackedWhenLocked: page === 'milestones' ? 'Saisir les jalons atteints' : undefined,
      }}
      deletion={{
        title: "Supprimer le modèle d'ordonnancement ?",
        message: "Activités, réseau, jalons, calendrier et référence de l'échéancier seront supprimés définitivement, pour tous les utilisateurs du projet. La WBS et le Gantt ne changent pas.",
        run: () => scheduleModelApi.remove(projectId),
      }}
      resource={resource}
      toInput={scheduleModelDtoToInput}
      blank={blankScheduleModel}
      labels={{
        edit: EDIT_LABELS[page],
        create: "+ Établir le modèle d'ordonnancement",
        loading: "Chargement du modèle d'ordonnancement…",
        emptyTitle: "Aucun modèle d'ordonnancement",
        emptyText:
          "Définissez les activités, leurs durées et leurs prédécesseurs, puis les jalons et le calendrier : le réseau et le chemin critique sont calculés automatiquement.",
      }}
      renderView={(model, context) => {
        const tiles = tilesOf(page, model);
        return (
          <article className="doc-page">
            {tiles.length > 0 && <SummaryTiles tiles={tiles} />}
            {page === 'activities' && <ActivitiesView model={model} />}
            {page === 'network' && <NetworkView model={model} />}
            {page === 'milestones' && <MilestonesView model={model} />}
            {page === 'baseline' && (
              <ScheduleBaselineView
                model={model}
                onNavigate={onNavigate}
                approval={context.approval}
                archived={context.archived}
              />
            )}
          </article>
        );
      }}
      renderEditor={({ initialInput, onCancel, onSaved }) => (
        <ScheduleModelEditor
          projectId={projectId}
          section={SECTION[page]}
          initialInput={initialInput}
          onCancel={onCancel}
          onSaved={onSaved}
        />
      )}
    />
  );
}
