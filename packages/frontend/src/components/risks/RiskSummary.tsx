import type { RiskEntryDto } from '@shared/index';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { isOverdue } from '@/lib/risk-format';

/** Indicateurs clés du registre (risques ouverts uniquement, sauf mention). */
export function RiskSummary({ risks }: { risks: RiskEntryDto[] }) {
  const open = risks.filter((risk) => risk.status !== 'CLOSED');
  return (
    <SummaryTiles
      tiles={[
        { label: 'Risques ouverts', value: open.length },
        { label: 'Critiques', value: open.filter((r) => r.level === 'CRITICAL').length, tone: 'danger' },
        { label: 'Élevés', value: open.filter((r) => r.level === 'HIGH').length, tone: 'warning' },
        { label: 'Opportunités', value: open.filter((r) => r.type === 'OPPORTUNITY').length, tone: 'success' },
        { label: 'Réponses en retard', value: open.filter((r) => isOverdue(r)).length, tone: 'alert' },
      ]}
    />
  );
}
