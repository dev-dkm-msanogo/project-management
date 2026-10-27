import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId } from '@domain/value-objects/register-rules';

/** Questions du template « Stakeholder Identification Questionnaire », dans l'ordre. */
export const STAKEHOLDER_QUESTION_KEYS = [
  'authorization',
  'delivery',
  'positiveImpact',
  'negativeImpact',
  'resources',
  'expertise',
  'currentUsers',
  'blockers',
  'endUsers',
  'regulators',
  'suppliers',
  'operations',
  'silent',
  'observers',
] as const;
export type StakeholderQuestionKey = (typeof STAKEHOLDER_QUESTION_KEYS)[number];

export interface StakeholderQuestionnaireProps {
  projectId: string;
  preparedOn: Date;
  answers: Readonly<Record<StakeholderQuestionKey, string>>;
}

/**
 * Agrégat racine : le questionnaire d'identification des parties prenantes (template PMI), une
 * réponse libre par question ; une question sans réponse reste vide.
 */
export class StakeholderQuestionnaire {
  private constructor(readonly props: Readonly<StakeholderQuestionnaireProps>) {}

  static create(params: StakeholderQuestionnaireProps): StakeholderQuestionnaire {
    assertProjectId(params.projectId);
    if (Number.isNaN(params.preparedOn.getTime())) {
      throw new DomainError("Date de préparation du questionnaire d'identification invalide.");
    }
    const answers = Object.fromEntries(
      STAKEHOLDER_QUESTION_KEYS.map((key) => [key, (params.answers[key] ?? '').trim()]),
    ) as Record<StakeholderQuestionKey, string>;
    return new StakeholderQuestionnaire(
      Object.freeze({ projectId: params.projectId, preparedOn: new Date(params.preparedOn), answers }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }
}
