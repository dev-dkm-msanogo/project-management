import type { TaskDto } from '@shared/index';
import { ProgressBar } from '@/components/performance/Indicators';
import { TaskStatusBadge } from '@/components/plan/TaskStatusBadge';
import { formatShortDate } from '@/lib/format';

interface TaskProgressTableProps {
  tasks: readonly TaskDto[];
  /** Tâches élémentaires que l'utilisateur peut mettre à jour (éditeur, ou tâche qui lui est affectée). */
  canUpdate: (task: TaskDto) => boolean;
  onUpdate: (task: TaskDto) => void;
}

const range = (start: string | null, end: string | null) =>
  start || end ? `${formatShortDate(start)} → ${formatShortDate(end)}` : '—';

/**
 * Avancement de la WBS : les éléments parents (avancement agrégé) encadrent leurs tâches
 * élémentaires, seules à recevoir une mesure — prévu, réel, dernière situation et auteur.
 */
export function TaskProgressTable({ tasks, canUpdate, onUpdate }: TaskProgressTableProps) {
  return (
    <div className="wbs-scroll">
      <table className="register-table register-table--progress">
        <thead>
          <tr>
            <th>WBS</th>
            <th>Tâche</th>
            <th>Affectée à</th>
            <th>Prévu · réel</th>
            <th>Statut</th>
            <th>Réalisé</th>
            <th>Dernière situation</th>
            <th className="register-table__edit">
              <span className="visually-hidden">Mettre à jour</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.wbs} className={task.isLeaf ? undefined : 'progress-row--parent'}>
              <td className="register-table__code">{task.wbs}</td>
              <td className="register-table__title" style={{ paddingLeft: `${(task.level - 1) * 16 + 10}px` }}>
                {task.name}
                {task.progress?.note && <span className="register-table__description">{task.progress.note}</span>}
              </td>
              <td>{task.isLeaf ? (task.assignee ?? <span className="register-table__muted">Non affectée</span>) : ''}</td>
              <td className={`register-table__muted-cell${task.overdue ? ' register-table__overdue' : ''}`}>
                {range(task.start, task.end)}
                {task.overdue && <span className="register-table__overdue-flag">En retard</span>}
                {task.actualStart && (
                  <span className="register-table__description">Réel : {range(task.actualStart, task.actualFinish)}</span>
                )}
              </td>
              <td>
                <TaskStatusBadge status={task.status} />
              </td>
              <td>
                <ProgressBar value={task.percentComplete} late={task.overdue} />
              </td>
              <td className="register-table__muted-cell">
                {task.progress ? (
                  <>
                    {formatShortDate(task.progress.asOf)}
                    <span className="register-table__description">{task.progress.updatedBy}</span>
                  </>
                ) : (
                  '—'
                )}
              </td>
              <td className="register-table__edit">
                {task.isLeaf && canUpdate(task) && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    aria-label={`Mettre à jour l'avancement de ${task.wbs} ${task.name}`}
                    onClick={() => onUpdate(task)}
                  >
                    Mettre à jour
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
