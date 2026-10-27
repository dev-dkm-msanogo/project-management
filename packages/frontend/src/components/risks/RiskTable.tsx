import type { RiskEntryDto, RiskImpactsInput } from '@shared/index';
import { PersonName } from '@/components/people/People';
import { EditCell, EditHeader } from '@/components/ui/EditEntry';
import { TrendIcon } from '@/components/ui/TrendIcon';
import { formatShortDate } from '@/lib/format';
import { IMPACT_OBJECTIVE_LABELS } from '@/lib/quality-risk-format';
import {
  isOverdue,
  RISK_CATEGORY_LABELS,
  RISK_LEVEL_LABELS,
  RISK_STATUS_LABELS,
  RISK_STATUS_MODIFIERS,
  RISK_STRATEGY_LABELS,
  RISK_TYPE_LABELS,
} from '@/lib/risk-format';

const OBJECTIVES = Object.keys(IMPACT_OBJECTIVE_LABELS) as (keyof RiskImpactsInput)[];

/** Risques ouverts d'abord (du plus critique au moins critique), puis les risques clos. */
function byPriority(a: RiskEntryDto, b: RiskEntryDto): number {
  const closed = Number(a.status === 'CLOSED') - Number(b.status === 'CLOSED');
  return closed !== 0 ? closed : b.score - a.score || a.code.localeCompare(b.code);
}

const sorted = (risks: RiskEntryDto[]) => [...risks].sort(byPriority);

function Score({ score, level }: { score: number; level: RiskEntryDto['level'] }) {
  return (
    <>
      <span className={`risk-score risk-level--${level.toLowerCase()}`}>{score}</span>
      <span className="register-table__muted">{RISK_LEVEL_LABELS[level]}</span>
    </>
  );
}

const Empty = () => <p className="plan__empty">Aucun risque identifié pour ce projet.</p>;

/** Identification et analyse : énoncé, responsable, probabilité, impact par objectif, score, stratégie. */
export function RiskAnalysisTable({ risks, onEdit }: { risks: RiskEntryDto[]; onEdit?: (code: string) => void }) {
  if (risks.length === 0) return <Empty />;
  return (
    <div className="wbs-scroll">
      <table className="register-table register-table--risks">
        <thead>
          <tr>
            <th rowSpan={2}>Code</th>
            <th rowSpan={2}>Risque</th>
            <th rowSpan={2}>Type · catégorie</th>
            <th rowSpan={2}>Responsable</th>
            <th rowSpan={2} className="num">
              P
            </th>
            <th colSpan={4} className="risk-impacts__head">
              Impact
            </th>
            <th rowSpan={2}>Criticité</th>
            <th rowSpan={2}>Stratégie</th>
            {onEdit && <EditHeader rowSpan={2} />}
          </tr>
          <tr>
            {OBJECTIVES.map((objective) => (
              <th key={objective} className="num risk-impacts__objective" title={IMPACT_OBJECTIVE_LABELS[objective]}>
                {IMPACT_OBJECTIVE_LABELS[objective].slice(0, 3)}.
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted(risks).map((risk) => (
            <tr key={risk.code} className={risk.status === 'CLOSED' ? 'risk-row--closed' : undefined}>
              <td className="register-table__code">{risk.code}</td>
              <td className="register-table__title">
                <span>{risk.title}</span>
                {risk.description && <span className="register-table__description">{risk.description}</span>}
              </td>
              <td>
                <span className={`risk-type risk-type--${risk.type === 'OPPORTUNITY' ? 'opportunity' : 'threat'}`}>
                  {RISK_TYPE_LABELS[risk.type]}
                </span>
                <span className="register-table__muted">{RISK_CATEGORY_LABELS[risk.category]}</span>
              </td>
              <td>
                <PersonName id={risk.ownerId} />
              </td>
              <td className="num register-table__scale">{risk.probability}</td>
              {OBJECTIVES.map((objective) => (
                <td
                  key={objective}
                  className={`num register-table__scale${risk.impacts[objective] === risk.impact ? ' risk-impacts__max' : ''}`}
                  title={`Impact sur le ${IMPACT_OBJECTIVE_LABELS[objective].toLowerCase()}`}
                >
                  {risk.impacts[objective]}
                </td>
              ))}
              <td>
                <Score score={risk.score} level={risk.level} />
              </td>
              <td>
                {risk.strategy ? (
                  <strong>{RISK_STRATEGY_LABELS[risk.strategy]}</strong>
                ) : (
                  <em className="register-table__muted">À définir</em>
                )}
              </td>
              {onEdit && <EditCell label={risk.code} onEdit={() => onEdit(risk.code)} />}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="heat-matrix__caption">
        Score = probabilité × impact le plus fort des quatre objectifs (en gras).
      </p>
    </div>
  );
}

/** Plan de réponse et suivi : actions, déclencheur, risque résiduel, statut, échéances, commentaires. */
export function RiskResponseTable({ risks, onEdit }: { risks: RiskEntryDto[]; onEdit?: (code: string) => void }) {
  if (risks.length === 0) return <Empty />;
  return (
    <div className="wbs-scroll">
      <table className="register-table register-table--risk-responses">
        <thead>
          <tr>
            <th>Code</th>
            <th>Plan de réponse</th>
            <th>Déclencheur</th>
            <th>Résiduel</th>
            <th>Statut</th>
            <th>Échéance</th>
            <th>Commentaires</th>
            {onEdit && <EditHeader />}
          </tr>
        </thead>
        <tbody>
          {sorted(risks).map((risk) => {
            const overdue = isOverdue(risk);
            return (
              <tr key={risk.code} className={risk.status === 'CLOSED' ? 'risk-row--closed' : undefined}>
                <td className="register-table__code" title={risk.title}>
                  {risk.code}
                </td>
                <td className="register-table__response">
                  <span className="register-table__title-inline">{risk.title}</span>
                  {risk.response ? (
                    <span className="register-table__description">{risk.response}</span>
                  ) : (
                    <em className="register-table__muted">Plan à définir</em>
                  )}
                </td>
                <td className="register-table__response register-table__note">{risk.trigger ?? '—'}</td>
                <td className="risk-residual">
                  {risk.residualScore !== null && risk.residualLevel !== null ? (
                    <>
                      <span className={`risk-score risk-level--${risk.residualLevel.toLowerCase()}`}>{risk.residualScore}</span>{' '}
                      {RISK_LEVEL_LABELS[risk.residualLevel]}
                      <span className="register-table__muted">
                        {risk.residualProbability} × {risk.residualImpact} · avant {risk.score}
                      </span>
                    </>
                  ) : (
                    <em className="register-table__muted">Non évalué</em>
                  )}
                </td>
                <td className={risk.type === 'OPPORTUNITY' ? 'risk-trend--opportunity' : undefined}>
                  <span className="risk-status">
                    <span className={`status-badge status-badge--${RISK_STATUS_MODIFIERS[risk.status]}`}>
                      {RISK_STATUS_LABELS[risk.status]}
                    </span>
                    <TrendIcon trend={risk.trend} />
                  </span>
                  <span className="register-table__muted">Revu le {formatShortDate(risk.lastReviewedOn)}</span>
                </td>
                <td className={overdue ? 'register-table__overdue' : undefined}>
                  {formatShortDate(risk.dueDate)}
                  {overdue && <span className="register-table__overdue-flag">En retard</span>}
                </td>
                <td className="register-table__response register-table__note">{risk.comments ?? '—'}</td>
                {onEdit && <EditCell label={risk.code} onEdit={() => onEdit(risk.code)} />}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
