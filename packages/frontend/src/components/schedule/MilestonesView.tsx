import type { ScheduleModelDto } from '@shared/index';
import { formatDaysSigned, formatLongDate, formatShortDate } from '@/lib/format';
import {
  CHARTER_MILESTONE_STATE_LABELS,
  CHARTER_MILESTONE_STATE_MODIFIERS,
  isNonWorkingDay,
  MILESTONE_TYPE_LABELS,
  WEEKDAY_LABELS,
} from '@/lib/schedule-format';

/** Liste des jalons et calendrier du projet (jours ouvrés, jours fériés). */
export function MilestonesView({ model }: { model: ScheduleModelDto }) {
  const { calendar } = model;
  const milestones = [...model.milestones].sort((a, b) => a.targetDate.localeCompare(b.targetDate));
  const charterMilestones = model.charterMilestones;
  const alerts = charterMilestones.filter((item) => item.state === 'UNPLANNED' || item.state === 'LATE').length;

  return (
    <>
      {charterMilestones.length > 0 && (
        <section className="doc-panel">
          <h2 className="plan__section-title">Jalons de la charte ({charterMilestones.length})</h2>
          <p className="doc-text">
            Dates approuvées à la charte, face aux jalons du calendrier qui les réalisent. Un jalon du calendrier désigne
            celui qu'il réalise dans l'édition des jalons.
          </p>
          {alerts > 0 && (
            <p className="entry-form__warning" role="note">
              {alerts} jalon(s) de la charte en retard ou non planifié(s) dans le calendrier.
            </p>
          )}
          <div className="wbs-scroll">
            <table className="register-table register-table--charter-milestones">
              <thead>
                <tr>
                  <th>Jalon de la charte</th>
                  <th>Date de la charte</th>
                  <th>Réalisé par</th>
                  <th>Date prévue</th>
                  <th>Écart</th>
                  <th>Situation</th>
                </tr>
              </thead>
              <tbody>
                {charterMilestones.map((item) => (
                  <tr key={item.code}>
                    <td className="register-table__title">
                      <span className="register-table__code">{item.code}</span> {item.name}
                    </td>
                    <td>{formatShortDate(item.approvedDate)}</td>
                    <td>
                      {item.milestoneCode ? (
                        <span className="register-table__code">{item.milestoneCode}</span>
                      ) : (
                        <span className="register-table__muted-cell">—</span>
                      )}
                    </td>
                    <td>
                      {item.achievedOn ? `Atteint le ${formatShortDate(item.achievedOn)}` : item.plannedDate ? formatShortDate(item.plannedDate) : '—'}
                    </td>
                    <td>{item.varianceDays === null ? '—' : formatDaysSigned(item.varianceDays)}</td>
                    <td>
                      <span className={`status-badge status-badge--${CHARTER_MILESTONE_STATE_MODIFIERS[item.state]}`}>
                        {CHARTER_MILESTONE_STATE_LABELS[item.state]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="doc-panel">
        <h2 className="plan__section-title">Jalons ({milestones.length})</h2>
        {milestones.length === 0 ? (
          <p className="plan__empty">Aucun jalon défini.</p>
        ) : (
          <ol className="milestone-track">
            {milestones.map((milestone) => (
              <li key={milestone.code} className={`milestone-track__item milestone-track__item--${milestone.type.toLowerCase()}`}>
                <span className="milestone-track__date">{formatShortDate(milestone.targetDate)}</span>
                <div className="milestone-track__body">
                  <span className="milestone-track__head">
                    <span className="register-table__code">{milestone.code}</span>
                    <strong>{milestone.name}</strong>
                    <span className="skill-chip">{MILESTONE_TYPE_LABELS[milestone.type]}</span>
                    {milestone.charterCode && <span className="skill-chip">Charte {milestone.charterCode}</span>}
                    {milestone.achievedOn && (
                      <span className="status-badge status-badge--green">Atteint le {formatShortDate(milestone.achievedOn)}</span>
                    )}
                    {isNonWorkingDay(milestone.targetDate, calendar) && (
                      <span className="status-badge status-badge--amber">Jour non ouvré</span>
                    )}
                  </span>
                  {milestone.description && <span className="milestone-track__text">{milestone.description}</span>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="doc-columns">
        <section className="doc-panel">
          <h2 className="plan__section-title">Semaine de travail</h2>
          <ul className="weekday-strip" aria-label="Jours ouvrés">
            {WEEKDAY_LABELS.map((label, index) => {
              const working = calendar.workingWeekdays.includes(index + 1);
              return (
                <li key={label} className={`weekday-strip__day${working ? ' weekday-strip__day--working' : ''}`}>
                  <span aria-hidden="true">{label.slice(0, 3)}</span>
                  <span className="visually-hidden">
                    {label} : {working ? 'ouvré' : 'non ouvré'}
                  </span>
                </li>
              );
            })}
          </ul>
          {calendar.notes ? <p className="doc-text">{calendar.notes}</p> : null}
        </section>

        <section className="doc-panel">
          <h2 className="plan__section-title">Jours fériés ({calendar.holidays.length})</h2>
          {calendar.holidays.length === 0 ? (
            <p className="plan__empty">Aucun jour férié.</p>
          ) : (
            <ul className="doc-refs">
              {calendar.holidays.map((holiday) => (
                <li key={holiday.date}>
                  <strong>{formatLongDate(holiday.date)}</strong>
                  {holiday.name}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
