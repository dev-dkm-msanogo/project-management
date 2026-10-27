export interface SummaryTile {
  label: string;
  value: number;
  /** Mise en avant appliquée seulement si la valeur est non nulle. */
  tone?: 'danger' | 'warning' | 'success' | 'alert';
}

/** Rangée d'indicateurs clés en tête d'une page de registre. */
export function SummaryTiles({ tiles }: { tiles: readonly SummaryTile[] }) {
  return (
    <div className="summary-tiles">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className={`summary-tile${tile.tone && tile.value > 0 ? ` summary-tile--${tile.tone}` : ''}`}
        >
          <span className="summary-tile__value">{tile.value}</span>
          <span className="summary-tile__label">{tile.label}</span>
        </div>
      ))}
    </div>
  );
}
