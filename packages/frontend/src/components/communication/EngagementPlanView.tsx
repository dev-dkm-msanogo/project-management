import type { ReactNode } from 'react';
import type { StakeholderEngagementPlanDto } from '@shared/index';
import { StyleChips } from '@/components/communication/StyleChips';
import { EngagementMatrix } from '@/components/stakeholders/EngagementMatrix';
import { formatLongDate } from '@/lib/format';
import { ENGAGEMENT_LABELS } from '@/lib/stakeholder-format';
import type { AppView } from '@/navigation/pmp';

function Panel({ title, live, children }: { title: string; live?: boolean; children: ReactNode }) {
  return (
    <section className="doc-panel">
      <div className="doc-panel-head">
        <h2 className="plan__section-title">{title}</h2>
        {live && <span className="doc-sync">Issu du registre des parties prenantes</span>}
      </div>
      {children}
    </section>
  );
}

interface EngagementPlanViewProps {
  plan: StakeholderEngagementPlanDto;
  projectName: string;
  onNavigate: (view: AppView) => void;
}

/**
 * Plan d'engagement lu comme le template PMI : matrice actuel / souhaité (lue dans le
 * registre), évolutions attendues, relations, puis l'approche retenue pour chacun.
 */
export function EngagementPlanView({ plan, projectName, onNavigate }: EngagementPlanViewProps) {
  const byCode = new Map(plan.stakeholders.map((stakeholder) => [stakeholder.code.toUpperCase(), stakeholder]));
  const missing = plan.missingApproaches.map((code) => byCode.get(code.toUpperCase())?.name ?? code);

  return (
    <article className="doc-page">
      <section className="doc-panel">
        <div className="doc-heading">
          <h2 className="doc-title">{projectName}</h2>
          <span className="doc-meta">Préparé le {formatLongDate(plan.preparedOn)}</span>
        </div>
        <div className="doc-panel-head">
          <h3 className="doc-subtitle">Matrice d'évaluation de l'engagement</h3>
          <span className="doc-sync">Issu du registre des parties prenantes</span>
        </div>
        {plan.stakeholders.length === 0 ? (
          <p className="plan__empty">Le registre des parties prenantes est vide.</p>
        ) : (
          <EngagementMatrix stakeholders={plan.stakeholders} />
        )}
        <button type="button" className="ref-link" onClick={() => onNavigate('stakeholders')}>
          Registre des parties prenantes →
        </button>
      </section>

      {missing.length > 0 && (
        <section className="doc-panel cost-unscheduled" role="alert">
          <h2 className="plan__section-title">Parties prenantes à faire progresser sans approche</h2>
          <p className="doc-text">{missing.join(' · ')}</p>
        </section>
      )}

      <div className="doc-columns">
        <Panel title="Évolutions d'engagement attendues">
          <p className="doc-text">{plan.pendingChanges || '—'}</p>
        </Panel>
        <Panel title="Relations entre parties prenantes">
          <p className="doc-text">{plan.relationships || '—'}</p>
        </Panel>
      </div>

      <Panel title={`Approches d'engagement (${plan.approaches.length})`}>
        {plan.approaches.length === 0 ? (
          <p className="plan__empty">Aucune approche définie.</p>
        ) : (
          <div className="wbs-scroll">
            <table className="register-table register-table--engagement">
              <thead>
                <tr>
                  <th>Partie prenante</th>
                  <th>Actuel → souhaité</th>
                  <th>Approche</th>
                  <th>Besoins d'information</th>
                  <th>Fréquence et méthode</th>
                </tr>
              </thead>
              <tbody>
                {plan.approaches.map((item) => {
                  const stakeholder = byCode.get(item.stakeholderCode.toUpperCase());
                  return (
                    <tr key={item.stakeholderCode}>
                      <td className="register-table__title">
                        {stakeholder?.name ?? item.stakeholderCode}
                        {stakeholder ? (
                          <span className="register-table__muted">{stakeholder.role}</span>
                        ) : (
                          <span className="register-flag">Absente du registre</span>
                        )}
                      </td>
                      <td className="engagement-shift">
                        {stakeholder ? (
                          <>
                            {ENGAGEMENT_LABELS[stakeholder.currentEngagement]} → {ENGAGEMENT_LABELS[stakeholder.desiredEngagement]}
                            <span
                              className={`engagement-gap engagement-gap--${stakeholder.engagementGap > 0 ? 'todo' : 'done'}`}
                            >
                              {stakeholder.engagementGap > 0 ? `+${stakeholder.engagementGap}` : 'atteint'}
                            </span>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="register-table__response">{item.approach}</td>
                      <td className="register-table__response">{item.informationNeeds || '—'}</td>
                      <td className="register-table__response">
                        {item.frequency && <span className="engagement-detail">{item.frequency}</span>}
                        {item.method && <span className="register-table__muted">{item.method}</span>}
                        <StyleChips styles={item.styles} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </article>
  );
}
