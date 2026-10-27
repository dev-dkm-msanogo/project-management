import type { AuditLogDto } from '@shared/index';
import { API_BASE_URL, apiFetch, readErrorMessage } from '@/api/http';

/** Journal d'audit de la plateforme (administrateurs) ; `before` reprend la lecture avant cet événement. */
export async function fetchAuditLog(before: number | null): Promise<AuditLogDto> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/admin/audit${before ? `?before=${before}` : ''}`);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `Échec du chargement du journal d'audit (HTTP ${response.status}).`));
  }
  return (await response.json()) as AuditLogDto;
}
