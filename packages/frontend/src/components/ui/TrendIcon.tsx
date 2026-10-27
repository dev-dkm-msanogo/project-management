import type { TrendDirection } from '@shared/contracts/executive-status-report';

const CONFIG: Record<TrendDirection, { symbol: string; modifier: string; label: string }> = {
  UP: { symbol: '↗', modifier: 'up', label: 'Tendance à la hausse' },
  DOWN: { symbol: '↘', modifier: 'down', label: 'Tendance à la baisse' },
  STABLE: { symbol: '→', modifier: 'stable', label: 'Tendance stable' },
};

/** Flèche de tendance colorée (hausse = rouge pour un risque, baisse = vert). */
export function TrendIcon({ trend }: { trend: TrendDirection }) {
  const config = CONFIG[trend];
  return (
    <span className={`trend trend--${config.modifier}`} title={config.label} aria-label={config.label}>
      {config.symbol}
    </span>
  );
}
