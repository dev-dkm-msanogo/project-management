interface GaugeProps {
  value: number;
  primary: string;
  secondary?: string;
  size?: number;
}

/** Jauge semi-circulaire (0–100%) en SVG pur. */
export function Gauge({ value, primary, secondary, size = 200 }: GaugeProps) {
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const semicircumference = Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const progress = (clamped / 100) * semicircumference;

  // Arc de gauche à droite en passant par le haut.
  const path = `M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`;
  const viewBoxHeight = center + 28;

  return (
    <svg
      className="gauge"
      viewBox={`0 0 ${size} ${viewBoxHeight}`}
      role="img"
      aria-label={`${primary} ${secondary ?? ''}`.trim()}
    >
      <path
        d={path}
        fill="none"
        stroke="var(--track)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d={path}
        fill="none"
        stroke="var(--rag-green)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${progress} ${semicircumference}`}
      />
      <text className="gauge__primary" x={center} y={center - 6} textAnchor="middle">
        {primary}
      </text>
      {secondary && (
        <text className="gauge__secondary" x={center} y={center + 16} textAnchor="middle">
          {secondary}
        </text>
      )}
    </svg>
  );
}
