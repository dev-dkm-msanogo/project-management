import type { RagLevel } from '@shared/contracts/executive-status-report';
import { RAG_COLORS } from '@/lib/format';

interface RagDotProps {
  rag: RagLevel;
  size?: number;
}

/** Pastille de couleur représentant un statut RAG. */
export function RagDot({ rag, size = 10 }: RagDotProps) {
  return (
    <span
      className="rag-dot"
      style={{ width: size, height: size, background: RAG_COLORS[rag] }}
      aria-hidden="true"
    />
  );
}
