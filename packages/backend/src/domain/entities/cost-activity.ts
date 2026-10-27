import { DomainError } from '@domain/errors/domain-errors';
import { entryCode, requiredText } from '@domain/value-objects/register-rules';
import { WbsCode } from '@domain/value-objects/wbs-code';

export const COST_ESTIMATE_METHODS = ['ANALOGOUS', 'PARAMETRIC', 'THREE_POINT', 'BOTTOM_UP'] as const;
export type CostEstimateMethod = (typeof COST_ESTIMATE_METHODS)[number];

export const ESTIMATE_CONFIDENCES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type EstimateConfidence = (typeof ESTIMATE_CONFIDENCES)[number];

/** Base de l'estimation : le détail du calcul, propre à chaque méthode. */
export type CostBasis =
  | { method: 'PARAMETRIC'; costVariable: string; unitCost: number; units: number }
  | { method: 'ANALOGOUS'; previousActivity: string; previousCost: number; multiplier: number }
  | { method: 'THREE_POINT'; optimistic: number; mostLikely: number; pessimistic: number }
  | {
      method: 'BOTTOM_UP';
      laborHours: number;
      laborRate: number;
      material: number;
      supplies: number;
      equipment: number;
      travel: number;
      otherDirect: number;
      indirect: number;
      reserve: number;
    };

export interface CostActivityProps {
  code: string;
  wbsCode: string;
  name: string;
  /** Ressource du référentiel (identifiant) ; « » : non précisée. */
  resourceId: string;
  laborCost: number;
  physicalCost: number;
  physicalCostNote: string;
  method: CostEstimateMethod;
  rangePct: number;
  confidence: EstimateConfidence;
  basis: CostBasis | null;
}

/** Montant positif ou nul (FCFA). */
export function costAmount(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new DomainError(`${label} doit être un montant positif ou nul.`);
  }
  return value;
}

/** Montant que donne la base de l'estimation, arrondi au franc. */
export function basisEstimate(basis: CostBasis): number {
  switch (basis.method) {
    case 'PARAMETRIC':
      return Math.round(basis.unitCost * basis.units);
    case 'ANALOGOUS':
      return Math.round(basis.previousCost * basis.multiplier);
    case 'THREE_POINT':
      return Math.round((basis.optimistic + 4 * basis.mostLikely + basis.pessimistic) / 6);
    case 'BOTTOM_UP':
      return Math.round(
        basis.laborHours * basis.laborRate +
          basis.material +
          basis.supplies +
          basis.equipment +
          basis.travel +
          basis.otherDirect +
          basis.indirect +
          basis.reserve,
      );
  }
}

function validBasis(basis: CostBasis, code: string): CostBasis {
  const label = `Base de l'estimation de ${code}`;
  const value = (amount: number, name: string) => costAmount(amount, `${label} : ${name}`);
  switch (basis.method) {
    case 'PARAMETRIC':
      return {
        method: basis.method,
        costVariable: requiredText(basis.costVariable, `${label} : la variable de coût est requise.`),
        unitCost: value(basis.unitCost, 'le coût unitaire'),
        units: value(basis.units, "le nombre d'unités"),
      };
    case 'ANALOGOUS':
      if (!Number.isFinite(basis.multiplier) || basis.multiplier <= 0) {
        throw new DomainError(`${label} : le coefficient doit être strictement positif.`);
      }
      return {
        method: basis.method,
        previousActivity: requiredText(basis.previousActivity, `${label} : l'activité de référence est requise.`),
        previousCost: value(basis.previousCost, 'le coût de référence'),
        multiplier: basis.multiplier,
      };
    case 'THREE_POINT': {
      const optimistic = value(basis.optimistic, "l'estimation optimiste");
      const mostLikely = value(basis.mostLikely, "l'estimation la plus probable");
      const pessimistic = value(basis.pessimistic, "l'estimation pessimiste");
      if (optimistic > mostLikely || mostLikely > pessimistic) {
        throw new DomainError(`${label} : il faut optimiste ≤ plus probable ≤ pessimiste.`);
      }
      return { method: basis.method, optimistic, mostLikely, pessimistic };
    }
    case 'BOTTOM_UP':
      return {
        method: basis.method,
        laborHours: value(basis.laborHours, 'les heures'),
        laborRate: value(basis.laborRate, 'le taux horaire'),
        material: value(basis.material, 'le matériel'),
        supplies: value(basis.supplies, 'les fournitures'),
        equipment: value(basis.equipment, 'les équipements'),
        travel: value(basis.travel, 'les déplacements'),
        otherDirect: value(basis.otherDirect, 'les autres coûts directs'),
        indirect: value(basis.indirect, 'les coûts indirects'),
        reserve: value(basis.reserve, 'la réserve'),
      };
  }
}

/**
 * Activité estimée (template « Activity Cost Estimates ») : coûts de main-d'œuvre et
 * physiques, méthode, fourchette et confiance. Sa base d'estimation, facultative, suit
 * forcément la méthode de l'activité.
 */
export class CostActivity {
  private constructor(readonly props: Readonly<CostActivityProps>) {}

  static create(params: CostActivityProps): CostActivity {
    const code = entryCode(params.code, "d'activité");
    if (
      !(COST_ESTIMATE_METHODS as readonly string[]).includes(params.method) ||
      !(ESTIMATE_CONFIDENCES as readonly string[]).includes(params.confidence)
    ) {
      throw new DomainError(`Méthode ou niveau de confiance invalide pour l'activité ${code}.`);
    }
    if (!Number.isFinite(params.rangePct) || params.rangePct < 0 || params.rangePct > 100) {
      throw new DomainError(`La fourchette de l'activité ${code} doit être comprise entre 0 et 100 %.`);
    }
    if (params.basis && params.basis.method !== params.method) {
      throw new DomainError(`La base de l'estimation de ${code} doit suivre sa méthode d'estimation.`);
    }
    const wbsCode = params.wbsCode.trim();

    return new CostActivity(
      Object.freeze({
        ...params,
        code,
        wbsCode: wbsCode ? WbsCode.of(wbsCode).value : '',
        name: requiredText(params.name, `L'activité ${code} doit être nommée.`),
        resourceId: params.resourceId.trim(),
        laborCost: costAmount(params.laborCost, `Le coût de main-d'œuvre de ${code}`),
        physicalCost: costAmount(params.physicalCost, `Le coût physique de ${code}`),
        physicalCostNote: params.physicalCostNote.trim(),
        basis: params.basis ? Object.freeze(validBasis(params.basis, code)) : null,
      }),
    );
  }

  get code(): string {
    return this.props.code;
  }

  /** Coût direct de l'activité : main-d'œuvre + coûts physiques. */
  get direct(): number {
    return this.props.laborCost + this.props.physicalCost;
  }

  get basisEstimate(): number | null {
    return this.props.basis ? basisEstimate(this.props.basis) : null;
  }
}
