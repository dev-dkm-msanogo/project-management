import { BacklogItem, Iteration, ProductBacklog } from '@domain/entities/product-backlog';
import { isoDate, isoDateOrNull, parseIsoDate, parseIsoDateOrNull } from '@application/mappers/iso-date';
import type { ProductBacklogInput } from '@shared/index';

/** Traductions du carnet de produit : domaine ⇄ saisie (la lecture est composée par son service). */

export function productBacklogToInput(backlog: ProductBacklog): ProductBacklogInput {
  return {
    items: backlog.items.map(({ props }) => ({
      ...props,
      doneOn: isoDateOrNull(props.doneOn),
      refusal: props.refusal && { ...props.refusal, on: isoDate(props.refusal.on) },
    })),
    iterations: backlog.iterations.map(({ props }) => ({
      ...props,
      start: isoDate(props.start),
      end: isoDate(props.end),
      actions: [...props.actions],
    })),
  };
}

export function inputToProductBacklog(projectId: string, input: ProductBacklogInput): ProductBacklog {
  return ProductBacklog.create({
    projectId,
    items: input.items.map((item) =>
      BacklogItem.create({
        ...item,
        doneOn: parseIsoDateOrNull(item.doneOn),
        acceptedBy: item.acceptedBy ?? null,
        refusal: item.refusal ? { ...item.refusal, on: parseIsoDate(item.refusal.on) } : null,
      }),
    ),
    iterations: input.iterations.map((iteration) =>
      Iteration.create({ ...iteration, start: parseIsoDate(iteration.start), end: parseIsoDate(iteration.end) }),
    ),
  });
}
