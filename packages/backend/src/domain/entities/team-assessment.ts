import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, requiredText } from '@domain/value-objects/register-rules';

export const TEAM_CRITERIA = [
  'SCOPE',
  'QUALITY',
  'SCHEDULE',
  'COST',
  'COMMUNICATION',
  'COLLABORATION',
  'CONFLICT_MANAGEMENT',
  'DECISION_MAKING',
  'MORALE',
] as const;
export type TeamCriterion = (typeof TEAM_CRITERIA)[number];

export const TEAM_RATINGS = ['EXCEEDS', 'MEETS', 'NEEDS_IMPROVEMENT'] as const;
export type TeamRating = (typeof TEAM_RATINGS)[number];

export interface TeamCriterionAssessment {
  rating: TeamRating | null;
  comments: string;
}

export interface DevelopmentArea {
  area: string;
  approach: string;
  actions: readonly string[];
}

export interface TeamAssessmentProps {
  projectId: string;
  assessedOn: Date | null;
  criteria: Readonly<Partial<Record<TeamCriterion, TeamCriterionAssessment>>>;
  developmentAreas: readonly DevelopmentArea[];
}

const lines = (values: readonly string[]) => values.map((value) => value.trim()).filter(Boolean);

/**
 * Agrégat racine : l'évaluation de la performance de l'équipe (template « Team Performance
 * Assessment »). Une note ou un axe de progression n'existe qu'avec la date de l'évaluation ; les
 * évaluations successives se retrouvent dans l'historique des versions.
 */
export class TeamAssessment {
  private constructor(
    public readonly projectId: string,
    public readonly assessedOn: Date | null,
    public readonly criteria: Readonly<Record<TeamCriterion, TeamCriterionAssessment>>,
    public readonly developmentAreas: readonly DevelopmentArea[],
  ) {}

  static create(params: TeamAssessmentProps): TeamAssessment {
    assertProjectId(params.projectId);
    if (params.assessedOn && Number.isNaN(params.assessedOn.getTime())) {
      throw new DomainError("Date de l'évaluation de l'équipe invalide.");
    }
    const criteria = Object.fromEntries(
      TEAM_CRITERIA.map((criterion) => {
        const value = params.criteria[criterion] ?? { rating: null, comments: '' };
        return [criterion, Object.freeze({ rating: value.rating, comments: value.comments.trim() })];
      }),
    ) as Record<TeamCriterion, TeamCriterionAssessment>;
    const developmentAreas = params.developmentAreas.map((area, index) => ({
      area: requiredText(area.area, `Axe de progression n° ${index + 1} : nommez-le.`),
      approach: area.approach.trim(),
      actions: lines(area.actions),
    }));
    const assessed =
      developmentAreas.length > 0 || Object.values(criteria).some((value) => value.rating !== null || value.comments !== '');
    if (assessed && !params.assessedOn) {
      throw new DomainError("Indiquez la date de l'évaluation de l'équipe.");
    }

    return new TeamAssessment(
      params.projectId,
      params.assessedOn ? new Date(params.assessedOn) : null,
      Object.freeze(criteria),
      developmentAreas,
    );
  }

  static empty(projectId: string): TeamAssessment {
    return TeamAssessment.create({ projectId, assessedOn: null, criteria: {}, developmentAreas: [] });
  }
}
