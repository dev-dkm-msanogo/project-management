import type { FinancialLineInput, FinancialSummaryDto } from '@shared/index';
import { YEARS, formatAmount } from '@/lib/business-case-format';

interface FinancialSummaryTableProps {
  lines: readonly FinancialLineInput[];
  summary: FinancialSummaryDto;
}

const lineTotal = (line: FinancialLineInput) => line.amounts.reduce((total, amount) => total + amount, 0);

/** Synthèse financière sur trois ans : coûts, total des coûts, bénéfices, total, bénéfice net. */
export function FinancialSummaryTable({ lines, summary }: FinancialSummaryTableProps) {
  const costs = lines.filter((line) => line.kind === 'COST');
  const benefits = lines.filter((line) => line.kind === 'BENEFIT');

  const row = (key: string, label: string, amounts: readonly number[], total: number, className?: string) => (
    <tr key={key} className={className}>
      <th scope="row">{label}</th>
      {amounts.map((amount, year) => (
        <td key={year} className={amount < 0 ? 'financial-table__negative' : undefined}>
          {formatAmount(amount)}
        </td>
      ))}
      <td className={total < 0 ? 'financial-table__negative' : undefined}>{formatAmount(total)}</td>
    </tr>
  );

  return (
    <div className="wbs-scroll">
      <table className="financial-table">
        <thead>
          <tr>
            <th>Poste (FCFA)</th>
            {YEARS.map((year) => (
              <th key={year}>Année {year}</th>
            ))}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {costs.map((line, index) => row(`cost-${index}`, line.label, line.amounts, lineTotal(line)))}
          {row('total-cost', 'Total des coûts', summary.totalCost, summary.total.cost, 'financial-table__subtotal')}
          {benefits.map((line, index) => row(`benefit-${index}`, line.label, line.amounts, lineTotal(line)))}
          {row('total-benefits', 'Total des bénéfices', summary.totalBenefits, summary.total.benefits, 'financial-table__subtotal')}
          {row('net', 'Bénéfice net', summary.netBenefit, summary.total.net, 'financial-table__net')}
        </tbody>
      </table>
    </div>
  );
}
