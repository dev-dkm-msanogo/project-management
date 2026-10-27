import type { ReactNode } from 'react';
import type { ProcurementPlanDto } from '@shared/index';
import { AssumptionReferences } from '@/components/assumptions/AssumptionReferences';
import { sectionsOf, TextSections } from '@/components/ui/TextSections';
import { formatLongDate, formatShortDate } from '@/lib/format';
import { INTEGRATION_LABELS, PLAN_TEXT_LABELS } from '@/lib/procurement-format';
import type { AppView } from '@/navigation/pmp';

function Panel({ title, live, children }: { title: string; live?: boolean; children: ReactNode }) {
  return (
    <section className="doc-panel">
      <div className="doc-panel-head">
        <h2 className="plan__section-title">{title}</h2>
        {live && <span className="doc-sync">Issu du registre des hypothèses et contraintes</span>}
      </div>
      {children}
    </section>
  );
}

interface ProcurementPlanViewProps {
  plan: ProcurementPlanDto;
  projectName: string;
  onNavigate: (view: AppView) => void;
}

/**
 * Plan de gestion des approvisionnements lu comme le template PMI ; ses contraintes et
 * hypothèses viennent du registre (catégorie « Approvisionnements »).
 */
export function ProcurementPlanView({ plan, projectName, onNavigate }: ProcurementPlanViewProps) {
  return (
    <article className="doc-page">
      <section className="doc-panel">
        <div className="doc-heading">
          <h2 className="doc-title">{projectName}</h2>
          <span className="doc-meta">Préparé le {formatLongDate(plan.preparedOn)}</span>
        </div>
        <h3 className="doc-subtitle">Calendrier des activités d'achat</h3>
        {plan.activities.length === 0 ? (
          <p className="plan__empty">Aucune activité d'achat planifiée.</p>
        ) : (
          <ol className="procurement-timeline">
            {plan.activities.map((item, index) => (
              <li key={index} className="procurement-timeline__item">
                <time dateTime={item.date} className="procurement-timeline__date">
                  {formatShortDate(item.date)}
                </time>
                <span>{item.activity}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <Panel title="Intégration au projet">
        <TextSections sections={sectionsOf(INTEGRATION_LABELS, plan.integration)} />
      </Panel>

      <Panel title="Rôles, responsabilités et autorité">
        {plan.roles.length === 0 ? (
          <p className="plan__empty">Aucun rôle défini.</p>
        ) : (
          <div className="wbs-scroll">
            <table className="register-table register-table--roles">
              <thead>
                <tr>
                  <th>Rôle</th>
                  <th>Responsabilités</th>
                  <th>Autorité</th>
                </tr>
              </thead>
              <tbody>
                {plan.roles.map((role) => (
                  <tr key={role.role}>
                    <td className="register-table__title">{role.role}</td>
                    <td className="register-table__response">{role.responsibility || '—'}</td>
                    <td className="register-table__response">{role.authority || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Indicateurs de performance des fournisseurs">
        {plan.metrics.length === 0 ? (
          <p className="plan__empty">Aucun indicateur défini.</p>
        ) : (
          <div className="wbs-scroll">
            <table className="register-table">
              <thead>
                <tr>
                  <th>Élément suivi</th>
                  <th>Indicateur</th>
                  <th>Mesure et seuil</th>
                </tr>
              </thead>
              <tbody>
                {plan.metrics.map((metric, index) => (
                  <tr key={index}>
                    <td className="register-table__title">{metric.item}</td>
                    <td>{metric.metric || '—'}</td>
                    <td>{metric.measurement || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Contraintes et hypothèses" live>
        <AssumptionReferences
          constraints={plan.references.constraints}
          assumptions={plan.references.assumptions}
          onOpen={() => onNavigate('assumptions')}
        />
      </Panel>

      <Panel title="Cadre contractuel">
        <TextSections sections={sectionsOf(PLAN_TEXT_LABELS, plan)} />
      </Panel>

      <Panel title="Fournisseurs présélectionnés">
        {plan.sellers.length === 0 ? (
          <p className="plan__empty">Aucun fournisseur présélectionné.</p>
        ) : (
          <ul className="seller-list">
            {plan.sellers.map((seller) => (
              <li key={seller.name} className="seller-list__item">
                <strong>{seller.name}</strong>
                {seller.description && <span>{seller.description}</span>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </article>
  );
}
