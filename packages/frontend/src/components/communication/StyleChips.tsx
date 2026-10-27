import type { CommunicationStyle } from '@shared/index';
import { STYLE_HINTS, STYLE_LABELS } from '@/lib/communication-format';

/** Méthodes de communication d'une approche (diffusion, mise à disposition, échange interactif). */
export function StyleChips({ styles }: { styles: readonly CommunicationStyle[] }) {
  if (styles.length === 0) return null;
  return (
    <span className="skill-chips">
      {styles.map((style) => (
        <span key={style} className={`style-chip style-chip--${style.toLowerCase()}`} title={STYLE_HINTS[style]}>
          {STYLE_LABELS[style]}
        </span>
      ))}
    </span>
  );
}
