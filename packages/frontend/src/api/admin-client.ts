import type {
  CreateUserInput,
  DirectoryResourceDto,
  DirectoryResourceInput,
  ResourceDirectoryDto,
  UpdateUserInput,
  UserAdminDto,
  UserCredentialsDto,
} from '@shared/index';
import { API_BASE_URL, apiFetch, readErrorMessage } from '@/api/http';

/** Client de l'administration : comptes (ADMIN) et référentiel des ressources. */

const ADMIN_URL = `${API_BASE_URL}/api/v1/admin`;

async function request<T>(url: string, init: RequestInit, failure: string): Promise<T> {
  const response = await apiFetch(url, {
    ...init,
    headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `${failure} (HTTP ${response.status}).`));
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}

export const usersApi = {
  list: (signal?: AbortSignal) =>
    request<UserAdminDto[]>(`${ADMIN_URL}/users`, { signal }, 'Échec du chargement des comptes'),
  create: (input: CreateUserInput) =>
    request<UserCredentialsDto>(
      `${ADMIN_URL}/users`,
      { method: 'POST', body: JSON.stringify(input) },
      'Échec de la création du compte',
    ),
  update: (userId: string, input: UpdateUserInput) =>
    request<UserAdminDto>(
      `${ADMIN_URL}/users/${encodeURIComponent(userId)}`,
      { method: 'PUT', body: JSON.stringify(input) },
      'Échec de la mise à jour du compte',
    ),
  resetPassword: (userId: string) =>
    request<UserCredentialsDto>(
      `${ADMIN_URL}/users/${encodeURIComponent(userId)}/reset-password`,
      { method: 'POST' },
      'Échec de la réinitialisation du mot de passe',
    ),
};

export const resourceDirectoryApi = {
  list: (signal?: AbortSignal) =>
    request<ResourceDirectoryDto>(`${API_BASE_URL}/api/v1/resources`, { signal }, 'Échec du chargement du référentiel'),
  create: (input: DirectoryResourceInput) =>
    request<DirectoryResourceDto>(
      `${ADMIN_URL}/resources`,
      { method: 'POST', body: JSON.stringify(input) },
      'Échec de la création de la ressource',
    ),
  update: (resourceId: string, input: DirectoryResourceInput) =>
    request<DirectoryResourceDto>(
      `${ADMIN_URL}/resources/${encodeURIComponent(resourceId)}`,
      { method: 'PUT', body: JSON.stringify(input) },
      'Échec de la mise à jour de la ressource',
    ),
  remove: (resourceId: string) =>
    request<void>(
      `${ADMIN_URL}/resources/${encodeURIComponent(resourceId)}`,
      { method: 'DELETE' },
      'Échec de la suppression de la ressource',
    ),
};
