import type { CSSProperties } from 'react';
import type { TaskDto } from '@shared/index';
import { ProgressBar } from '@/components/performance/Indicators';
import { TaskStatusBadge } from '@/components/plan/TaskStatusBadge';
import { formatMonthDay } from '@/lib/format';
import { phasePalette } from '@/lib/plan-format';

/** Tableau de la structure de découpage du projet (WBS), hiérarchique, avec l'avancement de chaque élément. */
export function WbsTable({ tasks }: { tasks: TaskDto[] }) {
  return (
    <div className="wbs-scroll">
      <table className="wbs">
        <thead>
          <tr>
            <th>WBS</th>
            <th>Nom de la tâche</th>
            <th>Statut</th>
            <th>Réalisé</th>
            <th>Affectée à</th>
            <th>Début</th>
            <th>Fin</th>
            <th>Durée</th>
            <th>Commentaires</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const isPhase = task.level === 1;
            const palette = phasePalette(task.wbs);
            const rowStyle: CSSProperties = isPhase ? { background: palette.tint } : {};
            const codeStyle: CSSProperties = isPhase
              ? { borderLeft: `4px solid ${palette.solid}` }
              : {};
            const nameStyle: CSSProperties = { paddingLeft: `${(task.level - 1) * 18 + 10}px` };
            return (
              <tr
                key={task.wbs}
                className={`wbs__row${isPhase ? ' wbs__row--phase' : ''}`}
                style={rowStyle}
              >
                <td className="wbs__code" style={codeStyle}>
                  {task.wbs}
                </td>
                <td className="wbs__name" style={nameStyle}>
                  {task.name}
                </td>
                <td>
                  <TaskStatusBadge status={task.status} />
                </td>
                <td>
                  <ProgressBar value={task.percentComplete} late={task.overdue} />
                </td>
                <td className="wbs__assignee">{task.assignee ?? ''}</td>
                <td className="wbs__date">{task.start ? formatMonthDay(task.start) : ''}</td>
                <td className="wbs__date">{task.end ? formatMonthDay(task.end) : ''}</td>
                <td className="wbs__duration">{task.durationDays ?? ''}</td>
                <td className="wbs__comments">{task.comments ?? ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
