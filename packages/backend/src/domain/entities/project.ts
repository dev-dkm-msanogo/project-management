import { DomainError } from '@domain/errors/domain-errors';

/** Projet : identité stable à laquelle se rattachent les rapports. */
export class Project {
  private constructor(
    public readonly id: string,
    public readonly name: string,
  ) {}

  static create(id: string, name: string): Project {
    if (!id.trim()) {
      throw new DomainError("L'identifiant du projet est requis.");
    }
    if (!name.trim()) {
      throw new DomainError('Le nom du projet est requis.');
    }
    return new Project(id.trim(), name.trim());
  }
}
