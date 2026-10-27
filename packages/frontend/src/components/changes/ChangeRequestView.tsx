import type { ReactNode } from 'react';
import type { ChangeLogDto } from '@shared/index';
import { PersonName } from '@/components/people/People';
import { ScoringTable } from '@/components/ui/ScoringTable';
import { TextSections } from '@/components/ui/TextSections';
import {
  CHANGE_CATEGORY_LABELS,
  CHANGE_STATUS_LABELS,
  DIRECTION_LABELS,
  DISPOSITION_LABELS,
  DISPOSITION_MODIFIERS,
  formatCostImpact,
  formatScheduleImpact,
  IMPACT_AREAS,
  STAKEHOLDER_RISK_LABELS,
  STAKEHOLDER_RISK_MODIFIERS,
} from '@/lib/change-format';
import { formatLongDate } from '@/lib/format';

export type ChangeRequestDto = ChangeLogDto['requests'][number];

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="doc-panel">
      <h2 className="plan__section-title">{title}</h2>
      {children}
    </section>
  );
}

/** Décision d'une demande : badge coloré (jamais la couleur seule). */
export function DispositionBadge({ request }: { request: ChangeRequestDto }) {
  if (!request.disposition) return <span className="status-badge status-badge--blue">En attente</span>;
  return (
    <span className={`status-badge status-badge--${DISPOSITION_MODIFIERS[request.disposition]}`}>
      {DISPOSITION_LABELS[request.disposition]}
    </span>
  );
}

/** Demande de modification lue comme les templates « Change Request » et « Change Request Assessment ». */
export function ChangeRequestView({ request }: { request: ChangeRequestDto }) {
  const { assessment, assessmentResult } = request;

  return (
    <article className="doc-page">
      <section className="doc-panel">
        <div className="doc-heading">
          <h2 className="doc-title">
            {request.code} · {request.title}
          </h2>
          <span className="doc-meta">
            Soumise le {formatLongDate(request.submittedOn)} par {request.requestor}
          </span>
        </div>
        <div className="change-tags">
          {request.categories.map((category) => (
            <span key={category} className="skill-chip">
              {CHANGE_CATEGORY_LABELS[category]}
            </span>
          ))}
          <span className="status-badge status-badge--grey">{CHANGE_STATUS_LABELS[request.status]}</span>
          <DispositionBadge request={request} />
        </div>
        <TextSections
          sections={[
            { key: 'description', label: 'Description détaillée', text: request.description },
            { key: 'justification', label: 'Justification', text: request.justification },
          ]}
        />
      </section>

      <Panel title="Impacts">
        <div className="change-figures">
          <div>
            <span className="change-figures__value">{formatCostImpact(request.costImpact)}</span>
            <span className="doc-meta">Coût estimé</span>
          </div>
          <div>
            <span className="change-figures__value">{formatScheduleImpact(request.scheduleImpactDays)}</span>
            <span className="doc-meta">Délai (jours ouvrés)</span>
          </div>
        </div>
        <div className="wbs-scroll">
          <table className="register-table">
            <thead>
              <tr>
                <th>Domaine</th>
                <th>Effet</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {IMPACT_AREAS.map((area) => {
                const impact = request.impacts[area];
                return (
                  <tr key={area}>
                    <td className="register-table__title">{CHANGE_CATEGORY_LABELS[area]}</td>
                    <td className={impact.direction ? '' : 'register-table__muted-cell'}>
                      {impact.direction ? DIRECTION_LABELS[impact.direction] : 'Sans effet'}
                    </td>
                    <td className="register-table__response">{impact.description || '—'}</td>
                  </tr>
                );
              })}
              <tr>
                <td className="register-table__title">Parties prenantes</td>
                <td>
                  {request.stakeholderRisk ? (
                    <span className={`status-badge status-badge--${STAKEHOLDER_RISK_MODIFIERS[request.stakeholderRisk]}`}>
                      {STAKEHOLDER_RISK_LABELS[request.stakeholderRisk]}
                    </span>
                  ) : (
                    <span className="register-table__muted-cell">Non évalué</span>
                  )}
                </td>
                <td className="register-table__response">{request.stakeholderImpact || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <TextSections
          sections={[
            { key: 'affectedDocuments', label: 'Documents du projet à mettre à jour', text: request.affectedDocuments },
            { key: 'comments', label: 'Commentaires', text: request.comments },
          ]}
        />
      </Panel>

      {assessment && (
        <Panel title="Évaluation">
          <p className="doc-meta">
            Évaluée le {formatLongDate(assessment.assessedOn)} par <PersonName id={assessment.assessedById} />
          </p>
          <div className="wbs-scroll">
            <table className="register-table register-table--alternatives">
              <thead>
                <tr>
                  <th>Alternative</th>
                  <th>Coût</th>
                  <th>Délai</th>
                  <th>Avantages</th>
                  <th>Inconvénients</th>
                </tr>
              </thead>
              <tbody>
                {assessment.alternatives.map((alternative) => {
                  const recommended = alternative.name === assessment.recommended;
                  return (
                    <tr key={alternative.name} className={recommended ? 'change-alternative--recommended' : ''}>
                      <td className="register-table__title">
                        {alternative.name}
                        {recommended && <span className="status-badge status-badge--green">Recommandée</span>}
                      </td>
                      <td>{alternative.cost || '—'}</td>
                      <td>{alternative.schedule || '—'}</td>
                      <td className="register-table__response">{alternative.pros || '—'}</td>
                      <td className="register-table__response">{alternative.cons || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {assessmentResult && (
            <>
              <h3 className="doc-subtitle">Analyse multicritère</h3>
              <ScoringTable
                options={assessment.alternatives.map((alternative) => alternative.name)}
                criteria={assessment.criteria}
                result={assessmentResult}
              />
            </>
          )}
          <TextSections
            sections={[
              { key: 'recommendation', label: 'Recommandation', text: assessment.recommendation },
              { key: 'implementationNotes', label: 'Mise en œuvre prévue', text: assessment.implementationNotes },
            ]}
          />
        </Panel>
      )}

      <Panel title="Décision">
        {!request.disposition ? (
          <p className="plan__empty">En attente de la décision des valideurs du projet.</p>
        ) : (
          <>
            <p className="change-decision">
              <DispositionBadge request={request} />
              <span>
                le {formatLongDate(request.decidedOn!)} par {request.decidedBy}
              </span>
            </p>
            {request.decisionRationale && <p className="doc-text">{request.decisionRationale}</p>}
          </>
        )}
      </Panel>
    </article>
  );
}
