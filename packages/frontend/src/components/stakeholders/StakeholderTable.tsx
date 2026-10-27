import { Fragment, useId, useState } from 'react';
import type { StakeholderDto, StakeholderQuadrant } from '@shared/index';
import { SelectInput } from '@/components/form/controls';
import { EditCell, EditHeader } from '@/components/ui/EditEntry';
import { matchesQuery } from '@/lib/format';
import {
  ENGAGEMENT_LABELS,
  formatGap,
  QUADRANT_LABELS,
  QUADRANT_MODIFIERS,
  STAKEHOLDER_TYPE_LABELS,
} from '@/lib/stakeholder-format';

type QuadrantFilter = StakeholderQuadrant | 'ALL';

const QUADRANTS: readonly StakeholderQuadrant[] = ['MANAGE_CLOSELY', 'KEEP_SATISFIED', 'KEEP_INFORMED', 'MONITOR'];

/** Du plus influent au moins influent ; à égalité, ordre des codes. */
const byInfluence = (a: StakeholderDto, b: StakeholderDto): number =>
  b.power + b.interest - (a.power + a.interest) || a.code.localeCompare(b.code);

const DETAILS: { key: 'requirements' | 'expectations' | 'strategy'; label: string }[] = [
  { key: 'requirements', label: 'Exigences' },
  { key: 'expectations', label: 'Attentes' },
  { key: 'strategy', label: "Actions d'engagement" },
];

/**
 * Registre : une ligne courte par partie prenante (identité, classification, engagement, contact),
 * exigences, attentes et actions d'engagement dépliables ; filtre par quadrant et recherche.
 */
export function StakeholderTable({
  stakeholders,
  onEdit,
}: {
  stakeholders: StakeholderDto[];
  onEdit?: (code: string) => void;
}) {
  const baseId = useId();
  const [filter, setFilter] = useState<QuadrantFilter>('ALL');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());

  if (stakeholders.length === 0) {
    return <p className="plan__empty">Aucune partie prenante identifiée pour ce projet.</p>;
  }

  const shown = [...stakeholders]
    .sort(byInfluence)
    .filter((s) => filter === 'ALL' || s.quadrant === filter)
    .filter((s) => matchesQuery([s.code, s.name, s.role, s.organization], query));
  const allOpen = shown.length > 0 && shown.every((s) => open.has(s.code));
  const toggle = (code: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  return (
    <>
      <div className="stakeholder-filters">
        <label className="stakeholder-filters__search">
          <span className="visually-hidden">Rechercher une partie prenante</span>
          <input
            className="form-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher (nom, rôle, organisation)"
          />
        </label>
        <label className="stakeholder-filters__quadrant">
          <span className="visually-hidden">Quadrant</span>
          <SelectInput<QuadrantFilter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'ALL', label: `Tous les quadrants (${stakeholders.length})` },
              ...QUADRANTS.map((quadrant) => ({
                value: quadrant,
                label: `${QUADRANT_LABELS[quadrant]} (${stakeholders.filter((s) => s.quadrant === quadrant).length})`,
              })),
            ]}
          />
        </label>
        {shown.length > 0 && (
          <button
            type="button"
            className="ref-link"
            onClick={() => setOpen(allOpen ? new Set() : new Set(shown.map((s) => s.code)))}
          >
            {allOpen ? 'Tout replier' : 'Tout déplier'}
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="plan__empty">Aucune partie prenante ne correspond.</p>
      ) : (
        <div className="wbs-scroll">
          <table className="register-table register-table--stakeholders">
            <thead>
              <tr>
                <th>
                  <span className="visually-hidden">Détails</span>
                </th>
                <th>Partie prenante</th>
                <th>Poste / rôle</th>
                <th>Classification</th>
                <th>Engagement</th>
                <th>Contact</th>
                {onEdit && <EditHeader />}
              </tr>
            </thead>
            <tbody>
              {shown.map((stakeholder) => {
                const expanded = open.has(stakeholder.code);
                const detailId = `${baseId}-${stakeholder.code}`;
                return (
                  <Fragment key={stakeholder.code}>
                    <tr
                      className={`stakeholder-row${expanded ? ' stakeholder-row--open' : ''}`}
                      onClick={() => toggle(stakeholder.code)}
                    >
                      <td className="stakeholder-row__toggle">
                        <button
                          type="button"
                          className="disclosure"
                          aria-expanded={expanded}
                          aria-controls={detailId}
                          aria-label={`${expanded ? 'Masquer' : 'Afficher'} les détails de ${stakeholder.name}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggle(stakeholder.code);
                          }}
                        >
                          <span aria-hidden="true">›</span>
                        </button>
                      </td>
                      <td className="register-table__title">
                        <span>
                          <span className="register-table__code">{stakeholder.code}</span> {stakeholder.name}
                        </span>
                        <span className="register-table__description">
                          {[stakeholder.organization, STAKEHOLDER_TYPE_LABELS[stakeholder.type]].filter(Boolean).join(' · ')}
                        </span>
                      </td>
                      <td>{stakeholder.role}</td>
                      <td>
                        <span className={`quadrant-badge quadrant--${QUADRANT_MODIFIERS[stakeholder.quadrant]}`}>
                          {QUADRANT_LABELS[stakeholder.quadrant]}
                        </span>
                        <span className="register-table__description">
                          Pouvoir {stakeholder.power} · intérêt {stakeholder.interest}
                        </span>
                      </td>
                      <td className="stakeholder-engagement">
                        <span>
                          {ENGAGEMENT_LABELS[stakeholder.currentEngagement]} → {ENGAGEMENT_LABELS[stakeholder.desiredEngagement]}
                        </span>
                        <span
                          className={`engagement-gap engagement-gap--${stakeholder.engagementGap > 0 ? 'todo' : 'done'}`}
                        >
                          {formatGap(stakeholder.engagementGap)}
                        </span>
                      </td>
                      <td className="register-table__note register-table__contact">{stakeholder.contact ?? '—'}</td>
                      {onEdit && (
                        <EditCell label={stakeholder.code} onEdit={() => onEdit(stakeholder.code)} />
                      )}
                    </tr>
                    {expanded && (
                      <tr id={detailId} className="stakeholder-details">
                        <td />
                        <td colSpan={onEdit ? 6 : 5}>
                          <dl className="stakeholder-details__grid">
                            {DETAILS.map(({ key, label }) => (
                              <div key={key}>
                                <dt>{label}</dt>
                                <dd>{stakeholder[key] ?? '—'}</dd>
                              </div>
                            ))}
                          </dl>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
