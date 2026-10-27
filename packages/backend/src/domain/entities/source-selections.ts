import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, assertUniqueNames, requiredText } from '@domain/value-objects/register-rules';
import {
  scoringCriteria,
  scoringResult,
  type ScoringCriterion,
  type ScoringResult,
} from '@domain/value-objects/weighted-scoring';

export type SelectionCriterion = ScoringCriterion;

/** Attribution de l'achat à l'un des candidats, décidée par un valideur du projet. */
export interface SourceSelectionAward {
  supplier: string;
  decidedOn: Date;
  decidedBy: string;
  rationale: string;
}

export interface SourceSelectionProps {
  procurement: string;
  preparedOn: Date;
  candidates: readonly string[];
  criteria: readonly SelectionCriterion[];
  recommendation: string;
  award: SourceSelectionAward | null;
}

/**
 * Grille de sélection d'un achat (template « Source Selection Criteria ») : chaque candidat est
 * noté de 1 à 5 sur chaque critère pondéré ; score = pondération × note, total sur 500.
 * L'achat est attribué à l'un des candidats, jamais avant la préparation de la grille.
 */
export class SourceSelection {
  private constructor(readonly props: Readonly<SourceSelectionProps>) {}

  static create(params: SourceSelectionProps): SourceSelection {
    const procurement = requiredText(params.procurement, "Nommez l'achat évalué.");
    if (Number.isNaN(params.preparedOn.getTime())) {
      throw new DomainError(`Date invalide pour l'évaluation « ${procurement} ».`);
    }

    const candidates = params.candidates.map((name, index) =>
      requiredText(name, `« ${procurement} » : nommez le candidat n° ${index + 1}.`),
    );
    if (candidates.length === 0) {
      throw new DomainError(`« ${procurement} » : au moins un candidat est requis.`);
    }
    assertUniqueNames(candidates, (name) => `« ${procurement} » : candidat en double, « ${name} ».`);

    if (params.criteria.length === 0) {
      throw new DomainError(`« ${procurement} » : au moins un critère est requis.`);
    }
    const criteria = scoringCriteria(params.criteria, candidates.length, `« ${procurement} »`);
    const award = params.award ? awardOf(procurement, params.preparedOn, candidates, params.award) : null;

    return new SourceSelection(
      Object.freeze({
        procurement,
        preparedOn: new Date(params.preparedOn),
        candidates,
        criteria,
        recommendation: params.recommendation.trim(),
        award,
      }),
    );
  }

  /** La grille attribuée à `supplier` : décision motivée, datée et signée par son auteur. */
  award(award: SourceSelectionAward): SourceSelection {
    if (this.props.award) {
      throw new DomainError(`« ${this.props.procurement} » est déjà attribué à ${this.props.award.supplier}.`);
    }
    return SourceSelection.create({ ...this.props, award });
  }

  /** Totaux par candidat et candidat(s) en tête. */
  get result(): ScoringResult {
    return scoringResult(this.props.candidates, this.props.criteria);
  }
}

function awardOf(
  procurement: string,
  preparedOn: Date,
  candidates: readonly string[],
  award: SourceSelectionAward,
): SourceSelectionAward {
  const supplier = candidates.find((name) => name.toLowerCase() === award.supplier.trim().toLowerCase());
  if (!supplier) {
    throw new DomainError(`« ${procurement} » : « ${award.supplier} » ne fait pas partie des candidats évalués.`);
  }
  if (Number.isNaN(award.decidedOn.getTime()) || award.decidedOn.getTime() < preparedOn.getTime()) {
    throw new DomainError(`« ${procurement} » : l'attribution ne peut précéder la grille d'évaluation.`);
  }
  return {
    supplier,
    decidedOn: new Date(award.decidedOn),
    decidedBy: requiredText(award.decidedBy, `« ${procurement} » : précisez qui a attribué l'achat.`),
    rationale: requiredText(award.rationale, `« ${procurement} » : motivez l'attribution.`),
  };
}

/** Agrégat racine : les grilles de sélection des fournisseurs d'un projet (une par achat). Vide : valide. */
export class SourceSelections {
  private constructor(
    public readonly projectId: string,
    public readonly evaluations: readonly SourceSelection[],
  ) {}

  static create(params: { projectId: string; evaluations: readonly SourceSelection[] }): SourceSelections {
    assertProjectId(params.projectId);
    assertUniqueNames(
      params.evaluations.map((evaluation) => evaluation.props.procurement),
      (name) => `Deux grilles portent sur le même achat : « ${name} ».`,
    );
    return new SourceSelections(params.projectId, [...params.evaluations]);
  }

  static empty(projectId: string): SourceSelections {
    return SourceSelections.create({ projectId, evaluations: [] });
  }

  /** Les grilles avec l'achat `procurement` attribué. */
  withAward(procurement: string, award: SourceSelectionAward): SourceSelections {
    const target = this.evaluations.find(
      (evaluation) => evaluation.props.procurement.toLowerCase() === procurement.trim().toLowerCase(),
    );
    if (!target) {
      throw new DomainError(`Aucune grille de sélection pour l'achat « ${procurement} ».`);
    }
    return SourceSelections.create({
      projectId: this.projectId,
      evaluations: this.evaluations.map((evaluation) => (evaluation === target ? evaluation.award(award) : evaluation)),
    });
  }
}
