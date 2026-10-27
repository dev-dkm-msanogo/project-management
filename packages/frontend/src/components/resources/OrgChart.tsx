import type { ResourceRoleInput } from '@shared/index';
import { PersonName } from '@/components/people/People';
import { buildOrgChart, type OrgNode } from '@/lib/resource-format';

function Branch({ node }: { node: OrgNode }) {
  return (
    <li>
      <div className="org-card">
        <strong>{node.role.role}</strong>
        {node.role.holderId && (
          <span>
            <PersonName id={node.role.holderId} />
          </span>
        )}
      </div>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <Branch key={child.role.role} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Organigramme du projet, déduit du rattachement des rôles (template « Resource Management Plan »). */
export function OrgChart({ roles }: { roles: readonly ResourceRoleInput[] }) {
  const tree = buildOrgChart(roles);
  if (tree.length === 0) return <p className="plan__empty">Aucun rôle défini.</p>;
  return (
    <div className="org-chart" role="img" aria-label="Organigramme du projet">
      <ul>
        {tree.map((node) => (
          <Branch key={node.role.role} node={node} />
        ))}
      </ul>
    </div>
  );
}
