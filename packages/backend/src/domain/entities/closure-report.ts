import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, requiredText } from '@domain/value-objects/register-rules';

export const BENEFIT_OUTCOMES = ['MET', 'MEASURING', 'NOT_MET'] as const;
export type BenefitOutcome = (typeof BENEFIT_OUTCOMES)[number];

export interface ClosureObjective {
  objective: string;
  criteria: string;
  howMet: string;
}

export interface ClosureBenefit {
  need: string;
  outcome: BenefitOutcome;
  comments: string;
}

export interface TransitionRecipient {
  recipient: string;
  responsibility: string;
  materials: string;
}

export interface TransitionAcceptance {
  /** Ressource du référentiel (identifiant). */
  resourceId: string;
  role: string;
  acceptedOn: Date | null;
}

export interface ClosureReportProps {
  projectId: string;
  preparedOn: Date;
  description: string;
  objectives: readonly ClosureObjective[];
  scheduleComments: string;
  costComments: string;
  benefits: readonly ClosureBenefit[];
  riskAndIssueDisposition: string;
  product: string;
  recipients: readonly TransitionRecipient[];
  training: string;
  supportArrangements: string;
  outstandingItems: readonly string[];
  acceptances: readonly TransitionAcceptance[];
}

const validDate = (date: Date) => !Number.isNaN(date.getTime());

/**
 * Agrégat racine : le rapport de clôture (templates « Final Report » et « Final Product / Service /
 * Result Transition ») — bilan des objectifs, écarts, bénéfices, disposition des risques, puis
 * transition vers l'exploitation et son acceptation. Un brouillon peut rester incomplet ; la
 * soumission à validation exige l'essentiel.
 */
export class ClosureReport {
  private constructor(readonly props: Readonly<ClosureReportProps>) {}

  static create(params: ClosureReportProps): ClosureReport {
    assertProjectId(params.projectId);
    if (!validDate(params.preparedOn)) {
      throw new DomainError('Date de préparation du rapport de clôture invalide.');
    }
    const objectives = params.objectives.map((item, index) => ({
      objective: requiredText(item.objective, `Objectif n° ${index + 1} : nommez-le.`),
      criteria: item.criteria.trim(),
      howMet: item.howMet.trim(),
    }));
    const benefits = params.benefits.map((item, index) => ({
      need: requiredText(item.need, `Bénéfice n° ${index + 1} : nommez le besoin ou le bénéfice.`),
      outcome: item.outcome,
      comments: item.comments.trim(),
    }));
    const recipients = params.recipients.map((item, index) => ({
      recipient: requiredText(item.recipient, `Destinataire n° ${index + 1} : nommez-le.`),
      responsibility: item.responsibility.trim(),
      materials: item.materials.trim(),
    }));
    const acceptances = params.acceptances.map((item, index) => {
      if (item.acceptedOn && !validDate(item.acceptedOn)) {
        throw new DomainError(`Acceptation n° ${index + 1} : date invalide.`);
      }
      return {
        resourceId: requiredText(item.resourceId, `Acceptation n° ${index + 1} : choisissez la personne dans le référentiel des ressources.`),
        role: item.role.trim(),
        acceptedOn: item.acceptedOn ? new Date(item.acceptedOn) : null,
      };
    });

    return new ClosureReport(
      Object.freeze({
        projectId: params.projectId,
        preparedOn: new Date(params.preparedOn),
        description: params.description.trim(),
        objectives,
        scheduleComments: params.scheduleComments.trim(),
        costComments: params.costComments.trim(),
        benefits,
        riskAndIssueDisposition: params.riskAndIssueDisposition.trim(),
        product: params.product.trim(),
        recipients,
        training: params.training.trim(),
        supportArrangements: params.supportArrangements.trim(),
        outstandingItems: params.outstandingItems.map((item) => item.trim()).filter(Boolean),
        acceptances,
      }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }

  /** Ce qui manque pour soumettre le rapport à validation (vide : prêt). */
  get missingForSubmission(): string[] {
    const { description, objectives, product, acceptances } = this.props;
    return [
      ...(description ? [] : ['la description du projet']),
      ...(objectives.some((item) => item.howMet) ? [] : ['au moins un objectif et la façon dont il a été atteint']),
      ...(product ? [] : ['le produit ou résultat transféré']),
      ...(acceptances.length > 0 && acceptances.every((item) => item.acceptedOn) ? [] : ['les acceptations de la transition, datées']),
    ];
  }
}
