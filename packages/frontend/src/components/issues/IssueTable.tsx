import type { IssueInput, IssueLogDto } from '@shared/index';
import { PersonName } from '@/components/people/People';
import { EditCell, EditHeader } from '@/components/ui/EditEntry';
import { formatShortDate } from '@/lib/format';
import {
  byFollowUp,
  ISSUE_PRIORITY_LABELS,
  ISSUE_PRIORITY_MODIFIERS,
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_MODIFIERS,
  ISSUE_TYPE_LABELS,
} from '@/lib/issue-format';
import type { AppView } from '@/navigation/pmp';

interface IssueTableProps {
  issues: readonly IssueInput[];
  references: IssueLogDto['references'];
  onNavigate: (view: AppView) => void;
  /** Éditeurs : « Modifier » sur chaque entrée. */
  onEdit?: (key: string) => void;
}

/** Problèmes du journal (template « Issue Log »), dans l'ordre de suivi. */
export function IssueTable({ issues, references, onNavigate, onEdit }: IssueTableProps) {
  if (issues.length === 0) return <p className="plan__empty">Aucun problème.</p>;

  return (
    <div className="wbs-scroll">
      <table className="register-table register-table--issues">
        <thead>
          <tr>
            <th>Code</th>
            <th>Type</th>
            <th>Problème</th>
            <th>Priorité</th>
            <th>Responsable</th>
            <th>Statut</th>
            <th>Résolution</th>
            <th>Liens</th>
            {onEdit && <EditHeader />}
          </tr>
        </thead>
        <tbody>
          {[...issues].sort(byFollowUp).map((issue) => (
            <tr key={issue.code}>
              <td className="register-table__code">{issue.code}</td>
              <td className="register-table__muted-cell">{ISSUE_TYPE_LABELS[issue.type]}</td>
              <td className="register-table__title">
                {issue.description}
                {issue.impact && <span className="register-table__muted">Impact : {issue.impact}</span>}
                <span className="register-table__muted">Signalé le {formatShortDate(issue.raisedOn)}</span>
              </td>
              <td>
                <span className={`status-badge status-badge--${ISSUE_PRIORITY_MODIFIERS[issue.priority]}`}>
                  {ISSUE_PRIORITY_LABELS[issue.priority]}
                </span>
              </td>
              <td>
                <PersonName id={issue.ownerId} />
              </td>
              <td>
                <span className={`status-badge status-badge--${ISSUE_STATUS_MODIFIERS[issue.status]}`}>
                  {ISSUE_STATUS_LABELS[issue.status]}
                </span>
                {issue.resolvedOn && <span className="register-table__muted">le {formatShortDate(issue.resolvedOn)}</span>}
              </td>
              <td className="register-table__response">
                {issue.resolution || '—'}
                {issue.comments && <span className="register-table__muted">{issue.comments}</span>}
              </td>
              <td>
                <div className="issue-links">
                  {issue.riskCode && (
                    <button type="button" className="ref-link" onClick={() => onNavigate('risks')}
                      title={references.risks[issue.riskCode] ?? undefined}>
                      {issue.riskCode} →
                    </button>
                  )}
                  {issue.changeCode && (
                    <button type="button" className="ref-link" onClick={() => onNavigate('change-log')}
                      title={references.changes[issue.changeCode] ?? undefined}>
                      {issue.changeCode} →
                    </button>
                  )}
                  {!issue.riskCode && !issue.changeCode && <span className="register-table__muted-cell">—</span>}
                </div>
              </td>
              {onEdit && <EditCell label={issue.code} onEdit={() => onEdit(issue.code)} />}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
