import type { StakeholderMappingEntryDto } from '@shared/index';
import { DIRECTION_DESCRIPTIONS, DIRECTION_LABELS, DIRECTION_ORDER } from '@/lib/stakeholder-tools-format';

/** Directions d'influence : chaque groupe placé autour du chef de projet selon le sens de son influence. */
export function InfluenceDirections({ entries }: { entries: StakeholderMappingEntryDto[] }) {
  return (
    <div className="influence-compass">
      <div className="influence-compass__center" aria-hidden="true">
        Chef de projet
      </div>
      {DIRECTION_ORDER.map((direction) => {
        const members = entries.filter((entry) => entry.direction === direction);
        return (
          <section key={direction} className={`influence-card influence-card--${direction.toLowerCase()}`}>
            <h3 className="influence-card__title">
              {DIRECTION_LABELS[direction]} <span className="influence-card__count">{members.length}</span>
            </h3>
            <p className="influence-card__hint">{DIRECTION_DESCRIPTIONS[direction]}</p>
            {members.length === 0 ? (
              <p className="plan__empty">Aucune partie prenante.</p>
            ) : (
              <ul className="influence-card__list">
                {members.map((entry) => (
                  <li key={entry.stakeholderCode}>
                    <span className="matrix-chip">{entry.stakeholderCode}</span>
                    <span>
                      <strong>{entry.name}</strong>
                      {entry.role && <span className="influence-card__role">{entry.role}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
