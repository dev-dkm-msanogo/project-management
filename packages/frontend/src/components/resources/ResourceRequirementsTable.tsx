import type { ResourceRequirementInput } from '@shared/index';
import { EditCell, EditHeader } from '@/components/ui/EditEntry';
import { byCategoryThenCode, RESOURCE_CATEGORY_LABELS } from '@/lib/resource-format';

/** Besoins en ressources (template « Resource Requirements »), regroupés par catégorie. */
export function ResourceRequirementsTable({
  requirements,
  onEdit,
}: {
  requirements: readonly ResourceRequirementInput[];
  onEdit?: (code: string) => void;
}) {
  const rows = [...requirements].sort(byCategoryThenCode);

  return (
    <div className="wbs-scroll">
      <table className="register-table register-table--resources">
        <thead>
          <tr>
            <th>ID</th>
            <th>Ressource</th>
            <th>Catégorie</th>
            <th>Quantité</th>
            <th>Niveau / qualité</th>
            <th>Hypothèses</th>
            <th>Commentaires</th>
            {onEdit && <EditHeader />}
          </tr>
        </thead>
        <tbody>
          {rows.map((requirement) => (
            <tr key={requirement.code}>
              <td className="register-table__code">{requirement.code}</td>
              <td className="register-table__title">
                {requirement.name}
                {requirement.group && <span className="register-table__muted">{requirement.group}</span>}
              </td>
              <td className="register-table__muted-cell">{RESOURCE_CATEGORY_LABELS[requirement.category]}</td>
              <td className="resource-quantity">{requirement.quantity || '—'}</td>
              <td>{requirement.grade || '—'}</td>
              <td className="register-table__response">{requirement.assumptions || '—'}</td>
              <td className="register-table__note">{requirement.comments || '—'}</td>
              {onEdit && <EditCell label={requirement.code} onEdit={() => onEdit(requirement.code)} />}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
