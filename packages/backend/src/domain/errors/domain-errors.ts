/**
 * Erreurs du domaine : violations de règles métier ou d'invariants.
 * Elles n'exposent aucun détail technique (HTTP, base de données, etc.).
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Un invariant du modèle a été violé (ex. agrégat dans un état impossible). */
export class InvariantViolationError extends DomainError {}
