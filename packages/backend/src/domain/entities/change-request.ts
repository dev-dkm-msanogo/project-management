import { DomainError } from '@domain/errors/domain-errors';
import { assertUniqueNames, entryCode, requiredText } from '@domain/value-objects/register-rules';
import {
  scoringCriteria,
  scoringResult,
  type ScoringCriterion,
  type ScoringResult,
} from '@domain/value-objects/weighted-scoring';

export const CHANGE_CATEGORIES = ['SCOPE', 'QUALITY', 'REQUIREMENTS', 'COST', 'SCHEDULE', 'DOCUMENTS'] as const;
export type ChangeCategory = (typeof CHANGE_CATEGORIES)[number];

export const IMPACT_AREAS = ['SCOPE', 'QUALITY', 'REQUIREMENTS', 'COST', 'SCHEDULE'] as const;
export type ImpactArea = (typeof IMPACT_AREAS)[number];

export const IMPACT_DIRECTIONS = ['INCREASE', 'DECREASE', 'MODIFY'] as const;
export type ImpactDirection = (typeof IMPACT_DIRECTIONS)[number];

export const STAKEHOLDER_RISKS = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type StakeholderRisk = (typeof STAKEHOLDER_RISKS)[number];

export const CHANGE_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'DECIDED', 'IMPLEMENTED', 'CLOSED'] as const;
export type ChangeStatus = (typeof CHANGE_STATUSES)[number];

export const DISPOSITIONS = ['APPROVED', 'DEFERRED', 'REJECTED'] as const;
export type Disposition = (typeof DISPOSITIONS)[number];

/** Statuts qui précèdent la décision. */
const UNDECIDED: readonly ChangeStatus[] = ['SUBMITTED', 'UNDER_REVIEW'];

export interface ChangeImpact {
  direction: ImpactDirection | null;
  description: string;
}

export interface ChangeAlternative {
  name: string;
  cost: string;
  schedule: string;
  pros: string;
  cons: string;
}

export interface ChangeAssessment {
  /** Ressource du référentiel (identifiant). */
  assessedById: string;
  assessedOn: Date;
  alternatives: readonly ChangeAlternative[];
  criteria: readonly ScoringCriterion[];
  recommended: string | null;
  recommendation: string;
  implementationNotes: string;
}

export interface ChangeRequestProps {
  code: string;
  title: string;
  requestor: string;
  submittedOn: Date;
  categories: readonly ChangeCategory[];
  description: string;
  justification: string;
  impacts: Readonly<Record<ImpactArea, ChangeImpact>>;
  stakeholderRisk: StakeholderRisk | null;
  stakeholderImpact: string;
  costImpact: number;
  scheduleImpactDays: number;
  affectedDocuments: string;
  comments: string;
  assessment: ChangeAssessment | null;
  status: ChangeStatus;
  disposition: Disposition | null;
  decidedOn: Date | null;
  decidedBy: string;
  decisionRationale: string;
}

const isOneOf = <T extends string>(values: readonly T[], value: string | null): value is T =>
  value !== null && (values as readonly string[]).includes(value);

const validDate = (date: Date | null): date is Date => date !== null && !Number.isNaN(date.getTime());

function assessmentOf(code: string, submittedOn: Date, assessment: ChangeAssessment): ChangeAssessment {
  if (!validDate(assessment.assessedOn) || assessment.assessedOn.getTime() < submittedOn.getTime()) {
    throw new DomainError(`${code} : l'évaluation est datée au plus tôt du jour de la soumission.`);
  }
  if (assessment.alternatives.length === 0) {
    throw new DomainError(`${code} : l'évaluation compare au moins une alternative.`);
  }
  const alternatives = assessment.alternatives.map((alternative, index) => ({
    name: requiredText(alternative.name, `${code} : nommez l'alternative n° ${index + 1}.`),
    cost: alternative.cost.trim(),
    schedule: alternative.schedule.trim(),
    pros: alternative.pros.trim(),
    cons: alternative.cons.trim(),
  }));
  assertUniqueNames(alternatives.map((item) => item.name), (name) => `${code} : alternative en double, « ${name} ».`);

  const recommended = assessment.recommended?.trim() || null;
  if (recommended && !alternatives.some((item) => item.name.toLowerCase() === recommended.toLowerCase())) {
    throw new DomainError(`${code} : l'alternative recommandée « ${recommended} » n'est pas évaluée.`);
  }

  return {
    assessedById: requiredText(assessment.assessedById, `${code} : choisissez l'évaluateur dans le référentiel des ressources.`),
    assessedOn: new Date(assessment.assessedOn),
    alternatives,
    criteria: scoringCriteria(assessment.criteria, alternatives.length, code),
    recommended,
    recommendation: assessment.recommendation.trim(),
    implementationNotes: assessment.implementationNotes.trim(),
  };
}

/**
 * Demande de modification (template « Change Request ») et son évaluation facultative. Elle suit
 * le circuit du plan de gestion des modifications : une demande décidée porte sa décision, sa
 * date (jamais avant la soumission) et son décideur ; seule une demande approuvée est mise en
 * œuvre.
 */
export class ChangeRequest {
  private constructor(readonly props: Readonly<ChangeRequestProps>) {}

  static create(params: ChangeRequestProps): ChangeRequest {
    const code = entryCode(params.code, 'de demande de modification');
    if (!validDate(params.submittedOn)) {
      throw new DomainError(`${code} : date de soumission invalide.`);
    }
    const categories = [...new Set(params.categories)];
    if (categories.length === 0 || !categories.every((category) => isOneOf(CHANGE_CATEGORIES, category))) {
      throw new DomainError(`${code} : choisissez au moins une catégorie connue.`);
    }
    for (const area of IMPACT_AREAS) {
      const direction = params.impacts[area]?.direction ?? null;
      if (direction !== null && !isOneOf(IMPACT_DIRECTIONS, direction)) {
        throw new DomainError(`${code} : effet inconnu sur ${area}.`);
      }
    }
    if (params.stakeholderRisk !== null && !isOneOf(STAKEHOLDER_RISKS, params.stakeholderRisk)) {
      throw new DomainError(`${code} : niveau de risque pour les parties prenantes inconnu.`);
    }
    if (!Number.isInteger(params.costImpact) || !Number.isInteger(params.scheduleImpactDays)) {
      throw new DomainError(`${code} : coût (en FCFA) et délai (en jours) sont des nombres entiers.`);
    }
    if (!isOneOf(CHANGE_STATUSES, params.status)) {
      throw new DomainError(`${code} : statut inconnu.`);
    }

    const decided = !UNDECIDED.includes(params.status);
    if (decided) {
      if (!isOneOf(DISPOSITIONS, params.disposition) || !validDate(params.decidedOn)) {
        throw new DomainError(`${code} : une demande décidée porte sa décision et sa date.`);
      }
      if (params.decidedOn.getTime() < params.submittedOn.getTime()) {
        throw new DomainError(`${code} : la décision ne peut précéder la soumission.`);
      }
      if (params.status === 'IMPLEMENTED' && params.disposition !== 'APPROVED') {
        throw new DomainError(`${code} : seule une demande approuvée est mise en œuvre.`);
      }
    } else if (params.disposition !== null || params.decidedOn !== null) {
      throw new DomainError(`${code} : une demande non décidée n'a ni décision ni date de décision.`);
    }

    return new ChangeRequest(
      Object.freeze({
        code,
        title: requiredText(params.title, `${code} : résumez la modification demandée.`),
        requestor: requiredText(params.requestor, `${code} : nommez le demandeur.`),
        submittedOn: new Date(params.submittedOn),
        categories,
        description: params.description.trim(),
        justification: params.justification.trim(),
        impacts: Object.fromEntries(
          IMPACT_AREAS.map((area) => [
            area,
            { direction: params.impacts[area]?.direction ?? null, description: params.impacts[area]?.description.trim() ?? '' },
          ]),
        ) as Record<ImpactArea, ChangeImpact>,
        stakeholderRisk: params.stakeholderRisk,
        stakeholderImpact: params.stakeholderImpact.trim(),
        costImpact: params.costImpact,
        scheduleImpactDays: params.scheduleImpactDays,
        affectedDocuments: params.affectedDocuments.trim(),
        comments: params.comments.trim(),
        assessment: params.assessment ? assessmentOf(code, params.submittedOn, params.assessment) : null,
        status: params.status,
        disposition: decided ? params.disposition : null,
        decidedOn: decided ? new Date(params.decidedOn!) : null,
        decidedBy: decided
          ? requiredText(params.decidedBy, `${code} : précisez qui a décidé (comité ou sponsor).`)
          : params.decidedBy.trim(),
        decisionRationale: params.decisionRationale.trim(),
      }),
    );
  }

  get code(): string {
    return this.props.code;
  }

  get isPending(): boolean {
    return UNDECIDED.includes(this.props.status);
  }

  /** En attente d'une décision : soumise, en analyse, ou reportée (à redécider). */
  get awaitsDecision(): boolean {
    return this.isPending || (this.props.status === 'DECIDED' && this.props.disposition === 'DEFERRED');
  }

  /** Décision du comité de contrôle des modifications : motivée, datée et signée par son auteur. */
  decide(decision: { disposition: Disposition; rationale: string; by: string; on: Date }): ChangeRequest {
    if (!this.awaitsDecision) {
      throw new DomainError(`${this.code} : seule une demande soumise, en analyse ou reportée attend une décision.`);
    }
    return ChangeRequest.create({
      ...this.props,
      status: 'DECIDED',
      disposition: decision.disposition,
      decidedOn: decision.on,
      decidedBy: decision.by,
      decisionRationale: requiredText(decision.rationale, `${this.code} : motivez la décision.`),
    });
  }

  /** Totaux pondérés des alternatives, si l'évaluation comporte une analyse multicritère. */
  get assessmentResult(): ScoringResult | null {
    const assessment = this.props.assessment;
    if (!assessment || assessment.criteria.length === 0) return null;
    return scoringResult(
      assessment.alternatives.map((alternative) => alternative.name),
      assessment.criteria,
    );
  }
}
