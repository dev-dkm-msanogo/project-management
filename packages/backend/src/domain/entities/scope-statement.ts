import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, requiredText } from '@domain/value-objects/register-rules';

export interface ScopeDeliverable {
  name: string;
  description: string;
}

export interface ScopeStatementProps {
  projectId: string;
  preparedOn: Date;
  description: string;
  deliverables: readonly ScopeDeliverable[];
  acceptanceCriteria: readonly string[];
  exclusions: readonly string[];
}

function lines(values: readonly string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}

/**
 * Agrégat racine : l'énoncé du périmètre du projet (description, livrables, critères
 * d'acceptation du produit, exclusions). Les livrables sont nommés de façon unique, car
 * la matrice de traçabilité des exigences s'y réfère par leur nom.
 */
export class ScopeStatement {
  private constructor(readonly props: Readonly<ScopeStatementProps>) {}

  static create(params: ScopeStatementProps): ScopeStatement {
    assertProjectId(params.projectId);
    if (Number.isNaN(params.preparedOn.getTime())) {
      throw new DomainError("Date de préparation de l'énoncé du périmètre invalide.");
    }

    const names = new Set<string>();
    const deliverables = params.deliverables.map((item, index) => {
      const name = requiredText(item.name, `Le livrable n° ${index + 1} doit être nommé.`);
      if (names.has(name.toLowerCase())) {
        throw new DomainError(`Livrable en double : « ${name} ».`);
      }
      names.add(name.toLowerCase());
      return { name, description: item.description.trim() };
    });

    return new ScopeStatement(
      Object.freeze({
        ...params,
        preparedOn: new Date(params.preparedOn),
        description: requiredText(params.description, 'La description du périmètre est requise.'),
        deliverables,
        acceptanceCriteria: lines(params.acceptanceCriteria),
        exclusions: lines(params.exclusions),
      }),
    );
  }

  get projectId(): string {
    return this.props.projectId;
  }
}
