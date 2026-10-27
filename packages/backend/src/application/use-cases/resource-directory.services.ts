import type { DirectoryResource } from '@domain/entities/directory-resource';
import { DomainError } from '@domain/errors/domain-errors';
import { ConflictError, NotFoundError } from '@application/errors/application-errors';
import { inputToDirectoryResource, toDirectoryResourceDto } from '@application/mappers/directory-resource.mappers';
import type { ResourceDirectoryAdministration } from '@application/ports/in/admin.use-cases';
import type { IdGenerator } from '@application/ports/out/id-generator';
import type { ResourceDirectoryRepository } from '@application/ports/out/resource-directory.repository';
import type { UserRepository } from '@application/ports/out/user.repository';
import type { DirectoryResourceDto, DirectoryResourceInput, ResourceDirectoryDto } from '@shared/index';

/**
 * Référentiel des ressources de l'organisation : lisible par tous, géré par les administrateurs. Un compte utilisateur se
 * rattache à une seule ressource.
 */
export class ResourceDirectoryService implements ResourceDirectoryAdministration {
  constructor(
    private readonly resources: ResourceDirectoryRepository,
    private readonly users: UserRepository,
    private readonly ids: IdGenerator,
    /** Projets dont les documents désignent la ressource (« Projet (charte, …) »). */
    private readonly citationsOf: (resourceId: string) => Promise<string[]>,
  ) {}

  async list(): Promise<ResourceDirectoryDto> {
    const resources = (await this.resources.list()).sort(
      (a, b) => Number(b.props.active) - Number(a.props.active) || a.props.name.localeCompare(b.props.name, 'fr'),
    );
    return { resources: resources.map(toDirectoryResourceDto) };
  }

  async create(command: { input: DirectoryResourceInput }): Promise<DirectoryResourceDto> {
    const resource = inputToDirectoryResource(this.ids.next('res'), command.input);
    await this.assertAccountLink(resource);
    await this.resources.save(resource);
    return toDirectoryResourceDto(resource);
  }

  async update(command: { resourceId: string; input: DirectoryResourceInput }): Promise<DirectoryResourceDto> {
    await this.find(command.resourceId);
    const resource = inputToDirectoryResource(command.resourceId, command.input);
    await this.assertAccountLink(resource);
    await this.resources.save(resource);
    return toDirectoryResourceDto(resource);
  }

  async delete(command: { resourceId: string }): Promise<void> {
    const resource = await this.find(command.resourceId);
    // Supprimée, elle laisserait dans ces documents une personne inconnue : on l'archive.
    const citations = await this.citationsOf(command.resourceId);
    if (citations.length > 0) {
      throw new ConflictError(
        `${resource.props.name} est désigné(e) dans : ${citations.join(' ; ')}. ` +
          "Archivez la ressource (décochez « Ressource active ») plutôt que de la supprimer.",
      );
    }
    await this.resources.delete(command.resourceId);
  }

  private async find(resourceId: string): Promise<DirectoryResource> {
    const resource = await this.resources.findById(resourceId);
    if (!resource) {
      throw new NotFoundError(`Ressource introuvable : "${resourceId}".`);
    }
    return resource;
  }

  private async assertAccountLink(resource: DirectoryResource): Promise<void> {
    const { userId } = resource.props;
    if (!userId) return;
    if (!(await this.users.findById(userId))) {
      throw new DomainError('Le compte utilisateur rattaché est introuvable.');
    }
    const linked = (await this.resources.list()).find(
      (other) => other.props.userId === userId && other.id !== resource.id,
    );
    if (linked) {
      throw new ConflictError(`Ce compte est déjà rattaché à la ressource « ${linked.props.name} ».`);
    }
  }
}
