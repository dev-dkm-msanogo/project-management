import type { ReactNode } from 'react';
import type { ResourceManagementPlanDto, ResourceRequirementInput } from '@shared/index';
import { PersonName } from '@/components/people/People';
import { OrgChart } from '@/components/resources/OrgChart';
import { TextSections } from '@/components/ui/TextSections';
import { formatLongDate } from '@/lib/format';
import { RESOURCE_PLAN_SECTIONS } from '@/lib/resource-format';
import type { AppView } from '@/navigation/pmp';

function Panel({ title, live, children }: { title: string; live?: boolean; children: ReactNode }) {
  return (
    <section className="doc-panel">
      <div className="doc-panel-head">
        <h2 className="plan__section-title">{title}</h2>
        {live && <span className="doc-sync">Issu des besoins en ressources</span>}
      </div>
      {children}
    </section>
  );
}

/** Rubriques rédigées du plan, par clé. */
function sections(plan: ResourceManagementPlanDto, keys: (keyof typeof RESOURCE_PLAN_SECTIONS)[]) {
  return keys.map((key) => ({ key, ...RESOURCE_PLAN_SECTIONS[key], text: plan[key] }));
}

function ResourceTable({ items, head, empty }: { items: readonly ResourceRequirementInput[]; head: [string, string, string]; empty: string }) {
  if (items.length === 0) return <p className="plan__empty">{empty}</p>;
  return (
    <div className="wbs-scroll">
      <table className="register-table">
        <thead>
          <tr>
            {head.map((label) => (
              <th key={label}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.code}>
              <td className="register-table__title">{item.name}</td>
              <td>{item.quantity || '—'}</td>
              <td>{item.grade || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ResourcePlanViewProps {
  plan: ResourceManagementPlanDto;
  projectName: string;
  onNavigate: (view: AppView) => void;
}

/** Plan de gestion des ressources lu comme le template PMI ; équipe et ressources physiques viennent des besoins. */
export function ResourcePlanView({ plan, projectName, onNavigate }: ResourcePlanViewProps) {
  const toRequirements = (
    <button type="button" className="ref-link" onClick={() => onNavigate('resource-requirements')}>
      Besoins en ressources →
    </button>
  );

  return (
    <article className="doc-page">
      <section className="doc-panel">
        <div className="doc-heading">
          <h2 className="doc-title">{projectName}</h2>
          <span className="doc-meta">Préparé le {formatLongDate(plan.preparedOn)}</span>
        </div>
        <div className="doc-panel-head">
          <h3 className="doc-subtitle">Identification des membres de l'équipe et estimations</h3>
          <span className="doc-sync">Issu des besoins en ressources</span>
        </div>
        <ResourceTable
          items={plan.references.team}
          head={['Rôle', 'Quantité et allocation', 'Niveau']}
          empty="Aucune ressource humaine dans les besoins en ressources."
        />
        <div className="doc-columns resource-plan__pair">
          <TextSections sections={sections(plan, ['staffAcquisition'])} />
          <TextSections sections={sections(plan, ['staffRelease'])} />
        </div>
      </section>

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
                    <td className="register-table__title">
                      {role.role}
                      {role.holderId && (
                        <span className="register-table__muted">
                          <PersonName id={role.holderId} />
                        </span>
                      )}
                    </td>
                    <td className="register-table__response">{role.responsibility || '—'}</td>
                    <td className="register-table__response">{role.authority || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Organisation du projet">
        <OrgChart roles={plan.roles} />
      </Panel>

      <Panel title="Formation, reconnaissance et développement de l'équipe">
        <TextSections sections={sections(plan, ['training', 'rewards', 'teamDevelopment'])} />
      </Panel>

      <Panel title="Ressources physiques : identification et estimations" live>
        <ResourceTable
          items={plan.references.physical}
          head={['Ressource', 'Quantité', 'Qualité']}
          empty="Aucune ressource physique dans les besoins en ressources."
        />
        <div className="doc-columns resource-plan__pair">
          <TextSections sections={sections(plan, ['resourceAcquisition'])} />
          <TextSections sections={sections(plan, ['resourceManagement'])} />
        </div>
        {toRequirements}
      </Panel>
    </article>
  );
}
