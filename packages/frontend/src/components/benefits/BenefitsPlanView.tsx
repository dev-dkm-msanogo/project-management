import type { ReactNode } from 'react';
import type { BenefitsPlanDto } from '@shared/index';
import { PersonName } from '@/components/people/People';
import { formatLongDate } from '@/lib/format';

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="doc-panel">
      <h2 className="plan__section-title">{title}</h2>
      {children}
    </section>
  );
}

function Bullets({ items, empty }: { items: readonly string[]; empty: string }) {
  if (items.length === 0) return <p className="plan__empty">{empty}</p>;
  return (
    <ul className="doc-list">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

/** Plan de gestion des bénéfices lu comme le template PMI. */
export function BenefitsPlanView({ document, projectName }: { document: BenefitsPlanDto; projectName: string }) {
  const metrics = document.benefits.flatMap((benefit) =>
    benefit.metrics.map((metric, index) => ({ benefit: benefit.name, first: index === 0, span: benefit.metrics.length, ...metric })),
  );

  return (
    <article className="doc-page">
      <section className="doc-panel">
        <div className="doc-heading">
          <h2 className="doc-title">{projectName}</h2>
          <span className="doc-meta">Préparé le {formatLongDate(document.preparedOn)}</span>
        </div>
        <h3 className="doc-subtitle">Bénéfices visés</h3>
        {document.summary && <p className="doc-text">{document.summary}</p>}
        <Bullets items={document.targetBenefits} empty="Aucun bénéfice visé." />
        <h3 className="doc-subtitle">Alignement stratégique</h3>
        <p className="doc-text">{document.strategicAlignment || '—'}</p>
      </section>

      <Panel title="Calendrier de réalisation">
        {document.benefits.length === 0 ? (
          <p className="plan__empty">Aucun bénéfice planifié.</p>
        ) : (
          <div className="wbs-scroll">
            <table className="register-table">
              <thead>
                <tr>
                  <th>Bénéfice</th>
                  <th>Réalisé à partir de</th>
                  <th>Maintenu jusqu'à</th>
                </tr>
              </thead>
              <tbody>
                {document.benefits.map((benefit, index) => (
                  <tr key={index}>
                    <td className="register-table__title">{benefit.name}</td>
                    <td>{benefit.realizedFrom || '—'}</td>
                    <td>{benefit.sustainedThrough || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Responsables et indicateurs">
        {metrics.length === 0 ? (
          <p className="plan__empty">Aucun indicateur défini.</p>
        ) : (
          <div className="wbs-scroll">
            <table className="register-table register-table--metrics">
              <thead>
                <tr>
                  <th>Bénéfice</th>
                  <th>Indicateur</th>
                  <th>Situation de départ</th>
                  <th>Cible</th>
                  <th>Responsable</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric, index) => (
                  <tr key={index}>
                    {metric.first && (
                      <td className="register-table__title" rowSpan={metric.span}>
                        {metric.benefit}
                      </td>
                    )}
                    <td className="register-table__response">{metric.metric}</td>
                    <td className="register-table__note">{metric.baseline || '—'}</td>
                    <td className="benefit-target">{metric.target}</td>
                    <td>
                      <PersonName id={metric.ownerId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="doc-columns">
        <Panel title="Hypothèses">
          <Bullets items={document.assumptions} empty="Aucune hypothèse." />
        </Panel>
        <Panel title="Risques sur la réalisation des bénéfices">
          <Bullets items={document.risks} empty="Aucun risque identifié." />
        </Panel>
      </div>

      <Panel title="Revue des bénéfices et gouvernance">
        <p className="doc-text">{document.governance || '—'}</p>
      </Panel>
    </article>
  );
}
