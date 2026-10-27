import { useEffect, useState } from 'react';
import { riskRegisterApi } from '@/api/project-documents';
import { useAuth } from '@/auth/AuthContext';
import { entryTarget, type RegisterEditing } from '@/components/form/EntryFocus';
import { PageActions } from '@/components/header/PageActions';
import { useVersionRestore } from '@/components/history/VersionHistory';
import { RiskMatrix } from '@/components/risks/RiskMatrix';
import { RiskSummary } from '@/components/risks/RiskSummary';
import { RiskAnalysisTable, RiskResponseTable } from '@/components/risks/RiskTable';
import { RiskRegisterEditor } from '@/components/risks/editor/RiskRegisterEditor';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { Tabs } from '@/components/ui/Tabs';
import { useRiskRegister } from '@/hooks/useProjectDocuments';
import { riskRegisterDtoToInput } from '@/lib/risk-input';

type Tab = 'analysis' | 'responses' | 'matrix';

/** Page « Registre des risques » : synthèse, puis identification et analyse, réponses et suivi, matrice P × I. */
export function RiskFeature({ projectId }: { projectId: string }) {
  const { data, loading, error, reload } = useRiskRegister(projectId);
  const { canEdit } = useAuth();
  const [editing, setEditing] = useState<RegisterEditing>(null);
  const [tab, setTab] = useState<Tab>('analysis');

  useEffect(() => setEditing(null), [projectId]);
  const restoring = useVersionRestore(projectId, riskRegisterApi, {
    canRestore: canEdit,
    edit: () => setEditing('register'),
  });
  const editEntry = canEdit ? (key: string) => setEditing({ key }) : undefined;

  if (editing && data) {
    return (
      <>
        {restoring.notice}
        <RiskRegisterEditor
          projectId={projectId}
          target={entryTarget(editing)}
          initialInput={riskRegisterDtoToInput(restoring.restored ?? data)}
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
              {data.risks.length > 0 && (
                <button type="button" className="btn btn--ghost" onClick={() => setEditing('register')}>
                  Éditer le registre
                </button>
              )}
              <button type="button" className="btn btn--primary" onClick={() => setEditing({ key: null })}>
                + Identifier un risque
              </button>
            </>
          )
        )}
      </PageActions>

      {loading && <p className="app__status">Chargement du registre…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && (
        <article className="doc-page">
          <RiskSummary risks={data.risks} />
          <Tabs
            label="Registre des risques"
            active={tab}
            onChange={setTab}
            tabs={[
              { id: 'analysis', label: 'Identification et analyse', count: data.risks.length },
              { id: 'responses', label: 'Réponses et suivi' },
              { id: 'matrix', label: 'Matrice probabilité × impact' },
            ]}
          >
            <section className="doc-panel">
              {tab === 'analysis' && <RiskAnalysisTable risks={data.risks} onEdit={editEntry} />}
              {tab === 'responses' && <RiskResponseTable risks={data.risks} onEdit={editEntry} />}
              {tab === 'matrix' && <RiskMatrix risks={data.risks} />}
            </section>
          </Tabs>
        </article>
      )}
    </>
  );
}
