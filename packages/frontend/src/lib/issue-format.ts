import type { IssueInput, IssueLogDto, IssueLogInput, IssuePriority, IssueStatus, IssueType } from '@shared/index';
import { todayIso } from '@/lib/format';

/** Libellés et règles d'affichage du journal des problèmes (template « Issue Log »). */

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  RESOURCE: 'Ressources',
  TECHNICAL: 'Technique',
  STAKEHOLDER: 'Parties prenantes',
  SCOPE: 'Périmètre',
  QUALITY: 'Qualité',
  SCHEDULE: 'Délai',
  COST: 'Coût',
  EXTERNAL: 'Externe',
  PROCESS: 'Processus',
};

export const ISSUE_PRIORITY_LABELS: Record<IssuePriority, string> = {
  HIGH: 'Haute',
  MEDIUM: 'Moyenne',
  LOW: 'Basse',
};

export const ISSUE_PRIORITY_MODIFIERS: Record<IssuePriority, 'red' | 'amber' | 'green'> = {
  HIGH: 'red',
  MEDIUM: 'amber',
  LOW: 'green',
};

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  ESCALATED: 'Escaladé',
  RESOLVED: 'Résolu',
};

export const ISSUE_STATUS_MODIFIERS: Record<IssueStatus, 'amber' | 'blue' | 'red' | 'green'> = {
  OPEN: 'amber',
  IN_PROGRESS: 'blue',
  ESCALATED: 'red',
  RESOLVED: 'green',
};

const PRIORITY_ORDER: readonly IssuePriority[] = ['HIGH', 'MEDIUM', 'LOW'];
const STATUS_ORDER: readonly IssueStatus[] = ['ESCALATED', 'OPEN', 'IN_PROGRESS', 'RESOLVED'];

/** Ordre de suivi : escaladés, puis priorité, puis ancienneté. */
export const byFollowUp = (a: IssueInput, b: IssueInput): number =>
  STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
  PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority) ||
  a.raisedOn.localeCompare(b.raisedOn) ||
  a.code.localeCompare(b.code);

export function blankIssue(code: string): IssueInput {
  return {
    code,
    type: 'TECHNICAL',
    description: '',
    priority: 'MEDIUM',
    impact: '',
    ownerId: '',
    raisedOn: todayIso(),
    status: 'OPEN',
    resolvedOn: null,
    resolution: '',
    comments: '',
    riskCode: null,
    changeCode: null,
  };
}

export function issueLogDtoToInput(dto: IssueLogDto): IssueLogInput {
  return structuredClone({ issues: dto.issues });
}
