import type { ExecutiveStatusReportDto } from '@shared/index';
import { fetchExecutiveReport, fetchExecutiveReports } from '@/api/report-client';
import { useProjectResource } from '@/hooks/useProjectResource';

/** Rapports exécutifs : l'historique d'un projet, et le rapport d'un mois. */

const loadReports = (projectId: string, signal: AbortSignal) => fetchExecutiveReports(projectId, signal);

// Clé « projet|mois » (« | » n'apparaît dans aucun identifiant de projet).
const loadReport = (key: string, signal: AbortSignal) => {
  const [projectId, period] = key.split('|');
  return fetchExecutiveReport(projectId!, period!, signal);
};
const loadNoReport = async (): Promise<ExecutiveStatusReportDto | null> => null;

export const useExecutiveReports = (projectId: string) => useProjectResource(projectId, loadReports);

/** Rapport d'un mois ; `period` à `null` : aucun rapport à charger. */
export const useExecutiveReport = (projectId: string, period: string | null) =>
  useProjectResource<ExecutiveStatusReportDto | null>(period ? `${projectId}|${period}` : projectId, period ? loadReport : loadNoReport);
