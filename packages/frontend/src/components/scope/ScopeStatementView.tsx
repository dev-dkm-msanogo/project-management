import type { ReactNode } from 'react';
import type { ScopeStatementDto } from '@shared/index';
import { AssumptionReferences } from '@/components/assumptions/AssumptionReferences';
import { formatLongDate } from '@/lib/format';
import type { AppView } from '@/navigation/pmp';

function Panel({ title, live, children }: { title: string; live?: boolean; children: ReactNode }) {
  return (
    <section className="doc-panel">
      <div className="doc-panel-head">
        <h2 className="plan__section-title">{title}</h2>
        {live && <span className="doc-sync">Issu des registres</span>}
      </div>
      {children}
    </section>
  );
}

function Bullets({ items, empty, variant }: { items: readonly string[]; empty: string; variant: 'in' | 'out' }) {
  if (items.length === 0) return <p className="plan__empty">{empty}</p>;
  return (
    <ul className={`doc-list doc-list--${variant}`}>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

interface ScopeStatementViewProps {
  statement: ScopeStatementDto;
  projectName: string;
  onNavigate: (view: AppView) => void;
}

/** Énoncé du périmètre lu comme le template PMI ; contraintes et hypothèses viennent du registre. */
export function ScopeStatementView({ statement, projectName, onNavigate }: ScopeStatementViewProps) {
  return (
    <article className="doc-page">
      <section className="doc-panel">
        <div className="doc-heading">
          <h2 className="doc-title">{projectName}</h2>
          <span className="doc-meta">Préparé le {formatLongDate(statement.preparedOn)}</span>
        </div>
        <h3 className="doc-subtitle">Description du périmètre</h3>
        <p className="doc-text">{statement.description}</p>
      </section>

      <Panel title={`Livrables du projet (${statement.deliverables.length})`}>
        {statement.deliverables.length === 0 ? (
          <p className="plan__empty">Aucun livrable défini.</p>
        ) : (
          <ol className="scope-deliverables">
            {statement.deliverables.map((deliverable) => (
              <li key={deliverable.name}>
                <strong>{deliverable.name}</strong>
                {deliverable.description && <span>{deliverable.description}</span>}
              </li>
            ))}
          </ol>
        )}
      </Panel>

      <div className="doc-columns">
        <Panel title="Critères d'acceptation du produit">
          <Bullets items={statement.acceptanceCriteria} empty="Aucun critère d'acceptation." variant="in" />
        </Panel>
        <Panel title="Exclusions du projet">
          <Bullets items={statement.exclusions} empty="Aucune exclusion." variant="out" />
        </Panel>
      </div>

      <Panel title="Contraintes et hypothèses" live>
        <AssumptionReferences
          constraints={statement.references.constraints}
          assumptions={statement.references.assumptions}
          onOpen={() => onNavigate('assumptions')}
        />
      </Panel>
    </article>
  );
}
