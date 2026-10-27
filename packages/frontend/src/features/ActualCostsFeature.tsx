import { useEffect, useState } from 'react';
import { actualCostsApi } from '@/api/project-documents';
import { useAuth } from '@/auth/AuthContext';
import { entryTarget, type RegisterEditing } from '@/components/form/EntryFocus';
import { PageActions } from '@/components/header/PageActions';
import { useVersionRestore } from '@/components/history/VersionHistory';
import { ActualCostsEditor } from '@/components/performance/ActualCostsEditor';
import { ActualCostsView } from '@/components/performance/ActualCostsView';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { useActualCosts } from '@/hooks/useProjectDocuments';
import { actualCostsDtoToInput } from '@/lib/performance-format';

/** Page « Dépenses réelles » : ce que le projet a réellement coûté, imputé à la WBS ; source du coût réel (AC). */
export function ActualCostsFeature({ projectId }: { projectId: string }) {
  const { data, loading, error, reload } = useActualCosts(projectId);
  const { canEdit } = useAuth();
  const [editing, setEditing] = useState<RegisterEditing>(null);

  useEffect(() => setEditing(null), [projectId]);
  const restoring = useVersionRestore(projectId, actualCostsApi, {
    canRestore: canEdit,
    edit: () => setEditing('register'),
  });
  const editEntry = canEdit ? (key: string) => setEditing({ key }) : undefined;

  if (editing && data) {
    return (
      <>
        {restoring.notice}
        <ActualCostsEditor
          projectId={projectId}
          target={entryTarget(editing)}
          initialInput={actualCostsDtoToInput(restoring.restored ?? data)}
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
          data && (
            <>
              {data.entries.length > 0 && (
                <button type="button" className="btn btn--ghost" onClick={() => setEditing('register')}>
                  Éditer le registre
                </button>
              )}
              <button type="button" className="btn btn--primary" onClick={() => setEditing({ key: null })}>
                + Nouvelle dépense
              </button>
            </>
          )
        )}
      </PageActions>

      {loading && <p className="app__status">Chargement des dépenses…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && (
        <article className="doc-page">
          <ActualCostsView costs={data} onEdit={editEntry} />
        </article>
      )}
    </>
  );
}
