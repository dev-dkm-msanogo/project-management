import { useEffect, useState } from 'react';
import { lessonsLearnedApi } from '@/api/project-documents';
import { useAuth } from '@/auth/AuthContext';
import { entryTarget, type RegisterEditing } from '@/components/form/EntryFocus';
import { PageActions } from '@/components/header/PageActions';
import { useVersionRestore } from '@/components/history/VersionHistory';
import { LessonsEditor } from '@/components/lessons/LessonsEditor';
import { LessonsView } from '@/components/lessons/LessonsView';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { useLessonsLearned } from '@/hooks/useProjectDocuments';
import { lessonsLearnedDtoToInput } from '@/lib/lessons-format';

/** Page « Registre des leçons apprises » : leçons du projet et pratiques à ériger en standard. */
export function LessonsLearnedFeature({ projectId }: { projectId: string }) {
  const { data, loading, error, reload } = useLessonsLearned(projectId);
  const { canEdit } = useAuth();
  const [editing, setEditing] = useState<RegisterEditing>(null);

  useEffect(() => setEditing(null), [projectId]);
  const restoring = useVersionRestore(projectId, lessonsLearnedApi, {
    canRestore: canEdit,
    edit: () => setEditing('register'),
  });
  const editEntry = canEdit ? (key: string) => setEditing({ key }) : undefined;

  if (editing && data) {
    return (
      <>
        {restoring.notice}
        <LessonsEditor
          projectId={projectId}
          target={entryTarget(editing)}
          initialInput={lessonsLearnedDtoToInput(restoring.restored ?? data)}
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
              {data.lessons.length > 0 && (
                <button type="button" className="btn btn--ghost" onClick={() => setEditing('register')}>
                  Éditer le registre
                </button>
              )}
              <button type="button" className="btn btn--primary" onClick={() => setEditing({ key: null })}>
                + Ajouter une leçon
              </button>
            </>
          )
        )}
      </PageActions>

      {loading && <p className="app__status">Chargement du registre des leçons apprises…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && (
        <article className="doc-page">
          <SummaryTiles
            tiles={[
              { label: 'Leçons', value: data.summary.total },
              { label: 'Catégories couvertes', value: data.summary.categories },
              { label: 'Pratiques récurrentes', value: data.summary.patterns, tone: 'success' },
            ]}
          />
          <LessonsView register={data} onEdit={editEntry} />
        </article>
      )}
    </>
  );
}
