import { useEffect, useState } from 'react';
import type { WbsDictionaryDto } from '@shared/index';
import { wbsDictionaryApi } from '@/api/project-documents';
import { useAuth } from '@/auth/AuthContext';
import { DocumentApprovalBar } from '@/components/approval/DocumentApprovalBar';
import { entryTarget, type RegisterEditing } from '@/components/form/EntryFocus';
import { PageActions } from '@/components/header/PageActions';
import { useVersionRestore } from '@/components/history/VersionHistory';
import { WbsDictionaryEditor } from '@/components/schedule/WbsDictionaryEditor';
import { WbsDictionaryView } from '@/components/schedule/WbsDictionaryView';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { useDocumentApproval } from '@/hooks/useDocumentApproval';
import { useWbsDictionary } from '@/hooks/useProjectDocuments';
import { wbsDictionaryDtoToInput } from '@/lib/schedule-format';

/** Page « Dictionnaire de la WBS » : fiche détaillée des éléments de la structure (validée avec le plan de management). */
export function WbsDictionaryFeature({ projectId }: { projectId: string }) {
  const current = useWbsDictionary(projectId);
  const { reload } = current;
  const { canEdit } = useAuth();
  const [editing, setEditing] = useState<RegisterEditing>(null);
  const validation = useDocumentApproval(projectId, 'PROJECT_MANAGEMENT_PLAN');
  const { locked, viewingApproved, reference } = validation;
  const { data, loading, error } = viewingApproved
    ? { ...reference, data: (reference.data?.documents['wbs-dictionary'] as WbsDictionaryDto | undefined) ?? null }
    : current;

  useEffect(() => setEditing(null), [projectId]);
  const restoring = useVersionRestore(projectId, wbsDictionaryApi, {
    canRestore: canEdit && !locked && !viewingApproved,
    edit: () => setEditing('register'),
  });
  const editEntry = canEdit && !locked && !viewingApproved ? (key: string) => setEditing({ key }) : undefined;

  if (editing && data) {
    return (
      <>
        {restoring.notice}
        <WbsDictionaryEditor
          projectId={projectId}
          target={entryTarget(editing)}
          initialInput={wbsDictionaryDtoToInput(restoring.restored ?? data)}
          onCancel={() => {
            setEditing(null);
            restoring.clear();
          }}
          onSaved={() => {
            setEditing(null);
            restoring.clear();
            reload();
          }}
        />
      </>
    );
  }

  return (
    <>
      <PageActions>
        {data && restoring.history}
        {!canEdit ? (
          <ReadOnlyBadge />
        ) : (
          data &&
          !locked &&
          !viewingApproved && (
            <>
              {data.entries.length > 0 && (
                <button type="button" className="btn btn--ghost" onClick={() => setEditing('register')}>
                  Éditer le dictionnaire
                </button>
              )}
              <button type="button" className="btn btn--primary" onClick={() => setEditing({ key: null })}>
                + Rédiger une fiche
              </button>
            </>
          )
        )}
      </PageActions>

      <DocumentApprovalBar projectId={projectId} approval={validation} component />
      {loading && <p className="app__status">Chargement du dictionnaire de la WBS…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && (
        <article className="doc-page">
          <SummaryTiles
            tiles={[
              { label: 'Fiches', value: data.entries.length },
              { label: 'Jalons', value: data.entries.reduce((total, entry) => total + entry.milestones.length, 0) },
              { label: 'Fiches chiffrées', value: data.entries.filter((entry) => entry.costLines.length > 0).length },
            ]}
          />
          <WbsDictionaryView dictionary={data} onEdit={editEntry} />
        </article>
      )}
    </>
  );
}
