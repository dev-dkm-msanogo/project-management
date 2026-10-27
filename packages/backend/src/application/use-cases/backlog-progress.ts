import type { ProductBacklog } from '@domain/entities/product-backlog';
import { TaskProgress } from '@domain/entities/task-progress';
import { ConflictError } from '@application/errors/application-errors';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import type { TaskProgressRepository } from '@application/ports/out/task-progress.repository';

const earliest = (dates: Date[]) => (dates.length > 0 ? new Date(Math.min(...dates.map((date) => date.getTime()))) : null);
const latest = (dates: Date[]) => (dates.length > 0 ? new Date(Math.max(...dates.map((date) => date.getTime()))) : null);

/**
 * Avancement d'un lot de la WBS tiré de ses éléments du carnet : points terminés sur points
 * estimés (à défaut, éléments terminés sur éléments). Début réel : début de la première itération
 * où un élément a avancé ; fin réelle : dernier achèvement, une fois tout terminé.
 */
function measuresOf(backlog: ProductBacklog, today: Date): Map<string, TaskProgress> {
  const iterations = new Map(backlog.iterations.map((iteration) => [iteration.code, iteration.props]));
  const byLot = new Map<string, typeof backlog.workItems>();
  for (const item of backlog.workItems) {
    if (item.props.wbsCode) byLot.set(item.props.wbsCode, [...(byLot.get(item.props.wbsCode) ?? []), item]);
  }

  const measures = new Map<string, TaskProgress>();
  for (const [wbs, items] of byLot) {
    const estimated = items.some((item) => (item.props.points ?? 0) > 0);
    const weight = (item: (typeof items)[number]) => (estimated ? (item.props.points ?? 0) : 1);
    const total = items.reduce((sum, item) => sum + weight(item), 0);
    const done = items.filter((item) => item.isDone).reduce((sum, item) => sum + weight(item), 0);
    const started = items.filter((item) => item.props.status !== 'TODO');
    const finishedOn = items.map((item) => item.props.doneOn).filter((date): date is Date => date !== null);
    const complete = items.every((item) => item.isDone);
    const startedOn = earliest([
      ...started.map((item) => iterations.get(item.props.iterationCode ?? '')?.start).filter((date): date is Date => !!date),
      ...finishedOn,
    ]);
    // Une itération à venir ne fait pas commencer le lot avant aujourd'hui.
    const begun = startedOn && startedOn.getTime() <= today.getTime() ? startedOn : today;
    const status = complete ? 'COMPLETE' : started.length > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
    try {
      measures.set(
        wbs,
        TaskProgress.create(
          {
            projectId: backlog.projectId,
            wbs,
            status,
            percentComplete: complete ? 100 : status === 'NOT_STARTED' ? 0 : Math.min(99, Math.floor((done / total) * 100)),
            actualStart: status === 'NOT_STARTED' ? null : complete ? earliest([begun, ...finishedOn]) : begun,
            actualFinish: complete ? latest(finishedOn) : null,
            asOf: today,
            note: `${done} sur ${total} ${estimated ? 'points' : 'éléments'} terminés dans le carnet de produit`,
            updatedBy: 'Carnet de produit',
            updatedAt: today,
          },
          today,
        ),
      );
    } catch {
      // Dates du carnet incohérentes avec la mesure (ex. achèvement futur) : l'avancement saisi reste en vigueur.
    }
  }
  return measures;
}

/**
 * Dépôt d'avancement en approche hybride : un lot de la WBS rattaché à des éléments du carnet de
 * produit prend son avancement du carnet (valeur acquise, portefeuille, livrables et rapport en
 * tiennent compte) ; il ne se saisit plus à la main.
 */
export function backlogDrivenProgress(
  progress: TaskProgressRepository,
  backlogs: ProjectDocumentRepository<ProductBacklog>,
  clock: () => Date,
): TaskProgressRepository {
  const drivenOf = async (projectId: string) => {
    const backlog = await backlogs.findByProjectId(projectId);
    return backlog ? measuresOf(backlog, clock()) : new Map<string, TaskProgress>();
  };
  return {
    async listByProject(projectId) {
      const [entered, driven] = await Promise.all([progress.listByProject(projectId), drivenOf(projectId)]);
      return [...entered.filter((measure) => !driven.has(measure.wbs)), ...driven.values()];
    },
    async save(measure) {
      const driven = await drivenOf(measure.props.projectId);
      if (driven.has(measure.wbs)) {
        throw new ConflictError(
          `L'avancement de ${measure.wbs} vient du carnet de produit : mettez à jour ses éléments (tableau de suivi).`,
        );
      }
      await progress.save(measure);
    },
    delete: (projectId) => progress.delete(projectId),
  };
}
