import { BacklogItem, ProductBacklog } from '@domain/entities/product-backlog';
import { ConflictError, ForbiddenError, NotFoundError } from '@application/errors/application-errors';
import type { DocumentActor } from '@application/ports/in/project-document.use-cases';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import type { ProjectMemberRepository } from '@application/ports/out/project-member.repository';
import type { UserRepository } from '@application/ports/out/user.repository';
import { backlogRightsOf } from '@application/use-cases/backlog-rights';
import type { ProductBacklogDto } from '@shared/index';

export interface BacklogDecisionCommand {
  projectId: string;
  code: string;
  decision: 'ACCEPT' | 'REJECT';
  /** Motif, obligatoire pour un refus. */
  comment: string | null;
  actor: DocumentActor;
}

const day = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

/**
 * Décision du Product Owner (à défaut, du chef de projet) sur un élément du carnet : il accepte un
 * élément en revue, qui est alors terminé à la date du jour et signé de son nom ; il refuse un élément
 * en revue ou déjà accepté, qui repart en cours avec le motif du refus.
 */
export class DecideBacklogItemService {
  constructor(
    private readonly backlogs: ProjectDocumentRepository<ProductBacklog>,
    private readonly members: ProjectMemberRepository,
    private readonly users: UserRepository,
    private readonly toDto: (backlog: ProductBacklog) => Promise<ProductBacklogDto>,
    private readonly clock: () => Date,
  ) {}

  async execute(command: BacklogDecisionCommand): Promise<ProductBacklogDto> {
    const rights = await backlogRightsOf(this.members, command.projectId, command.actor);
    if (!rights.decide) {
      throw new ForbiddenError(
        rights.productOwnerId
          ? "Seul le Product Owner du projet accepte ou refuse un élément du carnet."
          : "Sans Product Owner désigné, c'est le chef de projet qui accepte ou refuse un élément du carnet.",
      );
    }
    const backlog = await this.backlogs.findByProjectId(command.projectId);
    const item = backlog?.items.find((entry) => entry.code.toUpperCase() === command.code.toUpperCase());
    if (!backlog || !item) throw new NotFoundError(`Élément ${command.code} absent du carnet de produit.`);

    const user = await this.users.findById(command.actor.id);
    const name = user?.name ?? 'Compte inconnu';
    const today = day(this.clock());
    let decided: BacklogItem;
    if (command.decision === 'ACCEPT') {
      if (item.props.status !== 'IN_REVIEW') {
        throw new ConflictError(`${item.code} : seul un élément en revue s'accepte.`);
      }
      decided = BacklogItem.create({
        ...item.props,
        status: 'DONE',
        doneOn: today,
        acceptedBy: { id: command.actor.id, name },
        refusal: null,
      });
    } else {
      if (item.props.status !== 'IN_REVIEW' && item.props.status !== 'DONE') {
        throw new ConflictError(`${item.code} : seul un élément en revue ou accepté se refuse.`);
      }
      decided = BacklogItem.create({
        ...item.props,
        status: 'IN_PROGRESS',
        doneOn: null,
        acceptedBy: null,
        refusal: { reason: command.comment ?? '', by: name, on: today },
      });
    }

    const next = ProductBacklog.create({
      projectId: backlog.projectId,
      items: backlog.items.map((entry) => (entry.code === item.code ? decided : entry)),
      iterations: backlog.iterations,
    });
    await this.backlogs.save(next);
    return this.toDto(next);
  }
}
