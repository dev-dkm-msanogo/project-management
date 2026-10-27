import { AssumptionEntry } from '@domain/entities/assumption-entry';
import { AssumptionLog } from '@domain/entities/assumption-log';
import { isoDateOrNull, parseIsoDateOrNull } from '@application/mappers/iso-date';
import type { AssumptionEntryDto, AssumptionLogDto, AssumptionLogInput } from '@shared/index';

/** Traductions du registre des hypothèses et contraintes : domaine ⇄ saisie ⇄ lecture. */

export function toAssumptionEntryDto(entry: AssumptionEntry): AssumptionEntryDto {
  return { ...entry.props, dueDate: isoDateOrNull(entry.props.dueDate) };
}

export function toAssumptionLogDto(log: AssumptionLog): AssumptionLogDto {
  return { projectId: log.projectId, entries: log.entries.map(toAssumptionEntryDto) };
}

/** Domaine → saisie (identique à la lecture : aucun champ calculé). */
export function assumptionLogToInput(log: AssumptionLog): AssumptionLogInput {
  return { entries: log.entries.map(toAssumptionEntryDto) };
}

/** Saisie → domaine (invariants revalidés). */
export function inputToAssumptionLog(projectId: string, input: AssumptionLogInput): AssumptionLog {
  return AssumptionLog.create({
    projectId,
    entries: input.entries.map((entry) =>
      AssumptionEntry.create({ ...entry, dueDate: parseIsoDateOrNull(entry.dueDate) }),
    ),
  });
}
