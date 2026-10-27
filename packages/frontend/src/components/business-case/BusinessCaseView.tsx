import type { ReactNode } from 'react';
import type { BusinessCaseDto } from '@shared/index';
import { FinancialSummaryTable } from '@/components/business-case/FinancialSummaryTable';
import { OUTCOME_LABELS } from '@/lib/business-case-format';
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

/** Business case lu comme le template PMI : besoin, alternatives, solution, chiffrage, risques. */
export function BusinessCaseView({ document, projectName }: { document: BusinessCaseDto; projectName: string }) {
  const net = document.financialSummary.total.net;

  return (
    <article className="doc-page">
      <section className="doc-panel">
        <div className="doc-heading">
          <h2 className="doc-title">{projectName}</h2>
          <span className="doc-meta">Préparé le {formatLongDate(document.preparedOn)}</span>
        </div>
        <dl className="doc-facts">
          <div>
            <dt>Solution retenue</dt>
            <dd>{document.alternatives.find((item) => item.outcome === 'SELECTED')?.option ?? '—'}</dd>
          </div>
          <div>
            <dt>Coût sur 3 ans</dt>
            <dd>{new Intl.NumberFormat('fr-FR').format(document.financialSummary.total.cost)} FCFA</dd>
          </div>
          <div>
            <dt>Bénéfice net sur 3 ans</dt>
            <dd className={net < 0 ? 'financial-table__negative' : 'doc-positive'}>
              {new Intl.NumberFormat('fr-FR').format(net)} FCFA
            </dd>
          </div>
        </dl>
        <h3 className="doc-subtitle">Besoin métier et problématique</h3>
        <p className="doc-text">{document.businessNeed}</p>
      </section>

      <div className="doc-columns">
        <Panel title="Alignement stratégique">
          <p className="doc-text">{document.strategicAlignment || '—'}</p>
        </Panel>
        <Panel title="Analyse de la situation">
          <Bullets items={document.situation} empty="Non renseignée." />
        </Panel>
      </div>

      <Panel title="Alternatives étudiées">
        {document.alternatives.length === 0 ? (
          <p className="plan__empty">Aucune alternative décrite.</p>
        ) : (
          <div className="wbs-scroll">
            <table className="register-table register-table--alternatives">
              <thead>
                <tr>
                  <th>Option</th>
                  <th>Description</th>
                  <th>Coût</th>
                  <th>Décision</th>
                </tr>
              </thead>
              <tbody>
                {document.alternatives.map((item, index) => (
                  <tr key={index} className={item.outcome === 'SELECTED' ? 'alternative--selected' : undefined}>
                    <td className="register-table__title">{item.option}</td>
                    <td className="register-table__response">{item.description || '—'}</td>
                    <td className="register-table__note">{item.cost || '—'}</td>
                    <td className="register-table__response">
                      <span className={`status-badge status-badge--${item.outcome === 'SELECTED' ? 'green' : 'grey'}`}>
                        {OUTCOME_LABELS[item.outcome]}
                      </span>
                      {item.rationale && <span className="register-table__description">{item.rationale}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Solution recommandée">
        <p className="doc-text">{document.recommendedSolution || '—'}</p>
      </Panel>

      <Panel title="Synthèse financière (3 ans)">
        {document.financialLines.length === 0 ? (
          <p className="plan__empty">Aucun chiffrage saisi.</p>
        ) : (
          <FinancialSummaryTable lines={document.financialLines} summary={document.financialSummary} />
        )}
        {document.financialNote && <p className="doc-note">{document.financialNote}</p>}
      </Panel>

      <div className="doc-columns">
        <Panel title="Risques clés">
          <Bullets items={document.keyRisks} empty="Aucun risque identifié." />
        </Panel>
        <Panel title="Recommandation">
          <p className="doc-text">{document.recommendation || '—'}</p>
        </Panel>
      </div>
    </article>
  );
}
