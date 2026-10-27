import type { ExecutiveStatusReport } from '@domain/entities/executive-status-report';
import type { ProjectScopedStore } from '@application/ports/out/project-document.repository';
import type { ExecutiveStatusReportDto } from '@shared/index';

/** Publication d'un rapport : le rapport complet tel que publié, figé. */
export interface ReportPublication {
  at: Date;
  /** Nom du compte qui a publié. */
  by: string;
  report: ExecutiveStatusReportDto;
}

/** Rapport d'un mois, et sa publication s'il a été publié. */
export interface StoredReport {
  report: ExecutiveStatusReport;
  publication: ReportPublication | null;
}

/**
 * Port SORTANT (driven) : rapports exécutifs, un par mois et par projet. Un rapport publié est figé :
 * il reste dans l'historique, il ne se modifie ni ne se supprime.
 */
export interface StatusReportRepository extends ProjectScopedStore {
  /** Rapports du projet, du mois le plus récent au plus ancien. */
  list(projectId: string): Promise<StoredReport[]>;
  find(projectId: string, period: string): Promise<StoredReport | null>;
  /** Rapport du mois le plus récent (tableau de bord du portefeuille). */
  findLatest(projectId: string): Promise<StoredReport | null>;
  /** Crée ou remplace le brouillon de son mois. */
  save(report: ExecutiveStatusReport): Promise<void>;
  publish(projectId: string, period: string, publication: ReportPublication): Promise<void>;
  /** Supprime le brouillon d'un mois. */
  deleteDraft(projectId: string, period: string): Promise<void>;
}
