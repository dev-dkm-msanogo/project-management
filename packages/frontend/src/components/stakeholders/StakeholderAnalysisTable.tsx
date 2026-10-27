import type { StakeholderDto } from '@shared/index';
import { ENGAGEMENT_LABELS } from '@/lib/stakeholder-format';
import { analysisLevel, INFLUENCE_LEVELS, INTEREST_LEVELS, type AnalysisLevel } from '@/lib/stakeholder-tools-format';

function LevelCell({ level, levels }: { level: AnalysisLevel; levels: Record<AnalysisLevel, { label: string; hint: string }> }) {
  return (
    <td>
      <span className={`analysis-level analysis-level--${level.toLowerCase()}`}>{levels[level].label}</span>
      <span className="analysis-hint">{levels[level].hint}</span>
    </td>
  );
}

/** Analyse des parties prenantes : intérêt, influence et attitude de chacune, lus dans le registre. */
export function StakeholderAnalysisTable({ stakeholders }: { stakeholders: readonly StakeholderDto[] }) {
  return (
    <div className="wbs-scroll">
      <table className="register-table register-table--analysis">
        <thead>
          <tr>
            <th>Partie prenante</th>
            <th>Intérêt</th>
            <th>Influence</th>
            <th>Attitude</th>
          </tr>
        </thead>
        <tbody>
          {stakeholders.map((stakeholder) => (
            <tr key={stakeholder.code}>
              <td className="register-table__response">
                <span className="register-table__code">{stakeholder.code}</span>{' '}
                <strong className="analysis-name">{stakeholder.name}</strong>
                <span className="analysis-hint">
                  {[stakeholder.role, stakeholder.organization].filter(Boolean).join(' · ')}
                </span>
              </td>
              <LevelCell level={analysisLevel(stakeholder.interest)} levels={INTEREST_LEVELS} />
              <LevelCell level={analysisLevel(stakeholder.power)} levels={INFLUENCE_LEVELS} />
              <td>
                <span className={`attitude-badge attitude-badge--${stakeholder.currentEngagement.toLowerCase()}`}>
                  {ENGAGEMENT_LABELS[stakeholder.currentEngagement]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
