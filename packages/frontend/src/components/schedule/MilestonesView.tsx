import type { ScheduleModelDto } from '@shared/index';
import { formatLongDate, formatShortDate } from '@/lib/format';
import { isNonWorkingDay, MILESTONE_TYPE_LABELS, WEEKDAY_LABELS } from '@/lib/schedule-format';

/** Liste des jalons et calendrier du projet (jours ouvrés, jours fériés). */
export function MilestonesView({ model }: { model: ScheduleModelDto }) {
  const { calendar } = model;
  const milestones = [...model.milestones].sort((a, b) => a.targetDate.localeCompare(b.targetDate));

  return (
    <>
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
