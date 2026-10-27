import type {
  MoneyDto,
  RagLevel,
} from '@shared/contracts/executive-status-report';

/** Fonctions de formatage partagées (DRY) : dates, montants et correspondances RAG. */

const DAY_MONTH_FR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

const LONG_DATE_FR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const SHORT_DATE_FR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Interprète une date ISO "YYYY-MM-DD" en UTC (évite les décalages de fuseau). */
function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** Jour + mois court, ex. "8 avr.". */
export function formatMonthDay(iso: string | null): string {
  if (!iso) return '—';
  return DAY_MONTH_FR.format(parseIsoDate(iso));
}

/** Date longue, ex. "31 mai 2025". */
export function formatLongDate(iso: string): string {
  return LONG_DATE_FR.format(parseIsoDate(iso));
}

const MONTH_FR = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Mois d'un rapport (AAAA-MM), ex. « février 2025 ». */
export function formatMonth(period: string): string {
  return MONTH_FR.format(parseIsoDate(`${period}-01`));
}

/** « de février 2025 », « d'octobre 2026 » (élision devant avril, août, octobre). */
export function formatOfMonth(period: string): string {
  const name = formatMonth(period);
  return /^[aeiou]/.test(name) ? "d'" + name : `de ${name}`;
}

/** Date compacte avec année, ex. "10 oct. 2026". */
export function formatShortDate(iso: string | null): string {
  if (!iso) return '—';
  return SHORT_DATE_FR.format(parseIsoDate(iso));
}

// Millions à une décimale au plus : lisible et suffisant pour le pilotage.
const NUMBER_FR = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

const INTEGER_FR = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/** Montant en millions de FCFA, sans unité (colonnes « M FCFA »), ex. "1 940", "87,5". */
export function formatMillionsValue(amount: number): string {
  return NUMBER_FR.format(amount / 1_000_000);
}

/** Montant en millions de FCFA, ex. "2 400 M FCFA". */
export function formatFcfaMillions(amount: number): string {
  return `${formatMillionsValue(amount)} M FCFA`;
}

/** Montant exact, ex. "600 000 FCFA". */
export function formatFcfa(amount: number): string {
  return `${INTEGER_FR.format(amount)} FCFA`;
}

/** Montant en millions de FCFA, ex. "2 400 M FCFA". */
export function formatMillions(money: MoneyDto): string {
  return formatFcfaMillions(money.amount);
}

/** Montant signé en millions de FCFA, ex. "+126 M FCFA", "+0 M FCFA". */
export function formatSignedMillions(money: MoneyDto): string {
  const sign = money.amount >= 0 ? '+' : '-';
  return `${sign}${NUMBER_FR.format(Math.abs(money.amount) / 1_000_000)} M FCFA`;
}

/** Impact planning signé, ex. "+3 jours". */
export function formatDaysSigned(days: number): string {
  const sign = days >= 0 ? '+' : '';
  const unit = Math.abs(days) >= 2 ? 'jours' : 'jour';
  return `${sign}${days} ${unit}`;
}

export const RAG_COLORS: Record<RagLevel, string> = {
  GREEN: 'var(--rag-green)',
  AMBER: 'var(--rag-amber)',
  RED: 'var(--rag-red)',
  NOT_APPLICABLE: 'var(--rag-grey)',
};

export const RAG_MODIFIERS: Record<RagLevel, 'green' | 'amber' | 'red' | 'grey'> = {
  GREEN: 'green',
  AMBER: 'amber',
  RED: 'red',
  NOT_APPLICABLE: 'grey',
};

export const RAG_LEGEND_LABELS: Record<RagLevel, string> = {
  GREEN: 'Sur la bonne voie',
  AMBER: 'À risque',
  RED: 'En difficulté',
  NOT_APPLICABLE: 'Non applicable',
};

/** Intitulé court du statut global (affiché en grand). */
export const RAG_HEADLINE_LABELS: Record<RagLevel, string> = {
  GREEN: 'VERT',
  AMBER: 'ORANGE',
  RED: 'ROUGE',
  NOT_APPLICABLE: 'N/A',
};

/** Date du jour au format ISO (YYYY-MM-DD), pour comparer des échéances. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Recherche plein texte sans accents ni casse : la requête figure-t-elle dans l'un des textes ? */
export function matchesQuery(values: readonly (string | null | undefined)[], query: string): boolean {
  const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const needle = normalize(query.trim());
  if (!needle) return true;
  return normalize(values.filter(Boolean).join(' ')).includes(needle);
}
