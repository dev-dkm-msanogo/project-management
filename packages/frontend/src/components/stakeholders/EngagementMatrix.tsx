import type { StakeholderDto } from '@shared/index';
import { ENGAGEMENT_LABELS, ENGAGEMENT_LEVELS, formatGap } from '@/lib/stakeholder-format';

/**
 * Matrice d'évaluation de l'engagement (PMBOK) : niveau actuel (A) et souhaité (S)
 * de chaque partie prenante ; l'écart indique l'effort d'engagement à fournir.
 */
export function EngagementMatrix({ stakeholders }: { stakeholders: StakeholderDto[] }) {
  return (
    <div className="wbs-scroll">
      <table className="register-table engagement-matrix">
        <thead>
          <tr>
            <th>Partie prenante</th>
            {ENGAGEMENT_LEVELS.map((level) => (
              <th key={level} className="engagement-matrix__level">
                {ENGAGEMENT_LABELS[level]}
              </th>
            ))}
            <th className="engagement-matrix__level">Écart</th>
          </tr>
        </thead>
        <tbody>
          {stakeholders.map((stakeholder) => (
            <tr key={stakeholder.code}>
              <td className="register-table__title">
                <span className="register-table__code">{stakeholder.code}</span> {stakeholder.name}
              </td>
              {ENGAGEMENT_LEVELS.map((level) => {
                const current = stakeholder.currentEngagement === level;
                const desired = stakeholder.desiredEngagement === level;
                return (
                  <td key={level} className="engagement-matrix__cell">
                    {current && (
                      <span className="engagement-mark engagement-mark--current" title="Engagement actuel">
                        A
                      </span>
                    )}
                    {desired && (
                      <span className="engagement-mark engagement-mark--desired" title="Engagement souhaité">
                        S
                      </span>
                    )}
                  </td>
                );
              })}
              <td className="engagement-matrix__cell">
                <span
                  className={`engagement-gap engagement-gap--${stakeholder.engagementGap > 0 ? 'todo' : 'done'}`}
                >
                  {formatGap(stakeholder.engagementGap)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="engagement-matrix__legend">
        <span className="engagement-mark engagement-mark--current">A</span> actuel ·{' '}
        <span className="engagement-mark engagement-mark--desired">S</span> souhaité
      </p>
    </div>
  );
}
