import type { OverallStatusDto } from '@shared/contracts/executive-status-report';
import { SectionCard } from '@/components/ui/SectionCard';
import { RAG_HEADLINE_LABELS, RAG_MODIFIERS } from '@/lib/format';

/** Section 1 — Statut global RAG : calculé (pire des dimensions), ou ajusté et justifié par le chef de projet. */
export function OverallStatus({ overall }: { overall: OverallStatusDto }) {
  const mod = RAG_MODIFIERS[overall.rag];
  return (
    <SectionCard number={1} title="Statut global (RAG)" className="col-4">
      <div className="overall">
        <span className={`overall__badge overall__badge--${mod}`} aria-hidden="true" />
        <div>
          <p className={`overall__headline overall__headline--${mod}`}>
            {RAG_HEADLINE_LABELS[overall.rag]}
          </p>
          <p className="overall__statement">{overall.statement}</p>
          <p className="overall__basis">
            {overall.overridden
              ? `Ajusté par le chef de projet (calculé : ${RAG_HEADLINE_LABELS[overall.computedRag].toLowerCase()}) : ${overall.overrideReason}`
              : 'Calculé : la pire des dimensions périmètre, délai et coût.'}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
