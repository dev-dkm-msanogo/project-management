/** Erreurs de la couche application (cas d'usage). */
export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Ressource demandée introuvable (traduite en 404 par l'adaptateur HTTP). */
export class NotFoundError extends ApplicationError {}

export class PlanNotFoundError extends NotFoundError {
  constructor(public readonly projectId: string) {
    super(`Aucun plan de projet trouvé pour le projet "${projectId}".`);
  }
}

export class ProjectNotFoundError extends NotFoundError {
  constructor(public readonly projectId: string) {
    super(`Aucun projet trouvé pour l'identifiant "${projectId}".`);
  }
}

export class CharterNotFoundError extends NotFoundError {
  constructor(public readonly projectId: string) {
    super(`Aucune charte trouvée pour le projet "${projectId}".`);
  }
}

/** Document de projet pas encore rédigé (message propre à chaque document). */
export class DocumentNotFoundError extends NotFoundError {}

/** Identifiants de connexion invalides (message générique : anti-énumération). */
export class InvalidCredentialsError extends ApplicationError {
  constructor() {
    super('E-mail ou mot de passe invalide.');
  }
}

/** Authentification requise ou session invalide. */
export class AuthenticationError extends ApplicationError {
  constructor(message = 'Authentification requise.') {
    super(message);
  }
}

/** Action refusée à cet utilisateur pour cette donnée, ex. une tâche qui ne lui est pas affectée (403). */
export class ForbiddenError extends ApplicationError {}

/** Conflit avec l'existant, ex. adresse e-mail déjà utilisée (traduit en 409). */
export class ConflictError extends ApplicationError {}
