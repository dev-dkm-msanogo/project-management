import type { ReactNode } from 'react';
import type { QualityManagementPlanDto, RoleResponsibilityInput } from '@shared/index';
import { sectionsOf, TextSections } from '@/components/ui/TextSections';
import { formatLongDate } from '@/lib/format';
import { QUALITY_TEXT_LABELS } from '@/lib/quality-risk-format';

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="doc-panel">
      <h2 className="plan__section-title">{title}</h2>
      {children}
    </section>
  );
}

export function Bullets({ items, empty }: { items: readonly string[]; empty: string }) {
  if (items.length === 0) return <p className="plan__empty">{empty}</p>;
  return (
    <ul className="doc-list">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

/** Rôles et responsabilités (plans qualité et risques). */
export function RoleTable({ roles }: { roles: readonly RoleResponsibilityInput[] }) {
  if (roles.length === 0) return <p className="plan__empty">Aucun rôle défini.</p>;
  return (
    <div className="wbs-scroll">
      <table className="register-table">
        <thead>
          <tr>
            <th>Rôle</th>
            <th>Responsabilités</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.role}>
              <td className="register-table__title">{role.role}</td>
              <td className="register-table__response">{role.responsibility || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Plan de gestion de la qualité lu comme le template PMI. */
export function QualityPlanView({ plan, projectName }: { plan: QualityManagementPlanDto; projectName: string }) {
  return (
    <article className="doc-page">
      <section className="doc-panel">
        <div className="doc-heading">
          <h2 className="doc-title">{projectName}</h2>
          <span className="doc-meta">Préparé le {formatLongDate(plan.preparedOn)}</span>
        </div>
        <h3 className="doc-subtitle">Normes et référentiels</h3>
        <Bullets items={plan.standards} empty="Aucune norme retenue." />
      </section>

      <Panel title="Objectifs qualité">
        {plan.objectives.length === 0 ? (
          <p className="plan__empty">Aucun objectif qualité.</p>
        ) : (
          <div className="wbs-scroll">
            <table className="register-table">
              <thead>
                <tr>
                  <th>Objectif</th>
                  <th>Indicateur et mesure</th>
                </tr>
              </thead>
              <tbody>
                {plan.objectives.map((item, index) => (
                  <tr key={index}>
                    <td className="register-table__title">{item.objective}</td>
                    <td className="register-table__response">{item.measure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Rôles et responsabilités qualité">
        <RoleTable roles={plan.roles} />
      </Panel>

      <Panel title="Livrables et processus soumis à revue qualité">
        <div className="doc-columns">
          <div>
            <h3 className="doc-subtitle">Livrables</h3>
            <Bullets items={plan.deliverables} empty="Aucun livrable." />
          </div>
          <div>
            <h3 className="doc-subtitle">Processus</h3>
            <Bullets items={plan.processes} empty="Aucun processus." />
          </div>
        </div>
      </Panel>

      <Panel title="Assurance et contrôle de la qualité">
        <TextSections sections={sectionsOf(QUALITY_TEXT_LABELS, plan)} />
      </Panel>
    </article>
  );
}
