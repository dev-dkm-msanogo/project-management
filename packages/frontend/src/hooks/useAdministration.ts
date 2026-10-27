import type { UserAdminDto } from '@shared/index';
import { resourceDirectoryApi, usersApi } from '@/api/admin-client';
import { useProjectResource } from '@/hooks/useProjectResource';

/** Données de l'organisation (hors projet) : même cycle de chargement, sous une clé fixe. */

const ORGANIZATION = 'organisation';

const loadUsers = (_key: string, signal: AbortSignal) => usersApi.list(signal);
const loadNoUsers = async (): Promise<UserAdminDto[]> => [];
const loadDirectory = (_key: string, signal: AbortSignal) => resourceDirectoryApi.list(signal);

/** Comptes de la plateforme ; `enabled` à false (non-administrateur) : liste vide, sans appel refusé. */
export const useUsers = (enabled = true) => useProjectResource(ORGANIZATION, enabled ? loadUsers : loadNoUsers);

/** Référentiel des ressources, lisible par tous (taux masqués pour les lecteurs). */
export const useResourceDirectory = () => useProjectResource(ORGANIZATION, loadDirectory);
