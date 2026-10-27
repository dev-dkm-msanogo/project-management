import { useState } from 'react';
import type { MyTaskDto } from '@shared/index';
import { ProgressBar } from '@/components/performance/Indicators';
import { ProgressDialog } from '@/components/performance/ProgressDialog';
import { TaskStatusBadge } from '@/components/plan/TaskStatusBadge';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { useMyTasks } from '@/hooks/usePerformance';
import { formatShortDate } from '@/lib/format';
import { progressFormOf } from '@/lib/performance-format';

/** À traiter d'abord : en retard, puis en attente, en cours, non commencées ; terminées à la fin. */
const ORDER: Record<MyTaskDto['status'], number> = { ON_HOLD: 1, IN_PROGRESS: 2, NOT_STARTED: 3, COMPLETE: 4 };
const byUrgency = (a: MyTaskDto, b: MyTaskDto) =>
  Number(b.overdue) - Number(a.overdue) || ORDER[a.status] - ORDER[b.status] || (a.end ?? '').localeCompare(b.end ?? '');

/**
 * « Mes tâches » : les tâches affectées à la ressource du référentiel rattachée au compte, tous
 * projets confondus ; chacun y met à jour son avancement sans passer par la WBS.
 */
export function MyTasksFeature({ onOpenProject }: { onOpenProject: (projectId: string) => void }) {
  const { data, loading, error, reload } = useMyTasks();
  const [updating, setUpdating] = useState<MyTaskDto | null>(null);
  const tasks = [...(data?.tasks ?? [])].sort(byUrgency);
  const projects = [...new Map(tasks.map((task) => [task.projectId, task.projectName])).entries()];
  const open = tasks.filter((task) => task.status !== 'COMPLETE');

  return (
    <>
      {loading && <p className="app__status">Chargement de vos tâches…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && data.resourceName === null && (
        <div className="doc-page">
          <section className="doc-panel empty-state">
            <h2 className="empty-state__title">Votre compte n'est rattaché à aucune ressource</h2>
            <p className="empty-state__text">
              Les tâches sont affectées aux personnes du référentiel des ressources. Demandez à un administrateur de
              rattacher votre compte à votre fiche : vos tâches apparaîtront ici.
            </p>
          </section>
        </div>
      )}
      {data && data.resourceName !== null && (
        <article className="doc-page">
          <SummaryTiles
            tiles={[
              { label: 'Tâches à réaliser', value: open.length },
              { label: 'En retard', value: open.filter((task) => task.overdue).length, tone: 'danger' },
              { label: 'En attente', value: open.filter((task) => task.status === 'ON_HOLD').length, tone: 'warning' },
              { label: 'Terminées', value: tasks.length - open.length, tone: 'success' },
            ]}
          />
          {tasks.length === 0 && (
            <section className="doc-panel">
              <p className="plan__empty">Aucune tâche ne vous est affectée pour le moment.</p>
            </section>
          )}
          {projects.map(([projectId, projectName]) => (
            <section key={projectId} className="doc-panel">
              <div className="doc-heading">
                <h2 className="doc-title">{projectName}</h2>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => onOpenProject(projectId)}>
                  Ouvrir l'avancement du projet
                </button>
              </div>
              <div className="wbs-scroll">
                <table className="register-table register-table--my-tasks">
                  <thead>
                    <tr>
                      <th>WBS</th>
                      <th>Tâche</th>
                      <th>Échéance</th>
                      <th>Statut</th>
                      <th>Réalisé</th>
                      <th className="register-table__edit">
                        <span className="visually-hidden">Mettre à jour</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks
                      .filter((task) => task.projectId === projectId)
                      .map((task) => (
                        <tr key={task.wbs} className={task.status === 'COMPLETE' ? 'register-row--muted' : undefined}>
                          <td className="register-table__code">{task.wbs}</td>
                          <td className="register-table__title">
                            {task.name}
                            {task.progress?.note && <span className="register-table__description">{task.progress.note}</span>}
                          </td>
                          <td className={task.overdue ? 'register-table__overdue' : 'register-table__muted-cell'}>
                            {formatShortDate(task.end)}
                            {task.overdue && <span className="register-table__overdue-flag">En retard</span>}
                          </td>
                          <td>
                            <TaskStatusBadge status={task.status} />
                          </td>
                          <td>
                            <ProgressBar value={task.percentComplete} late={task.overdue} />
                          </td>
                          <td className="register-table__edit">
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              aria-label={`Mettre à jour l'avancement de ${task.wbs} ${task.name}`}
                              onClick={() => setUpdating(task)}
                            >
                              Mettre à jour
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </article>
      )}
      {updating && (
        <ProgressDialog
          projectId={updating.projectId}
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
