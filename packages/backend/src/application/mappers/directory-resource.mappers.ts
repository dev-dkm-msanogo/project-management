import { DirectoryResource } from '@domain/entities/directory-resource';
import type { DirectoryResourceDto, DirectoryResourceInput } from '@shared/index';

/** Traductions du référentiel des ressources : domaine ⇄ saisie ⇄ lecture. */

export function inputToDirectoryResource(id: string, input: DirectoryResourceInput): DirectoryResource {
  return DirectoryResource.create({ ...input, id });
}

export function toDirectoryResourceDto(resource: DirectoryResource): DirectoryResourceDto {
  return { ...resource.props, skills: [...resource.props.skills] };
}
