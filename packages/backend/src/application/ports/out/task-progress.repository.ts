import type { TaskProgress } from '@domain/entities/task-progress';
import type { ProjectScopedStore } from '@application/ports/out/project-document.repository';

/**
 * Port SORTANT : mesures d'avancement des tâches, une par tâche élémentaire. Chaque mise à jour
 * ne touche que sa tâche : deux personnes avancent leurs tâches sans se gêner.
 */
export interface TaskProgressRepository extends ProjectScopedStore {
  listByProject(projectId: string): Promise<TaskProgress[]>;
  save(progress: TaskProgress): Promise<void>;
}
