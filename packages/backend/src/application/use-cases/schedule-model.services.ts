import type { CostEstimates } from '@domain/entities/cost-estimates';
import type { ProjectPlan } from '@domain/entities/project-plan';
import type { ScheduleModel } from '@domain/entities/schedule-model';
import type { WbsDictionary } from '@domain/entities/wbs-dictionary';
import { DomainError } from '@domain/errors/domain-errors';
import { isoDate } from '@application/mappers/iso-date';
import {
  inputToScheduleModel,
  toScheduleModelDto,
  toScheduleNetworkDto,
  toWbsDictionaryDto,
} from '@application/mappers/schedule-model.mappers';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import type { ProjectPlanRepository } from '@application/ports/out/project-plan.repository';
import type {
  ScheduledWbsDto,
  ScheduleModelDto,
  ScheduleModelInput,
  SchedulePreviewDto,
  WbsDictionaryDto,
} from '@shared/index';

/** Intitulés des éléments de la WBS de l'échéancier (jamais modifié ici), par code. */
async function wbsNamesOf(plans: ProjectPlanRepository, projectId: string): Promise<Map<string, string>> {
  const plan = await plans.findByProjectId(projectId);
  return new Map((plan?.tasks ?? []).map((task) => [task.wbs.value, task.name]));
}

function assertKnownWbs(codes: readonly string[], known: Map<string, string>, label: string): void {
  const unknown = [...new Set(codes.filter((code) => !known.has(code)))];
  if (unknown.length > 0) {
    throw new DomainError(`${label} : élément(s) absent(s) de la WBS de l'échéancier : ${unknown.join(', ')}.`);
  }
}

// --- Échéancier unifié : le réseau d'activités fixe les dates de la WBS ---

/** WBS dont les éléments portant des activités prennent les dates du réseau ; les autres gardent les leurs. */
export function scheduledPlan(plan: ProjectPlan, model: ScheduleModel): ProjectPlan {
  return plan.withScheduledDates((task) => model.scheduleOf(task.wbs.value, task));
}

/** Dates fixées par le réseau, par élément de la WBS (ceux qui portent des activités). */
function scheduledWbs(plan: ProjectPlan | null, model: ScheduleModel): ScheduledWbsDto {
  const driven = new Set(model.props.activities.map((activity) => activity.wbsCode));
  return Object.fromEntries(
    (plan ? scheduledPlan(plan, model).tasks : [])
      .filter((task) => driven.has(task.wbs.value) && task.start && task.end)
      .map((task) => [task.wbs.value, { start: isoDate(task.start!), end: isoDate(task.end!) }]),
  );
}

/**
 * Dépôt de la WBS : à chaque enregistrement, les éléments portant des activités reprennent les dates
 * du réseau (on ne les saisit pas). À placer avant le verrou d'approbation, qui compare ce qui est
 * réellement enregistré.
 */
export function scheduledPlans(
  plans: ProjectPlanRepository,
  models: ProjectDocumentRepository<ScheduleModel>,
): ProjectPlanRepository {
  return {
    findByProjectId: (projectId) => plans.findByProjectId(projectId),
    async save(plan) {
      const model = await models.findByProjectId(plan.project.id);
      await plans.save(model ? scheduledPlan(plan, model) : plan);
    },
    delete: (projectId) => plans.delete(projectId),
  };
}

/** Dépôt du modèle d'ordonnancement : après chaque enregistrement, la WBS se réaligne sur le réseau. */
export function realigningModels(
  models: ProjectDocumentRepository<ScheduleModel>,
  plans: ProjectPlanRepository,
): ProjectDocumentRepository<ScheduleModel> {
  return {
    findByProjectId: (projectId) => models.findByProjectId(projectId),
    async save(model) {
      await models.save(model);
      const plan = await plans.findByProjectId(model.projectId);
      if (plan) await plans.save(plan);
    },
    delete: (projectId) => models.delete(projectId),
  };
}

/** Aperçu d'un modèle modifié (Gantt) : réseau et dates de la WBS recalculés, rien n'est enregistré. */
export class PreviewScheduleService {
  constructor(private readonly plans: ProjectPlanRepository) {}

  async execute(command: { projectId: string; input: ScheduleModelInput }): Promise<SchedulePreviewDto> {
    const model = inputToScheduleModel(command.projectId, command.input);
    const plan = await this.plans.findByProjectId(command.projectId);
    assertKnownWbs(
      model.props.activities.map((activity) => activity.wbsCode),
      new Map((plan?.tasks ?? []).map((task) => [task.wbs.value, task.name])),
      'Activités',
    );
    return { network: toScheduleNetworkDto(model), wbsDates: scheduledWbs(plan, model) };
  }
}

/** Modèle d'ordonnancement : chaque activité se rattache à un élément de la WBS de l'échéancier. */
export function scheduleModelServices(plans: ProjectPlanRepository) {
  return {
    toDto: async (model: ScheduleModel): Promise<ScheduleModelDto> => {
      const plan = await plans.findByProjectId(model.projectId);
      const used = new Set(model.props.activities.map((activity) => activity.wbsCode));
      const names = (plan?.tasks ?? []).filter((task) => used.has(task.wbs.value)).map((task) => [task.wbs.value, task.name]);
      return toScheduleModelDto(model, Object.fromEntries(names), scheduledWbs(plan, model));
    },
    beforeSave: async (model: ScheduleModel): Promise<void> => {
      const names = await wbsNamesOf(plans, model.projectId);
      assertKnownWbs(model.props.activities.map((activity) => activity.wbsCode), names, 'Activités');
    },
  };
}

/** Code de l'élément ou de l'un de ses descendants. */
const within = (code: string, root: string) => code === root || code.startsWith(`${root}.`);

/**
 * Dictionnaire de la WBS : chaque fiche porte sur un élément de l'échéancier ; son intitulé, son
 * effort (activités du modèle d'ordonnancement) et ses coûts (estimations) sont relus à chaque lecture.
 */
export function wbsDictionaryServices(
  plans: ProjectPlanRepository,
  scheduleModels: ProjectDocumentRepository<ScheduleModel>,
  costEstimates: ProjectDocumentRepository<CostEstimates>,
) {
  return {
    toDto: async (dictionary: WbsDictionary): Promise<WbsDictionaryDto> => {
      const [names, model, estimates] = await Promise.all([
        wbsNamesOf(plans, dictionary.projectId),
        scheduleModels.findByProjectId(dictionary.projectId),
        costEstimates.findByProjectId(dictionary.projectId),
      ]);
      return toWbsDictionaryDto(dictionary, (wbsCode) => {
        const activities = (model?.props.activities ?? []).filter((activity) => within(activity.wbsCode, wbsCode));
        const costLines = (estimates?.props.activities ?? [])
          .filter((activity) => within(activity.props.wbsCode, wbsCode))
          .map((activity) => ({ code: activity.code, name: activity.props.name, amount: activity.direct }));
        return {
          name: names.get(wbsCode) ?? wbsCode,
          effortHours: activities.length > 0 ? activities.reduce((sum, activity) => sum + activity.effortHours, 0) : null,
          costLines,
          costTotal: costLines.reduce((sum, line) => sum + line.amount, 0),
        };
      });
    },
    beforeSave: async (dictionary: WbsDictionary): Promise<void> => {
      const names = await wbsNamesOf(plans, dictionary.projectId);
      assertKnownWbs(dictionary.entries.map((entry) => entry.wbsCode), names, 'Dictionnaire de la WBS');
    },
  };
}
