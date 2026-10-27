import { fetchEarnedValue, fetchMyTasks, fetchPortfolio } from '@/api/performance-client';
import { useProjectResource } from '@/hooks/useProjectResource';

/** Pilotage : données vivantes, rechargées à chaque visite. */

const ORGANIZATION = 'organisation';
const loadMyTasks = (_key: string, signal: AbortSignal) => fetchMyTasks(signal);
const loadPortfolio = (_key: string, signal: AbortSignal) => fetchPortfolio(signal);

/** Clé « projet|date d'état » : changer la date recharge la mesure. */
const loadEarnedValue = (key: string, signal: AbortSignal) => {
  const [projectId, statusDate] = key.split('|');
  return fetchEarnedValue(projectId!, statusDate || null, signal);
};

export const useMyTasks = () => useProjectResource(ORGANIZATION, loadMyTasks);
export const usePortfolio = () => useProjectResource(ORGANIZATION, loadPortfolio);

/** `data` vaut `null` sans WBS datée ni estimations des coûts ; `statusDate` vide : date proposée. */
export const useEarnedValue = (projectId: string, statusDate: string) =>
  useProjectResource(`${projectId}|${statusDate}`, loadEarnedValue);
