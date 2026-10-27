import type { DeliverableDto } from '@shared/index';
import { PersonName } from '@/components/people/People';
import { EditCell, EditHeader } from '@/components/ui/EditEntry';
import { DELIVERABLE_STAGE_LABELS, DELIVERABLE_STAGE_MODIFIERS } from '@/lib/closing-format';
import { formatShortDate } from '@/lib/format';
import type { AppView } from '@/navigation/pmp';

interface DeliverablesTableProps {
  deliverables: readonly DeliverableDto[];
  onNavigate: (view: AppView) => void;
  /** Éditeurs : « Modifier » sur chaque livrable. */
  onEdit?: (wbsCode: string) => void;
}

/** Livrables du projet : production, vérification puis décision d'acceptation. */
export function DeliverablesTable({ deliverables, onNavigate, onEdit }: DeliverablesTableProps) {
  return (
    <div className="wbs-scroll">
      <table className="register-table register-table--deliverables">
        <thead>
          <tr>
            <th>WBS</th>
            <th>Livrable</th>
            <th>Fin prévue</th>
            <th>Avancement</th>
            <th>Étape</th>
            <th>Vérification</th>
            <th>Décision</th>
            {onEdit && <EditHeader />}
          </tr>
        </thead>
        <tbody>
          {deliverables.map((item) => (
            <tr key={item.wbsCode}>
              <td className="register-table__code">{item.wbsCode}</td>
              <td className="register-table__title">
                {item.deliverable || item.name}
                <span className="register-table__muted">{item.name}</span>
                {item.acceptanceCriteria && (
                  <span className="register-table__muted">Acceptation : {item.acceptanceCriteria}</span>
                )}
              </td>
              <td>{formatShortDate(item.plannedFinish)}</td>
              <td>
                <div className="deliverable-progress" aria-label={`${item.percentComplete} % réalisé`}>
                  <span style={{ width: `${Math.min(item.percentComplete, 100)}%` }} />
                </div>
                <span className="register-table__muted">{item.percentComplete} %</span>
              </td>
              <td>
                <span className={`status-badge status-badge--${DELIVERABLE_STAGE_MODIFIERS[item.stage]}`}>
                  {DELIVERABLE_STAGE_LABELS[item.stage]}
                </span>
              </td>
              <td className="register-table__response">
                {item.verification ? (
                  <>
                    Le {formatShortDate(item.verification.verifiedOn)} par <PersonName id={item.verification.verifiedById} />
                    {item.verification.notes && <span className="register-table__muted">{item.verification.notes}</span>}
                  </>
                ) : (
                  <span className="register-table__muted-cell">—</span>
                )}
              </td>
              <td className="register-table__response">
                {item.acceptance ? (
                  <>
                    {item.acceptance.decision === 'ACCEPTED' ? 'Accepté' : 'Refusé'} le {formatShortDate(item.acceptance.decidedOn)} par{' '}
                    <PersonName id={item.acceptance.decidedById} />
                    {item.acceptance.comments && <span className="register-table__muted">{item.acceptance.comments}</span>}
                    {item.acceptance.changeCode && (
                      <button type="button" className="ref-link" onClick={() => onNavigate('change-log')}>
                        {item.acceptance.changeCode} →
                      </button>
                    )}
                  </>
                ) : (
                  <span className="register-table__muted-cell">—</span>
                )}
              </td>
              {onEdit && <EditCell label={item.deliverable || item.wbsCode} onEdit={() => onEdit(item.wbsCode)} />}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
