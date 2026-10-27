import { DomainError } from '@domain/errors/domain-errors';
import {
  isAssumptionCategory,
  isAssumptionKind,
  statusesFor,
  type AssumptionCategory,
  type AssumptionKind,
  type AssumptionStatus,
} from '@domain/value-objects/assumption-classifications';
import { entryCode, optionalText, requiredText } from '@domain/value-objects/register-rules';

export interface AssumptionEntryProps {
  code: string;
  kind: AssumptionKind;
  statement: string;
  category: AssumptionCategory;
  /** Ressource du référentiel (identifiant). */
  ownerId: string;
  dueDate: Date | null;
  actions: string | null;
  status: AssumptionStatus;
  comments: string | null;
  riskCode: string | null;
}

/**
 * Hypothèse (tenue pour vraie sans preuve, à valider) ou contrainte (limite imposée)
 * du projet. Une hypothèse invalidée devient un risque : elle se rattache au registre.
 */
export class AssumptionEntry {
  private constructor(readonly props: Readonly<AssumptionEntryProps>) {}

  static create(params: AssumptionEntryProps): AssumptionEntry {
    const code = entryCode(params.code, "d'hypothèse ou de contrainte");
    if (!isAssumptionKind(params.kind) || !isAssumptionCategory(params.category)) {
      throw new DomainError(`Nature ou domaine invalide pour l'entrée ${code}.`);
    }
    if (!statusesFor(params.kind).includes(params.status)) {
      throw new DomainError(`Le statut ${params.status} ne s'applique pas à l'entrée ${code}.`);
    }
    return new AssumptionEntry(
      Object.freeze({
        ...params,
        code,
        statement: requiredText(params.statement, `L'énoncé de l'entrée ${code} est requis.`),
        ownerId: requiredText(params.ownerId, `${code} : choisissez le responsable dans le référentiel des ressources.`),
        actions: optionalText(params.actions),
        comments: optionalText(params.comments),
        dueDate: params.dueDate ? new Date(params.dueDate) : null,
        riskCode: params.riskCode ? entryCode(params.riskCode, 'de risque lié') : null,
      }),
    );
  }

  get code(): string {
    return this.props.code;
  }

  /** En vigueur : contrainte non levée ou hypothèse non invalidée. */
  get isCurrent(): boolean {
    return this.props.status !== 'INVALIDATED' && this.props.status !== 'LIFTED';
  }
}
