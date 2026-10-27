import { Fragment } from 'react';
import type { StakeholderDto, StakeholderQuadrant } from '@shared/index';
import {
  HIGH_INTEREST,
  HIGH_POWER,
  INFLUENCE_SCALE,
  QUADRANT_HINTS,
  QUADRANT_LABELS,
  QUADRANT_MODIFIERS,
  quadrantOf,
} from '@/lib/stakeholder-format';

const DESCENDING = [5, 4, 3, 2, 1];
const ASCENDING = [1, 2, 3, 4, 5];
const QUADRANTS: readonly StakeholderQuadrant[] = ['MANAGE_CLOSELY', 'KEEP_SATISFIED', 'KEEP_INFORMED', 'MONITOR'];

/** Grille pouvoir / intérêt : la position de chaque partie prenante fixe sa stratégie d'engagement. */
export function PowerInterestGrid({ stakeholders }: { stakeholders: StakeholderDto[] }) {
  return (
    <div className="heat-matrix">
      <div className="heat-matrix__grid" role="table" aria-label="Grille pouvoir × intérêt">
        {DESCENDING.map((power) => (
          <Fragment key={power}>
            <div className="heat-matrix__axis heat-matrix__axis--y" role="rowheader">
              <strong>{power}</strong>{' '}
              <span className="heat-matrix__axis-label">{INFLUENCE_SCALE[power - 1]}</span>
            </div>
            {ASCENDING.map((interest) => {
              const quadrant = quadrantOf(power, interest);
              const cell = stakeholders.filter((s) => s.power === power && s.interest === interest);
              return (
                <div
                  key={interest}
                  role="cell"
                  className={`heat-matrix__cell quadrant--${QUADRANT_MODIFIERS[quadrant]}`}
                  title={`Pouvoir ${power} × intérêt ${interest} : ${QUADRANT_LABELS[quadrant]}`}
                >
                  <span className="heat-matrix__codes">
                    {cell.map((stakeholder) => (
                      <span key={stakeholder.code} className="matrix-chip" title={`${stakeholder.code} · ${stakeholder.name}`}>
                        {stakeholder.code}
                      </span>
                    ))}
                  </span>
                </div>
              );
            })}
          </Fragment>
        ))}
        <div className="heat-matrix__corner" aria-hidden="true" />
        {ASCENDING.map((interest) => (
          <div key={interest} className="heat-matrix__axis heat-matrix__axis--x" role="columnheader">
            <strong>{interest}</strong>{' '}
            <span className="heat-matrix__axis-label">{INFLUENCE_SCALE[interest - 1]}</span>
          </div>
        ))}
      </div>

      <p className="heat-matrix__caption">
        {`Lignes : pouvoir · colonnes : intérêt. Pouvoir élevé à partir de ${HIGH_POWER}, intérêt élevé à partir de ${HIGH_INTEREST} ; le quadrant détermine la stratégie d'engagement.`}
      </p>
      <ul className="heat-matrix__legend">
        {QUADRANTS.map((quadrant) => (
          <li key={quadrant}>
            <span className={`heat-matrix__swatch quadrant--${QUADRANT_MODIFIERS[quadrant]}`} />
            <strong>{QUADRANT_LABELS[quadrant]}</strong> — {QUADRANT_HINTS[quadrant].toLowerCase()}
          </li>
        ))}
      </ul>
    </div>
  );
}
