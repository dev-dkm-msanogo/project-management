import type { CostEstimates } from '@domain/entities/cost-estimates';
import type { ScheduleModel } from '@domain/entities/schedule-model';
import type { WbsDictionary } from '@domain/entities/wbs-dictionary';
import { DomainError } from '@domain/errors/domain-errors';
import { toScheduleModelDto, toWbsDictionaryDto } from '@application/mappers/schedule-model.mappers';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import type { ProjectPlanRepository } from '@application/ports/out/project-plan.repository';
import type { ScheduleModelDto, WbsDictionaryDto } from '@shared/index';

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

/** Modèle d'ordonnancement : chaque activité se rattache à un élément de la WBS de l'échéancier. */
export function scheduleModelServices(plans: ProjectPlanRepository) {
  return {
    toDto: async (model: ScheduleModel): Promise<ScheduleModelDto> => {
      const names = await wbsNamesOf(plans, model.projectId);
      const used = new Set(model.props.activities.map((activity) => activity.wbsCode));
      return toScheduleModelDto(model, Object.fromEntries([...names].filter(([code]) => used.has(code))));
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
