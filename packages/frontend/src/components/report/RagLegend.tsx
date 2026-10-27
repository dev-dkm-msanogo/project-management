import type { RagLevel } from '@shared/contracts/executive-status-report';
import { RagDot } from '@/components/ui/RagDot';
import { RAG_LEGEND_LABELS } from '@/lib/format';

const ITEMS: RagLevel[] = ['GREEN', 'AMBER', 'RED', 'NOT_APPLICABLE'];

/** Légende RAG affichée en pied de rapport. */
export function RagLegend() {
  return (
    <div className="legend col-12">
      <span className="legend__title">Légende RAG :</span>
      {ITEMS.map((rag) => (
        <span className="legend__item" key={rag}>
          <RagDot rag={rag} /> {RAG_LEGEND_LABELS[rag]}
        </span>
      ))}
    </div>
  );
}
