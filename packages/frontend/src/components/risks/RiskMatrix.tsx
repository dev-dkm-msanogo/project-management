import { Fragment } from 'react';
import type { RiskEntryDto, RiskLevel } from '@shared/index';
import {
  IMPACT_SCALE,
  PROBABILITY_SCALE,
  RISK_LEVEL_LABELS,
  riskLevel,
} from '@/lib/risk-format';

const DESCENDING = [5, 4, 3, 2, 1];
const ASCENDING = [1, 2, 3, 4, 5];

const LEGEND: { level: RiskLevel; range: string }[] = [
  { level: 'LOW', range: '1–4' },
  { level: 'MEDIUM', range: '5–9' },
  { level: 'HIGH', range: '10–16' },
  { level: 'CRITICAL', range: '20–25' },
];

/** Matrice probabilité × impact (analyse, processus 18) des risques ouverts. */
export function RiskMatrix({ risks }: { risks: RiskEntryDto[] }) {
  const open = risks.filter((risk) => risk.status !== 'CLOSED');

  return (
    <div className="heat-matrix">
      <div className="heat-matrix__grid" role="table" aria-label="Matrice probabilité × impact">
        {DESCENDING.map((probability) => (
          <Fragment key={probability}>
            <div className="heat-matrix__axis heat-matrix__axis--y" role="rowheader">
              <strong>{probability}</strong>{' '}
              <span className="heat-matrix__axis-label">{PROBABILITY_SCALE[probability - 1]}</span>
            </div>
            {ASCENDING.map((impact) => {
              const score = probability * impact;
              const level = riskLevel(score);
              const cellRisks = open.filter(
                (risk) => risk.probability === probability && risk.impact === impact,
              );
              return (
                <div
                  key={impact}
                  role="cell"
                  className={`heat-matrix__cell risk-level--${level.toLowerCase()}`}
                  title={`Probabilité ${probability} × impact ${impact} = ${score} (${RISK_LEVEL_LABELS[level]})`}
                >
                  <span className="heat-matrix__score">{score}</span>
                  <span className="heat-matrix__codes">
                    {cellRisks.map((risk) => (
                      <span
                        key={risk.code}
                        className={`matrix-chip${risk.type === 'OPPORTUNITY' ? ' matrix-chip--ring' : ''}`}
                        title={`${risk.code} · ${risk.title}`}
                      >
                        {risk.code}
                      </span>
                    ))}
                  </span>
                </div>
              );
            })}
          </Fragment>
        ))}
        <div className="heat-matrix__corner" aria-hidden="true" />
        {ASCENDING.map((impact) => (
          <div key={impact} className="heat-matrix__axis heat-matrix__axis--x" role="columnheader">
            <strong>{impact}</strong>{' '}
            <span className="heat-matrix__axis-label">{IMPACT_SCALE[impact - 1]}</span>
          </div>
        ))}
      </div>

      <p className="heat-matrix__caption">
        Lignes : probabilité · colonnes : impact. Les risques clos ne figurent pas sur la matrice ;
        les opportunités sont cerclées de vert.
      </p>
      <ul className="heat-matrix__legend">
        {LEGEND.map((item) => (
          <li key={item.level}>
            <span className={`heat-matrix__swatch risk-level--${item.level.toLowerCase()}`} />
            {RISK_LEVEL_LABELS[item.level]} ({item.range})
          </li>
        ))}
      </ul>
    </div>
  );
}
