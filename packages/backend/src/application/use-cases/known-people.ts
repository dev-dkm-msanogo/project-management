import { DomainError } from '@domain/errors/domain-errors';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import type { ProjectRepository } from '@application/ports/out/project.repository';
import type { ResourceDirectoryRepository } from '@application/ports/out/resource-directory.repository';

/** Personnes désignées par un document : identifiant de ressource et ce qu'elles y font (messages). */
export type PeopleOf<T> = (document: T) => readonly { id: string | null; role: string }[];

/**
 * Dépôt contrôlé : chaque personne d'un document est une ressource du référentiel, désignée par
 * son identifiant (choisie dans une liste, jamais saisie). Un nom saisi avant le référentiel se
 * lit encore, mais le document ne s'enregistre qu'une fois la ressource choisie.
 */
export function withKnownPeople<T>(
  repository: ProjectDocumentRepository<T>,
  directory: ResourceDirectoryRepository,
  peopleOf: PeopleOf<T>,
): ProjectDocumentRepository<T> {
  return {
    findByProjectId: (projectId) => repository.findByProjectId(projectId),
    async save(document) {
      const known = new Set((await directory.list()).map((resource) => resource.props.id));
      const unknown = [
        ...new Set(peopleOf(document).flatMap(({ id, role }) => (id && !known.has(id) ? [`${role} « ${id} »`] : []))),
      ];
      if (unknown.length > 0) {
        throw new DomainError(
          `Absent du référentiel des ressources : ${unknown.join(', ')}. Choisissez une ressource dans la liste ` +
            '(ou faites-la ajouter au référentiel).',
        );
      }
      await repository.save(document);
    },
    delete: (projectId) => repository.delete(projectId),
  };
}

/** Type de document qui désigne des personnes : son libellé et la recherche d'une ressource. */
export interface PersonCitation {
  label: string;
  /** Le document de ce projet désigne-t-il la ressource ? */
  cites(projectId: string, resourceId: string): Promise<boolean>;
}

/** Règle « personnes » d'un type de document : dépôt contrôlé à l'enregistrement et recherche. */
export interface PeopleRule<T> extends PersonCitation {
  checked: ProjectDocumentRepository<T>;
}

export function peopleRule<T>(
  label: string,
  repository: ProjectDocumentRepository<T>,
  directory: ResourceDirectoryRepository,
  peopleOf: PeopleOf<T>,
): PeopleRule<T> {
  return {
    label,
    checked: withKnownPeople(repository, directory, peopleOf),
    async cites(projectId, resourceId) {
      const document = await repository.findByProjectId(projectId);
      return document !== null && peopleOf(document).some(({ id }) => id === resourceId);
    },
  };
}

/** Où une ressource est désignée : « Projet (document, document) » pour chaque projet concerné. */
export function resourceCitations(projects: ProjectRepository, citations: readonly PersonCitation[]) {
  return async (resourceId: string): Promise<string[]> => {
    const found = await Promise.all(
      (await projects.list()).map(async (project) => {
        const cited = await Promise.all(citations.map((citation) => citation.cites(project.id, resourceId)));
        const labels = citations.filter((_, index) => cited[index]).map((citation) => citation.label);
        return labels.length > 0 ? `${project.name} (${labels.join(', ')})` : null;
      }),
    );
    return found.filter((entry): entry is string => entry !== null);
  };
}
