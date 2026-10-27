import type { ResponsibilityMatrixDto } from '@shared/index';
import { PersonName } from '@/components/people/People';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { formatLongDate } from '@/lib/format';
import { RACI_CODES, RACI_LABELS } from '@/lib/raci-format';

/** Matrice RACI lue comme le template : activités en lignes, participants en colonnes. */
export function RaciView({ matrix, projectName }: { matrix: ResponsibilityMatrixDto; projectName: string }) {
  const count = (code: 'A' | 'R') => matrix.gaps.filter((gap) => gap.missing.includes(code)).length;

  return (
    <article className="doc-page">
      <SummaryTiles
        tiles={[
          { label: 'Participants', value: matrix.participants.length },
          { label: 'Activités', value: matrix.activities.length },
          { label: 'Sans personne qui rend compte (A)', value: count('A'), tone: 'danger' },
          { label: 'Sans réalisateur (R)', value: count('R'), tone: 'warning' },
        ]}
      />

      <section className="doc-panel">
        <div className="doc-heading">
          <h2 className="doc-title">{projectName}</h2>
          <span className="doc-meta">Préparée le {formatLongDate(matrix.preparedOn)}</span>
        </div>
        {matrix.activities.length === 0 || matrix.participants.length === 0 ? (
          <p className="plan__empty">Ajoutez des participants et des activités pour construire la matrice.</p>
        ) : (
          <div className="wbs-scroll">
            <table className="raci-table">
              <thead>
                <tr>
                  <th className="raci-table__activity">Lot de travail / activité</th>
                  {matrix.participants.map((participant) => (
                    <th key={participant.key}>
                      <PersonName id={participant.resourceId} />
                      {participant.role && <span>{participant.role}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.activities.map((activity, index) => {
                  const gap = matrix.gaps.find((item) => item.activity === activity.name);
                  return (
                    <tr key={index}>
                      <th scope="row" className="raci-table__activity">
                        {activity.name}
                        {gap && <span className="register-flag">Sans {gap.missing.join(' ni ')}</span>}
                      </th>
                      {matrix.participants.map((participant) => {
                        const code = activity.assignments[participant.key];
                        return (
                          <td key={participant.key} className={code ? `raci-cell raci-cell--${code}` : 'raci-cell'}>
                            {code ?? ''}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <ul className="raci-legend">
          {RACI_CODES.map((code) => (
            <li key={code} className={`raci-cell--${code}`}>
              <strong>
                {code} — {RACI_LABELS[code].name}
              </strong>
              <span>{RACI_LABELS[code].hint}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
