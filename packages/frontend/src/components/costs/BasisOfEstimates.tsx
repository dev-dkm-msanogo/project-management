import type { ReactNode } from 'react';
import type {
  AnalogousBasisInput,
  BasisNarrativeInput,
  BottomUpBasisInput,
  CostActivityInput,
  CostBasisInput,
  ParametricBasisInput,
  ThreePointBasisInput,
} from '@shared/index';
import { sectionsOf, TextSections } from '@/components/ui/TextSections';
import { BOTTOM_UP_COMPONENTS, NARRATIVE_LABELS } from '@/lib/cost-format';
import { formatFcfa, formatFcfaMillions } from '@/lib/format';

type Detailed<B extends CostBasisInput> = { activity: CostActivityInput; basis: B; estimate: number };

function detailed<B extends CostBasisInput>(
  activities: readonly CostActivityInput[],
  estimates: Record<string, number>,
  method: B['method'],
): Detailed<B>[] {
  return activities
    .filter((activity) => activity.basis?.method === method)
    .map((activity) => ({ activity, basis: activity.basis as B, estimate: estimates[activity.code] ?? 0 }));
}

/** En-tête de colonne numérique (alignée à droite). */
const num = (label: string) => ({ label, num: true });

type Column = string | { label: string; num: boolean };

function Worksheet({ title, note, head, children }: { title: string; note?: string; head: Column[]; children: ReactNode }) {
  return (
    <section className="basis-sheet">
      <h3 className="doc-subtitle">{title}</h3>
      <div className="wbs-scroll">
        <table className="register-table register-table--basis">
          <thead>
            <tr>
              {head.map((column) =>
                typeof column === 'string' ? (
                  <th key={column}>{column}</th>
                ) : (
                  <th key={column.label} className="num">
                    {column.label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {note && <p className="doc-note">{note}</p>}
    </section>
  );
}

interface BasisOfEstimatesProps {
  activities: readonly CostActivityInput[];
  basisEstimates: Record<string, number>;
  narrative: BasisNarrativeInput;
}

/**
 * Base des estimations (template « Basis of Estimates ») : une feuille de calcul par
 * méthode (paramétrique, analogue, trois points, ascendante), puis la synthèse narrative.
 */
export function BasisOfEstimates({ activities, basisEstimates, narrative }: BasisOfEstimatesProps) {
  const parametric = detailed<ParametricBasisInput>(activities, basisEstimates, 'PARAMETRIC');
  const analogous = detailed<AnalogousBasisInput>(activities, basisEstimates, 'ANALOGOUS');
  const threePoint = detailed<ThreePointBasisInput>(activities, basisEstimates, 'THREE_POINT');
  const bottomUp = detailed<BottomUpBasisInput>(activities, basisEstimates, 'BOTTOM_UP');
  const components = Object.keys(BOTTOM_UP_COMPONENTS) as (keyof typeof BOTTOM_UP_COMPONENTS)[];
  const none = parametric.length + analogous.length + threePoint.length + bottomUp.length === 0;
  const amount = (value: number) => (value > 0 ? formatFcfaMillions(value) : '—');

  return (
    <div className="basis">
      {none && <p className="plan__empty">Aucune activité n'a encore le détail de son calcul.</p>}

      {parametric.length > 0 && (
        <Worksheet title="Estimations paramétriques" head={['ID', 'Variable de coût', num('Coût unitaire'), num("Nombre d'unités"), num('Estimation')]}>
          {parametric.map(({ activity, basis, estimate }) => (
            <tr key={activity.code}>
              <td className="register-table__code">{activity.code}</td>
              <td className="register-table__title">{basis.costVariable}</td>
              <td className="num">{formatFcfa(basis.unitCost)}</td>
              <td className="num">{new Intl.NumberFormat('fr-FR').format(basis.units)}</td>
              <td className="num cost-total">{formatFcfaMillions(estimate)}</td>
            </tr>
          ))}
        </Worksheet>
      )}

      {analogous.length > 0 && (
        <Worksheet
          title="Estimations analogues"
          head={['ID', 'Activité de référence', num('Coût de référence'), 'Activité actuelle', num('Coefficient'), num('Estimation')]}
        >
          {analogous.map(({ activity, basis, estimate }) => (
            <tr key={activity.code}>
              <td className="register-table__code">{activity.code}</td>
              <td className="register-table__title">{basis.previousActivity}</td>
              <td className="num">{formatFcfaMillions(basis.previousCost)}</td>
              <td>{activity.name}</td>
              <td className="num">{new Intl.NumberFormat('fr-FR').format(basis.multiplier)}</td>
              <td className="num cost-total">{formatFcfaMillions(estimate)}</td>
            </tr>
          ))}
        </Worksheet>
      )}

      {threePoint.length > 0 && (
        <Worksheet
          title="Estimations à trois points (PERT)"
          note="Pondération PERT : (optimiste + 4 × plus probable + pessimiste) / 6, pour les activités à forte incertitude."
          head={['ID', num('Optimiste'), num('Plus probable'), num('Pessimiste'), num('Estimation')]}
        >
          {threePoint.map(({ activity, basis, estimate }) => (
            <tr key={activity.code}>
              <td className="register-table__code">{activity.code}</td>
              <td className="num">{formatFcfaMillions(basis.optimistic)}</td>
              <td className="num">{formatFcfaMillions(basis.mostLikely)}</td>
              <td className="num">{formatFcfaMillions(basis.pessimistic)}</td>
              <td className="num cost-total">{formatFcfaMillions(estimate)}</td>
            </tr>
          ))}
        </Worksheet>
      )}

      {bottomUp.length > 0 && (
        <Worksheet
          title="Estimations ascendantes"
          head={['ID', num('Heures'), num('Taux horaire'), num("Main-d'œuvre"), ...components.map((key) => num(BOTTOM_UP_COMPONENTS[key])), num('Estimation')]}
        >
          {bottomUp.map(({ activity, basis, estimate }) => (
            <tr key={activity.code}>
              <td className="register-table__code">{activity.code}</td>
              <td className="num">{new Intl.NumberFormat('fr-FR').format(basis.laborHours)}</td>
              <td className="num">{formatFcfa(basis.laborRate)}</td>
              <td className="num">{amount(basis.laborHours * basis.laborRate)}</td>
              {components.map((key) => (
                <td key={key} className="num">
                  {amount(basis[key])}
                </td>
              ))}
              <td className="num cost-total">{formatFcfaMillions(estimate)}</td>
            </tr>
          ))}
        </Worksheet>
      )}

      <section className="basis-narrative">
        <h3 className="plan__section-title">Synthèse</h3>
        <TextSections sections={sectionsOf(NARRATIVE_LABELS, narrative)} />
      </section>
    </div>
  );
}
