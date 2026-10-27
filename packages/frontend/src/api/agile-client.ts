import type { BacklogDecisionInput, ProductBacklogDto } from '@shared/index';
import { API_BASE_URL, apiFetch, readErrorMessage } from '@/api/http';

/** Décision du Product Owner sur un élément du carnet : accepter (en revue) ou refuser (motif). */
export async function decideBacklogItem(projectId: string, code: string, input: BacklogDecisionInput): Promise<ProductBacklogDto> {
  const url = `${API_BASE_URL}/api/v1/projects/${encodeURIComponent(projectId)}/backlog/${encodeURIComponent(code)}/decision`;
  const response = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `Échec de la décision sur ${code} (HTTP ${response.status}).`));
  }
  return (await response.json()) as ProductBacklogDto;
}
