import { DomainError } from '@domain/errors/domain-errors';
import { assertProjectId, assertUniqueCodes, entryCode, requiredText } from '@domain/value-objects/register-rules';

export const ISSUE_TYPES = [
  'RESOURCE',
  'TECHNICAL',
  'STAKEHOLDER',
  'SCOPE',
  'QUALITY',
  'SCHEDULE',
  'COST',
  'EXTERNAL',
  'PROCESS',
] as const;
export type IssueType = (typeof ISSUE_TYPES)[number];

export const ISSUE_PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'] as const;
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];

export const ISSUE_STATUSES = ['OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED'] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

const MS_PER_DAY = 86_400_000;

export interface IssueProps {
  code: string;
  type: IssueType;
  description: string;
  priority: IssuePriority;
  impact: string;
  /** Ressource du référentiel (identifiant). */
  ownerId: string;
  raisedOn: Date;
  status: IssueStatus;
  resolvedOn: Date | null;
  resolution: string;
  comments: string;
  riskCode: string | null;
  changeCode: string | null;
}

const isOneOf = <T extends string>(values: readonly T[], value: string): value is T =>
  (values as readonly string[]).includes(value);

/**
 * Problème du journal (template « Issue Log ») : un responsable, une priorité, un statut. Résolu,
 * il porte sa date (jamais avant qu'il soit consigné) et sa résolution ; sinon, pas de date.
 */
export class Issue {
  private constructor(readonly props: Readonly<IssueProps>) {}

  static create(params: IssueProps): Issue {
    const code = entryCode(params.code, 'de problème');
    if (!isOneOf(ISSUE_TYPES, params.type) || !isOneOf(ISSUE_PRIORITIES, params.priority) || !isOneOf(ISSUE_STATUSES, params.status)) {
      throw new DomainError(`${code} : type, priorité ou statut inconnu.`);
    }
    if (Number.isNaN(params.raisedOn.getTime())) {
      throw new DomainError(`${code} : date de signalement invalide.`);
    }

    const resolved = params.status === 'RESOLVED';
    if (resolved) {
      if (!params.resolvedOn || Number.isNaN(params.resolvedOn.getTime())) {
        throw new DomainError(`${code} : un problème résolu porte sa date de résolution.`);
      }
      if (params.resolvedOn.getTime() < params.raisedOn.getTime()) {
        throw new DomainError(`${code} : la résolution ne peut précéder le signalement.`);
      }
    } else if (params.resolvedOn) {
      throw new DomainError(`${code} : un problème non résolu n'a pas de date de résolution.`);
    }

    return new Issue(
      Object.freeze({
        code,
        type: params.type,
        description: requiredText(params.description, `${code} : décrivez le problème.`),
        priority: params.priority,
        impact: params.impact.trim(),
        ownerId: requiredText(params.ownerId, `${code} : choisissez le responsable dans le référentiel des ressources.`),
        raisedOn: new Date(params.raisedOn),
        status: params.status,
        resolvedOn: resolved ? new Date(params.resolvedOn!) : null,
        resolution: resolved
          ? requiredText(params.resolution, `${code} : décrivez la résolution.`)
          : params.resolution.trim(),
        comments: params.comments.trim(),
        riskCode: params.riskCode?.trim() ? entryCode(params.riskCode, 'de risque lié') : null,
        changeCode: params.changeCode?.trim() ? entryCode(params.changeCode, 'de demande de modification liée') : null,
      }),
    );
  }

  get code(): string {
    return this.props.code;
  }

  get isOpen(): boolean {
    return this.props.status !== 'RESOLVED';
  }
}

export interface IssueLogSummary {
  total: number;
  open: number;
  escalated: number;
  highPriorityOpen: number;
  resolved: number;
  averageResolutionDays: number | null;
}

/** Codes liés absents de leur registre (comparaison sans casse). */
const unknown = (codes: readonly (string | null)[], known: readonly string[]): string[] => {
  const set = new Set(known.map((code) => code.toUpperCase()));
  return codes.filter((code): code is string => code !== null && !set.has(code.toUpperCase()));
};

/** Agrégat racine : le journal des problèmes d'un projet ; codes uniques. Vide : valide. */
export class IssueLog {
  private constructor(
    public readonly projectId: string,
    public readonly issues: readonly Issue[],
  ) {}

  static create(params: { projectId: string; issues: readonly Issue[] }): IssueLog {
    assertProjectId(params.projectId);
    assertUniqueCodes(params.issues, 'de problème');
    return new IssueLog(params.projectId, [...params.issues]);
  }

  static empty(projectId: string): IssueLog {
    return IssueLog.create({ projectId, issues: [] });
  }

  unknownRiskCodes(knownRiskCodes: readonly string[]): string[] {
    return unknown(this.issues.map((issue) => issue.props.riskCode), knownRiskCodes);
  }

  unknownChangeCodes(knownChangeCodes: readonly string[]): string[] {
    return unknown(this.issues.map((issue) => issue.props.changeCode), knownChangeCodes);
  }

  get summary(): IssueLogSummary {
    const open = this.issues.filter((issue) => issue.isOpen);
    const resolutionDays = this.issues
      .filter((issue) => issue.props.resolvedOn)
      .map((issue) => (issue.props.resolvedOn!.getTime() - issue.props.raisedOn.getTime()) / MS_PER_DAY);
    return {
      total: this.issues.length,
      open: open.length,
      escalated: open.filter((issue) => issue.props.status === 'ESCALATED').length,
      highPriorityOpen: open.filter((issue) => issue.props.priority === 'HIGH').length,
      resolved: this.issues.length - open.length,
      averageResolutionDays:
        resolutionDays.length === 0
          ? null
          : Math.round((resolutionDays.reduce((sum, days) => sum + days, 0) / resolutionDays.length) * 10) / 10,
    };
  }
}
