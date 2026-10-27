import { IconLock } from '@/components/nav/icons';

/** Signale qu'un rôle en lecture seule ne peut pas modifier la page. */
export function ReadOnlyBadge() {
  return (
    <span className="readonly-badge" title="Votre rôle permet la consultation, pas la modification.">
      <IconLock />
      Lecture seule
    </span>
  );
}
