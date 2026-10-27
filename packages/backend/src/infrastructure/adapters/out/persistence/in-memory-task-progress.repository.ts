import type { TaskProgress } from '@domain/entities/task-progress';
import type { TaskProgressRepository } from '@application/ports/out/task-progress.repository';

/** Adaptateur SORTANT en mémoire (repli sans base) : une mesure par (projet, tâche). */
export class InMemoryTaskProgressRepository implements TaskProgressRepository {
  private readonly measures = new Map<string, TaskProgress>();

  constructor(seed: readonly TaskProgress[] = []) {
    for (const measure of seed) this.measures.set(this.key(measure.props.projectId, measure.wbs), measure);
  }

  /** « | » n'apparaît ni dans un identifiant de projet ni dans un code WBS. */
  private key(projectId: string, wbs: string): string {
    return `${projectId}|${wbs}`;
  }

  async listByProject(projectId: string): Promise<TaskProgress[]> {
    return [...this.measures.values()].filter((measure) => measure.props.projectId === projectId);
  }

  async save(progress: TaskProgress): Promise<void> {
    this.measures.set(this.key(progress.props.projectId, progress.wbs), progress);
  }

  async delete(projectId: string): Promise<void> {
    for (const [key, measure] of this.measures) {
      if (measure.props.projectId === projectId) this.measures.delete(key);
    }
  }
}
