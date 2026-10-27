import type { AssumptionEntryDto } from '@shared/index';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { isValidationOverdue, needsRisk } from '@/lib/assumption-format';

/** Indicateurs clés du registre des hypothèses et contraintes. */
export function AssumptionSummary({ entries }: { entries: AssumptionEntryDto[] }) {
  const count = (predicate: (entry: AssumptionEntryDto) => boolean) => entries.filter(predicate).length;
  return (
    <SummaryTiles
      tiles={[
        { label: 'Contraintes en vigueur', value: count((e) => e.status === 'ACTIVE') },
        { label: 'Hypothèses à valider', value: count((e) => e.status === 'TO_VALIDATE'), tone: 'warning' },
        { label: 'Validations en retard', value: count((e) => isValidationOverdue(e)), tone: 'alert' },
        { label: 'Invalidées sans risque lié', value: count(needsRisk), tone: 'danger' },
      ]}
    />
  );
}
