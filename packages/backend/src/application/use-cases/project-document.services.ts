import { DocumentNotFoundError } from '@application/errors/application-errors';
import type {
  DeleteProjectDocumentUseCase,
  GetProjectDocumentUseCase,
  SaveProjectDocumentUseCase,
} from '@application/ports/in/project-document.use-cases';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import { loadOrEmpty } from '@application/use-cases/load-or-empty';

/** Domaine → lecture ; asynchrone quand la lecture s'enrichit d'autres documents du projet. */
export type ToDto<T, Dto> = (document: T) => Dto | Promise<Dto>;

/** Traductions d'un document : saisie → domaine (invariants revalidés) et domaine → lecture. */
export interface DocumentTranslation<T, Input, Dto> {
  fromInput: (projectId: string, input: Input) => T;
  toDto: ToDto<T, Dto>;
  /** Contrôle avant enregistrement, ex. références vers un autre document du projet. */
  beforeSave?: (document: T) => Promise<void>;
}

/** Lecture d'un document rédigé ; `notFound` fournit l'erreur métier (404) s'il est absent. */
export class GetProjectDocumentService<T, Dto> implements GetProjectDocumentUseCase<Dto> {
  constructor(
    private readonly repository: ProjectDocumentRepository<T>,
    private readonly toDto: ToDto<T, Dto>,
    private readonly notFound: (projectId: string) => Error,
  ) {}

  async execute(query: { projectId: string }): Promise<Dto> {
    const document = await this.repository.findByProjectId(query.projectId);
    if (!document) {
      throw this.notFound(query.projectId);
    }
    return this.toDto(document);
  }
}

/** Lecture d'un registre : vide tant que rien n'a été saisi (état valide, jamais 404). */
export class GetProjectRegisterService<T, Dto> implements GetProjectDocumentUseCase<Dto> {
  constructor(
    private readonly repository: ProjectDocumentRepository<T>,
    private readonly toDto: ToDto<T, Dto>,
    private readonly empty: (projectId: string) => T,
  ) {}

  async execute(query: { projectId: string }): Promise<Dto> {
    return this.toDto(await loadOrEmpty(this.repository, query.projectId, this.empty));
  }
}

/** Création ou remplacement d'un document, après revalidation par le domaine. */
export class SaveProjectDocumentService<T, Input, Dto> implements SaveProjectDocumentUseCase<Input, Dto> {
  constructor(
    private readonly repository: ProjectDocumentRepository<T>,
    private readonly translation: DocumentTranslation<T, Input, Dto>,
  ) {}

  async execute(command: { projectId: string; input: Input }): Promise<Dto> {
    const document = this.translation.fromInput(command.projectId, command.input);
    await this.translation.beforeSave?.(document);
    await this.repository.save(document);
    return this.translation.toDto(document);
  }
}

/** Suppression d'un document entier ; `beforeDelete` peut la refuser (entrées encore citées ailleurs). */
export class DeleteProjectDocumentService<T> implements DeleteProjectDocumentUseCase {
  constructor(
    private readonly repository: ProjectDocumentRepository<T>,
    private readonly beforeDelete?: (projectId: string) => Promise<void>,
  ) {}

  async execute(command: { projectId: string }): Promise<void> {
    if (!(await this.repository.findByProjectId(command.projectId))) {
      throw new DocumentNotFoundError("Ce document n'existe pas ou a déjà été supprimé.");
    }
    await this.beforeDelete?.(command.projectId);
    await this.repository.delete(command.projectId);
  }
}
