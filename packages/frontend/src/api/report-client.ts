import type {
  ExecutiveReportSummaryDto,
  ExecutiveStatusReportDto,
  ExecutiveStatusReportInput,
} from '@shared/index';
import { API_BASE_URL, apiFetch, readErrorMessage } from '@/api/http';

/** Rapports exécutifs d'un projet : un par mois (AAAA-MM), figé une fois publié. */

function reportsUrl(projectId: string, period?: string): string {
  const base = `${API_BASE_URL}/api/v1/projects/${encodeURIComponent(projectId)}/executive-reports`;
  return period ? `${base}/${period}` : base;
}

async function json<T>(response: Response, failure: string): Promise<T> {
  if (!response.ok) throw new Error(await readErrorMessage(response, `${failure} (HTTP ${response.status}).`));
  return (await response.json()) as T;
}

/** Mois d'un rapport (AAAA-MM) : celui du début de sa période. */
export const periodOf = (input: ExecutiveStatusReportInput): string => input.reportingPeriod.from.slice(0, 7);

/** Historique : les rapports du projet, du mois le plus récent au plus ancien. */
export async function fetchExecutiveReports(projectId: string, signal?: AbortSignal): Promise<ExecutiveReportSummaryDto[]> {
  return json(await apiFetch(reportsUrl(projectId), { signal }), 'Échec du chargement des rapports');
}

export async function fetchExecutiveReport(projectId: string, period: string, signal?: AbortSignal): Promise<ExecutiveStatusReportDto> {
  return json(await apiFetch(reportsUrl(projectId, period), { signal }), 'Échec du chargement du rapport');
}

/** Rédige le rapport de son mois ; `create` : le mois ne doit pas déjà avoir de rapport. */
export async function saveExecutiveReport(
  projectId: string,
  input: ExecutiveStatusReportInput,
  create: boolean,
): Promise<ExecutiveStatusReportDto> {
  const response = await apiFetch(reportsUrl(projectId, periodOf(input)), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(create ? { 'If-None-Match': '*' } : {}) },
    body: JSON.stringify(input),
  });
  return json(response, "Échec de l'enregistrement");
}

/** Publie le rapport d'un mois : il est figé tel quel dans l'historique (chef de projet). */
export async function publishExecutiveReport(projectId: string, period: string): Promise<ExecutiveStatusReportDto> {
  return json(await apiFetch(`${reportsUrl(projectId, period)}/publish`, { method: 'POST' }), 'Échec de la publication');
}

/** Supprime le brouillon d'un mois. */
export async function deleteExecutiveReport(projectId: string, period: string): Promise<void> {
  const response = await apiFetch(reportsUrl(projectId, period), { method: 'DELETE' });
  if (!response.ok) throw new Error(await readErrorMessage(response, `Échec de la suppression (HTTP ${response.status}).`));
}
