import { useEffect, useState } from 'react';
import { assumptionLogApi } from '@/api/project-documents';
import { useAuth } from '@/auth/AuthContext';
import { AssumptionSummary } from '@/components/assumptions/AssumptionSummary';
import { AssumptionTable } from '@/components/assumptions/AssumptionTable';
import { AssumptionLogEditor } from '@/components/assumptions/editor/AssumptionLogEditor';
import { entryTarget, type RegisterEditing } from '@/components/form/EntryFocus';
import { PageActions } from '@/components/header/PageActions';
import { useVersionRestore } from '@/components/history/VersionHistory';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { useAssumptionLog } from '@/hooks/useProjectDocuments';

interface AssumptionFeatureProps {
  projectId: string;
  onOpenRiskRegister: () => void;
}

/** Page « Hypothèses et contraintes » : synthèse, hypothèses à valider, contraintes en vigueur. */
export function AssumptionFeature({ projectId, onOpenRiskRegister }: AssumptionFeatureProps) {
  const { data, loading, error, reload } = useAssumptionLog(projectId);
  const { canEdit } = useAuth();
  const [editing, setEditing] = useState<RegisterEditing>(null);

  useEffect(() => setEditing(null), [projectId]);
  const restoring = useVersionRestore(projectId, assumptionLogApi, {
    canRestore: canEdit,
    edit: () => setEditing('register'),
  });
  const editEntry = canEdit ? (key: string) => setEditing({ key }) : undefined;

  if (editing && data) {
    return (
      <>
        {restoring.notice}
        <AssumptionLogEditor
          projectId={projectId}
          target={entryTarget(editing)}
          initialInput={structuredClone({ entries: (restoring.restored ?? data).entries })}
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

  const count = (kind: 'ASSUMPTION' | 'CONSTRAINT') => data?.entries.filter((entry) => entry.kind === kind).length ?? 0;

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
                + Ajouter une hypothèse ou une contrainte
              </button>
            </>
          )
        )}
      </PageActions>

      {loading && <p className="app__status">Chargement du registre…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && (
        <article className="doc-page">
          <AssumptionSummary entries={data.entries} />
          <section className="doc-panel">
            <h2 className="plan__section-title">Hypothèses ({count('ASSUMPTION')})</h2>
            <AssumptionTable entries={data.entries} kind="ASSUMPTION" onOpenRiskRegister={onOpenRiskRegister} onEdit={editEntry} />
          </section>
          <section className="doc-panel">
            <h2 className="plan__section-title">Contraintes ({count('CONSTRAINT')})</h2>
            <AssumptionTable entries={data.entries} kind="CONSTRAINT" onOpenRiskRegister={onOpenRiskRegister} onEdit={editEntry} />
          </section>
        </article>
      )}
    </>
  );
}
