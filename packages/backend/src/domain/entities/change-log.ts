import type { ChangeRequest } from '@domain/entities/change-request';
import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, assertUniqueCodes } from '@domain/value-objects/register-rules';

const MS_PER_DAY = 86_400_000;

export interface ChangeLogSummary {
  total: number;
  pending: number;
  approved: number;
  deferred: number;
  rejected: number;
  approvedCost: number;
  approvedScheduleDays: number;
  averageDecisionDays: number | null;
}

/**
 * Agrégat racine : le registre des modifications d'un projet (template « Change Log ») ; codes de
 * demande uniques. Un registre vide est un état valide.
 */
export class ChangeLog {
  private constructor(
    public readonly projectId: string,
    public readonly requests: readonly ChangeRequest[],
  ) {}

  static create(params: { projectId: string; requests: readonly ChangeRequest[] }): ChangeLog {
    assertProjectId(params.projectId);
    assertUniqueCodes(params.requests, 'de demande de modification');
    return new ChangeLog(params.projectId, [...params.requests]);
  }

  static empty(projectId: string): ChangeLog {
    return ChangeLog.create({ projectId, requests: [] });
  }

  /** Le registre avec la demande `code` remplacée par sa version décidée. */
  withDecision(code: string, decide: (request: ChangeRequest) => ChangeRequest): ChangeLog {
    const target = this.requests.find((request) => request.code.toLowerCase() === code.toLowerCase());
    if (!target) {
      throw new DomainError(`Aucune demande de modification ${code} dans le registre.`);
    }
    return ChangeLog.create({
      projectId: this.projectId,
      requests: this.requests.map((request) => (request === target ? decide(request) : request)),
    });
  }

  /** Décisions, coûts et délais approuvés, délai moyen de décision (au dixième de jour). */
  get summary(): ChangeLogSummary {
    const count = (disposition: string) =>
      this.requests.filter((request) => request.props.disposition === disposition).length;
    const approved = this.requests.filter((request) => request.props.disposition === 'APPROVED');
    const decisionDays = this.requests
      .filter((request) => request.props.decidedOn)
      .map((request) => (request.props.decidedOn!.getTime() - request.props.submittedOn.getTime()) / MS_PER_DAY);

    return {
      total: this.requests.length,
      pending: this.requests.filter((request) => request.isPending).length,
      approved: approved.length,
      deferred: count('DEFERRED'),
      rejected: count('REJECTED'),
      approvedCost: approved.reduce((sum, request) => sum + request.props.costImpact, 0),
      approvedScheduleDays: approved.reduce((sum, request) => sum + request.props.scheduleImpactDays, 0),
      averageDecisionDays:
        decisionDays.length === 0
          ? null
          : Math.round((decisionDays.reduce((sum, days) => sum + days, 0) / decisionDays.length) * 10) / 10,
    };
  }
}
