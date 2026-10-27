import type { DirectoryResourceDto, DirectoryResourceInput, ProjectRole, ResourceKind, Role } from '@shared/index';
import { matchesQuery } from '@/lib/format';

/** Libellés et conversions de l'administration (comptes, référentiel des ressources). */

/** Rôles dans un projet. */
export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  MANAGER: 'Chef de projet',
  CONTRIBUTOR: 'Contributeur',
  READER: 'Lecteur',
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrateur',
  EDITOR: 'Éditeur',
  VIEWER: 'Lecteur',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: 'Administrateur · tout, y compris comptes et suppression de projets',
  EDITOR: 'Éditeur · rédige et modifie les documents des projets',
  VIEWER: 'Lecteur · consultation seule',
};

export const RESOURCE_KIND_LABELS: Record<ResourceKind, string> = {
  INTERNAL: 'Interne',
  EXTERNAL: 'Prestataire externe',
};

const DATE_TIME_FR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Date et heure locales, ex. « 22 oct. 2026, 14:05 ». */
export function formatDateTime(iso: string | null): string {
  return iso ? DATE_TIME_FR.format(new Date(iso)) : 'Jamais';
}

export function blankDirectoryResource(): DirectoryResourceInput {
  return {
    name: '',
    kind: 'INTERNAL',
    jobTitle: '',
    department: '',
    email: null,
    skills: [],
    userId: null,
    active: true,
  };
}

export function directoryResourceToInput(resource: DirectoryResourceDto): DirectoryResourceInput {
  const { id: _id, ...input } = resource;
  return structuredClone(input);
}

/** Recherche plein texte : nom, fonction, service et compétences, sans accents ni casse. */
export function matchesResource(resource: DirectoryResourceDto, query: string): boolean {
  return matchesQuery([resource.name, resource.jobTitle, resource.department, ...resource.skills], query);
}
