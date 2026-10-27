import { Issue, IssueLog } from '@domain/entities/issue-log';
import { isoDate, isoDateOrNull, parseIsoDate, parseIsoDateOrNull } from '@application/mappers/iso-date';
import type { IssueLogDto, IssueLogInput } from '@shared/index';

/** Traductions du journal des problèmes : domaine ⇄ saisie ⇄ lecture. */

export function issueLogToInput(log: IssueLog): IssueLogInput {
  return {
    issues: log.issues.map(({ props }) => ({
      ...props,
      raisedOn: isoDate(props.raisedOn),
      resolvedOn: isoDateOrNull(props.resolvedOn),
    })),
  };
}

export function inputToIssueLog(projectId: string, input: IssueLogInput): IssueLog {
  return IssueLog.create({
    projectId,
    issues: input.issues.map((issue) =>
      Issue.create({ ...issue, raisedOn: parseIsoDate(issue.raisedOn), resolvedOn: parseIsoDateOrNull(issue.resolvedOn) }),
    ),
  });
}

/** Domaine → lecture, avec les intitulés des risques et demandes de modification liés. */
export function toIssueLogDto(log: IssueLog, references: IssueLogDto['references']): IssueLogDto {
  return { projectId: log.projectId, ...issueLogToInput(log), references, summary: log.summary };
}
