import type { DimensionStatusDto } from '@shared/contracts/executive-status-report';
import { Donut } from '@/components/ui/Donut';
import { RagDot } from '@/components/ui/RagDot';
import { SectionCard } from '@/components/ui/SectionCard';
import { RAG_COLORS } from '@/lib/format';

interface DimensionStatusCardProps {
  number: number;
  title: string;
  dimension: DimensionStatusDto;
  /** Provenance des données, et ce qui manque quand il n'y en a pas. */
  source: string;
  emptyText: string;
}

/** Sections 4 & 5 — Statut d'une dimension (périmètre / planning) : donut + ventilation. */
export function DimensionStatusCard({ number, title, dimension, source, emptyText }: DimensionStatusCardProps) {
  const segments = dimension.breakdown.map((line) => ({
    value: line.percentage,
    color: RAG_COLORS[line.rag],
  }));

  return (
    <SectionCard
      number={number}
      title={title}
      className="col-4"
      source={dimension.basis ? `${source} · ${dimension.basis}` : source}
    >
      {dimension.basis === null ? (
        <p className="plan__empty">{emptyText}</p>
      ) : (
      <div className="dimension">
        <Donut
          segments={segments}
          centerPrimary={`${dimension.headlinePercentage}%`}
          centerSecondary={dimension.headlineLabel}
        />
        <ul className="legend-list">
          {dimension.breakdown.map((line) => (
            <li key={line.label}>
              <RagDot rag={line.rag} />
              <span className="legend-list__label">{line.label}</span>
              <span className="legend-list__value">{line.percentage}%</span>
            </li>
          ))}
        </ul>
      </div>
      )}
    </SectionCard>
  );
}
