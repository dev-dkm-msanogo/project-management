import type { TeamDto } from '@shared/index';
import { PersonName } from '@/components/people/People';
import {
  TEAM_CRITERION_GROUPS,
  TEAM_CRITERION_LABELS,
  TEAM_RATING_LABELS,
  TEAM_RATING_MODIFIERS,
} from '@/lib/closing-format';
import { formatLongDate, formatShortDate } from '@/lib/format';
import type { AppView } from '@/navigation/pmp';

const DAYS = new Intl.NumberFormat('fr-FR');

/** Équipe du projet relue dans ses documents et affectations ; évaluation de sa performance. */
export function TeamView({ team, onNavigate }: { team: TeamDto; onNavigate: (view: AppView) => void }) {
  return (
    <article className="doc-page">
      <section className="doc-panel">
        <div className="doc-panel-head">
          <h2 className="plan__section-title">Équipe et affectations</h2>
          <span className="doc-sync">Issu du projet</span>
        </div>
        {team.members.length === 0 ? (
          <p className="plan__empty">
            Personne n'est encore désigné : nommez le chef de projet dans la charte, les rôles dans le plan des ressources
            et affectez les tâches de la WBS.
          </p>
        ) : (
          <div className="wbs-scroll">
            <table className="register-table register-table--team">
              <thead>
                <tr>
                  <th>Personne</th>
                  <th>Rôles dans le projet</th>
                  <th>Tâches affectées</th>
                  <th>Période</th>
                  <th>Charge</th>
                </tr>
              </thead>
              <tbody>
                {team.members.map((member) => (
                  <tr key={member.resourceId}>
                    <td className="register-table__title">
                      <PersonName id={member.resourceId} />
                    </td>
                    <td>{member.roles.length > 0 ? member.roles.join(' · ') : <span className="register-table__muted-cell">—</span>}</td>
                    <td className="register-table__response">
                      {member.assignments.length === 0 ? (
                        <span className="register-table__muted-cell">—</span>
                      ) : (
                        <ul className="team-tasks">
                          {member.assignments.map((task) => (
                            <li key={task.wbs} className={task.overdue ? 'team-tasks__late' : undefined}>
                              <span className="register-table__code">{task.wbs}</span> {task.name}
                              <span className="register-table__muted">
                                {task.percentComplete} %{task.overdue ? ' · en retard' : ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td>
                      {member.start ? `${formatShortDate(member.start)} → ${formatShortDate(member.end)}` : '—'}
                    </td>
                    <td>
                      {member.assignments.length > 0 ? `${DAYS.format(member.workloadDays)} j` : '—'}
                      {member.openTasks > 0 && (
                        <span className="register-table__muted">
                          {member.openTasks} en cours{member.overdueTasks > 0 ? `, ${member.overdueTasks} en retard` : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="doc-links">
          <button type="button" className="ref-link" onClick={() => onNavigate('resource-plan')}>
            Plan de gestion des ressources →
          </button>
          <button type="button" className="ref-link" onClick={() => onNavigate('task-progress')}>
            Avancement des tâches →
          </button>
        </div>
      </section>

      <section className="doc-panel">
        <div className="doc-panel-head">
          <h2 className="plan__section-title">Évaluation de la performance de l'équipe</h2>
          {team.assessedOn && <span className="doc-meta">Évaluée le {formatLongDate(team.assessedOn)}</span>}
        </div>
        {!team.assessedOn ? (
          <p className="plan__empty">L'équipe n'a pas encore été évaluée.</p>
        ) : (
          <>
            {TEAM_CRITERION_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="doc-subtitle">{group.title}</h3>
                <dl className="team-ratings">
                  {group.criteria.map((criterion) => {
                    const { rating, comments } = team.criteria[criterion];
                    return (
                      <div key={criterion}>
                        <dt>{TEAM_CRITERION_LABELS[criterion]}</dt>
                        <dd>
                          {rating ? (
                            <span className={`status-badge status-badge--${TEAM_RATING_MODIFIERS[rating]}`}>
                              {TEAM_RATING_LABELS[rating]}
                            </span>
                          ) : (
                            <span className="status-badge status-badge--grey">Non évalué</span>
                          )}
                          {comments && <p className="doc-text">{comments}</p>}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            ))}
            <h3 className="doc-subtitle">Axes de progression</h3>
            {team.developmentAreas.length === 0 ? (
              <p className="plan__empty">Aucun axe de progression.</p>
            ) : (
              <div className="wbs-scroll">
                <table className="register-table">
                  <thead>
                    <tr>
                      <th>Axe</th>
                      <th>Constat et approche</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.developmentAreas.map((area, index) => (
                      <tr key={index}>
                        <td className="register-table__title">{area.area}</td>
                        <td className="register-table__response">{area.approach || '—'}</td>
                        <td className="register-table__response">
                          {area.actions.length === 0 ? (
                            '—'
                          ) : (
                            <ol className="doc-list">
                              {area.actions.map((action, actionIndex) => (
                                <li key={actionIndex}>{action}</li>
                              ))}
                            </ol>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </article>
  );
}
