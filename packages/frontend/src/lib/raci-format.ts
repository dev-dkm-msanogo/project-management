import type {
  RaciActivityInput,
  RaciCode,
  RaciGapDto,
  ResponsibilityMatrixDto,
  ResponsibilityMatrixInput,
} from '@shared/index';
import { todayIso } from '@/lib/format';

/** Libellés, contrôles et conversions de la matrice RACI (template PMI). */

export const RACI_CODES: readonly RaciCode[] = ['R', 'A', 'C', 'I'];

export const RACI_LABELS: Record<RaciCode, { name: string; hint: string }> = {
  R: { name: 'Réalise', hint: 'Exécute le travail.' },
  A: { name: 'Rend compte', hint: "Répond du résultat (délai, exigences) ; une seule personne par activité." },
  C: { name: 'Consulté', hint: 'Détient des informations nécessaires au travail.' },
  I: { name: 'Informé', hint: 'Est prévenu quand le travail est terminé.' },
};

// Miroir UX de la règle du domaine (ResponsibilityMatrix.gaps) — le serveur reste l'autorité.
export function raciGaps(activities: readonly RaciActivityInput[]): RaciGapDto[] {
  return activities
    .map((activity) => {
      const codes = Object.values(activity.assignments);
      return { activity: activity.name, missing: (['A', 'R'] as const).filter((code) => !codes.includes(code)) };
    })
    .filter((gap) => gap.missing.length > 0);
}

/** Nombre de « A » d'une activité (plus d'un est refusé par le serveur). */
export const accountableCount = (activity: RaciActivityInput): number =>
  Object.values(activity.assignments).filter((code) => code === 'A').length;

/** Clé technique d'une nouvelle colonne (jamais affichée). */
export function newParticipantKey(): string {
  return `p-${crypto.randomUUID().slice(0, 8)}`;
}

export function raciDtoToInput(dto: ResponsibilityMatrixDto): ResponsibilityMatrixInput {
  const { projectId: _projectId, gaps: _gaps, ...input } = dto;
  return structuredClone(input);
}

export function blankRaci(): ResponsibilityMatrixInput {
  return { preparedOn: todayIso(), participants: [], activities: [] };
}
