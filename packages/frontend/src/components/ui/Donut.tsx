export interface DonutSegment {
  value: number;
  color: string;
}

interface DonutProps {
  segments: DonutSegment[];
  centerPrimary: string;
  centerSecondary?: string;
  size?: number;
  strokeWidth?: number;
}

/**
 * Anneau (donut) en SVG pur — aucune dépendance de graphe.
 * Les segments sont dessinés via strokeDasharray ; le total détermine l'échelle
 * (un total < 100 laisse apparaître la piste de fond comme "reste").
 */
export function Donut({
  segments,
  centerPrimary,
  centerSecondary,
  size = 150,
  strokeWidth = 16,
}: DonutProps) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  let offset = 0;

  return (
    <svg
      className="donut"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${centerPrimary} ${centerSecondary ?? ''}`.trim()}
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--track)"
        strokeWidth={strokeWidth}
      />
      <g transform={`rotate(-90 ${center} ${center})`}>
        {segments.map((segment, index) => {
          const length = (segment.value / total) * circumference;
          const dasharray = `${length} ${circumference - length}`;
          const element = (
            <circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dasharray}
              strokeDashoffset={-offset}
            />
          );
          offset += length;
          return element;
        })}
      </g>
      <text className="donut__primary" x="50%" y="46%" textAnchor="middle" dominantBaseline="middle">
        {centerPrimary}
      </text>
      {centerSecondary && (
        <text className="donut__secondary" x="50%" y="62%" textAnchor="middle" dominantBaseline="middle">
          {centerSecondary}
        </text>
      )}
    </svg>
  );
}
