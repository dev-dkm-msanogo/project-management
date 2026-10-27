import type { ReactNode } from 'react';
import type { RiskEntryDto, RiskManagementPlanDto } from '@shared/index';
import { RoleTable } from '@/components/quality/QualityPlanView';
import { RiskMatrix } from '@/components/risks/RiskMatrix';
import { sectionsOf, TextSections } from '@/components/ui/TextSections';
import { formatLongDate } from '@/lib/format';
import { IMPACT_OBJECTIVE_LABELS, RISK_CATEGORIES, RISK_PLAN_TEXT_LABELS } from '@/lib/quality-risk-format';
import { IMPACT_SCALE, PROBABILITY_SCALE, RISK_CATEGORY_LABELS } from '@/lib/risk-format';
import type { AppView } from '@/navigation/pmp';

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="doc-panel">
      <h2 className="plan__section-title">{title}</h2>
      {children}
    </section>
  );
}

const pick = <K extends keyof typeof RISK_PLAN_TEXT_LABELS>(...keys: K[]) =>
  Object.fromEntries(keys.map((key) => [key, RISK_PLAN_TEXT_LABELS[key]])) as Record<K, string>;

const plural = (count: number) => `${count} risque${count > 1 ? 's' : ''} au registre`;

/**
 * Structure de découpage des risques : les catégories du registre, leurs sous-catégories,
 * et le nombre de risques que le registre classe dans chacune.
 */
function RiskBreakdown({ plan, risks, projectName }: { plan: RiskManagementPlanDto; risks: readonly RiskEntryDto[]; projectName: string }) {
  return (
    <div className="rbs">
      <p className="rbs__root">
        <span className="rbs__code">1</span> Risques du projet{projectName ? ` – ${projectName}` : ''}
      </p>
      <ul className="rbs__children rbs__children--top">
        {RISK_CATEGORIES.map((category, index) => (
          <li key={category} className="rbs__node rbs__node--level-1">
            <div className="rbs__row">
              <span className="rbs__code">1.{index + 1}</span>
              <span className="rbs__label">{RISK_CATEGORY_LABELS[category]}</span>
              <span className="rbs__detail">{plural(risks.filter((risk) => risk.category === category).length)}</span>
            </div>
            {plan.breakdown[category].length > 0 && (
              <ul className="rbs__children">
                {plan.breakdown[category].map((subcategory, position) => (
                  <li key={subcategory} className="rbs__node rbs__node--level-2">
                    <div className="rbs__row">
                      <span className="rbs__code">
                        1.{index + 1}.{position + 1}
                      </span>
                      <span className="rbs__label">{subcategory}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface RiskPlanViewProps {
  plan: RiskManagementPlanDto;
  projectName: string;
  /** Risques du registre : matrice et décompte par catégorie. */
  risks: readonly RiskEntryDto[];
  onNavigate: (view: AppView) => void;
}

/** Plan de gestion des risques lu comme le template PMI, adossé au registre des risques. */
export function RiskPlanView({ plan, projectName, risks, onNavigate }: RiskPlanViewProps) {
  return (
    <article className="doc-page">
      <section className="doc-panel">
        <div className="doc-heading">
          <h2 className="doc-title">{projectName}</h2>
          <span className="doc-meta">Préparé le {formatLongDate(plan.preparedOn)}</span>
        </div>
        <TextSections
          sections={[
            { key: 'strategy', label: 'Stratégie', text: plan.strategy },
            { key: 'methodology', label: 'Méthodologie', text: plan.methodology },
          ]}
        />
      </section>

      <Panel title="Rôles et responsabilités">
        <RoleTable roles={plan.roles} />
      </Panel>

      <Panel title="Catégories de risques (RBS)">
        <RiskBreakdown plan={plan} risks={risks} projectName={projectName} />
      </Panel>

      <Panel title="Financement et réserve">
        <TextSections sections={sectionsOf(pick('funding', 'contingencyProtocols'), plan)} />
      </Panel>

      <Panel title="Calendrier, tolérances et suivi">
        <TextSections sections={sectionsOf(pick('timing', 'tolerances', 'tracking'), plan)} />
      </Panel>

      <Panel title="Définitions de la probabilité">
        <div className="wbs-scroll">
          <table className="register-table register-table--scale">
            <thead>
              <tr>
                <th>Niveau</th>
                <th>Fourchette</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {[...plan.probability].reverse().map((item, position) => {
                const level = plan.probability.length - position;
                return (
                  <tr key={level}>
                    <td className="register-table__title">
                      {level} · {PROBABILITY_SCALE[level - 1]}
                    </td>
                    <td>{item.range || '—'}</td>
                    <td>{item.description || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Définitions de l'impact par objectif">
        <div className="wbs-scroll">
          <table className="register-table register-table--scale">
            <thead>
              <tr>
                <th>Niveau</th>
                {Object.values(IMPACT_OBJECTIVE_LABELS).map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...plan.impact].reverse().map((item, position) => {
                const level = plan.impact.length - position;
                return (
                  <tr key={level}>
                    <td className="register-table__title">
                      {level} · {IMPACT_SCALE[level - 1]}
                    </td>
                    {(Object.keys(IMPACT_OBJECTIVE_LABELS) as (keyof typeof IMPACT_OBJECTIVE_LABELS)[]).map((key) => (
                      <td key={key}>{item[key] || '—'}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Matrice probabilité × impact">
        <RiskMatrix risks={[...risks]} />
        <button type="button" className="ref-link" onClick={() => onNavigate('risks')}>
          Registre des risques →
        </button>
      </Panel>
    </article>
  );
}
