import type {
  ApprovalAction,
  ApprovalSnapshotDto,
  ApprovalSubject,
  ChangeDecisionInput,
  ChangeLogDto,
  PendingApprovalDto,
  ProjectApprovalsDto,
  ProjectApproverDto,
  SourceSelectionAwardInput,
  SourceSelectionsDto,
} from '@shared/index';
import { API_BASE_URL, apiFetch, readErrorMessage } from '@/api/http';

/** Client du circuit de validation : états, étapes, versions approuvées, valideurs, décisions. */

const projectUrl = (projectId: string) => `${API_BASE_URL}/api/v1/projects/${encodeURIComponent(projectId)}`;

async function readJson<T>(response: Response, failure: string): Promise<T> {
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `${failure} (HTTP ${response.status}).`));
  }
  return (await response.json()) as T;
}

const post = (url: string, body: unknown) =>
  apiFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export async function fetchProjectApprovals(projectId: string, signal?: AbortSignal): Promise<ProjectApprovalsDto> {
  return readJson(await apiFetch(`${projectUrl(projectId)}/approvals`, { signal }), 'Échec du chargement des validations');
}

/** Soumettre, retirer, approuver, rejeter ou réviser un document. */
export async function actOnApproval(
  projectId: string,
  subject: ApprovalSubject,
  action: ApprovalAction,
  comment: string | null,
  changeRequest: string | null = null,
): Promise<ProjectApprovalsDto> {
  const response = await post(`${projectUrl(projectId)}/approvals/${subject}/${action.toLowerCase()}`, {
    comment,
    changeRequest,
  });
  return readJson(response, 'Échec de la validation');
}

export async function fetchApprovalSnapshot(
  projectId: string,
  subject: ApprovalSubject,
  revision: number,
  signal?: AbortSignal,
): Promise<ApprovalSnapshotDto> {
  const response = await apiFetch(`${projectUrl(projectId)}/approvals/${subject}/versions/${revision}`, { signal });
  return readJson(response, 'Échec du chargement de la version approuvée');
}

export async function saveProjectApprovers(projectId: string, userIds: string[]): Promise<ProjectApproverDto[]> {
  const response = await apiFetch(`${projectUrl(projectId)}/approvers`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userIds }),
  });
  return readJson(response, "Échec de l'enregistrement des valideurs");
}

export async function fetchMyApprovals(signal?: AbortSignal): Promise<PendingApprovalDto[]> {
  return readJson(await apiFetch(`${API_BASE_URL}/api/v1/me/approvals`, { signal }), 'Échec du chargement des validations');
}

export async function decideChangeRequest(projectId: string, code: string, input: ChangeDecisionInput): Promise<ChangeLogDto> {
  const response = await post(`${projectUrl(projectId)}/change-log/${encodeURIComponent(code)}/decision`, input);
  return readJson(response, "Échec de l'enregistrement de la décision");
}

export async function awardSourceSelection(projectId: string, input: SourceSelectionAwardInput): Promise<SourceSelectionsDto> {
  const response = await post(`${projectUrl(projectId)}/source-selections/award`, input);
  return readJson(response, "Échec de l'attribution");
}
