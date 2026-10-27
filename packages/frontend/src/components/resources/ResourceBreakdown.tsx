import type { ResourceRequirementInput } from '@shared/index';
import { buildRbs, type RbsNode } from '@/lib/resource-format';

function Node({ node, level }: { node: RbsNode; level: number }) {
  return (
    <li className={`rbs__node rbs__node--level-${level}`}>
      <div className="rbs__row">
        <span className="rbs__code">{node.code}</span>
        <span className="rbs__label">{node.label}</span>
        {node.detail && <span className="rbs__detail">{node.detail}</span>}
      </div>
      {node.children.length > 0 && (
        <ul className="rbs__children">
          {node.children.map((child) => (
            <Node key={child.code} node={child} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Structure de découpage des ressources (template « Resource Breakdown Structure »), déduite
 * des besoins : catégorie, sous-ensemble, puis chaque ressource avec sa quantité.
 */
export function ResourceBreakdown({ requirements, projectName }: { requirements: readonly ResourceRequirementInput[]; projectName: string }) {
  return (
    <div className="rbs">
      <p className="rbs__root">
        <span className="rbs__code">1</span> Ressources du projet{projectName ? ` – ${projectName}` : ''}
      </p>
      <ul className="rbs__children rbs__children--top">
        {buildRbs(requirements).map((node) => (
          <Node key={node.code} node={node} level={1} />
        ))}
      </ul>
    </div>
  );
}
