import type { ReactNode } from 'react';
import type { TeamCharterDto } from '@shared/index';
import { PersonName } from '@/components/people/People';
import { TextSections } from '@/components/ui/TextSections';
import { formatLongDate, formatShortDate } from '@/lib/format';

/** « Respect : … » → terme en gras, puis son explication. */
function Term({ text }: { text: string }) {
  const separator = text.indexOf(' : ');
  if (separator <= 0 || separator > 40) return <>{text}</>;
  return (
    <>
      <strong>{text.slice(0, separator)}</strong>
      {text.slice(separator)}
    </>
  );
}

function Numbered({ title, items, empty }: { title: string; items: readonly string[]; empty: string }) {
  return (
    <section className="charter-rules">
      <h3 className="doc-subtitle">{title}</h3>
      {items.length === 0 ? (
        <p className="plan__empty">{empty}</p>
      ) : (
        <ol className="doc-numbered">
          {items.map((item, index) => (
            <li key={index}>
              <Term text={item} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="doc-panel">
      <h2 className="plan__section-title">{title}</h2>
      {children}
    </section>
  );
}

/** Charte de l'équipe lue comme le template PMI : valeurs, règles, décisions, conflits, signatures. */
export function TeamCharterView({ charter, projectName }: { charter: TeamCharterDto; projectName: string }) {
  const signed = charter.signatures.filter((signature) => signature.signedOn).length;

  return (
    <article className="doc-page">
      <section className="doc-panel">
        <div className="doc-heading">
          <h2 className="doc-title">{projectName}</h2>
          <span className="doc-meta">Préparée le {formatLongDate(charter.preparedOn)}</span>
        </div>
        <Numbered title="Valeurs et principes de l'équipe" items={charter.values} empty="Aucune valeur définie." />
        <Numbered title="Règles de réunion" items={charter.meetingGuidelines} empty="Aucune règle de réunion." />
        <Numbered title="Règles de communication" items={charter.communicationGuidelines} empty="Aucune règle de communication." />
      </section>

      <Panel title="Décisions et conflits">
        <TextSections
          sections={[
            { key: 'decisionMaking', label: 'Prise de décision', text: charter.decisionMaking },
            { key: 'conflictResolution', label: 'Résolution des conflits', text: charter.conflictResolution },
          ]}
        />
      </Panel>

      <Panel title="Autres accords">
        {charter.otherAgreements.length === 0 ? (
          <p className="plan__empty">Aucun autre accord.</p>
        ) : (
          <ul className="doc-list">
            {charter.otherAgreements.map((agreement, index) => (
              <li key={index}>
                <Term text={agreement} />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <section className="doc-panel">
        <div className="doc-panel-head">
          <h2 className="plan__section-title">Signatures</h2>
          {charter.signatures.length > 0 && (
            <span className="doc-meta">
              {signed}/{charter.signatures.length} signées
            </span>
          )}
        </div>
        {charter.signatures.length === 0 ? (
          <p className="plan__empty">Aucun signataire.</p>
        ) : (
          <div className="wbs-scroll">
            <table className="register-table register-table--signatures">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Rôle</th>
                  <th>Date de signature</th>
                </tr>
              </thead>
              <tbody>
                {charter.signatures.map((signature, index) => (
                  <tr key={`${signature.resourceId}-${index}`}>
                    <td className="register-table__title">
                      <PersonName id={signature.resourceId} />
                    </td>
                    <td>{signature.role || '—'}</td>
                    <td>
                      {signature.signedOn ? (
                        formatShortDate(signature.signedOn)
                      ) : (
                        <span className="register-flag">À signer</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </article>
  );
}
