import type { RequirementInput } from '@shared/index';
import { PriorityBadge, RequirementStatusBadge } from '@/components/requirements/RequirementBadges';
import { EditCell, EditHeader } from '@/components/ui/EditEntry';
import { isActive, REQUIREMENT_CATEGORY_LABELS } from '@/lib/requirements-format';

/** Documentation des exigences : énoncé, source, catégorie, priorité, acceptation et vérification. */
export function RequirementsDocumentation({
  requirements,
  onEdit,
}: {
  requirements: readonly RequirementInput[];
  onEdit?: (code: string) => void;
}) {
  return (
    <div className="wbs-scroll">
      <table className="register-table register-table--requirements">
        <thead>
          <tr>
            <th>ID</th>
            <th>Exigence</th>
            <th>Partie prenante</th>
            <th>Catégorie</th>
            <th>Priorité</th>
            <th>Critères d'acceptation</th>
            <th>Vérification</th>
            <th>Phase</th>
            <th>Statut</th>
            {onEdit && <EditHeader />}
          </tr>
        </thead>
        <tbody>
          {requirements.map((requirement) => (
            <tr key={requirement.code} className={isActive(requirement) ? undefined : 'register-row--muted'}>
              <td className="register-table__code">{requirement.code}</td>
              <td className="register-table__title">{requirement.statement}</td>
              <td>{requirement.source || '—'}</td>
              <td className="register-table__muted-cell">{REQUIREMENT_CATEGORY_LABELS[requirement.category]}</td>
              <td>
                <PriorityBadge priority={requirement.priority} />
              </td>
              <td className="register-table__response">{requirement.acceptanceCriteria || '—'}</td>
              <td className="register-table__note">{requirement.verification || '—'}</td>
              <td className="register-table__muted-cell">{requirement.phase || '—'}</td>
              <td>
                <RequirementStatusBadge status={requirement.status} />
              </td>
              {onEdit && <EditCell label={requirement.code} onEdit={() => onEdit(requirement.code)} />}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
