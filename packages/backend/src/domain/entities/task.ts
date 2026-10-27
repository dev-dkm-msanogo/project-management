import { DomainError } from '@domain/errors/domain-errors';
import type { TaskStatus } from '@domain/value-objects/task-status';
import { WbsCode } from '@domain/value-objects/wbs-code';

const MS_PER_DAY = 86_400_000;

/**
 * Tâche du plan de projet (élément WBS).
 * La durée (en jours, inclusive) est calculée à partir des dates début/fin.
 */
export class Task {
  private constructor(
    public readonly wbs: WbsCode,
    public readonly name: string,
    public readonly status: TaskStatus,
    /** Ressource du référentiel affectée (identifiant). */
    public readonly assigneeId: string | null,
    public readonly start: Date | null,
    public readonly end: Date | null,
    public readonly comments: string | null,
  ) {}

  static create(params: {
    wbs: string;
    name: string;
    status: TaskStatus;
    assigneeId?: string | null;
    start?: Date | null;
    end?: Date | null;
    comments?: string | null;
  }): Task {
    if (!params.name.trim()) {
      throw new DomainError('Le nom de la tâche est requis.');
    }
    const start = params.start ?? null;
    const end = params.end ?? null;
    if (start && end && end.getTime() < start.getTime()) {
      throw new DomainError(
        `La date de fin ne peut pas précéder la date de début (tâche "${params.name}").`,
      );
    }
    const assigneeId = params.assigneeId?.trim();
    const comments = params.comments?.trim();
    return new Task(
      WbsCode.of(params.wbs),
      params.name.trim(),
      params.status,
      assigneeId ? assigneeId : null,
      start ? new Date(start) : null,
      end ? new Date(end) : null,
      comments ? comments : null,
    );
  }

  /** Même tâche, à d'autres dates (ordonnancement par le réseau d'activités). */
  withDates(start: Date, end: Date): Task {
    return Task.create({
      wbs: this.wbs.value,
      name: this.name,
      status: this.status,
      assigneeId: this.assigneeId,
      start,
      end,
      comments: this.comments,
    });
  }

  /** Durée en jours (inclusive), ou null si les dates sont incomplètes. */
  get durationDays(): number | null {
    if (!this.start || !this.end) return null;
    return Math.round((this.end.getTime() - this.start.getTime()) / MS_PER_DAY) + 1;
  }

  get level(): number {
    return this.wbs.level;
  }
}
