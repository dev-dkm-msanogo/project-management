import type { ReactNode } from 'react';
import { HEALTH_ICONS, HEALTH_LABELS, indexHealth, formatIndex, type IndexHealth } from '@/lib/performance-format';

/** Barre d'avancement (0–100 %) avec sa valeur en clair ; rouge si la tâche est en retard. */
export function ProgressBar({ value, late = false }: { value: number; late?: boolean }) {
  const percent = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <span className="progress-bar">
      <span className="progress-bar__track" aria-hidden="true">
        <span className={`progress-bar__fill${late ? ' progress-bar__fill--late' : ''}`} style={{ width: `${percent}%` }} />
      </span>
      <span className="progress-bar__value">{percent} %</span>
    </span>
  );
}

/** Santé d'un indice : pictogramme et libellé, jamais la couleur seule. */
export function HealthBadge({ health }: { health: IndexHealth }) {
  return (
    <span className={`health health--${health}`}>
      <span className="health__icon" aria-hidden="true">
        {HEALTH_ICONS[health]}
      </span>
      {HEALTH_LABELS[health]}
    </span>
  );
}

/** Indice de performance (SPI, CPI) et sa santé ; « — » sans mesure. */
export function IndexValue({ value }: { value: number | null }) {
  const health = indexHealth(value);
  return (
    <span className="index-value">
      <strong>{formatIndex(value)}</strong>
      {health && <HealthBadge health={health} />}
    </span>
  );
}

/** Indice compact pour les tableaux denses : pictogramme de santé + valeur ; le libellé reste lu. */
export function IndexChip({ value, label }: { value: number | null; label: string }) {
  const health = indexHealth(value);
  if (!health) return <span className="register-table__muted">—</span>;
  return (
    <span className={`index-chip index-chip--${health}`} title={HEALTH_LABELS[health]}>
      <span aria-hidden="true">{HEALTH_ICONS[health]}</span> {formatIndex(value)}
      <span className="visually-hidden">
        {' '}
        {label} : {HEALTH_LABELS[health].toLowerCase()}
      </span>
    </span>
  );
}

interface MetricCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  health?: IndexHealth | null;
}

/** Indicateur clé : valeur en grand, précision dessous, liseré selon la santé. */
export function MetricCard({ label, value, hint, health }: MetricCardProps) {
  return (
    <div className={`metric-card${health ? ` metric-card--${health}` : ''}`}>
      <span className="metric-card__label">{label}</span>
      <span className="metric-card__value">{value}</span>
      {hint && <span className="metric-card__hint">{hint}</span>}
      {health && <HealthBadge health={health} />}
    </div>
  );
}
