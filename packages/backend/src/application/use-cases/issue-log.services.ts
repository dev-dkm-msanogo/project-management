import { ChangeLog } from '@domain/entities/change-log';
import type { IssueLog } from '@domain/entities/issue-log';
import { RiskRegister } from '@domain/entities/risk-register';
import { DomainError } from '@domain/errors/domain-errors';
import { toIssueLogDto } from '@application/mappers/issue-log.mappers';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import type { RiskRegisterRepository } from '@application/ports/out/risk-register.repository';
import { loadOrEmpty } from '@application/use-cases/load-or-empty';
import type { IssueLogDto } from '@shared/index';

/**
 * Journal des problèmes : les risques et demandes de modification liés doivent exister dans
 * leurs registres (intégrité référentielle) ; leurs intitulés sont relus à chaque lecture.
 */
export function issueLogServices(risks: RiskRegisterRepository, changes: ProjectDocumentRepository<ChangeLog>) {
  const registers = (projectId: string) =>
    Promise.all([loadOrEmpty(risks, projectId, RiskRegister.empty), loadOrEmpty(changes, projectId, ChangeLog.empty)]);

  return {
    toDto: async (log: IssueLog): Promise<IssueLogDto> => {
      const [riskRegister, changeLog] = await registers(log.projectId);
      const linked = (code: string | null, entries: readonly { code: string; title: string }[]) =>
        entries.find((entry) => code !== null && entry.code.toUpperCase() === code.toUpperCase());
      const references: IssueLogDto['references'] = { risks: {}, changes: {} };
      for (const { props } of log.issues) {
        const risk = linked(props.riskCode, riskRegister.risks);
        if (risk) references.risks[props.riskCode!] = risk.title;
        const change = linked(props.changeCode, changeLog.requests.map((request) => request.props));
        if (change) references.changes[props.changeCode!] = change.title;
      }
      return toIssueLogDto(log, references);
    },

    beforeSave: async (log: IssueLog): Promise<void> => {
      const [riskRegister, changeLog] = await registers(log.projectId);
      const unknownRisks = log.unknownRiskCodes(riskRegister.risks.map((risk) => risk.code));
      if (unknownRisks.length > 0) {
        throw new DomainError(`Risque(s) absent(s) du registre des risques : ${unknownRisks.join(', ')}.`);
      }
      const unknownChanges = log.unknownChangeCodes(changeLog.requests.map((request) => request.code));
      if (unknownChanges.length > 0) {
        throw new DomainError(`Demande(s) absente(s) du registre des modifications : ${unknownChanges.join(', ')}.`);
      }
    },
  };
}
