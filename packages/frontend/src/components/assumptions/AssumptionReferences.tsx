import type { AssumptionEntryDto } from '@shared/index';
import {
  ASSUMPTION_CATEGORY_LABELS,
  ASSUMPTION_STATUS_LABELS,
  ASSUMPTION_STATUS_MODIFIERS,
} from '@/lib/assumption-format';

interface AssumptionReferencesProps {
  constraints: readonly AssumptionEntryDto[];
  assumptions: readonly AssumptionEntryDto[];
  onOpen: () => void;
}

/**
 * Contraintes en vigueur et hypothèses en cours, tirées en direct du registre des hypothèses
 * et contraintes (charte, énoncé du périmètre…), avec un lien vers le registre.
 */
export function AssumptionReferences({ constraints, assumptions, onOpen }: AssumptionReferencesProps) {
  return (
    <>
      <div className="doc-references">
        <div>
          <h3 className="doc-subtitle">Contraintes</h3>
          {constraints.length === 0 ? (
            <p className="plan__empty">Aucune contrainte en vigueur.</p>
          ) : (
            <ul className="doc-refs">
              {constraints.map((entry) => (
                <li key={entry.code}>
                  <strong>{ASSUMPTION_CATEGORY_LABELS[entry.category]}</strong>
                  {entry.statement}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="doc-subtitle">Hypothèses</h3>
          {assumptions.length === 0 ? (
            <p className="plan__empty">Aucune hypothèse en cours.</p>
          ) : (
            <ul className="doc-refs">
              {assumptions.map((entry) => (
                <li key={entry.code}>
                  {entry.statement}{' '}
                  <span className={`status-badge status-badge--${ASSUMPTION_STATUS_MODIFIERS[entry.status]}`}>
                    {ASSUMPTION_STATUS_LABELS[entry.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <button type="button" className="ref-link" onClick={onOpen}>
        Hypothèses et contraintes →
      </button>
    </>
  );
}
