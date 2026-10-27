import { estimatedDays, ScheduleModel } from '@domain/entities/schedule-model';
import { WbsDictionary } from '@domain/entities/wbs-dictionary';
import { isoDate, isoDateOrNull, parseIsoDate, parseIsoDateOrNull } from '@application/mappers/iso-date';
import type {
  ScheduleModelDto,
  ScheduleModelInput,
  WbsDictionaryDto,
  WbsDictionaryInput,
} from '@shared/index';

/** Traductions du modèle d'ordonnancement et du dictionnaire de la WBS : domaine ⇄ saisie ⇄ lecture. */

// --- Modèle d'ordonnancement ---

export function scheduleModelToInput(model: ScheduleModel): ScheduleModelInput {
  const { props } = model;
  return {
    preparedOn: isoDate(props.preparedOn),
    projectStart: isoDate(props.projectStart),
    activities: props.activities.map((activity) => ({
      ...activity,
      predecessors: activity.predecessors.map((dependency) => ({ ...dependency })),
      basis: activity.basis ? { ...activity.basis } : null,
    })),
    milestones: props.milestones.map((milestone) => ({
      ...milestone,
      targetDate: isoDate(milestone.targetDate),
      achievedOn: milestone.achievedOn ? isoDate(milestone.achievedOn) : null,
    })),
    calendar: {
      workingWeekdays: [...props.calendar.workingWeekdays],
      holidays: props.calendar.holidays.map((holiday) => ({ date: isoDate(holiday.date), name: holiday.name })),
      notes: props.calendar.notes,
    },
    baseline: { purpose: props.baseline.purpose, components: props.baseline.components },
  };
}

export function inputToScheduleModel(projectId: string, input: ScheduleModelInput): ScheduleModel {
  return ScheduleModel.create({
    projectId,
    preparedOn: parseIsoDate(input.preparedOn),
    projectStart: parseIsoDate(input.projectStart),
    activities: input.activities,
    // Jalons enregistrés avant la date d'atteinte : pas encore atteints.
    milestones: input.milestones.map((milestone) => ({
      ...milestone,
      targetDate: parseIsoDate(milestone.targetDate),
      achievedOn: milestone.achievedOn ? parseIsoDate(milestone.achievedOn) : null,
    })),
    calendar: {
      ...input.calendar,
      holidays: input.calendar.holidays.map((holiday) => ({ ...holiday, date: parseIsoDate(holiday.date) })),
    },
    baseline: { purpose: input.baseline.purpose, components: input.baseline.components },
  });
}

/** Domaine → lecture, avec le réseau calculé et les intitulés des éléments de la WBS. */
export function toScheduleModelDto(model: ScheduleModel, wbsNames: Record<string, string>): ScheduleModelDto {
  const { network } = model;
  const activities = new Map(model.props.activities.map((activity) => [activity.code, activity]));
  return {
    projectId: model.projectId,
    ...scheduleModelToInput(model),
    wbsNames,
    network: {
      start: isoDate(network.start),
      finish: isoDate(network.finish),
      workingDays: network.workingDays,
      criticalPath: network.criticalPath,
      activities: network.activities.map((scheduled) => {
        const activity = activities.get(scheduled.code)!;
        return {
          code: scheduled.code,
          earlyStart: isoDate(scheduled.earlyStart),
          earlyFinish: isoDate(scheduled.earlyFinish),
          lateStart: isoDate(scheduled.lateStart),
          lateFinish: isoDate(scheduled.lateFinish),
          totalFloat: scheduled.totalFloat,
          critical: scheduled.critical,
          estimatedDays: activity.basis
            ? Math.round(estimatedDays(activity.basis, activity.effortHours) * 10) / 10
            : null,
        };
      }),
    },
  };
}

// --- Dictionnaire de la WBS ---

export function wbsDictionaryToInput(dictionary: WbsDictionary): WbsDictionaryInput {
  return {
    entries: dictionary.entries.map((entry) => ({
      ...entry,
      milestones: entry.milestones.map((milestone) => ({ name: milestone.name, dueDate: isoDate(milestone.dueDate) })),
    })),
  };
}

export function inputToWbsDictionary(projectId: string, input: WbsDictionaryInput): WbsDictionary {
  return WbsDictionary.create({
    projectId,
    entries: input.entries.map((entry) => ({
      ...entry,
      milestones: entry.milestones.map((milestone) => ({ ...milestone, dueDate: parseIsoDate(milestone.dueDate) })),
    })),
  });
}

export function toWbsDictionaryDto(
  dictionary: WbsDictionary,
  context: (wbsCode: string) => Omit<WbsDictionaryDto['entries'][number], keyof WbsDictionaryInput['entries'][number]>,
): WbsDictionaryDto {
  return {
    projectId: dictionary.projectId,
    entries: wbsDictionaryToInput(dictionary).entries.map((entry) => ({ ...entry, ...context(entry.wbsCode) })),
  };
}
