/** Base commune aux clients d'API (DRY). */

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

/** Événement émis quand la session n'est plus valide (401 hors routes d'authentification). */
export const UNAUTHORIZED_EVENT = 'gdp:unauthorized';

/** Message affiché quand l'API ne répond pas (serveur arrêté, réseau coupé). */
const UNREACHABLE_MESSAGE =
  "Le serveur de l'application ne répond pas. Vérifiez qu'il est démarré, puis réessayez.";

/**
 * fetch authentifié : transmet le cookie de session httpOnly (credentials: 'include'),
 * traduit une panne réseau en message lisible et signale une session expirée pour
 * renvoyer l'utilisateur vers la connexion.
 */
export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase();
  let response: Response;
  try {
    response = await fetch(url, { ...withPrecondition(url, method, init), credentials: 'include' });
  } catch (err) {
    // Une requête annulée volontairement (changement de projet ou de page) reste un abandon.
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new Error(UNREACHABLE_MESSAGE);
  }
  if (response.status === 401 && !url.includes('/api/v1/auth/')) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
  rememberVersion(url, method, response);
  return response;
}

/**
 * Concurrence optimiste : la version (ETag) de chaque document lu est retenue par adresse et
 * rappelée à l'enregistrement et à la suppression (If-Match), ou « If-None-Match: * » si le document
 * n'existait pas. Le serveur refuse alors d'écraser ou de supprimer ce qu'un autre utilisateur a
 * enregistré entre-temps (409).
 */
const versions = new Map<string, string | null>();

function withPrecondition(url: string, method: string, init: RequestInit): RequestInit {
  if ((method !== 'PUT' && method !== 'DELETE') || !versions.has(url)) return init;
  const headers = new Headers(init.headers);
  const version = versions.get(url);
  if (version) headers.set('If-Match', version);
  // Supprimer : seulement la version lue. Enregistrer sans version lue : le document ne doit pas exister.
  else if (method === 'PUT') headers.set('If-None-Match', '*');
  else return init;
  return { ...init, headers };
}

function rememberVersion(url: string, method: string, response: Response): void {
  if (method === 'DELETE' && response.ok) versions.set(url, null);
  else if ((method === 'GET' && (response.ok || response.status === 404)) || (method === 'PUT' && response.ok)) {
    versions.set(url, response.headers.get('ETag'));
  }
}

/** Extrait un message d'erreur lisible de la réponse, avec repli générique. */
export async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    if (body && typeof body.message === 'string') return body.message;
  } catch {
    /* corps non-JSON : on garde le message de repli */
  }
  return fallback;
}
