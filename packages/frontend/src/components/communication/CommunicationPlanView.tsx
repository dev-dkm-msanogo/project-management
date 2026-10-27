import type { ReactNode } from 'react';
import type { CommunicationPlanDto } from '@shared/index';
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

/** Plan de communication lu comme le template PMI : matrice, hypothèses, contraintes, glossaire. */
export function CommunicationPlanView({ plan, projectName }: { plan: CommunicationPlanDto; projectName: string }) {
  const glossary = [...plan.glossary].sort((a, b) => a.term.localeCompare(b.term, 'fr'));

  return (
    <article className="doc-page">
      <section className="doc-panel">
        <div className="doc-heading">
          <h2 className="doc-title">{projectName}</h2>
          <span className="doc-meta">Préparé le {formatLongDate(plan.preparedOn)}</span>
        </div>
        {plan.communications.length === 0 ? (
          <p className="plan__empty">Aucune communication planifiée.</p>
        ) : (
          <div className="wbs-scroll">
            <table className="register-table register-table--communications">
              <thead>
                <tr>
                  <th>Partie prenante</th>
                  <th>Information</th>
                  <th>Moyen</th>
                  <th>Fréquence</th>
                  <th>Émetteur</th>
                </tr>
              </thead>
              <tbody>
                {plan.communications.map((item, index) => (
                  <tr key={index}>
                    <td className="register-table__title">{item.audience}</td>
                    <td className="register-table__response">{item.information}</td>
                    <td>{item.method}</td>
                    <td>{item.frequency}</td>
                    <td className="register-table__muted-cell">
                      <PersonName id={item.senderId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="doc-columns">
        <Panel title="Hypothèses">
          <Bullets items={plan.assumptions} empty="Aucune hypothèse." />
        </Panel>
        <Panel title="Contraintes">
          <Bullets items={plan.constraints} empty="Aucune contrainte." />
        </Panel>
      </div>

      <Panel title="Glossaire des termes et sigles">
        {glossary.length === 0 ? (
          <p className="plan__empty">Aucun terme défini.</p>
        ) : (
          <dl className="glossary">
            {glossary.map((entry) => (
              <div key={entry.term} className="glossary__entry">
                <dt>{entry.term}</dt>
                <dd>{entry.definition}</dd>
              </div>
            ))}
          </dl>
        )}
      </Panel>
    </article>
  );
}
