import type { MajorRisksDto } from '@shared/index';
import { PersonName } from '@/components/people/People';
import { SectionCard } from '@/components/ui/SectionCard';
import { TrendIcon } from '@/components/ui/TrendIcon';
import { formatShortDate } from '@/lib/format';
import { isOverdue, RISK_LEVEL_LABELS, RISK_STRATEGY_LABELS } from '@/lib/risk-format';

interface TopRisksProps {
  majorRisks: MajorRisksDto;
  /** Ouvre le registre complet ; sans gestionnaire, le lien est masqué. */
  onOpenRegister?: () => void;
}

/** Section 7 — Risques majeurs, alimentée par le registre des risques (source unique). */
export function TopRisks({ majorRisks, onOpenRegister }: TopRisksProps) {
  const { items, openCount } = majorRisks;

  return (
    <SectionCard number={7} title="Risques majeurs" className="col-7">
      {items.length === 0 ? (
        <p className="risks__empty">Aucun risque ouvert de criticité élevée ou critique.</p>
      ) : (
        <table className="risks">
          <thead>
            <tr>
              <th>Risque</th>
              <th>Criticité</th>
              <th>Tendance</th>
              <th>Réponse / Responsable</th>
            </tr>
          </thead>
          <tbody>
            {items.map((risk) => {
              const isOpportunity = risk.type === 'OPPORTUNITY';
              const overdue = isOverdue(risk);
              return (
                <tr key={risk.code}>
                  <td className="risks__title">
                    <span className="risks__code">{risk.code}</span> {risk.title}
                    {isOpportunity && <span className="risk-type risk-type--opportunity">Opportunité</span>}
                  </td>
                  <td className="risks__criticality">
                    <span className={`risk-score risk-level--${risk.level.toLowerCase()}`}>{risk.score}</span>
                    <span className="risks__level">{RISK_LEVEL_LABELS[risk.level]}</span>
                  </td>
                  <td className={isOpportunity ? 'risk-trend--opportunity' : undefined}>
                    <TrendIcon trend={risk.trend} />
                  </td>
                  <td className="risks__mitigation">
                    <strong className="risks__strategy">
                      {risk.strategy ? RISK_STRATEGY_LABELS[risk.strategy] : 'Stratégie à définir'}
                    </strong>
                    {risk.response && <> — {risk.response}</>}
                    <span className="risks__owner">
                      {' / '}
                      <PersonName id={risk.ownerId} />
                    </span>
                    {risk.dueDate && (
                      <span className={`risks__due${overdue ? ' risks__due--overdue' : ''}`}>
                        Échéance {formatShortDate(risk.dueDate)}
                        {overdue && ' · en retard'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <footer className="risks__footer">
        <span>
          Majeurs : <strong>{items.length}</strong> · Ouverts : <strong>{openCount}</strong> · Source : registre
          des risques
        </span>
        {onOpenRegister && (
          <button type="button" className="btn btn--ghost risks__open" onClick={onOpenRegister}>
            Voir le registre →
          </button>
        )}
      </footer>
    </SectionCard>
  );
}
