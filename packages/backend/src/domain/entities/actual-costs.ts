import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, assertUniqueCodes, entryCode, requiredText } from '@domain/value-objects/register-rules';
import { WbsCode } from '@domain/value-objects/wbs-code';

/** Même nature que les estimations : main-d'œuvre ou coûts physiques. */
export const ACTUAL_COST_NATURES = ['LABOR', 'PHYSICAL'] as const;
export type ActualCostNature = (typeof ACTUAL_COST_NATURES)[number];

export interface ActualCostProps {
  code: string;
  date: Date;
  wbsCode: string;
  nature: ActualCostNature;
  description: string;
  supplier: string;
  reference: string;
  amount: number;
}

const day = (date: Date): string => date.toISOString().slice(0, 10);

/** Dépense réelle (facture, service fait) imputée à un élément de la WBS. */
export class ActualCost {
  private constructor(readonly props: Readonly<ActualCostProps>) {}

  static create(params: ActualCostProps): ActualCost {
    const code = entryCode(params.code, 'de dépense');
    if (!(ACTUAL_COST_NATURES as readonly string[]).includes(params.nature)) {
      throw new DomainError(`Dépense ${code} : nature invalide.`);
    }
    if (!Number.isInteger(params.amount) || params.amount <= 0) {
      throw new DomainError(`Dépense ${code} : montant entier strictement positif en FCFA attendu.`);
    }
    return new ActualCost({
      ...params,
      code,
      wbsCode: WbsCode.of(params.wbsCode).value,
      description: requiredText(params.description, `La dépense ${code} doit être décrite.`),
      supplier: params.supplier.trim(),
      reference: params.reference.trim(),
    });
  }

  get code(): string {
    return this.props.code;
  }
}

/** Registre des dépenses réelles du projet, rangées par date : alimente le coût réel (AC). */
export class ActualCosts {
  private constructor(
    readonly projectId: string,
    readonly entries: readonly ActualCost[],
  ) {}

  static create(params: { projectId: string; entries: readonly ActualCost[] }): ActualCosts {
    assertProjectId(params.projectId);
    assertUniqueCodes(params.entries, 'de dépense');
    const entries = [...params.entries].sort(
      (a, b) => a.props.date.getTime() - b.props.date.getTime() || a.code.localeCompare(b.code),
    );
    return new ActualCosts(params.projectId, entries);
  }

  static empty(projectId: string): ActualCosts {
    return ActualCosts.create({ projectId, entries: [] });
  }

  /** Coût réel cumulé jusqu'à cette date incluse (toutes dépenses sans date limite). */
  totalUpTo(date?: Date): number {
    return this.entries
      .filter((entry) => !date || day(entry.props.date) <= day(date))
      .reduce((sum, entry) => sum + entry.props.amount, 0);
  }

  totalOf(nature: ActualCostNature): number {
    return this.entries.filter((entry) => entry.props.nature === nature).reduce((sum, entry) => sum + entry.props.amount, 0);
  }

  /** Dépenses datées après ce jour : une dépense réelle ne peut pas être future. */
  datedAfter(today: Date): string[] {
    return this.entries.filter((entry) => day(entry.props.date) > day(today)).map((entry) => entry.code);
  }
}
