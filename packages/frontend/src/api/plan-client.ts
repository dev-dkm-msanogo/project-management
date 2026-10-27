import type {
  DocumentVersionsDto,
  ProjectPlanDto,
  ProjectPlanInput,
  ScheduleModelInput,
  SchedulePreviewDto,
} from '@shared/index';
import { API_BASE_URL, apiFetch, readErrorMessage } from '@/api/http';
import type { DocumentHistoryApi } from '@/api/project-documents';

function planUrl(projectId: string): string {
  return `${API_BASE_URL}/api/v1/projects/${encodeURIComponent(projectId)}/plan`;
}

/** Récupère le plan de projet (WBS). */
export async function fetchProjectPlan(
  projectId: string,
  signal?: AbortSignal,
): Promise<ProjectPlanDto> {
  const response = await apiFetch(planUrl(projectId), { signal });
  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, `Échec du chargement du plan (HTTP ${response.status}).`),
    );
  }
  return (await response.json()) as ProjectPlanDto;
}

/** Crée ou met à jour (upsert) le plan de projet. */
export async function saveProjectPlan(
  projectId: string,
  input: ProjectPlanInput,
  signal?: AbortSignal,
): Promise<ProjectPlanDto> {
  const response = await apiFetch(planUrl(projectId), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, `Échec de l'enregistrement du plan (HTTP ${response.status}).`),
    );
  }
  return (await response.json()) as ProjectPlanDto;
}

/** Historique de la WBS : versions enregistrées et contenu de l'une d'elles. */
export const planHistoryApi: DocumentHistoryApi<ProjectPlanDto> = {
  async versions(projectId, signal) {
    const response = await apiFetch(`${planUrl(projectId)}/versions`, { signal });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, `Échec du chargement de l'historique du plan (HTTP ${response.status}).`));
    }
    return (await response.json()) as DocumentVersionsDto;
  },
  async fetchVersion(projectId, version) {
    const response = await apiFetch(`${planUrl(projectId)}?version=${version}`);
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, `Échec du chargement de la version ${version} du plan (HTTP ${response.status}).`));
    }
    return (await response.json()) as ProjectPlanDto;
  },
};

/** Aperçu d'un modèle d'ordonnancement modifié (Gantt) : réseau et dates de la WBS, sans enregistrer. */
export async function previewSchedule(projectId: string, input: ScheduleModelInput): Promise<SchedulePreviewDto> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/projects/${encodeURIComponent(projectId)}/schedule-model/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `Échec du recalcul de l'échéancier (HTTP ${response.status}).`));
  }
  return (await response.json()) as SchedulePreviewDto;
}
