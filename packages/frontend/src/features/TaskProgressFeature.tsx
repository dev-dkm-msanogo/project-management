import { useEffect, useMemo, useState } from 'react';
import type { TaskDto } from '@shared/index';
import { useAuth } from '@/auth/AuthContext';
import { SelectInput } from '@/components/form/controls';
import { ProgressDialog } from '@/components/performance/ProgressDialog';
import { TaskProgressTable } from '@/components/performance/TaskProgressTable';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { useResourceDirectory } from '@/hooks/useAdministration';
import { useProjectPlan } from '@/hooks/useProjectPlan';
import { progressFormOf } from '@/lib/performance-format';
import type { AppView } from '@/navigation/pmp';

type Filter = 'all' | 'mine' | 'late' | 'open';

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Toute la WBS' },
  { value: 'open', label: 'Tâches non terminées' },
  { value: 'late', label: 'Tâches en retard' },
  { value: 'mine', label: 'Mes tâches' },
];

/**
 * Page « Avancement des tâches » : chaque tâche élémentaire reçoit sa mesure (statut, % réalisé,
 * dates réelles) de la personne affectée ou d'un éditeur ; les éléments parents s'agrègent.
 */
export function TaskProgressFeature({ projectId, onNavigate }: { projectId: string; onNavigate: (view: AppView) => void }) {
  const { data: plan, loading, error, reload } = useProjectPlan(projectId);
  const { data: directory } = useResourceDirectory();
  const { user, canEdit } = useAuth();
  const [filter, setFilter] = useState<Filter>('all');
  const [updating, setUpdating] = useState<TaskDto | null>(null);

  useEffect(() => setUpdating(null), [projectId]);

  const mine = useMemo(
    () => new Set((directory?.resources ?? []).filter((resource) => resource.userId === user?.id).map((resource) => resource.id)),
    [directory, user],
  );
  const isMine = (task: TaskDto) => task.assigneeId !== null && mine.has(task.assigneeId);
  const leaves = plan?.tasks.filter((task) => task.isLeaf) ?? [];
  const shown = (plan?.tasks ?? []).filter((task) => {
    if (filter === 'all') return true;
    if (!task.isLeaf) return false;
    if (filter === 'mine') return isMine(task);
    if (filter === 'late') return task.overdue;
    return task.status !== 'COMPLETE';
  });
  const overall = leaves.length === 0 ? 0 : Math.round(
    leaves.reduce((sum, task) => sum + (task.durationDays ?? 1) * task.percentComplete, 0) /
      leaves.reduce((sum, task) => sum + (task.durationDays ?? 1), 0),
  );

  if (error) {
    return (
      <div className="doc-page">
        <section className="doc-panel empty-state">
          <h2 className="empty-state__title">Pas encore de WBS pour ce projet</h2>
          <p className="empty-state__text">
            L'avancement se mesure sur les tâches de la WBS : établissez-la d'abord, avec les personnes affectées.
          </p>
          <button type="button" className="btn btn--primary" onClick={() => onNavigate('wbs')}>
            Ouvrir la WBS
          </button>
        </section>
      </div>
    );
  }

  return (
    <>
      {loading && <p className="app__status">Chargement de l'avancement…</p>}
      {plan && (
        <article className="doc-page">
          <SummaryTiles
            tiles={[
              { label: '% réalisé (pondéré par les durées)', value: overall },
              { label: 'Tâches terminées', value: leaves.filter((task) => task.status === 'COMPLETE').length, tone: 'success' },
              { label: 'Tâches en cours', value: leaves.filter((task) => task.status === 'IN_PROGRESS').length },
              { label: 'En attente', value: leaves.filter((task) => task.status === 'ON_HOLD').length, tone: 'warning' },
              { label: 'En retard', value: leaves.filter((task) => task.overdue).length, tone: 'danger' },
            ]}
          />
          <section className="doc-panel">
            <div className="register-toolbar">
              <label className="register-toolbar__filter">
                <span className="visually-hidden">Afficher</span>
                <SelectInput value={filter} onChange={setFilter} options={FILTER_OPTIONS} />
              </label>
              <span className="register-toolbar__count">
                {canEdit
                  ? 'Vous pouvez mettre à jour toutes les tâches élémentaires.'
                  : mine.size > 0
                    ? 'Vous pouvez mettre à jour les tâches qui vous sont affectées.'
                    : 'Lecture seule : aucune tâche ne vous est affectée.'}
              </span>
            </div>
            {shown.length === 0 ? (
              <p className="plan__empty">Aucune tâche pour ce filtre.</p>
            ) : (
              <TaskProgressTable tasks={shown} canUpdate={(task) => canEdit || isMine(task)} onUpdate={setUpdating} />
            )}
          </section>
        </article>
      )}
      {updating && (
        <ProgressDialog
          projectId={projectId}
          task={updating}
          initial={progressFormOf(updating)}
          onClose={() => setUpdating(null)}
          onSaved={() => {
            setUpdating(null);
            reload();
          }}
        />
      )}
    </>
  );
}
