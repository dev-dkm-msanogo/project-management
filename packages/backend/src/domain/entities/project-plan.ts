import { DomainError } from '@domain/errors/domain-errors';
import type { Project } from '@domain/entities/project';
import type { Task } from '@domain/entities/task';

const MS_PER_DAY = 86_400_000;

export interface ProjectPlanProps {
  project: Project;
  /** Chef de projet : ressource du référentiel (identifiant). */
  managerId: string | null;
  tasks: readonly Task[];
}

/**
 * Agrégat racine : le plan de projet (WBS) d'un projet.
 * Les bornes (début, fin) et la durée totale dérivent des tâches.
 */
export class ProjectPlan {
  private constructor(private readonly props: ProjectPlanProps) {}

  static create(props: ProjectPlanProps): ProjectPlan {
    if (props.tasks.length === 0) {
      throw new DomainError('Un plan de projet doit comporter au moins une tâche.');
    }
    const seen = new Set<string>();
    for (const task of props.tasks) {
      if (seen.has(task.wbs.value)) {
        throw new DomainError(`Code WBS en double : "${task.wbs.value}".`);
      }
      seen.add(task.wbs.value);
    }
    return new ProjectPlan(props);
  }

  get project(): Project {
    return this.props.project;
  }
  get managerId(): string | null {
    return this.props.managerId;
  }
  get tasks(): readonly Task[] {
    return this.props.tasks;
  }

  private datedBounds(): { start: Date; end: Date } | null {
    const starts = this.props.tasks
      .map((task) => task.start)
      .filter((date): date is Date => date !== null);
    const ends = this.props.tasks
      .map((task) => task.end)
      .filter((date): date is Date => date !== null);
    if (starts.length === 0 || ends.length === 0) return null;
    const start = new Date(Math.min(...starts.map((d) => d.getTime())));
    const end = new Date(Math.max(...ends.map((d) => d.getTime())));
    return { start, end };
  }

  get startDate(): Date | null {
    return this.datedBounds()?.start ?? null;
  }
  get endDate(): Date | null {
    return this.datedBounds()?.end ?? null;
  }

  /** Durée totale du projet en jours (inclusive). */
  get durationDays(): number | null {
    const bounds = this.datedBounds();
    if (!bounds) return null;
    return Math.round((bounds.end.getTime() - bounds.start.getTime()) / MS_PER_DAY) + 1;
  }
}
