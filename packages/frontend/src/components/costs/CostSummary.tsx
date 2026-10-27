import type { CostSummaryDto } from '@shared/index';
import { formatFcfaMillions } from '@/lib/format';

interface CostSummaryProps {
  summary: CostSummaryDto;
  charterBudget: number | null;
}

/**
 * Cascade du template : coûts directs + réserve pour aléas = référence des coûts (BAC) ;
 * + réserve de management = financement total requis, comparé au budget de la charte.
 */
export function CostSummary({ summary, charterBudget }: CostSummaryProps) {
  const margin = charterBudget === null ? null : charterBudget - summary.totalFunding;

  return (
    <div className="cost-cascade">
      <table className="cost-cascade__table">
        <tbody>
          <tr>
            <th scope="row">Main-d'œuvre</th>
            <td>{formatFcfaMillions(summary.labor)}</td>
          </tr>
          <tr>
            <th scope="row">Coûts physiques</th>
            <td>{formatFcfaMillions(summary.physical)}</td>
          </tr>
          <tr className="cost-cascade__subtotal">
            <th scope="row">Coûts directs</th>
            <td>{formatFcfaMillions(summary.direct)}</td>
          </tr>
          <tr>
            <th scope="row">+ Réserve pour aléas</th>
            <td>{formatFcfaMillions(summary.contingencyReserve)}</td>
          </tr>
          <tr className="cost-cascade__baseline">
            <th scope="row">= Référence des coûts (BAC)</th>
            <td>{formatFcfaMillions(summary.costBaseline)}</td>
          </tr>
          <tr>
            <th scope="row">
              + Réserve de management <span>détenue par le sponsor, hors référence</span>
            </th>
            <td>{formatFcfaMillions(summary.managementReserve)}</td>
          </tr>
          <tr className="cost-cascade__total">
            <th scope="row">= Financement total requis</th>
            <td>{formatFcfaMillions(summary.totalFunding)}</td>
          </tr>
        </tbody>
      </table>
      {charterBudget !== null && margin !== null && (
        <p className={`cost-cascade__budget${margin < 0 ? ' cost-cascade__budget--over' : ''}`}>
          Budget de la charte : <strong>{formatFcfaMillions(charterBudget)}</strong>
          {' · '}
          {margin >= 0
            ? `marge de ${formatFcfaMillions(margin)}`
            : `dépassement de ${formatFcfaMillions(-margin)}`}
        </p>
      )}
    </div>
  );
}
