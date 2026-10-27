import type { RequirementCategory, RequirementInput } from '@shared/index';
import { RequirementCodes } from '@/components/requirements/RequirementBadges';
import {
  isActive,
  isNeed,
  REQUIREMENT_CATEGORY_LABELS,
  SOLUTION_CATEGORIES,
} from '@/lib/requirements-format';

const COLUMN_LABELS: Record<RequirementCategory, string> = {
  ...REQUIREMENT_CATEGORY_LABELS,
  FUNCTIONAL: 'Fonctionnelles',
  NON_FUNCTIONAL: 'Non fonctionnelles',
};

/**
 * Traçabilité inter-exigences (template PMI) : pour chaque besoin métier ou partie prenante,
 * les exigences de solution actives qui le satisfont. Un besoin actif sans solution est signalé.
 */
export function NeedsCoverage({ requirements }: { requirements: readonly RequirementInput[] }) {
  const needs = requirements.filter(isNeed);
  const solutions = requirements.filter((requirement) => isActive(requirement) && requirement.satisfies.length > 0);

  if (needs.length === 0) {
    return <p className="plan__empty">Aucune exigence métier ou partie prenante enregistrée.</p>;
  }

  const satisfying = (need: RequirementInput, category: RequirementCategory) =>
    solutions.filter(
      (solution) =>
        solution.category === category &&
        solution.satisfies.some((code) => code.toUpperCase() === need.code.toUpperCase()),
    );

  return (
    <div className="wbs-scroll">
      <table className="register-table register-table--coverage">
        <thead>
          <tr>
            <th>Besoin</th>
            {SOLUTION_CATEGORIES.map((category) => (
              <th key={category}>{COLUMN_LABELS[category]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {needs.map((need) => {
            const covered = SOLUTION_CATEGORIES.some((category) => satisfying(need, category).length > 0);
            return (
              <tr key={need.code} className={isActive(need) ? undefined : 'register-row--muted'}>
                <td className="register-table__title">
                  <span className="register-table__code">{need.code}</span> {need.statement}
                  <span className="register-table__muted">
                    {REQUIREMENT_CATEGORY_LABELS[need.category]}
                    {isActive(need) && !covered && (
                      <span className="register-flag register-flag--inline">Non couvert</span>
                    )}
                  </span>
                </td>
                {SOLUTION_CATEGORIES.map((category) => (
                  <td key={category}>
                    <RequirementCodes requirements={satisfying(need, category)} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
