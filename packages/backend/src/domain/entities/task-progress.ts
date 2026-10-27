import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, optionalText } from '@domain/value-objects/register-rules';
import { isTaskStatus, type TaskStatus } from '@domain/value-objects/task-status';
import { WbsCode } from '@domain/value-objects/wbs-code';

export interface TaskProgressProps {
  projectId: string;
  wbs: string;
  status: TaskStatus;
  /** 0 à 100. */
  percentComplete: number;
  actualStart: Date | null;
  actualFinish: Date | null;
  /** Date de la mesure (« situation au »). */
  asOf: Date;
  note: string | null;
  updatedBy: string;
  updatedAt: Date;
}

const day = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Avancement d'une tâche élémentaire à une date de mesure : statut, pourcentage réalisé et dates
 * réelles, cohérents entre eux et jamais postérieurs au jour de la saisie.
 */
export class TaskProgress {
  private constructor(readonly props: Readonly<TaskProgressProps>) {}

  static create(params: TaskProgressProps, today: Date): TaskProgress {
    assertProjectId(params.projectId);
    const wbs = WbsCode.of(params.wbs).value;
    const { status, percentComplete: percent, actualStart, actualFinish, asOf } = params;
    if (!isTaskStatus(status)) {
      throw new DomainError(`Statut d'avancement invalide : "${status}".`);
    }
    if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
      throw new DomainError("L'avancement doit être un pourcentage entier de 0 à 100.");
    }
    if (day(asOf) > day(today)) {
      throw new DomainError('La date de situation ne peut pas être dans le futur.');
    }
    if (actualStart && day(actualStart) > day(asOf)) {
      throw new DomainError('Le début réel ne peut pas suivre la date de situation.');
    }
    if (actualFinish && day(actualFinish) > day(asOf)) {
      throw new DomainError('La fin réelle ne peut pas suivre la date de situation.');
    }
    if (actualStart && actualFinish && day(actualFinish) < day(actualStart)) {
      throw new DomainError('La fin réelle ne peut pas précéder le début réel.');
    }
    if (status === 'NOT_STARTED' && (percent !== 0 || actualStart || actualFinish)) {
      throw new DomainError("Une tâche non commencée n'a ni avancement ni date réelle.");
    }
    if (status === 'COMPLETE' && (percent !== 100 || !actualStart || !actualFinish)) {
      throw new DomainError('Une tâche terminée est à 100 % avec ses dates réelles de début et de fin.');
    }
    if (status === 'IN_PROGRESS' || status === 'ON_HOLD') {
      if (!actualStart) throw new DomainError('Une tâche commencée a une date réelle de début.');
      if (actualFinish || percent === 100) {
        throw new DomainError("Une tâche en cours ou suspendue n'est ni à 100 % ni achevée : passez-la à « Terminée ».");
      }
    }
    const updatedBy = params.updatedBy.trim();
    return new TaskProgress({ ...params, wbs, note: optionalText(params.note), updatedBy });
  }

  get wbs(): string {
    return this.props.wbs;
  }

  /** Mesure réelle saisie (au-delà de « non commencée ») : elle cite son élément de WBS. */
  get started(): boolean {
    return this.props.status !== 'NOT_STARTED';
  }
}
