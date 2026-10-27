import { useEffect, useState } from 'react';
import { stakeholderRegisterApi } from '@/api/project-documents';
import { useAuth } from '@/auth/AuthContext';
import { entryTarget, type RegisterEditing } from '@/components/form/EntryFocus';
import { PageActions } from '@/components/header/PageActions';
import { useVersionRestore } from '@/components/history/VersionHistory';
import { EngagementMatrix } from '@/components/stakeholders/EngagementMatrix';
import { PowerInterestGrid } from '@/components/stakeholders/PowerInterestGrid';
import { StakeholderSummary } from '@/components/stakeholders/StakeholderSummary';
import { StakeholderTable } from '@/components/stakeholders/StakeholderTable';
import { StakeholderRegisterEditor } from '@/components/stakeholders/editor/StakeholderRegisterEditor';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { Tabs } from '@/components/ui/Tabs';
import { useStakeholderRegister } from '@/hooks/useProjectDocuments';
import { stakeholderRegisterDtoToInput } from '@/lib/stakeholder-input';

type Tab = 'register' | 'engagement' | 'grid';

/** Page « Registre des parties prenantes » : synthèse, puis registre, engagement et grille pouvoir / intérêt en onglets. */
export function StakeholderFeature({ projectId }: { projectId: string }) {
  const { data, loading, error, reload } = useStakeholderRegister(projectId);
  const { canEdit } = useAuth();
  const [editing, setEditing] = useState<RegisterEditing>(null);
  const [tab, setTab] = useState<Tab>('register');

  useEffect(() => setEditing(null), [projectId]);
  const restoring = useVersionRestore(projectId, stakeholderRegisterApi, {
    canRestore: canEdit,
    edit: () => setEditing('register'),
  });
  const editEntry = canEdit ? (key: string) => setEditing({ key }) : undefined;

  if (editing && data) {
    return (
      <>
        {restoring.notice}
        <StakeholderRegisterEditor
          projectId={projectId}
          target={entryTarget(editing)}
          initialInput={stakeholderRegisterDtoToInput(restoring.restored ?? data)}
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
              {data.stakeholders.length > 0 && (
                <button type="button" className="btn btn--ghost" onClick={() => setEditing('register')}>
                  Éditer le registre
                </button>
              )}
              <button type="button" className="btn btn--primary" onClick={() => setEditing({ key: null })}>
                + Identifier une partie prenante
              </button>
            </>
          )
        )}
      </PageActions>

      {loading && <p className="app__status">Chargement du registre…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && (
        <article className="doc-page">
          <StakeholderSummary stakeholders={data.stakeholders} />
          <Tabs
            label="Registre des parties prenantes"
            active={tab}
            onChange={setTab}
            tabs={[
              { id: 'register', label: 'Registre', count: data.stakeholders.length },
              { id: 'engagement', label: "Évaluation de l'engagement" },
              { id: 'grid', label: 'Pouvoir / intérêt' },
            ]}
          >
            <section className="doc-panel">
              {tab === 'register' && <StakeholderTable stakeholders={data.stakeholders} onEdit={editEntry} />}
              {tab !== 'register' && data.stakeholders.length === 0 && (
                <p className="plan__empty">Aucune partie prenante identifiée pour ce projet.</p>
              )}
              {tab === 'engagement' && data.stakeholders.length > 0 && <EngagementMatrix stakeholders={data.stakeholders} />}
              {tab === 'grid' && data.stakeholders.length > 0 && <PowerInterestGrid stakeholders={data.stakeholders} />}
            </section>
          </Tabs>
        </article>
      )}
    </>
  );
}
