import type { ReactNode } from 'react';
import type { ClosureReportDto } from '@shared/index';
import { PersonName } from '@/components/people/People';
import { BENEFIT_OUTCOME_LABELS, BENEFIT_OUTCOME_MODIFIERS } from '@/lib/closing-format';
import { formatDaysSigned, formatFcfaMillions, formatLongDate, formatShortDate } from '@/lib/format';
import type { AppView } from '@/navigation/pmp';

function Panel({ title, live, children }: { title: string; live?: boolean; children: ReactNode }) {
  return (
    <section className="doc-panel">
      <div className="doc-panel-head">
        <h2 className="plan__section-title">{title}</h2>
        {live && <span className="doc-sync">Issu du projet</span>}
      </div>
      {children}
    </section>
  );
}

const Text = ({ value, empty = '—' }: { value: string; empty?: string }) => <p className="doc-text">{value || empty}</p>;

interface ClosureReportViewProps {
  report: ClosureReportDto;
  projectName: string;
  onNavigate: (view: AppView) => void;
}

/** Rapport de clôture lu comme les templates « Final Report » et « Final Product Transition ». */
export function ClosureReportView({ report, projectName, onNavigate }: ClosureReportViewProps) {
  const { facts } = report;
  const { schedule, cost, deliverables } = facts;
  const open = facts.openRisks.length + facts.openIssues.length;

  return (
    <article className="doc-page">
      <section className="doc-panel">
        <div className="doc-heading">
          <h2 className="doc-title">{projectName}</h2>
        </div>
        <dl className="doc-facts">
          <div>
            <dt>Préparé le</dt>
            <dd>{formatLongDate(report.preparedOn)}</dd>
          </div>
          <div>
            <dt>Livrables acceptés</dt>
            <dd>
              {deliverables.accepted} sur {deliverables.total}
              {deliverables.rejected > 0 && <span>{deliverables.rejected} refusé(s)</span>}
            </dd>
          </div>
          <div>
            <dt>Avancement</dt>
            <dd>{schedule.percentComplete === null ? '—' : `${schedule.percentComplete} %`}</dd>
          </div>
          <div>
            <dt>Risques et problèmes ouverts</dt>
            <dd>{open}</dd>
          </div>
        </dl>
        <h3 className="doc-subtitle">Description du projet</h3>
        <Text value={report.description} />
      </section>

      <Panel title="Bilan des objectifs">
        {report.objectives.length === 0 ? (
          <p className="plan__empty">Aucun objectif.</p>
        ) : (
          <div className="wbs-scroll">
            <table className="register-table">
              <thead>
                <tr>
                  <th>Objectif</th>
                  <th>Critères d'achèvement</th>
                  <th>Comment ils ont été atteints</th>
                </tr>
              </thead>
              <tbody>
                {report.objectives.map((item, index) => (
                  <tr key={index}>
                    <td className="register-table__code">{item.objective}</td>
                    <td className="register-table__response">{item.criteria || '—'}</td>
                    <td className="register-table__response">{item.howMet || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button type="button" className="ref-link" onClick={() => onNavigate('deliverables')}>
          Livrables →
        </button>
      </Panel>

      <Panel title="Écarts" live>
        <div className="wbs-scroll">
          <table className="register-table">
            <thead>
              <tr>
                <th>Objectif</th>
                <th>Résultat final</th>
                <th>Écart</th>
                <th>Commentaires</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="register-table__code">Délai</td>
                <td>
                  Fin {schedule.finished ? 'réelle' : 'prévue'} : {formatShortDate(schedule.finish)}
                  <span className="register-table__muted">Référence : {formatShortDate(schedule.baselineFinish)}</span>
                </td>
                <td>{schedule.varianceDays === null ? '—' : formatDaysSigned(schedule.varianceDays)}</td>
                <td className="register-table__response">{report.scheduleComments || '—'}</td>
              </tr>
              <tr>
                <td className="register-table__code">Coût</td>
                <td>
                  {cost ? (
                    <>
                      Coût réel : {formatFcfaMillions(cost.ac)}
                      <span className="register-table__muted">
                        Budget : {formatFcfaMillions(cost.bac)} · estimation à l'achèvement : {formatFcfaMillions(cost.eac)}
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  {cost ? (
                    <>
                      {cost.variance >= 0 ? '+' : '−'}
                      {formatFcfaMillions(Math.abs(cost.variance))}
                      <span className="register-table__muted">
                        Réserves : {formatFcfaMillions(cost.contingencyReserve)} pour aléas,{' '}
                        {formatFcfaMillions(cost.managementReserve)} de management
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="register-table__response">{report.costComments || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Bénéfices">
        {report.benefits.length === 0 ? (
          <p className="plan__empty">Aucun bénéfice repris.</p>
        ) : (
          <div className="wbs-scroll">
            <table className="register-table">
              <thead>
                <tr>
                  <th>Besoin ou bénéfice</th>
                  <th>Situation à la clôture</th>
                  <th>Commentaires</th>
                </tr>
              </thead>
              <tbody>
                {report.benefits.map((item, index) => (
                  <tr key={index}>
                    <td className="register-table__title">{item.need}</td>
                    <td>
                      <span className={`status-badge status-badge--${BENEFIT_OUTCOME_MODIFIERS[item.outcome]}`}>
                        {BENEFIT_OUTCOME_LABELS[item.outcome]}
                      </span>
                    </td>
                    <td className="register-table__response">{item.comments || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Risques et problèmes : disposition finale" live>
        {open === 0 ? (
          <p className="plan__empty">Aucun risque ni problème ouvert.</p>
        ) : (
          <ul className="doc-refs">
            {facts.openRisks.map((risk) => (
              <li key={risk.code}>
                <strong>{risk.code}</strong>
                <span>{risk.title}</span>
              </li>
            ))}
            {facts.openIssues.map((issue) => (
              <li key={issue.code}>
                <strong>{issue.code}</strong>
                <span>{issue.description}</span>
              </li>
            ))}
          </ul>
        )}
        <Text value={report.riskAndIssueDisposition} empty="Disposition non précisée." />
        <div className="doc-links">
          <button type="button" className="ref-link" onClick={() => onNavigate('risks')}>
            Registre des risques →
          </button>
          <button type="button" className="ref-link" onClick={() => onNavigate('issue-log')}>
            Journal des problèmes →
          </button>
        </div>
      </Panel>

      <Panel title="Transition vers l'exploitation">
        <h3 className="doc-subtitle">Produit ou résultat transféré</h3>
        <Text value={report.product} />
        {report.recipients.length > 0 && (
          <div className="wbs-scroll">
            <table className="register-table">
              <thead>
                <tr>
                  <th>Destinataire</th>
                  <th>Responsabilité d'exploitation</th>
                  <th>Éléments remis</th>
                </tr>
              </thead>
              <tbody>
                {report.recipients.map((item, index) => (
                  <tr key={index}>
                    <td className="register-table__title">{item.recipient}</td>
                    <td className="register-table__response">{item.responsibility || '—'}</td>
                    <td className="register-table__response">{item.materials || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <h3 className="doc-subtitle">Formations dispensées</h3>
        <Text value={report.training} />
        <h3 className="doc-subtitle">Support après la transition</h3>
        <Text value={report.supportArrangements} />
        <h3 className="doc-subtitle">Éléments restants ou reportés</h3>
        {report.outstandingItems.length === 0 ? (
          <p className="plan__empty">Aucun.</p>
        ) : (
          <ul className="doc-list">
            {report.outstandingItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Acceptation de la transition">
        {report.acceptances.length === 0 ? (
          <p className="plan__empty">Aucune acceptation consignée.</p>
        ) : (
          <div className="charter__signatures">
            {report.acceptances.map((item, index) => (
              <div key={index} className={`charter__signature${item.acceptedOn ? ' charter__signature--signed' : ''}`}>
                <span className="charter__signature-role">{item.role || 'Destinataire'}</span>
                <strong>
                  <PersonName id={item.resourceId} />
                </strong>
                <span>{item.acceptedOn ? `Acceptée le ${formatShortDate(item.acceptedOn)}` : "En attente d'acceptation"}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Leçons apprises" live>
        <p className="doc-text">
          {facts.lessons.total} leçon(s) consignée(s)
          {facts.lessons.transferredOn
            ? `, transférées au référentiel de l'organisation le ${formatShortDate(facts.lessons.transferredOn)}.`
            : ", pas encore transférées au référentiel de l'organisation."}
        </p>
        <button type="button" className="ref-link" onClick={() => onNavigate('lessons-learned')}>
          Registre des leçons apprises →
        </button>
      </Panel>
    </article>
  );
}
