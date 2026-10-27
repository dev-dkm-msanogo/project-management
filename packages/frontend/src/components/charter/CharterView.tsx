import type { ReactNode } from 'react';
import type { ApprovalDto, ApprovalStatus, ProjectCharterDto, ProjectManagerAuthorityInput } from '@shared/index';
import { AssumptionReferences } from '@/components/assumptions/AssumptionReferences';
import { PersonName } from '@/components/people/People';
import {
  AUTHORITY_LABELS,
  CHARTER_STATUS_LABELS,
  OBJECTIVE_CATEGORY_LABELS,
  OVERALL_RISK_LABELS,
  OVERALL_RISK_MODIFIERS,
} from '@/lib/charter-format';
import { APPROVAL_STATUS_MODIFIERS, approvalDate } from '@/lib/approval-format';
import { formatLongDate, formatMillions, formatShortDate } from '@/lib/format';
import type { AppView } from '@/navigation/pmp';

function Panel({ title, live, children }: { title: string; live?: boolean; children: ReactNode }) {
  return (
    <section className="doc-panel">
      <div className="doc-panel-head">
        <h2 className="plan__section-title">{title}</h2>
        {live && <span className="doc-sync">Issu des registres</span>}
      </div>
      {children}
    </section>
  );
}

function Bullets({ items, empty, variant }: { items: readonly string[]; empty: string; variant?: 'in' | 'out' }) {
  if (items.length === 0) return <p className="plan__empty">{empty}</p>;
  return (
    <ul className={`doc-list${variant ? ` doc-list--${variant}` : ''}`}>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

interface Signatures {
  status: ApprovalStatus;
  /** Le chef de projet signe en soumettant, le valideur en approuvant (dates-heures ISO). */
  submitted: { by: string | null; at: string } | null;
  approver: { name: string; at: string } | null;
}

/** Signatures de la version affichée, tirées du circuit de validation. */
function signaturesOf(approval: ApprovalDto | null, archived: boolean): Signatures {
  const approved = approval?.approved ?? null;
  if (approved && (archived || approval?.status === 'APPROVED')) {
    return {
      status: 'APPROVED',
      submitted: { by: null, at: approved.submittedAt },
      approver: { name: approved.by.name, at: approved.at },
    };
  }
  if (approval?.status === 'SUBMITTED' && approval.submitted) {
    return { status: 'SUBMITTED', submitted: { by: approval.submitted.by.name, at: approval.submitted.at }, approver: null };
  }
  return { status: 'DRAFT', submitted: null, approver: null };
}

function approvalLine(signatures: Signatures): string {
  if (signatures.status === 'APPROVED' && signatures.approver) {
    return `Approuvée par ${signatures.approver.name} le ${approvalDate(signatures.approver.at)}`;
  }
  if (signatures.status === 'SUBMITTED' && signatures.submitted) {
    return `Soumise par ${signatures.submitted.by} le ${approvalDate(signatures.submitted.at)}, en attente de validation`;
  }
  return 'Brouillon, pas encore soumise';
}

function Signature({ role, name, signedAt }: { role: string; name: ReactNode; signedAt: string | null }) {
  return (
    <div className={`charter__signature${signedAt ? ' charter__signature--signed' : ''}`}>
      <span className="charter__signature-role">{role}</span>
      <strong>{name}</strong>
      <span>{signedAt ? `Signée le ${approvalDate(signedAt)}` : 'En attente de signature'}</span>
    </div>
  );
}

const AUTHORITY_KEYS = Object.keys(AUTHORITY_LABELS) as (keyof ProjectManagerAuthorityInput)[];

interface CharterViewProps {
  charter: ProjectCharterDto;
  projectName: string;
  onNavigate: (view: AppView) => void;
  approval: ApprovalDto | null;
  /** Version approuvée archivée (consultée pendant la préparation de la suivante). */
  archived: boolean;
}

/** Charte du projet, lue comme le template PMI ; parties prenantes et hypothèses viennent des registres. */
export function CharterView({ charter, projectName, onNavigate, approval, archived }: CharterViewProps) {
  const { references } = charter;
  const signatures = signaturesOf(approval, archived);

  return (
    <article className="doc-page charter">
      <section className="doc-panel charter__overview">
        <div className="doc-heading">
          <h2 className="doc-title">{projectName}</h2>
          <p className="charter__approval">
            <span className={`status-badge status-badge--${APPROVAL_STATUS_MODIFIERS[signatures.status]}`}>
              {CHARTER_STATUS_LABELS[signatures.status]}
            </span>
            {approvalLine(signatures)}
          </p>
        </div>
        <dl className="doc-facts">
          <div>
            <dt>Préparée le</dt>
            <dd>{formatLongDate(charter.preparedOn)}</dd>
          </div>
          <div>
            <dt>Sponsor</dt>
            <dd>
              <PersonName id={charter.sponsor.resourceId} />
              {charter.sponsor.role && <span>{charter.sponsor.role}</span>}
            </dd>
          </div>
          <div>
            <dt>Chef de projet</dt>
            <dd>
              <PersonName id={charter.projectManager.resourceId} />
            </dd>
          </div>
          <div>
            <dt>Client du projet</dt>
            <dd>{charter.customer ?? '—'}</dd>
          </div>
        </dl>
        <h3 className="doc-subtitle">Objet et justification</h3>
        <p className="doc-text">{charter.purpose}</p>
        <h3 className="doc-subtitle">Description de haut niveau</h3>
        <p className="doc-text">{charter.description || '—'}</p>
      </section>

      <div className="doc-columns">
        <Panel title="Dans le périmètre">
          <Bullets items={charter.inScope} empty="Non précisé." variant="in" />
        </Panel>
        <Panel title="Hors périmètre">
          <Bullets items={charter.outOfScope} empty="Non précisé." variant="out" />
        </Panel>
      </div>

      <div className="doc-columns">
        <Panel title="Livrables clés">
          <Bullets items={charter.deliverables} empty="Aucun livrable défini." />
        </Panel>
        <Panel title="Exigences de haut niveau">
          <Bullets items={charter.requirements} empty="Aucune exigence définie." />
        </Panel>
      </div>

      <Panel title="Risque global du projet">
        <p className="charter__risk-level">
          {charter.overallRiskLevel ? (
            <span className={`status-badge status-badge--${OVERALL_RISK_MODIFIERS[charter.overallRiskLevel]}`}>
              {OVERALL_RISK_LABELS[charter.overallRiskLevel]}
            </span>
          ) : (
            <span className="status-badge status-badge--grey">À évaluer</span>
          )}
          Principaux domaines de risque :
        </p>
        <Bullets items={charter.highLevelRisks} empty="Aucun domaine de risque identifié à ce stade." />
      </Panel>

      <Panel title="Objectifs et critères de succès">
        {charter.objectives.length === 0 ? (
          <p className="plan__empty">Aucun objectif défini.</p>
        ) : (
          <div className="wbs-scroll">
            <table className="register-table charter__objectives-table">
              <thead>
                <tr>
                  <th>Rubrique</th>
                  <th>Objectif</th>
                  <th>Critère de succès</th>
                </tr>
              </thead>
              <tbody>
                {charter.objectives.map((item, index) => (
                  <tr key={index}>
                    <td className="register-table__code">{OBJECTIVE_CATEGORY_LABELS[item.category]}</td>
                    <td className="register-table__title">{item.objective}</td>
                    <td className="register-table__response">{item.successCriterion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="doc-columns">
        <Panel title="Jalons sommaires">
          {charter.milestones.length === 0 ? (
            <p className="plan__empty">Aucun jalon défini.</p>
          ) : (
            <ol className="charter__timeline">
              {charter.milestones.map((milestone, index) => (
                <li key={index}>
                  <time dateTime={milestone.targetDate}>{formatShortDate(milestone.targetDate)}</time>
                  {milestone.name}
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel title="Ressources financières pré-approuvées">
          <p className="charter__amount">{formatMillions(charter.budget)}</p>
          <p className="doc-text">{charter.fundingSource ?? 'Source de financement non précisée.'}</p>
        </Panel>
      </div>

      <Panel title="Parties prenantes" live>
        {references.stakeholders.length === 0 ? (
          <p className="plan__empty">Aucune partie prenante identifiée.</p>
        ) : (
          <ul className="doc-refs doc-refs--two-columns">
            {references.stakeholders.map((stakeholder) => (
              <li key={stakeholder.code}>
                <strong>{stakeholder.name}</strong>
                <span>{stakeholder.role}</span>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="ref-link" onClick={() => onNavigate('stakeholders')}>
          Registre des parties prenantes →
        </button>
      </Panel>

      <Panel title="Hypothèses et contraintes" live>
        <AssumptionReferences
          constraints={references.constraints}
          assumptions={references.assumptions}
          onOpen={() => onNavigate('assumptions')}
        />
      </Panel>

      <Panel title="Critères de clôture du projet">
        <p className="doc-text">{charter.exitCriteria || '—'}</p>
      </Panel>

      <Panel title="Autorités">
        <table className="charter__authority">
          <tbody>
            {AUTHORITY_KEYS.map((key) => (
              <tr key={key}>
                <th scope="row">
                  {AUTHORITY_LABELS[key]}
                  <span>Chef de projet</span>
                </th>
                <td>{charter.projectManager.authority[key] || '—'}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">
                Autorité du sponsor
                <span>Sponsor</span>
              </th>
              <td>{charter.sponsor.authority || '—'}</td>
            </tr>
          </tbody>
        </table>
      </Panel>

      <Panel title="Approbations">
        <div className="charter__signatures">
          <Signature role="Chef de projet" name={<PersonName id={charter.projectManager.resourceId} />} signedAt={signatures.submitted?.at ?? null} />
          <Signature role="Sponsor" name={signatures.approver?.name ?? <PersonName id={charter.sponsor.resourceId} />} signedAt={signatures.approver?.at ?? null} />
        </div>
      </Panel>
    </article>
  );
}
