import { ClosureReport } from '@domain/entities/closure-report';
import { isoDate, isoDateOrNull, parseIsoDate, parseIsoDateOrNull } from '@application/mappers/iso-date';
import type { ClosureReportInput } from '@shared/index';

/** Traductions du rapport de clôture : domaine ⇄ saisie (la lecture ajoute les faits relus dans le projet). */

export function closureReportToInput(report: ClosureReport): ClosureReportInput {
  const { projectId: _projectId, ...props } = report.props;
  return {
    ...props,
    preparedOn: isoDate(props.preparedOn),
    objectives: props.objectives.map((item) => ({ ...item })),
    benefits: props.benefits.map((item) => ({ ...item })),
    recipients: props.recipients.map((item) => ({ ...item })),
    outstandingItems: [...props.outstandingItems],
    acceptances: props.acceptances.map((item) => ({ ...item, acceptedOn: isoDateOrNull(item.acceptedOn) })),
  };
}

export function inputToClosureReport(projectId: string, input: ClosureReportInput): ClosureReport {
  return ClosureReport.create({
    ...input,
    projectId,
    preparedOn: parseIsoDate(input.preparedOn),
    acceptances: input.acceptances.map((item) => ({ ...item, acceptedOn: parseIsoDateOrNull(item.acceptedOn) })),
  });
}
