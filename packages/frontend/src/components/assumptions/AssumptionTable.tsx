import type { AssumptionEntryDto, AssumptionKind, AssumptionStatus } from '@shared/index';
import { PersonName } from '@/components/people/People';
import { EditCell, EditHeader } from '@/components/ui/EditEntry';
import {
  ASSUMPTION_CATEGORY_LABELS,
  ASSUMPTION_STATUS_LABELS,
  ASSUMPTION_STATUS_MODIFIERS,
  isValidationOverdue,
  needsRisk,
} from '@/lib/assumption-format';
import { formatShortDate } from '@/lib/format';

/** Ordre de suivi : ce qui demande une action d'abord. */
const STATUS_ORDER: readonly AssumptionStatus[] = ['TO_VALIDATE', 'INVALIDATED', 'ACTIVE', 'VALIDATED', 'LIFTED'];

const byFollowUp = (a: AssumptionEntryDto, b: AssumptionEntryDto): number =>
  STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
  (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') ||
  a.code.localeCompare(b.code);

interface AssumptionTableProps {
  entries: AssumptionEntryDto[];
  kind: AssumptionKind;
  onOpenRiskRegister: () => void;
  /** Éditeurs : « Modifier » sur chaque entrée. */
  onEdit?: (key: string) => void;
}

/** Hypothèses (validation, échéance, risque lié) ou contraintes (statut, effet). */
export function AssumptionTable({ entries, kind, onOpenRiskRegister, onEdit }: AssumptionTableProps) {
  const isAssumption = kind === 'ASSUMPTION';
  const rows = entries.filter((entry) => entry.kind === kind).sort(byFollowUp);

  if (rows.length === 0) {
    return (
      <p className="plan__empty">{isAssumption ? 'Aucune hypothèse enregistrée.' : 'Aucune contrainte enregistrée.'}</p>
    );
  }

  return (
    <div className="wbs-scroll">
      <table className="register-table register-table--assumptions">
        <thead>
          <tr>
            <th>Code</th>
            <th>Catégorie</th>
            <th>{isAssumption ? 'Hypothèse' : 'Contrainte'}</th>
            <th>Responsable</th>
            <th>Échéance</th>
            <th>Actions</th>
            <th>Statut</th>
            <th>Commentaires</th>
            {isAssumption && <th>Risque lié</th>}
            {onEdit && <EditHeader />}
          </tr>
        </thead>
        <tbody>
          {rows.map((entry) => {
            const overdue = isValidationOverdue(entry);
            return (
              <tr key={entry.code} className={entry.status === 'LIFTED' ? 'register-row--muted' : undefined}>
                <td className="register-table__code">{entry.code}</td>
                <td className="register-table__muted-cell">{ASSUMPTION_CATEGORY_LABELS[entry.category]}</td>
                <td className="register-table__title">{entry.statement}</td>
                <td>
                  <PersonName id={entry.ownerId} />
                </td>
                <td className={overdue ? 'register-table__overdue' : 'register-table__muted-cell'}>
                  {entry.dueDate ? formatShortDate(entry.dueDate) : 'En continu'}
                  {overdue && <span className="register-table__overdue-flag">En retard</span>}
                </td>
                <td className="register-table__response">{entry.actions ?? '—'}</td>
                <td>
                  <span className={`status-badge status-badge--${ASSUMPTION_STATUS_MODIFIERS[entry.status]}`}>
                    {ASSUMPTION_STATUS_LABELS[entry.status]}
                  </span>
                </td>
                <td className="register-table__response register-table__note">{entry.comments ?? '—'}</td>
                {isAssumption && (
                  <td>
                    {entry.riskCode ? (
                      <button
                        type="button"
                        className="ref-link"
                        onClick={onOpenRiskRegister}
                        title="Ouvrir le registre des risques"
                      >
                        {entry.riskCode} →
                      </button>
                    ) : needsRisk(entry) ? (
                      <span className="register-flag" title="Hypothèse invalidée : créez ou liez le risque qui la porte">
                        Risque à créer
                      </span>
                    ) : (
                      <span className="register-table__muted-cell">—</span>
                    )}
                  </td>
                )}
                {onEdit && <EditCell label={entry.code} onEdit={() => onEdit(entry.code)} />}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
