import { ActualCost, ActualCosts, type ActualCostNature } from '@domain/entities/actual-costs';
import { TaskProgress } from '@domain/entities/task-progress';
import type { TaskStatus } from '@domain/value-objects/task-status';

/**
 * Données de démonstration du pilotage « Projet Alpha » (simulées, à la demande de l'utilisateur) :
 * personnes affectées aux tâches élémentaires, avancement au 21 février 2025 et dépenses réelles
 * jusqu'à cette date. Les dates prévues de la WBS et du Gantt ne changent pas.
 */

const d = (month1to12: number, day: number): Date => new Date(Date.UTC(2025, month1to12 - 1, day));
const AS_OF = d(2, 21);

/** Tâche élémentaire → ressource du référentiel. */
export const ALPHA_ASSIGNEES: Readonly<Record<string, string>> = {
  '1.1.1': 'res-mamadou-ba',
  '1.2': 'res-fatou-ndiaye',
  '1.3': 'res-ibrahima-fall',
  '1.4': 'res-mamadou-ba',
  '1.5': 'res-mamadou-ba',
  '1.6': 'res-mamadou-ba',
  '2.1': 'res-fatou-ndiaye',
  '2.2': 'res-fatou-sow',
  '2.3': 'res-mamadou-ba',
  '2.4': 'res-mamadou-ba',
  '3.1': 'res-mamadou-ba',
  '3.2.1': 'res-integrateur',
  '3.2.2': 'res-integrateur',
  '3.3.1': 'res-ibrahima-fall',
  '4.1': 'res-integrateur',
  '4.2': 'res-khady-sarr',
  '4.3': 'res-fatou-sow',
  '4.4': 'res-aminata-diallo',
};

type Measure = [wbs: string, status: TaskStatus, percent: number, start: Date | null, finish: Date | null, note: string | null, by: string];

const MEASURES: readonly Measure[] = [
  ['1.1.1', 'COMPLETE', 100, d(1, 7), d(1, 13), 'Charte signée par le sponsor avec deux jours de retard.', 'Mamadou Ba'],
  ['1.2', 'IN_PROGRESS', 85, d(1, 13), null, 'Deux ateliers métier restent à tenir.', 'Fatou Ndiaye'],
  ['1.3', 'COMPLETE', 100, d(1, 10), d(1, 22), null, 'Ibrahima Fall'],
  ['1.4', 'COMPLETE', 100, d(1, 16), d(1, 31), null, 'Mamadou Ba'],
  ['1.5', 'COMPLETE', 100, d(1, 20), d(2, 5), null, 'Mamadou Ba'],
  ['1.6', 'COMPLETE', 100, d(1, 27), d(2, 12), 'Séminaire de lancement tenu le 12 février.', 'Mamadou Ba'],
  ['2.1', 'ON_HOLD', 60, d(1, 29), null, 'En attente de la validation du périmètre par le comité de pilotage.', 'Fatou Ndiaye'],
  ['2.2', 'COMPLETE', 100, d(1, 31), d(2, 4), null, 'Fatou Sow'],
  ['2.3', 'IN_PROGRESS', 70, d(2, 6), null, null, 'Mamadou Ba'],
  ['2.4', 'COMPLETE', 100, d(2, 6), d(2, 14), null, 'Mamadou Ba'],
  ['3.1', 'IN_PROGRESS', 25, d(2, 14), null, null, 'Mamadou Ba'],
  ['3.2.1', 'IN_PROGRESS', 50, d(2, 17), null, "Retard de l'API du prestataire (voir I-002).", 'Prestataire intégrateur'],
  ['3.2.2', 'NOT_STARTED', 0, null, null, null, 'Mamadou Ba'],
  ['3.3.1', 'NOT_STARTED', 0, null, null, null, 'Mamadou Ba'],
  ['4.1', 'NOT_STARTED', 0, null, null, null, 'Mamadou Ba'],
  ['4.2', 'NOT_STARTED', 0, null, null, null, 'Mamadou Ba'],
  ['4.3', 'NOT_STARTED', 0, null, null, null, 'Mamadou Ba'],
  ['4.4', 'NOT_STARTED', 0, null, null, null, 'Mamadou Ba'],
];

export function buildProjectAlphaTaskProgress(): TaskProgress[] {
  return MEASURES.map(([wbs, status, percentComplete, actualStart, actualFinish, note, updatedBy]) =>
    TaskProgress.create(
      { projectId: 'project-alpha', wbs, status, percentComplete, actualStart, actualFinish, asOf: AS_OF, note, updatedBy, updatedAt: AS_OF },
      AS_OF,
    ),
  );
}

type Expense = [code: string, date: Date, wbsCode: string, nature: ActualCostNature, description: string, supplier: string, reference: string, amount: number];

const EXPENSES: readonly Expense[] = [
  ['D-001', d(1, 15), '1.1', 'LABOR', 'Rédaction et approbation de la charte', 'DSI Dakar Mobilité', 'Temps interne janvier', 6_500_000],
  ['D-002', d(1, 24), '1.3', 'PHYSICAL', 'Étude de dimensionnement technique', 'Prestataire intégrateur', 'FAC-2025-014', 19_500_000],
  ['D-003', d(1, 31), '1.2', 'LABOR', 'Ateliers de recueil des besoins (janvier)', 'Cabinet Conseil Métier', 'FAC-2025-019', 38_000_000],
  ['D-004', d(1, 31), '1.4', 'LABOR', 'Analyse des parties prenantes', 'DSI Dakar Mobilité', 'Temps interne janvier', 4_200_000],
  ['D-005', d(2, 10), '2.1', 'LABOR', 'Définition du périmètre et des objectifs', 'Cabinet Conseil Métier', 'FAC-2025-024', 8_500_000],
  ['D-006', d(2, 12), '1.6', 'PHYSICAL', 'Séminaire de lancement : salle et restauration', 'Hôtel Terrou-Bi', 'FAC-2025-027', 3_100_000],
  ['D-007', d(2, 12), '1.6', 'LABOR', 'Préparation et animation du lancement', 'DSI Dakar Mobilité', 'Temps interne février', 5_500_000],
  ['D-008', d(2, 14), '2.4', 'LABOR', "Atelier d'analyse des risques", 'DSI Dakar Mobilité', 'Temps interne février', 6_800_000],
  ['D-009', d(2, 18), '3.2', 'PHYSICAL', 'Maquettes du tableau de bord de direction', 'Prestataire intégrateur', 'FAC-2025-029', 30_000_000],
  ['D-010', d(2, 20), '3', 'PHYSICAL', 'Licences de la plateforme : acompte de 30 %', 'Prestataire intégrateur', 'FAC-2025-031', 300_000_000],
  ['D-011', d(2, 20), '3.1', 'LABOR', "Pilotage de l'exécution (février)", 'DSI Dakar Mobilité', 'Temps interne février', 9_000_000],
  ['D-012', d(2, 21), '1.2', 'LABOR', 'Ateliers de recueil des besoins (février)', 'Cabinet Conseil Métier', 'FAC-2025-033', 34_000_000],
];

export function buildProjectAlphaActualCosts(): ActualCosts {
  return ActualCosts.create({
    projectId: 'project-alpha',
    entries: EXPENSES.map(([code, date, wbsCode, nature, description, supplier, reference, amount]) =>
      ActualCost.create({ code, date, wbsCode, nature, description, supplier, reference, amount }),
    ),
  });
}
