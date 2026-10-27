import type { EarnedValueDto, MyTasksDto, PortfolioDto, TaskProgressDto, TaskProgressInput } from '@shared/index';
import { API_BASE_URL, apiFetch, readErrorMessage } from '@/api/http';

/** Client du pilotage : avancement d'une tâche, « Mes tâches », valeur acquise, portefeuille. */

const projectUrl = (projectId: string) => `${API_BASE_URL}/api/v1/projects/${encodeURIComponent(projectId)}`;

async function readJson<T>(response: Response, failure: string): Promise<T> {
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `${failure} (HTTP ${response.status}).`));
  }
  return (await response.json()) as T;
}

/** Met à jour l'avancement d'une tâche élémentaire (personne affectée ou éditeur). */
export async function updateTaskProgress(projectId: string, wbs: string, input: TaskProgressInput): Promise<TaskProgressDto> {
  const response = await apiFetch(`${projectUrl(projectId)}/tasks/${encodeURIComponent(wbs)}/progress`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return readJson(response, "Échec de l'enregistrement de l'avancement");
}

export async function fetchMyTasks(signal?: AbortSignal): Promise<MyTasksDto> {
  return readJson(await apiFetch(`${API_BASE_URL}/api/v1/me/tasks`, { signal }), 'Échec du chargement de vos tâches');
}

/** Valeur acquise à une date d'état (par défaut : la dernière mesure d'avancement) ; `null` sans WBS ni estimations. */
export async function fetchEarnedValue(projectId: string, statusDate: string | null, signal?: AbortSignal): Promise<EarnedValueDto | null> {
  const query = statusDate ? `?statusDate=${encodeURIComponent(statusDate)}` : '';
  const response = await apiFetch(`${projectUrl(projectId)}/earned-value${query}`, { signal });
  if (response.status === 404) return null;
  return readJson(response, 'Échec du calcul de la valeur acquise');
}

export async function fetchPortfolio(signal?: AbortSignal): Promise<PortfolioDto> {
  return readJson(await apiFetch(`${API_BASE_URL}/api/v1/portfolio`, { signal }), 'Échec du chargement du portefeuille');
}
