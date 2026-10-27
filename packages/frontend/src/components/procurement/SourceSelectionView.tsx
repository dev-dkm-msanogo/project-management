import type { SourceSelectionsDto } from '@shared/index';
import { EditEntryButton } from '@/components/ui/EditEntry';
import { ScoringTable } from '@/components/ui/ScoringTable';
import { formatLongDate } from '@/lib/format';
import { MAX_SCORE } from '@/lib/scoring';

type Evaluation = SourceSelectionsDto['evaluations'][number];

/** Classement des candidats par total pondéré, du meilleur au moins bon. */
function Ranking({ evaluation }: { evaluation: Evaluation }) {
  const ranked = evaluation.candidates
    .map((name, index) => ({ name, total: evaluation.result.totals[index]! }))
    .sort((a, b) => b.total - a.total);

  return (
    <ol className="selection-ranking" aria-label="Classement des candidats">
      {ranked.map((candidate) => {
        const leader = evaluation.result.leaders.includes(candidate.name);
        return (
          <li key={candidate.name} className={`selection-ranking__row${leader ? ' selection-ranking__row--leader' : ''}`}>
            <span className="selection-ranking__name">
              {candidate.name}
              {leader && <span className="status-badge status-badge--green">En tête</span>}
            </span>
            <span className="selection-ranking__track" aria-hidden="true">
              <span className="selection-ranking__bar" style={{ width: `${(candidate.total / MAX_SCORE) * 100}%` }} />
            </span>
            <span className="selection-ranking__total">
              {candidate.total} <span className="register-table__muted-cell">/ {MAX_SCORE}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

interface SelectionPanelProps {
  evaluation: Evaluation;
  onEdit?: (procurement: string) => void;
  /** Valideur du projet : attribue l'achat à l'un des candidats. */
  onAward?: (procurement: string) => void;
}

/**
 * Grille d'un achat : notes de 1 à 5 par critère pondéré, scores, total, recommandation et
 * attribution (par un valideur du projet ; la grille est alors figée).
 */
function SelectionPanel({ evaluation, onEdit, onAward }: SelectionPanelProps) {
  const { award } = evaluation;
  return (
    <section className="doc-panel">
      <div className="doc-heading">
        <h2 className="doc-title">{evaluation.procurement}</h2>
        <div className="doc-heading__aside">
          <span className="doc-meta">Évalué le {formatLongDate(evaluation.preparedOn)}</span>
          {award ? (
            <span className="status-badge status-badge--green">Attribué</span>
          ) : (
            <>
              {onAward && (
                <button type="button" className="btn btn--primary btn--small" onClick={() => onAward(evaluation.procurement)}>
                  Attribuer
                </button>
              )}
              {onEdit && (
                <EditEntryButton label={`la grille « ${evaluation.procurement} »`} onEdit={() => onEdit(evaluation.procurement)} />
              )}
            </>
          )}
        </div>
      </div>

      <Ranking evaluation={evaluation} />

      <ScoringTable options={evaluation.candidates} criteria={evaluation.criteria} result={evaluation.result} />

      <h3 className="doc-subtitle">Recommandation</h3>
      {evaluation.recommendation ? (
        <p className="doc-text">{evaluation.recommendation}</p>
      ) : (
        <p className="plan__empty">À rédiger.</p>
      )}

      <h3 className="doc-subtitle">Attribution</h3>
      {award ? (
        <>
          <p className="change-decision">
            <span className="status-badge status-badge--green">{award.supplier}</span>
            <span>
              le {formatLongDate(award.decidedOn)} par {award.decidedBy}
            </span>
          </p>
          <p className="doc-text">{award.rationale}</p>
        </>
      ) : (
        <p className="plan__empty">En attente de la décision des valideurs du projet.</p>
      )}
    </section>
  );
}

/** Grilles de sélection des fournisseurs (template « Source Selection Criteria »), une par achat. */
export function SourceSelectionView({
  selections,
  onEdit,
  onAward,
}: {
  selections: SourceSelectionsDto;
  onEdit?: (procurement: string) => void;
  onAward?: (procurement: string) => void;
}) {
  return (
    <>
      {selections.evaluations.map((evaluation) => (
        <SelectionPanel key={evaluation.procurement} evaluation={evaluation} onEdit={onEdit} onAward={onAward} />
      ))}
    </>
  );
}
