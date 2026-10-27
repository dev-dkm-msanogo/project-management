import { Project } from '@domain/entities/project';
import { ProjectPlan } from '@domain/entities/project-plan';
import { Task } from '@domain/entities/task';
import type { TaskStatus } from '@domain/value-objects/task-status';
import { ALPHA_ASSIGNEES } from '@infrastructure/adapters/out/persistence/seed/project-alpha-performance.seed';

/** Date UTC (évite les décalages de fuseau sur les dates "jour"). */
const d = (month1to12: number, day: number): Date =>
  new Date(Date.UTC(2025, month1to12 - 1, day));

const task = (
  wbs: string,
  name: string,
  status: TaskStatus,
  start: Date,
  end: Date,
): Task => Task.create({ wbs, name, status, start, end, assigneeId: ALPHA_ASSIGNEES[wbs] ?? null });

/**
 * Plan de projet de démonstration « Projet Alpha » (WBS + Gantt), en français.
 * Structure et dates fidèles au modèle de plan de projet de référence.
 */
export function buildProjectAlphaPlan(): ProjectPlan {
  return ProjectPlan.create({
    project: Project.create('project-alpha', 'Projet Alpha'),
    managerId: 'res-awa-diop',
    tasks: [
      // 1. Conception et lancement
      task('1', 'Conception et lancement du projet', 'COMPLETE', d(1, 2), d(2, 9)),
      task('1.1', 'Charte du projet', 'COMPLETE', d(1, 2), d(1, 11)),
      task('1.1.1', 'Révisions de la charte du projet', 'COMPLETE', d(1, 7), d(1, 11)),
      task('1.2', 'Recherche', 'COMPLETE', d(1, 10), d(2, 23)),
      task('1.3', 'Projections', 'COMPLETE', d(1, 10), d(1, 20)),
      task('1.4', 'Parties prenantes', 'COMPLETE', d(1, 16), d(1, 29)),
      task('1.5', 'Directives', 'IN_PROGRESS', d(1, 19), d(2, 1)),
      task('1.6', 'Lancement du projet', 'IN_PROGRESS', d(1, 22), d(2, 9)),

      // 2. Définition et planification
      task('2', 'Définition et planification du projet', 'IN_PROGRESS', d(1, 28), d(2, 14)),
      task('2.1', "Définition du champ d'application et de l'objectif", 'ON_HOLD', d(1, 28), d(2, 6)),
      task('2.2', 'Budget', 'IN_PROGRESS', d(1, 31), d(2, 2)),
      task('2.3', 'Plan de communication', 'IN_PROGRESS', d(2, 4), d(2, 12)),
      task('2.4', 'Gestion des risques', 'COMPLETE', d(2, 6), d(2, 14)),

      // 3. Lancement et exécution
      task('3', 'Lancement et exécution du projet', 'COMPLETE', d(2, 13), d(3, 12)),
      task('3.1', 'Statut et suivi', 'IN_PROGRESS', d(2, 13), d(3, 12)),
      task('3.2', 'Indicateurs clés de performance (ICP)', 'IN_PROGRESS', d(2, 15), d(2, 23)),
      task('3.2.1', 'Supervision', 'IN_PROGRESS', d(2, 15), d(2, 20)),
      task('3.2.2', 'Prévisions', 'NOT_STARTED', d(2, 21), d(2, 26)),
      task('3.3', 'Actualisations du projet', 'NOT_STARTED', d(2, 26), d(3, 5)),
      task('3.3.1', 'Actualisations des diagrammes', 'IN_PROGRESS', d(2, 28), d(3, 5)),

      // 4. Supervision / performances
      task('4', 'Supervision / performances du projet', 'IN_PROGRESS', d(3, 1), d(3, 26)),
      task('4.1', 'Objectifs du projet', 'IN_PROGRESS', d(3, 1), d(3, 12)),
      task('4.2', 'Livrables qualité', 'ON_HOLD', d(3, 5), d(3, 14)),
      task('4.3', 'Suivi des efforts et des coûts', 'NOT_STARTED', d(3, 10), d(3, 20)),
      task('4.4', 'Performances du projet', 'NOT_STARTED', d(3, 12), d(3, 26)),
    ],
  });
}
