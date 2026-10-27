import type {
  CreateProjectInput,
  ProjectRecordDto,
  ProjectTeamDto,
  ProjectTeamInput,
  UpdateProjectInput,
} from '@shared/index';
import { API_BASE_URL, apiFetch, readErrorMessage } from '@/api/http';

const PROJECTS_URL = `${API_BASE_URL}/api/v1/projects`;

/** Liste tous les projets du registre. */
export async function fetchProjects(signal?: AbortSignal): Promise<ProjectRecordDto[]> {
  const response = await apiFetch(PROJECTS_URL, { signal });
  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, `Échec du chargement des projets (HTTP ${response.status}).`),
    );
  }
  return (await response.json()) as ProjectRecordDto[];
}

/** Crée un projet (l'identifiant est généré côté serveur). */
export async function createProject(
  input: CreateProjectInput,
  signal?: AbortSignal,
): Promise<ProjectRecordDto> {
  const response = await apiFetch(PROJECTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, `Échec de la création du projet (HTTP ${response.status}).`),
    );
  }
  return (await response.json()) as ProjectRecordDto;
}

/** Modifie le nom, la description et le statut d'un projet (son identifiant ne change pas). */
export async function updateProject(projectId: string, input: UpdateProjectInput): Promise<ProjectRecordDto> {
  const response = await apiFetch(`${PROJECTS_URL}/${encodeURIComponent(projectId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, `Échec de la modification du projet (HTTP ${response.status}).`),
    );
  }
  return (await response.json()) as ProjectRecordDto;
}

/** Supprime un projet et, en cascade, tous ses documents. */
export async function deleteProject(projectId: string, signal?: AbortSignal): Promise<void> {
  const response = await apiFetch(`${PROJECTS_URL}/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
    signal,
  });
  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, `Échec de la suppression du projet (HTTP ${response.status}).`),
    );
  }
}

const teamUrl = (projectId: string) => `${PROJECTS_URL}/${encodeURIComponent(projectId)}/members`;

/** Équipe d'un projet (et comptes proposés à l'ajout pour qui la gère). */
export async function fetchProjectTeam(projectId: string, signal?: AbortSignal): Promise<ProjectTeamDto> {
  const response = await apiFetch(teamUrl(projectId), { signal });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `Échec du chargement de l'équipe (HTTP ${response.status}).`));
  }
  return (await response.json()) as ProjectTeamDto;
}

/** Remplace l'équipe d'un projet (chef de projet). */
export async function saveProjectTeam(projectId: string, input: ProjectTeamInput): Promise<ProjectTeamDto> {
  const response = await apiFetch(teamUrl(projectId), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `Échec de l'enregistrement de l'équipe (HTTP ${response.status}).`));
  }
  return (await response.json()) as ProjectTeamDto;
}
