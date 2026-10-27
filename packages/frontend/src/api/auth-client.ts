import type { ChangePasswordInput, LoginInput, UserDto } from '@shared/index';
import { API_BASE_URL, apiFetch, readErrorMessage } from '@/api/http';

const AUTH_URL = `${API_BASE_URL}/api/v1/auth`;

/** Connexion : le serveur pose un cookie de session httpOnly (jamais lisible en JS). */
export async function login(input: LoginInput): Promise<UserDto> {
  const response = await apiFetch(`${AUTH_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `Échec de la connexion (HTTP ${response.status}).`));
  }
  return (await response.json()) as UserDto;
}

export async function logout(): Promise<void> {
  await apiFetch(`${AUTH_URL}/logout`, { method: 'POST' });
}

/** Utilisateur courant, ou null si aucune session valide. */
export async function fetchCurrentUser(signal?: AbortSignal): Promise<UserDto | null> {
  const response = await apiFetch(`${AUTH_URL}/me`, { signal });
  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `Échec de la vérification de session (HTTP ${response.status}).`));
  }
  return (await response.json()) as UserDto;
}

/** Changement de son mot de passe : le serveur renouvelle le cookie de session. */
export async function changePassword(input: ChangePasswordInput): Promise<UserDto> {
  const response = await apiFetch(`${AUTH_URL}/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `Échec du changement de mot de passe (HTTP ${response.status}).`));
  }
  return (await response.json()) as UserDto;
}
