import type { ApprovalSubject, ProjectApprovalsDto } from '@shared/index';
import { fetchApprovalSnapshot, fetchMyApprovals, fetchProjectApprovals } from '@/api/approval-client';
import { useAuth } from '@/auth/AuthContext';
import { useProjectResource } from '@/hooks/useProjectResource';

/** Circuit de validation : données vivantes, rechargées à chaque visite. */

const loadApprovals = (projectId: string, signal: AbortSignal): Promise<ProjectApprovalsDto | null> =>
  projectId ? fetchProjectApprovals(projectId, signal) : Promise.resolve(null);
const loadMyApprovals = (_key: string, signal: AbortSignal) => fetchMyApprovals(signal);

/** États de validation du projet ; projet vide : rien à charger (document hors circuit). */
export const useApprovals = (projectId: string) => useProjectResource(projectId, loadApprovals);
export const useMyApprovals = () => useProjectResource('organisation', loadMyApprovals);

/** Clé « projet|document|version » ; vide : rien à consulter. */
const loadApprovedVersion = (key: string, signal: AbortSignal) => {
  if (!key) return Promise.resolve(null);
  const [projectId, subject, revision] = key.split('|');
  return fetchApprovalSnapshot(projectId!, subject as ApprovalSubject, Number(revision), signal);
};

/** Version approuvée archivée, chargée seulement quand on la consulte (`revision` non nul). */
export const useApprovedVersion = (projectId: string, subject: ApprovalSubject | undefined, revision: number | null) =>
  useProjectResource(subject && revision ? `${projectId}|${subject}|${revision}` : '', loadApprovedVersion);

/** L'utilisateur connecté est-il valideur (actif) du projet ? Décide des demandes et des attributions. */
export function useIsApprover(projectId: string): boolean {
  const { user } = useAuth();
  const { data } = useApprovals(projectId);
  return Boolean(user && data?.approvers.some((approver) => approver.id === user.id && approver.active));
}
