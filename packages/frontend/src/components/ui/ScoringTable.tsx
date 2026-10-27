import type { SelectionCriterionInput, SourceSelectionResultDto } from '@shared/index';
import { MAX_SCORE, TOTAL_WEIGHT } from '@/lib/scoring';

interface ScoringTableProps {
  /** Options notées (candidats, alternatives), dans l'ordre des notes. */
  options: readonly string[];
  criteria: readonly SelectionCriterionInput[];
  result: SourceSelectionResultDto;
}

/** Grille d'analyse pondérée : note de chaque option par critère, score et total sur 500. */
export function ScoringTable({ options, criteria, result }: ScoringTableProps) {
  const leaders = new Set(result.leaders);

  return (
    <div className="wbs-scroll">
      <table className="register-table selection-grid">
        <caption className="selection-grid__caption">
          Note de 1 à 5 × pondération = score ; total sur {MAX_SCORE}.
        </caption>
        <thead>
          <tr>
            <th>Critère</th>
            <th className="num">Pondération</th>
            {options.map((name) => (
              <th key={name} className={`num${leaders.has(name) ? ' selection-grid__leader' : ''}`}>
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteria.map((criterion) => (
            <tr key={criterion.name}>
              <td className="register-table__title">
                {criterion.name}
                {criterion.description && <span className="register-table__muted">{criterion.description}</span>}
              </td>
              <td className="num">{criterion.weight} %</td>
              {criterion.ratings.map((rating, index) => (
                <td key={index} className="num">
                  <span className={`rating rating--${rating}`} title={`Note ${rating} sur 5`}>
                    {rating}
                  </span>
                  <span className="register-table__muted">{criterion.weight * rating}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td className="num">{TOTAL_WEIGHT} %</td>
            {result.totals.map((total, index) => (
              <td key={index} className="num">
                {total}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
