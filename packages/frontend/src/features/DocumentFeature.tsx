import { useEffect, useState, type ReactNode } from 'react';
import type { ApprovalDto, ApprovalSubject } from '@shared/index';
import type { DocumentHistoryApi } from '@/api/project-documents';
import { useAuth } from '@/auth/AuthContext';
import { DocumentApprovalBar } from '@/components/approval/DocumentApprovalBar';
import { PageActions } from '@/components/header/PageActions';
import { RestoredNotice, VersionHistory } from '@/components/history/VersionHistory';
import { DeleteAction } from '@/components/ui/DeleteAction';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { useDocumentApproval } from '@/hooks/useDocumentApproval';
import type { ProjectResource } from '@/hooks/useProjectResource';

type Mode = 'view' | 'edit' | 'create';

export interface DocumentEditorProps<Input> {
  mode: 'edit' | 'create';
  initialInput: Input;
  onCancel: () => void;
  onSaved: () => void;
}

/** Ce que la vue sait de la validation : état du document, et s'il s'agit de la version approuvée archivée. */
export interface DocumentViewContext {
  approval: ApprovalDto | null;
  archived: boolean;
}

/** Document soumis au circuit de validation : seul ou avec le plan de management (composant). */
export interface DocumentApproval {
  subject: ApprovalSubject;
  /** Segment d'API du document dans la version approuvée archivée. */
  segment: string;
  component?: boolean;
  /** Suivi encore saisissable une fois la version figée (ex. jalons atteints) : libellé du bouton. */
  trackedWhenLocked?: string;
}

interface DocumentFeatureProps<Dto, Input> {
  projectId: string;
  /** Document du projet ; `data` vaut `null` tant qu'il n'a pas été rédigé. */
  resource: ProjectResource<Dto | null>;
  toInput: (dto: Dto) => Input;
  blank: () => Input;
  labels: { edit: string; create: string; loading: string; emptyTitle: string; emptyText: string };
  renderView: (dto: Dto, context: DocumentViewContext) => ReactNode;
  renderEditor: (props: DocumentEditorProps<Input>) => ReactNode;
  /** Suppression du document entier ; `message` remplace les conséquences par défaut. */
  deletion?: { title: string; message?: ReactNode; run: () => Promise<void> };
  approval?: DocumentApproval;
  /** Historique des versions (consultable par tous, restaurable par les rédacteurs). */
  history?: DocumentHistoryApi<Dto>;
}

/**
 * Page d'un document rédigé (business case, plan des bénéfices, matrice RACI…) :
 * consultation, état vide, création, édition et suppression selon le rôle. Un document validé
 * est figé tant que sa version est soumise ou approuvée ; sa version de référence reste
 * consultable pendant qu'on prépare la suivante. Une version passée se restaure par l'éditeur.
 */
export function DocumentFeature<Dto, Input>({
  projectId,
  resource,
  toInput,
  blank,
  labels,
  renderView,
  renderEditor,
  deletion,
  approval,
  history,
}: DocumentFeatureProps<Dto, Input>) {
  const { data, loading, error, reload } = resource;
  const { canEdit } = useAuth();
  const [mode, setMode] = useState<Mode>('view');
  // Version passée reprise dans l'éditeur (restauration en cours).
  const [restored, setRestored] = useState<{ dto: Dto; version: number } | null>(null);
  const validation = useDocumentApproval(projectId, approval?.subject);
  const { state, locked, viewingApproved, reference } = validation;

  useEffect(() => {
    setMode('view');
    setRestored(null);
  }, [projectId]);

  const close = () => {
    setMode('view');
    setRestored(null);
  };
  const saved = () => {
    close();
    reload();
  };
  const withRestored = (editor: ReactNode) =>
    restored ? (
      <>
        <RestoredNotice version={restored.version} />
        {editor}
      </>
    ) : (
      editor
    );

  if (mode === 'edit' && data) {
    const initialInput = toInput(restored?.dto ?? data);
    return withRestored(renderEditor({ mode: 'edit', initialInput, onCancel: close, onSaved: saved }));
  }
  if (mode === 'create') {
    const initialInput = restored ? toInput(restored.dto) : blank();
    return withRestored(renderEditor({ mode: 'create', initialInput, onCancel: close, onSaved: saved }));
  }

  const missing = !loading && !error && data === null;
  const editable = canEdit && !locked && !viewingApproved;
  const tracked = canEdit && locked && !viewingApproved && approval?.trackedWhenLocked;
  const archived = viewingApproved ? (reference.data?.documents[approval!.segment] as Dto | undefined) : undefined;
  const restore = (dto: Dto, version: number) => {
    setRestored({ dto, version });
    setMode(data ? 'edit' : 'create');
  };

  return (
    <>
      <PageActions>
        {history && !loading && !viewingApproved && (data || editable) && (
          <VersionHistory projectId={projectId} api={history} canRestore={editable} onRestore={restore} />
        )}
        {!canEdit ? (
          <ReadOnlyBadge />
        ) : tracked && data ? (
          <button type="button" className="btn btn--primary" onClick={() => setMode('edit')}>
            {approval!.trackedWhenLocked}
          </button>
        ) : !editable ? null : data ? (
          <>
            {deletion && (
              <DeleteAction
                title={deletion.title}
                message={
                  deletion.message ??
                  'Le document et tout son contenu seront supprimés définitivement, pour tous les utilisateurs du projet.'
                }
                onDelete={async () => {
                  await deletion.run();
                  reload();
                }}
              />
            )}
            <button type="button" className="btn btn--primary" onClick={() => setMode('edit')}>
              {labels.edit}
            </button>
          </>
        ) : (
          missing && (
            <button type="button" className="btn btn--primary" onClick={() => setMode('create')}>
              {labels.create}
            </button>
          )
        )}
      </PageActions>

      {approval && <DocumentApprovalBar projectId={projectId} approval={validation} component={approval.component} />}
      {viewingApproved ? (
        <>
          {reference.loading && <p className="app__status">Chargement de la version approuvée…</p>}
          {reference.error && <p className="app__status app__status--error">{reference.error}</p>}
          {reference.data &&
            (archived ? (
              renderView(archived, { approval: state, archived: true })
            ) : (
              <p className="app__status">Ce document n'existait pas encore dans la version approuvée.</p>
            ))}
        </>
      ) : (
        <>
          {loading && <p className="app__status">{labels.loading}</p>}
          {error && <p className="app__status app__status--error">{error}</p>}
          {missing && (
            <div className="doc-page">
              <section className="doc-panel empty-state">
                <h2 className="empty-state__title">{labels.emptyTitle}</h2>
                <p className="empty-state__text">{labels.emptyText}</p>
              </section>
            </div>
          )}
          {data && renderView(data, { approval: state, archived: false })}
        </>
      )}
    </>
  );
}
