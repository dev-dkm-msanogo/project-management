import type { ProductBacklog } from '@domain/entities/product-backlog';
import type { ProjectManagementPlan } from '@domain/entities/project-management-plan';
import type { RequirementsRegister } from '@domain/entities/requirements-register';
import { DomainError } from '@domain/errors/domain-errors';
import { isoDate, parseIsoDate } from '@application/mappers/iso-date';
import { productBacklogToInput } from '@application/mappers/product-backlog.mappers';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import type { ProjectPlanRepository } from '@application/ports/out/project-plan.repository';
import type {
  BacklogItemInput,
  BurndownPointDto,
  IterationDto,
  IterationInput,
  IterationState,
  ProductBacklogDto,
} from '@shared/index';

interface BacklogSources {
  plans: ProjectPlanRepository;
  requirements: ProjectDocumentRepository<RequirementsRegister>;
  managementPlans: ProjectDocumentRepository<ProjectManagementPlan>;
  clock: () => Date;
}

const DAY = 86_400_000;
const round1 = (value: number) => Math.round(value * 10) / 10;
const pointsOf = (items: readonly BacklogItemInput[]) => items.reduce((sum, item) => sum + (item.points ?? 0), 0);

/** Jours ouvrés (lundi à vendredi) de l'itération ; tous ses jours si elle n'en compte aucun. */
function workingDays(start: string, end: string): string[] {
  const days: string[] = [];
  for (let time = parseIsoDate(start).getTime(); time <= parseIsoDate(end).getTime(); time += DAY) {
    days.push(isoDate(new Date(time)));
  }
  const weekdays = days.filter((day) => ![0, 6].includes(parseIsoDate(day).getUTCDay()));
  return weekdays.length > 0 ? weekdays : days;
}

function stateOf(iteration: IterationInput, today: string): IterationState {
  if (iteration.start > today) return 'PLANNED';
  return iteration.end < today ? 'COMPLETED' : 'ACTIVE';
}

/** Reste à faire chaque jour ouvré : engagement moins les points terminés à cette date. */
function burndownOf(iteration: IterationInput, items: readonly BacklogItemInput[], today: string): BurndownPointDto[] {
  const committed = pointsOf(items);
  const days = workingDays(iteration.start, iteration.end);
  const steps = Math.max(days.length - 1, 1);
  return days.map((date, index) => ({
    date,
    ideal: round1(committed * (1 - index / steps)),
    remaining:
      date > today ? null : committed - pointsOf(items.filter((item) => item.doneOn !== null && item.doneOn <= date)),
  }));
}

/**
 * Carnet de produit : les exigences et lots de la WBS cités existent (un lot = élément sans
 * descendant) ; la lecture calcule l'état des itérations, leur burndown, la vélocité, le burnup et
 * la prévision, et reprend la définition de « terminé » du plan de management.
 */
export function productBacklogServices(sources: BacklogSources) {
  const workPackagesOf = async (projectId: string) => {
    const plan = await sources.plans.findByProjectId(projectId);
    const tasks = plan?.tasks ?? [];
    const codes = tasks.map((task) => task.wbs.value);
    return new Map(
      tasks
        .filter((task) => !codes.some((code) => code.startsWith(`${task.wbs.value}.`)))
        .map((task) => [task.wbs.value, task.name]),
    );
  };

  return {
    toDto: async (backlog: ProductBacklog): Promise<ProductBacklogDto> => {
      const { projectId } = backlog;
      const [workPackages, requirements, managementPlan] = await Promise.all([
        workPackagesOf(projectId),
        sources.requirements.findByProjectId(projectId),
        sources.managementPlans.findByProjectId(projectId),
      ]);
      const today = isoDate(sources.clock());
      const input = productBacklogToInput(backlog);
      const work = input.items.filter((item) => item.type !== 'EPIC');
      const done = work.filter((item) => item.status === 'DONE');

      const iterations: IterationDto[] = input.iterations.map((iteration) => {
        const planned = work.filter((item) => item.iterationCode === iteration.code);
        const finished = planned.filter((item) => item.status === 'DONE');
        return {
          ...iteration,
          state: stateOf(iteration, today),
          committedPoints: pointsOf(planned),
          donePoints: pointsOf(finished),
          itemCount: planned.length,
          doneCount: finished.length,
          burndown: burndownOf(iteration, planned, today),
        };
      });
      const completed = iterations.filter((iteration) => iteration.state === 'COMPLETED');
      const recent = completed.slice(-3);
      const averageVelocity =
        recent.length > 0 ? round1(recent.reduce((sum, iteration) => sum + iteration.donePoints, 0) / recent.length) : null;
      const totalPoints = pointsOf(work);
      const donePoints = pointsOf(done);
      const remainingPoints = totalPoints - donePoints;

      const epics: ProductBacklogDto['metrics']['epics'] = {};
      for (const epic of input.items.filter((item) => item.type === 'EPIC')) {
        const children = work.filter((item) => item.epicCode === epic.code);
        epics[epic.code] = {
          points: pointsOf(children),
          donePoints: pointsOf(children.filter((item) => item.status === 'DONE')),
          items: children.length,
        };
      }

      const cited = (codes: (string | null)[], titles: Map<string, string>) =>
        Object.fromEntries(codes.filter((code): code is string => code !== null && titles.has(code)).map((code) => [code, titles.get(code)!]));
      const requirementTitles = new Map((requirements?.requirements ?? []).map((requirement) => [requirement.code, requirement.props.statement]));

      return {
        projectId,
        items: input.items,
        iterations,
        metrics: {
          totalPoints,
          donePoints,
          remainingPoints,
          unestimated: work.filter((item) => item.points === null && item.status !== 'DONE').length,
          currentIteration: iterations.find((iteration) => iteration.state === 'ACTIVE')?.code ?? null,
          velocity: completed.map(({ code, name, committedPoints, donePoints: velocity }) => ({
            code,
            name,
            committed: committedPoints,
            done: velocity,
          })),
          averageVelocity,
          forecastIterations: averageVelocity ? Math.ceil(remainingPoints / averageVelocity) : null,
          burnup: iterations.map((iteration) => ({
            code: iteration.code,
            name: iteration.name,
            end: iteration.end,
            done: iteration.start > today ? null : pointsOf(done.filter((item) => item.doneOn! <= iteration.end)),
            scope: totalPoints,
          })),
          epics,
        },
        references: {
          requirements: cited(input.items.map((item) => item.requirementCode), requirementTitles),
          workPackages: Object.fromEntries(workPackages),
        },
        definitionOfDone: managementPlan?.props.developmentApproach.definitionOfDone ?? '',
      };
    },

    beforeSave: async (backlog: ProductBacklog): Promise<void> => {
      const [workPackages, requirements] = await Promise.all([
        workPackagesOf(backlog.projectId),
        sources.requirements.findByProjectId(backlog.projectId),
      ]);
      const unknownWbs = backlog.items
        .map((item) => item.props.wbsCode)
        .filter((code): code is string => code !== null && !workPackages.has(code));
      if (unknownWbs.length > 0) {
        throw new DomainError(`Lot(s) absent(s) de la WBS ou qui ne sont pas des lots de travaux : ${[...new Set(unknownWbs)].join(', ')}.`);
      }
      const known = new Set((requirements?.requirements ?? []).map((requirement) => requirement.code.toUpperCase()));
      const unknownRequirements = backlog.items
        .map((item) => item.props.requirementCode)
        .filter((code): code is string => code !== null && !known.has(code.toUpperCase()));
      if (unknownRequirements.length > 0) {
        throw new DomainError(`Exigence(s) absente(s) du registre des exigences : ${[...new Set(unknownRequirements)].join(', ')}.`);
      }
    },
  };
}
