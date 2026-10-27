import type { BacklogItem, ProductBacklog } from '@domain/entities/product-backlog';
import { ForbiddenError } from '@application/errors/application-errors';
import type { DocumentActor } from '@application/ports/in/project-document.use-cases';
import type { ProjectMemberRepository } from '@application/ports/out/project-member.repository';

/**
 * Droits sur le carnet de produit. Le Product Owner désigné décide : il ordonne et priorise le
 * carnet, rédige les éléments, les accepte ou les refuse. L'équipe (les autres rédacteurs) estime
 * et fait avancer les éléments jusqu'à la revue. Sans Product Owner désigné, le chef de projet décide.
 */
export interface BacklogRights {
  decide: boolean;
  develop: boolean;
  productOwnerId: string | null;
}

export async function backlogRightsOf(
  members: ProjectMemberRepository,
  projectId: string,
  actor: DocumentActor,
): Promise<BacklogRights> {
  const productOwnerId = (await members.listByProject(projectId)).find((member) => member.productOwner)?.userId ?? null;
  const editor = actor.projectRole === 'MANAGER' || actor.projectRole === 'CONTRIBUTOR';
  return {
    productOwnerId,
    decide: productOwnerId ? actor.id === productOwnerId : actor.projectRole === 'MANAGER',
    develop: editor && actor.id !== productOwnerId,
  };
}

/** Qui décide, au génitif : « relève du Product Owner du projet ». */
const DECIDER = (rights: BacklogRights) =>
  rights.productOwnerId ? 'du Product Owner du projet' : 'du chef de projet (aucun Product Owner désigné)';

/** Ce que l'élément porte de la décision du Product Owner : il ne change que par sa décision. */
const decisionOf = ({ props }: BacklogItem) =>
  JSON.stringify([props.status === 'DONE', props.doneOn?.getTime() ?? null, props.acceptedBy, props.refusal]);

/** Contenu de l'élément : ce qu'en dit le Product Owner. */
const contentOf = ({ props }: BacklogItem) =>
  JSON.stringify([
    props.type,
    props.title,
    props.description,
    props.acceptanceCriteria,
    props.priority,
    props.epicCode,
    props.requirementCode,
    props.wbsCode,
  ]);

/**
 * Contrôle d'un enregistrement du carnet au regard des droits de qui l'enregistre (403 sinon) :
 * l'acceptation et le refus passent par la décision du Product Owner ; ordre, priorités, contenu et
 * suppression lui reviennent ; estimation et avancement reviennent à l'équipe. Un élément proposé
 * par l'équipe s'ajoute en fin de carnet, non estimé par le Product Owner.
 */
export function assertBacklogChange(previous: ProductBacklog, next: ProductBacklog, rights: BacklogRights): void {
  const before = new Map(previous.items.map((item) => [item.code.toUpperCase(), item]));
  const deny = (message: string) => {
    throw new ForbiddenError(message);
  };

  for (const item of next.items) {
    const prior = before.get(item.code.toUpperCase());
    if (!prior) {
      if (item.isDone || item.props.acceptedBy || item.props.refusal) {
        deny(`${item.code} : un élément ne naît pas accepté ; il le devient par la décision ${DECIDER(rights)}.`);
      }
      if (!rights.develop && (item.props.points !== null || item.props.status !== 'TODO')) {
        deny(`${item.code} : l'estimation et l'avancement reviennent à l'équipe, pas au Product Owner.`);
      }
      continue;
    }
    if (decisionOf(prior) !== decisionOf(item)) {
      deny(`${item.code} : l'acceptation et le refus passent par la décision ${DECIDER(rights)} (Accepter ou Refuser).`);
    }
    if (!rights.decide && contentOf(prior) !== contentOf(item)) {
      deny(`${item.code} : son contenu et sa priorité relèvent ${DECIDER(rights)}.`);
    }
    if (!rights.develop && (prior.props.points !== item.props.points || prior.props.status !== item.props.status)) {
      deny(`${item.code} : l'estimation et l'avancement reviennent à l'équipe, pas au Product Owner.`);
    }
  }

  if (rights.decide) return;
  const kept = new Set(next.items.map((item) => item.code.toUpperCase()));
  const removed = previous.items.filter((item) => !kept.has(item.code.toUpperCase()));
  if (removed.length > 0) {
    deny(`Retirer ${removed.map((item) => item.code).join(', ')} du carnet relève ${DECIDER(rights)}.`);
  }
  const order = (items: readonly BacklogItem[]) =>
    items.map((item) => item.code.toUpperCase()).filter((code) => before.has(code) && kept.has(code));
  if (order(previous.items).join() !== order(next.items).join()) {
    deny(`L'ordre du carnet relève ${DECIDER(rights)}.`);
  }
  const lastExisting = Math.max(-1, ...next.items.map((item, index) => (before.has(item.code.toUpperCase()) ? index : -1)));
  const misplaced = next.items.find((item, index) => !before.has(item.code.toUpperCase()) && index < lastExisting);
  if (misplaced) {
    deny(`${misplaced.code} : un élément proposé par l'équipe s'ajoute en fin de carnet, où il attend la priorisation ${DECIDER(rights)}.`);
  }
}
