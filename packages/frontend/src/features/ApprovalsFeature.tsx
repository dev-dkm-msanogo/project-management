import { useState } from 'react';
import type { PendingApprovalDto } from '@shared/index';
import { useAuth } from '@/auth/AuthContext';
import { ApproversDialog } from '@/components/approval/ApproversDialog';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { useApprovals, useMyApprovals } from '@/hooks/useApprovals';
import {
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_MODIFIERS,
  PENDING_KIND_LABELS,
  SUBJECT_LABELS,
  SUBJECT_SCOPES,
  SUBJECT_VIEWS,
  approvalDate,
} from '@/lib/approval-format';
import type { AppView } from '@/navigation/pmp';

interface ApprovalsFeatureProps {
  projectId: string;
  projectName: string;
  /** Ouvre une page d'un projet (bascule sur ce projet si besoin). */
  onOpen: (projectId: string, view: AppView) => void;
}

const viewOf = (item: PendingApprovalDto): AppView =>
  item.kind === 'DOCUMENT' && item.subject
    ? SUBJECT_VIEWS[item.subject]
    : item.kind === 'CHANGE_REQUEST'
      ? 'change-log'
      : 'source-selection';

/**
 * « Validations » : ce qui attend votre décision dans les projets dont vous êtes valideur, puis le
 * circuit du projet courant (état de chaque document validé) et ses valideurs.
 */
export function ApprovalsFeature({ projectId, projectName, onOpen }: ApprovalsFeatureProps) {
  const { canAdminister } = useAuth();
  const pending = useMyApprovals();
  const project = useApprovals(projectId);
  const [editingApprovers, setEditingApprovers] = useState(false);
  const items = pending.data ?? [];
  const subjects = project.data?.subjects ?? [];

  return (
    <article className="doc-page">
      <SummaryTiles
        tiles={[
          { label: 'À décider', value: items.length, tone: items.length > 0 ? 'warning' : undefined },
          { label: 'Documents approuvés', value: subjects.filter((item) => item.status === 'APPROVED').length, tone: 'success' },
          { label: 'En validation', value: subjects.filter((item) => item.status === 'SUBMITTED').length },
          { label: 'En préparation', value: subjects.filter((item) => item.status === 'DRAFT').length },
        ]}
      />

      <section className="doc-panel">
        <h2 className="plan__section-title">À décider</h2>
        {pending.loading && <p className="app__status">Chargement…</p>}
        {pending.error && <p className="app__status app__status--error">{pending.error}</p>}
        {pending.data && items.length === 0 && (
          <p className="plan__empty">Rien n'attend votre décision dans les projets dont vous êtes valideur.</p>
        )}
        {items.length > 0 && (
          <div className="wbs-scroll">
            <table className="register-table">
              <thead>
                <tr>
                  <th>Projet</th>
                  <th>Élément</th>
                  <th>Objet</th>
                  <th>Soumis</th>
                  <th>
                    <span className="visually-hidden">Ouvrir</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={`${item.projectId}|${item.kind}|${item.reference}`}>
                    <td>{item.projectName}</td>
                    <td>
                      <span className="register-table__muted-cell">{PENDING_KIND_LABELS[item.kind]}</span>
                      <br />
                      {item.reference}
                    </td>
                    <td>{item.title}</td>
                    <td className="register-table__muted-cell">
                      {item.submittedAt ? approvalDate(item.submittedAt) : '—'}
                      {item.submittedBy && <br />}
                      {item.submittedBy}
                    </td>
                    <td>
                      <button type="button" className="btn btn--ghost btn--small" onClick={() => onOpen(item.projectId, viewOf(item))}>
                        Ouvrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="doc-panel">
        <div className="doc-panel-head">
          <h2 className="plan__section-title">Documents validés · {projectName}</h2>
        </div>
        {project.loading && <p className="app__status">Chargement…</p>}
        {project.error && <p className="app__status app__status--error">{project.error}</p>}
        {subjects.length > 0 && (
          <div className="wbs-scroll">
            <table className="register-table approval-circuit">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>État</th>
                  <th>Version de référence</th>
                  <th>
                    <span className="visually-hidden">Ouvrir</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((item) => (
                  <tr key={item.subject}>
                    <td>
                      <strong>{SUBJECT_LABELS[item.subject]}</strong>
                      <br />
                      <span className="approval-circuit__note">{SUBJECT_SCOPES[item.subject]}</span>
                    </td>
                    <td>
                      <span className={`status-badge status-badge--${APPROVAL_STATUS_MODIFIERS[item.status]}`}>
                        {APPROVAL_STATUS_LABELS[item.status]}
                      </span>
                      <br />
                      <span className="approval-circuit__note">Version {item.revision}</span>
                    </td>
                    <td className="approval-circuit__note">
                      {item.approved
                        ? `Version ${item.approved.revision}, approuvée le ${approvalDate(item.approved.at)} par ${item.approved.by.name}`
                        : 'Jamais approuvé'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        onClick={() => onOpen(projectId, SUBJECT_VIEWS[item.subject])}
                      >
                        Ouvrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="doc-panel">
        <div className="doc-panel-head">
          <h2 className="plan__section-title">Valideurs · {projectName}</h2>
          {canAdminister && project.data && (
            <button type="button" className="btn btn--ghost btn--small" onClick={() => setEditingApprovers(true)}>
              Modifier les valideurs
            </button>
          )}
        </div>
        {project.data && project.data.approvers.length === 0 && (
          <p className="plan__empty">
            Aucun valideur désigné : aucun document ne peut être soumis.{' '}
            {canAdminister ? 'Désignez-en au moins un.' : 'Un administrateur doit en désigner.'}
          </p>
        )}
        {project.data && project.data.approvers.length > 0 && (
          <ul className="doc-refs">
            {project.data.approvers.map((approver) => (
              <li key={approver.id}>
                <strong>{approver.name}</strong>
                <span>{approver.active ? 'Valideur' : 'Compte désactivé : ne peut plus valider'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editingApprovers && project.data && (
        <ApproversDialog
          open
          projectId={projectId}
          projectName={projectName}
          current={project.data.approvers}
          onSaved={() => {
            setEditingApprovers(false);
            project.reload();
            pending.reload();
          }}
          onClose={() => setEditingApprovers(false)}
        />
      )}
    </article>
  );
}
