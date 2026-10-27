import type { ReactNode } from 'react';

interface SectionCardProps {
  number?: number;
  title: string;
  className?: string;
  /** Provenance des données d'une section calculée. */
  source?: string;
  children: ReactNode;
}

/** Carte de section réutilisable : en-tête numéroté + corps. */
export function SectionCard({ number, title, className = '', source, children }: SectionCardProps) {
  return (
    <section className={`card ${className}`.trim()}>
      <header className="card__head">
        {number !== undefined && <span className="card__num">{number}.</span>}
        <h2 className="card__title">{title}</h2>
      </header>
      {source && <p className="card__source">{source}</p>}
      <div className="card__body">{children}</div>
    </section>
  );
}
