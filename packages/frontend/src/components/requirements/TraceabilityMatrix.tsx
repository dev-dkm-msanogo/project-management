import type { RequirementInput } from '@shared/index';
import { PriorityBadge } from '@/components/requirements/RequirementBadges';
import { isActive, REQUIREMENT_CATEGORY_LABELS } from '@/lib/requirements-format';

/**
 * Matrice de traçabilité des exigences (template PMI) : chaque exigence reliée à l'objectif
 * métier qu'elle sert, au livrable qui la réalise, à sa vérification et à sa validation.
 */
export function TraceabilityMatrix({ requirements }: { requirements: readonly RequirementInput[] }) {
  return (
    <div className="wbs-scroll">
      <table className="register-table register-table--traceability">
        <thead>
          <tr className="trace-groups">
            <th colSpan={5}>Exigence</th>
            <th colSpan={2}>Relations</th>
            <th colSpan={2}>Traçabilité</th>
          </tr>
          <tr>
            <th>ID</th>
            <th>Exigence</th>
            <th>Source</th>
            <th>Priorité</th>
            <th>Catégorie</th>
            <th className="trace-group-start">Objectif métier</th>
            <th>Livrable</th>
            <th className="trace-group-start">Vérification</th>
            <th>Validation</th>
          </tr>
        </thead>
        <tbody>
          {requirements.map((requirement) => {
            const active = isActive(requirement);
            return (
              <tr key={requirement.code} className={active ? undefined : 'register-row--muted'}>
                <td className="register-table__code">{requirement.code}</td>
                <td className="register-table__title">{requirement.statement}</td>
                <td>{requirement.source || '—'}</td>
                <td>
                  <PriorityBadge priority={requirement.priority} />
                </td>
                <td className="register-table__muted-cell">{REQUIREMENT_CATEGORY_LABELS[requirement.category]}</td>
                <td className="trace-group-start register-table__note">{requirement.businessObjective || '—'}</td>
                <td>
                  {requirement.deliverable ||
                    (active ? (
                      <span className="register-flag" title="Exigence active reliée à aucun livrable">
                        À relier
                      </span>
                    ) : (
                      '—'
                    ))}
                </td>
                <td className="trace-group-start register-table__note">{requirement.verification || '—'}</td>
                <td className="register-table__note">{requirement.validation || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
