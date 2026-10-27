import type { SalienceCategory, StakeholderMappingEntryDto } from '@shared/index';
import {
  SALIENCE_ATTRIBUTES,
  SALIENCE_ENGAGEMENT,
  SALIENCE_LABELS,
  SALIENCE_ORDER,
} from '@/lib/stakeholder-tools-format';

const MAX_CODES = 3;

/** Centre de chaque zone du diagramme (cercles pouvoir, légitimité, urgence). */
const REGIONS: Record<Exclude<SalienceCategory, 'NONE'>, { x: number; y: number }> = {
  DORMANT: { x: 128, y: 118 },
  DISCRETIONARY: { x: 392, y: 118 },
  DEMANDING: { x: 260, y: 338 },
  DOMINANT: { x: 260, y: 92 },
  DANGEROUS: { x: 178, y: 236 },
  DEPENDENT: { x: 342, y: 236 },
  DEFINITIVE: { x: 260, y: 178 },
};

/** Modèle de saillance : diagramme pouvoir / légitimité / urgence et tableau des catégories. */
export function SalienceModel({ entries }: { entries: StakeholderMappingEntryDto[] }) {
  const byCategory = (category: SalienceCategory) => entries.filter((entry) => entry.category === category);
  const unclassified = byCategory('NONE');

  return (
    <div className="salience">
      <svg className="salience__venn" viewBox="0 0 520 400" role="img" aria-label="Modèle de saillance : pouvoir, légitimité et urgence">
        <circle cx="190" cy="145" r="120" className="salience__circle salience__circle--power" />
        <circle cx="330" cy="145" r="120" className="salience__circle salience__circle--legitimacy" />
        <circle cx="260" cy="262" r="120" className="salience__circle salience__circle--urgency" />
        <text x="62" y="30" className="salience__axis">Pouvoir</text>
        <text x="458" y="30" className="salience__axis" textAnchor="end">Légitimité</text>
        <text x="260" y="396" className="salience__axis" textAnchor="middle">Urgence</text>

        {(Object.keys(REGIONS) as (keyof typeof REGIONS)[]).map((category) => {
          const { x, y } = REGIONS[category];
          const codes = byCategory(category).map((entry) => entry.stakeholderCode);
          const shown = codes.length > MAX_CODES ? [...codes.slice(0, MAX_CODES - 1), `+${codes.length - MAX_CODES + 1}`] : codes;
          return (
            <g key={category} className={codes.length > 0 ? 'salience__region salience__region--filled' : 'salience__region'}>
              <title>{`${SALIENCE_LABELS[category]} : ${byCategory(category).map((entry) => entry.name).join(', ') || 'aucune'}`}</title>
              <text x={x} y={y} textAnchor="middle" className="salience__label">
                {SALIENCE_LABELS[category]}
              </text>
              {shown.map((code, index) => (
                <text key={code} x={x} y={y + 16 + index * 14} textAnchor="middle" className="salience__code">
                  {code}
                </text>
              ))}
            </g>
          );
        })}
      </svg>

      <div className="wbs-scroll">
        <table className="register-table register-table--salience">
          <thead>
            <tr>
              <th>Catégorie</th>
              <th>Attributs</th>
              <th>Comment engager</th>
              <th>Parties prenantes</th>
            </tr>
          </thead>
          <tbody>
            {SALIENCE_ORDER.filter((category) => category !== 'NONE' || unclassified.length > 0).map((category) => {
              const members = byCategory(category);
              return (
                <tr key={category}>
                  <td>
                    <strong className={`salience-badge salience-badge--${category.toLowerCase()}`}>{SALIENCE_LABELS[category]}</strong>
                  </td>
                  <td className="register-table__muted-cell">{SALIENCE_ATTRIBUTES[category]}</td>
                  <td className="register-table__response">{SALIENCE_ENGAGEMENT[category]}</td>
                  <td className="register-table__response">
                    {members.length === 0 ? (
                      <span className="register-table__muted-cell">Aucune</span>
                    ) : (
                      <span className="salience-members">
                        {members.map((entry) => (
                          <span key={entry.stakeholderCode} className="salience-member">
                            <span className="matrix-chip">{entry.stakeholderCode}</span>
                            {entry.name}
                          </span>
                        ))}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
