import type { CharterMilestone } from '@domain/entities/project-charter';
import type { ScheduleMilestone } from '@domain/entities/schedule-model';

export type CharterMilestoneState = 'UNPLANNED' | 'ON_TRACK' | 'EARLY' | 'LATE' | 'ACHIEVED';

export interface CharterMilestoneStatus {
  code: string;
  name: string;
  approvedDate: Date;
  milestoneCode: string | null;
  plannedDate: Date | null;
  achievedOn: Date | null;
  varianceDays: number | null;
  state: CharterMilestoneState;
}

const DAY = 86_400_000;

/** Écart en jours calendaires : date atteinte (sinon prévue) du jalon moins date approuvée à la charte. */
export function charterVarianceDays(approved: Date, milestone: Pick<ScheduleMilestone, 'targetDate' | 'achievedOn'>): number {
  const reference = milestone.achievedOn ?? milestone.targetDate;
  return Math.round((reference.getTime() - approved.getTime()) / DAY);
}

/**
 * Jalons de la charte face au calendrier. Un jalon du calendrier réalise un jalon de la charte en
 * le citant ; sans lui, le jalon de la charte n'est pas planifié. La charte garde sa date approuvée,
 * le calendrier la sienne : l'écart est ce que le sponsor veut voir.
 */
export function charterMilestoneStatuses(
  charter: readonly CharterMilestone[],
  schedule: readonly ScheduleMilestone[],
): CharterMilestoneStatus[] {
  return [...charter]
    .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime())
    .map((item) => {
      const linked = schedule.find((milestone) => milestone.charterCode?.toUpperCase() === item.code.toUpperCase()) ?? null;
      const base = { code: item.code, name: item.name, approvedDate: item.targetDate };
      if (!linked) {
        return { ...base, milestoneCode: null, plannedDate: null, achievedOn: null, varianceDays: null, state: 'UNPLANNED' as const };
      }
      const variance = charterVarianceDays(item.targetDate, linked);
      const state = linked.achievedOn ? 'ACHIEVED' : variance > 0 ? 'LATE' : variance < 0 ? 'EARLY' : 'ON_TRACK';
      return {
        ...base,
        milestoneCode: linked.code,
        plannedDate: linked.targetDate,
        achievedOn: linked.achievedOn,
        varianceDays: variance,
        state,
      };
    });
}

/** À signaler : jalon de la charte non planifié, ou prévu après sa date approuvée sans être atteint. */
export const isCharterMilestoneAlert = (status: Pick<CharterMilestoneStatus, 'state'>): boolean =>
  status.state === 'UNPLANNED' || status.state === 'LATE';
