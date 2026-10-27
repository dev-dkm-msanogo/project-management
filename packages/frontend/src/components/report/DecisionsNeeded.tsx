import type { DecisionDto } from '@shared/contracts/executive-status-report';
import { SectionCard } from '@/components/ui/SectionCard';
import { formatMonthDay } from '@/lib/format';

/** Section 8 — Décisions attendues de la direction. */
export function DecisionsNeeded({ decisions }: { decisions: DecisionDto[] }) {
  return (
    <SectionCard
      number={8}
      title="Décisions attendues"
      className="col-5"
      source="Demandes de modification à décider, problèmes escaladés, puis décisions saisies"
    >
      {decisions.length === 0 && <p className="plan__empty">Aucune décision attendue.</p>}
      <ul className="decisions">
        {decisions.map((decision, index) => (
          <li key={index}>
            {decision.code && <span className="decisions__code">{decision.code}</span>}
            {decision.description}
            {decision.impact && (
              <span className="decisions__impact"> (impact : {decision.impact})</span>
            )}
            {decision.neededBy && (
              <span className="decisions__by"> — à décider avant le {formatMonthDay(decision.neededBy)}</span>
            )}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
