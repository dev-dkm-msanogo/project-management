import { useEffect, useState } from 'react';
import { issueLogApi } from '@/api/project-documents';
import { useAuth } from '@/auth/AuthContext';
import { entryTarget, type RegisterEditing } from '@/components/form/EntryFocus';
import { PageActions } from '@/components/header/PageActions';
import { useVersionRestore } from '@/components/history/VersionHistory';
import { IssueLogEditor } from '@/components/issues/IssueLogEditor';
import { IssueTable } from '@/components/issues/IssueTable';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { Tabs } from '@/components/ui/Tabs';
import { useIssueLog } from '@/hooks/useProjectDocuments';
import { issueLogDtoToInput } from '@/lib/issue-format';
import type { AppView } from '@/navigation/pmp';

type IssueTab = 'open' | 'resolved';

interface IssueLogFeatureProps {
  projectId: string;
  onNavigate: (view: AppView) => void;
}

/** Page « Journal des problèmes » : problèmes à traiter et problèmes résolus. */
export function IssueLogFeature({ projectId, onNavigate }: IssueLogFeatureProps) {
  const { data, loading, error, reload } = useIssueLog(projectId);
  const { canEdit } = useAuth();
  const [editing, setEditing] = useState<RegisterEditing>(null);
  const [tab, setTab] = useState<IssueTab>('open');

  useEffect(() => setEditing(null), [projectId]);
  const restoring = useVersionRestore(projectId, issueLogApi, {
    canRestore: canEdit,
    edit: () => setEditing('register'),
  });
  const editEntry = canEdit ? (key: string) => setEditing({ key }) : undefined;

  if (editing && data) {
    return (
      <>
        {restoring.notice}
        <IssueLogEditor
          projectId={projectId}
          target={entryTarget(editing)}
          initialInput={issueLogDtoToInput(restoring.restored ?? data)}
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

  const issues = data?.issues ?? [];
  const open = issues.filter((issue) => issue.status !== 'RESOLVED');
  const resolved = issues.filter((issue) => issue.status === 'RESOLVED');
  const summary = data?.summary;

  return (
    <>
      <PageActions>
        {data && restoring.history}
        {!canEdit ? (
          <ReadOnlyBadge />
        ) : (
          data && (
            <>
              {issues.length > 0 && (
                <button type="button" className="btn btn--ghost" onClick={() => setEditing('register')}>
                  Éditer le journal
                </button>
              )}
              <button type="button" className="btn btn--primary" onClick={() => setEditing({ key: null })}>
                + Signaler un problème
              </button>
            </>
          )
        )}
      </PageActions>

      {loading && <p className="app__status">Chargement du journal des problèmes…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && summary && (
        <article className="doc-page">
          <SummaryTiles
            tiles={[
              { label: 'Problèmes à traiter', value: summary.open, tone: 'warning' },
              { label: 'Prioritaires à traiter', value: summary.highPriorityOpen, tone: 'danger' },
              { label: 'Escaladés', value: summary.escalated, tone: 'alert' },
              { label: 'Résolus', value: summary.resolved, tone: 'success' },
            ]}
          />
          <section className="doc-panel">
            {summary.averageResolutionDays !== null && (
              <p className="doc-meta issue-meta">
                Résolution en {new Intl.NumberFormat('fr-FR').format(summary.averageResolutionDays)} jours en moyenne
              </p>
            )}
            <Tabs
              label="Problèmes du journal"
              active={tab}
              onChange={setTab}
              tabs={[
                { id: 'open', label: 'À traiter', count: open.length },
                { id: 'resolved', label: 'Résolus', count: resolved.length },
              ]}
            >
              <IssueTable issues={tab === 'open' ? open : resolved} references={data.references} onNavigate={onNavigate} onEdit={editEntry} />
            </Tabs>
          </section>
        </article>
      )}
    </>
  );
}
