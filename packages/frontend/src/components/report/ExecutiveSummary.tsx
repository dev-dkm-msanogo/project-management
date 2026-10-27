import type { ExecutiveSummaryDto } from '@shared/contracts/executive-status-report';
import { SectionCard } from '@/components/ui/SectionCard';

/** Section 2 — Résumé exécutif. */
export function ExecutiveSummary({ summary }: { summary: ExecutiveSummaryDto }) {
  return (
    <SectionCard number={2} title="Résumé exécutif" className="col-8">
      <p className="summary">{summary.narrative}</p>
    </SectionCard>
  );
}
