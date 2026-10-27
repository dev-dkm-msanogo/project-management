import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, requiredText } from '@domain/value-objects/register-rules';

export const RACI_CODES = ['R', 'A', 'C', 'I'] as const;
export type RaciCode = (typeof RACI_CODES)[number];

const PARTICIPANT_KEY = /^[A-Za-z0-9_-]{1,40}$/;

export interface RaciParticipant {
  key: string;
  /** Ressource du référentiel (identifiant). */
  resourceId: string;
  role: string;
}

export interface RaciActivity {
  name: string;
  assignments: Readonly<Record<string, RaciCode>>;
}

export interface ResponsibilityMatrixProps {
  projectId: string;
  preparedOn: Date;
  participants: readonly RaciParticipant[];
  activities: readonly RaciActivity[];
}

export interface RaciGap {
  activity: string;
  missing: ('A' | 'R')[];
}

/**
 * Agrégat racine : la matrice des responsabilités (RACI). Règle PMI : une activité a au
 * plus un « A » (une seule personne rend compte). Les activités sans « A » ou sans « R »
 * sont signalées comme incomplètes, sans être refusées (matrice en construction).
 */
export class ResponsibilityMatrix {
  private constructor(readonly props: Readonly<ResponsibilityMatrixProps>) {}

  static create(params: ResponsibilityMatrixProps): ResponsibilityMatrix {
    assertProjectId(params.projectId);
    if (Number.isNaN(params.preparedOn.getTime())) {
      throw new DomainError('Date de préparation de la matrice RACI invalide.');
    }

    const keys = new Set<string>();
    const participants = params.participants.map((participant, index) => {
      if (!PARTICIPANT_KEY.test(participant.key) || keys.has(participant.key)) {
        throw new DomainError(`Identifiant invalide ou en double pour le participant n° ${index + 1}.`);
      }
      keys.add(participant.key);
      return {
        key: participant.key,
        resourceId: requiredText(participant.resourceId, `Choisissez le participant n° ${index + 1} dans le référentiel des ressources.`),
        role: participant.role.trim(),
      };
    });

    const activities = params.activities.map((activity, index) => {
      const name = requiredText(activity.name, `L'activité n° ${index + 1} doit être nommée.`);
      const entries = Object.entries(activity.assignments);
      for (const [key, code] of entries) {
        if (!keys.has(key)) {
          throw new DomainError(`L'activité « ${name} » fait référence à un participant inconnu.`);
        }
        if (!(RACI_CODES as readonly string[]).includes(code)) {
          throw new DomainError(`Code RACI invalide pour l'activité « ${name} ».`);
        }
      }
      if (entries.filter(([, code]) => code === 'A').length > 1) {
        throw new DomainError(`L'activité « ${name} » ne peut avoir qu'un seul « A » (une seule personne rend compte).`);
      }
      return { name, assignments: Object.freeze({ ...activity.assignments }) };
    });

    return new ResponsibilityMatrix(
      Object.freeze({ ...params, preparedOn: new Date(params.preparedOn), participants, activities }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }

  /** Activités incomplètes : sans personne qui rend compte (A) ou sans réalisateur (R). */
  get gaps(): RaciGap[] {
    return this.props.activities
      .map((activity) => {
        const codes = Object.values(activity.assignments);
        const missing = (['A', 'R'] as const).filter((code) => !codes.includes(code));
        return { activity: activity.name, missing };
      })
      .filter((gap) => gap.missing.length > 0);
  }
}
