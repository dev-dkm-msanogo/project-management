import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, assertUniqueCodes, entryCode, requiredText } from '@domain/value-objects/register-rules';

export const BACKLOG_ITEM_TYPES = ['EPIC', 'STORY', 'DEFECT', 'TECHNICAL'] as const;
export type BacklogItemType = (typeof BACKLOG_ITEM_TYPES)[number];

export const BACKLOG_ITEM_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;
export type BacklogItemStatus = (typeof BACKLOG_ITEM_STATUSES)[number];

export const BACKLOG_PRIORITIES = ['MUST', 'SHOULD', 'COULD', 'WONT'] as const;
export type BacklogPriority = (typeof BACKLOG_PRIORITIES)[number];

/** Échelle d'estimation en points (suite de Fibonacci). */
export const STORY_POINTS = [0, 1, 2, 3, 5, 8, 13, 21] as const;

export interface BacklogItemProps {
  code: string;
  type: BacklogItemType;
  title: string;
  description: string;
  acceptanceCriteria: string;
  priority: BacklogPriority;
  /** `null` : pas encore estimé. Une épopée n'est pas estimée : elle somme ses éléments. */
  points: number | null;
  status: BacklogItemStatus;
  /** Date d'achèvement : obligatoire une fois terminé, absente sinon (alimente le burndown). */
  doneOn: Date | null;
  iterationCode: string | null;
  epicCode: string | null;
  /** Exigence du registre satisfaite par l'élément. */
  requirementCode: string | null;
  /** Lot de la WBS dont l'élément fait avancer le travail (approche hybride). */
  wbsCode: string | null;
  /** Ressource du référentiel (identifiant). */
  assigneeId: string | null;
  /** Qui a accepté l'élément : seulement une fois terminé (absent pour un élément terminé avant le rôle). */
  acceptedBy: { id: string | null; name: string } | null;
  /** Dernier refus : seulement sur un élément non terminé. */
  refusal: { reason: string; by: string; on: Date } | null;
}

const isOneOf = <T extends string>(values: readonly T[], value: string): value is T =>
  (values as readonly string[]).includes(value);

const optional = (value: string | null): string | null => (value?.trim() ? value.trim() : null);

/**
 * Élément du carnet de produit : épopée, récit utilisateur, anomalie ou élément technique. Une
 * épopée regroupe des éléments ; elle n'est ni estimée, ni planifiée dans une itération.
 */
export class BacklogItem {
  private constructor(readonly props: Readonly<BacklogItemProps>) {}

  static create(params: BacklogItemProps): BacklogItem {
    const code = entryCode(params.code, "d'élément du carnet");
    if (!isOneOf(BACKLOG_ITEM_TYPES, params.type) || !isOneOf(BACKLOG_ITEM_STATUSES, params.status)) {
      throw new DomainError(`${code} : type ou statut inconnu.`);
    }
    if (!isOneOf(BACKLOG_PRIORITIES, params.priority)) {
      throw new DomainError(`${code} : priorité inconnue.`);
    }
    if (params.points !== null && !(STORY_POINTS as readonly number[]).includes(params.points)) {
      throw new DomainError(`${code} : estimation hors de l'échelle (${STORY_POINTS.join(', ')}).`);
    }
    const done = params.status === 'DONE';
    if (done && (!params.doneOn || Number.isNaN(params.doneOn.getTime()))) {
      throw new DomainError(`${code} : un élément terminé porte sa date d'achèvement.`);
    }
    if (!done && params.doneOn) {
      throw new DomainError(`${code} : un élément non terminé n'a pas de date d'achèvement.`);
    }
    if (!done && params.acceptedBy) {
      throw new DomainError(`${code} : seul un élément terminé est accepté.`);
    }
    if (done && params.refusal) {
      throw new DomainError(`${code} : un élément accepté ne porte plus de refus.`);
    }
    const epic = params.type === 'EPIC';
    if (epic && (params.points !== null || optional(params.iterationCode) || optional(params.epicCode))) {
      throw new DomainError(`${code} : une épopée n'est ni estimée, ni planifiée dans une itération, ni rattachée à une épopée.`);
    }

    return new BacklogItem(
      Object.freeze({
        code,
        type: params.type,
        title: requiredText(params.title, `${code} : donnez un titre à l'élément.`),
        description: params.description.trim(),
        acceptanceCriteria: params.acceptanceCriteria.trim(),
        priority: params.priority,
        points: params.points,
        status: params.status,
        doneOn: done ? new Date(params.doneOn!) : null,
        iterationCode: optional(params.iterationCode),
        epicCode: optional(params.epicCode),
        requirementCode: optional(params.requirementCode),
        wbsCode: optional(params.wbsCode),
        assigneeId: optional(params.assigneeId),
        acceptedBy: params.acceptedBy && { id: params.acceptedBy.id, name: params.acceptedBy.name.trim() },
        refusal: params.refusal && {
          reason: requiredText(params.refusal.reason, `${code} : indiquez le motif du refus.`),
          by: params.refusal.by.trim(),
          on: new Date(params.refusal.on),
        },
      }),
    );
  }

  get code(): string {
    return this.props.code;
  }

  get isEpic(): boolean {
    return this.props.type === 'EPIC';
  }

  get isDone(): boolean {
    return this.props.status === 'DONE';
  }
}

export interface IterationProps {
  code: string;
  name: string;
  goal: string;
  start: Date;
  end: Date;
  /** Capacité de l'équipe en points ; `null` : non précisée. */
  capacity: number | null;
  /** Revue de l'itération : ce qui a été montré et les retours. */
  review: string;
  /** Rétrospective : ce qui a bien marché, ce qui est à améliorer, actions retenues. */
  wentWell: string;
  toImprove: string;
  actions: readonly string[];
}

const DAY = 86_400_000;

/** Itération (sprint) : une période fixe, un objectif, une capacité, puis sa revue et sa rétrospective. */
export class Iteration {
  private constructor(readonly props: Readonly<IterationProps>) {}

  static create(params: IterationProps): Iteration {
    const code = entryCode(params.code, "d'itération");
    if (Number.isNaN(params.start.getTime()) || Number.isNaN(params.end.getTime())) {
      throw new DomainError(`${code} : dates invalides.`);
    }
    if (params.end.getTime() < params.start.getTime()) {
      throw new DomainError(`${code} : la fin ne peut précéder le début.`);
    }
    if ((params.end.getTime() - params.start.getTime()) / DAY > 62) {
      throw new DomainError(`${code} : une itération dure au plus deux mois.`);
    }
    if (params.capacity !== null && (!Number.isInteger(params.capacity) || params.capacity < 0)) {
      throw new DomainError(`${code} : la capacité est un nombre entier de points.`);
    }
    return new Iteration(
      Object.freeze({
        code,
        name: requiredText(params.name, `${code} : nommez l'itération.`),
        goal: params.goal.trim(),
        start: new Date(params.start),
        end: new Date(params.end),
        capacity: params.capacity,
        review: params.review.trim(),
        wentWell: params.wentWell.trim(),
        toImprove: params.toImprove.trim(),
        actions: params.actions.map((action) => action.trim()).filter(Boolean),
      }),
    );
  }

  get code(): string {
    return this.props.code;
  }
}

/**
 * Agrégat racine : le carnet de produit d'un projet, ses éléments dans l'ordre de priorité et ses
 * itérations, qui se suivent sans se chevaucher. Les épopées, itérations et éléments cités
 * existent dans le carnet. Vide : valide.
 */
export class ProductBacklog {
  private constructor(
    public readonly projectId: string,
    public readonly items: readonly BacklogItem[],
    public readonly iterations: readonly Iteration[],
  ) {}

  static create(params: { projectId: string; items: readonly BacklogItem[]; iterations: readonly Iteration[] }): ProductBacklog {
    assertProjectId(params.projectId);
    assertUniqueCodes(params.items, "d'élément du carnet");
    assertUniqueCodes(params.iterations, "d'itération");

    const iterations = [...params.iterations].sort((a, b) => a.props.start.getTime() - b.props.start.getTime());
    iterations.forEach((iteration, index) => {
      const next = iterations[index + 1];
      if (next && next.props.start.getTime() <= iteration.props.end.getTime()) {
        throw new DomainError(`Les itérations ${iteration.code} et ${next.code} se chevauchent.`);
      }
    });

    const upper = (code: string) => code.toUpperCase();
    const iterationCodes = new Map(iterations.map((iteration) => [upper(iteration.code), iteration.code]));
    const epics = new Map(params.items.filter((item) => item.isEpic).map((item) => [upper(item.code), item.code]));
    const items = params.items.map((item) => {
      const { iterationCode, epicCode } = item.props;
      if (iterationCode && !iterationCodes.has(upper(iterationCode))) {
        throw new DomainError(`${item.code} : itération ${iterationCode} absente du carnet.`);
      }
      if (epicCode && !epics.has(upper(epicCode))) {
        throw new DomainError(`${item.code} : épopée ${epicCode} absente du carnet.`);
      }
      // Codes cités normalisés à l'orthographe de leur cible.
      return BacklogItem.create({
        ...item.props,
        iterationCode: iterationCode ? iterationCodes.get(upper(iterationCode))! : null,
        epicCode: epicCode ? epics.get(upper(epicCode))! : null,
      });
    });

    return new ProductBacklog(params.projectId, items, iterations);
  }

  static empty(projectId: string): ProductBacklog {
    return ProductBacklog.create({ projectId, items: [], iterations: [] });
  }

  /** Éléments à réaliser (hors épopées). */
  get workItems(): readonly BacklogItem[] {
    return this.items.filter((item) => !item.isEpic);
  }
}
