import type { ReactNode } from 'react';
import type { ProcurementStrategyDto } from '@shared/index';
import { TextSections } from '@/components/ui/TextSections';
import { formatLongDate } from '@/lib/format';
import {
  CONTRACT_RISK,
  CONTRACT_TYPE_CODES,
  CONTRACT_TYPE_LABELS,
  STRATEGY_TEXT_LABELS,
} from '@/lib/procurement-format';

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="doc-panel">
      <h2 className="plan__section-title">{title}</h2>
      {children}
    </section>
  );
}

/** Rubriques rédigées de la stratégie, par clé. */
function sections(strategy: ProcurementStrategyDto, keys: (keyof typeof STRATEGY_TEXT_LABELS)[]) {
  return keys.map((key) => ({ key, label: STRATEGY_TEXT_LABELS[key], text: strategy[key] }));
}

/** Stratégie d'approvisionnement lue comme le template PMI : livraison, contrats, cycle d'achat. */
export function ProcurementStrategyView({ strategy, projectName }: { strategy: ProcurementStrategyDto; projectName: string }) {
  return (
    <article className="doc-page">
      <section className="doc-panel">
        <div className="doc-heading">
          <h2 className="doc-title">{projectName}</h2>
          <span className="doc-meta">Préparé le {formatLongDate(strategy.preparedOn)}</span>
        </div>
        <div className="doc-columns">
          <TextSections sections={sections(strategy, ['deliveryMethod'])} />
          <TextSections sections={sections(strategy, ['makeOrBuy'])} />
        </div>
      </section>

      <Panel title="Types de contrat retenus">
        {strategy.contractTypes.length === 0 ? (
          <p className="plan__empty">Aucun type de contrat retenu.</p>
        ) : (
          <ul className="contract-cards">
            {strategy.contractTypes.map((choice) => (
              <li key={choice.type} className="contract-card">
                <div className="contract-card__head">
                  {CONTRACT_TYPE_CODES[choice.type] && (
                    <span className="contract-card__code">{CONTRACT_TYPE_CODES[choice.type]}</span>
                  )}
                  <strong>{CONTRACT_TYPE_LABELS[choice.type]}</strong>
                </div>
                <span className={`contract-risk contract-risk--${CONTRACT_RISK[choice.type].modifier}`}>
                  {CONTRACT_RISK[choice.type].label}
                </span>
                <p className="doc-text">{choice.note}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Cycle d'achat">
        {strategy.lifecycle.length === 0 ? (
          <p className="plan__empty">Aucune phase définie.</p>
        ) : (
          <div className="wbs-scroll">
            <table className="register-table register-table--lifecycle">
              <thead>
                <tr>
                  <th>Phase</th>
                  <th>Critères d'entrée</th>
                  <th>Livrables</th>
                  <th>Critères de sortie</th>
                </tr>
              </thead>
              <tbody>
                {strategy.lifecycle.map((item, index) => (
                  <tr key={item.phase}>
                    <td className="register-table__title">
                      <span className="phase-step">{index + 1}</span>
                      {item.phase}
                    </td>
                    <td>{item.entryCriteria || '—'}</td>
                    <td>{item.deliverables || '—'}</td>
                    <td>{item.exitCriteria || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Clauses contractuelles">
        <TextSections sections={sections(strategy, ['incentiveCriteria', 'knowledgeTransfer'])} />
      </Panel>
    </article>
  );
}
