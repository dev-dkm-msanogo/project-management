import { useEffect, useState } from 'react';
import type { RequirementsRegisterDto } from '@shared/index';
import { requirementsApi } from '@/api/project-documents';
import { useAuth } from '@/auth/AuthContext';
import { DocumentApprovalBar } from '@/components/approval/DocumentApprovalBar';
import { entryTarget, type RegisterEditing } from '@/components/form/EntryFocus';
import { PageActions } from '@/components/header/PageActions';
import { useVersionRestore } from '@/components/history/VersionHistory';
import { NeedsCoverage } from '@/components/requirements/NeedsCoverage';
import { RequirementsDocumentation } from '@/components/requirements/RequirementsDocumentation';
import { TraceabilityMatrix } from '@/components/requirements/TraceabilityMatrix';
import { RequirementsRegisterEditor } from '@/components/requirements/editor/RequirementsRegisterEditor';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { Tabs } from '@/components/ui/Tabs';
import { useDocumentApproval } from '@/hooks/useDocumentApproval';
import { useRequirementsRegister } from '@/hooks/useProjectDocuments';
import { byCategoryThenCode, requirementsDtoToInput } from '@/lib/requirements-format';

type RequirementsTab = 'documentation' | 'traceability' | 'coverage';

/**
 * Page « Exigences et traçabilité » : indicateurs, puis documentation des exigences,
 * matrice de traçabilité et couverture des besoins (templates PMI), en onglets. Une fois le
 * registre soumis ou approuvé, seuls l'avancement et la recette de chaque exigence évoluent.
 */
export function RequirementsFeature({ projectId }: { projectId: string }) {
  const current = useRequirementsRegister(projectId);
  const { reload } = current;
  const { canEdit } = useAuth();
  const [editing, setEditing] = useState<RegisterEditing>(null);
  const [tab, setTab] = useState<RequirementsTab>('documentation');
  const validation = useDocumentApproval(projectId, 'REQUIREMENTS');
  const { locked, viewingApproved, reference } = validation;
  // Version approuvée consultée, ou registre en cours.
  const { data, loading, error } = viewingApproved
    ? { ...reference, data: (reference.data?.documents.requirements as RequirementsRegisterDto | undefined) ?? null }
    : current;

  useEffect(() => setEditing(null), [projectId]);
  const restoring = useVersionRestore(projectId, requirementsApi, {
    canRestore: canEdit && !locked && !viewingApproved,
    edit: () => setEditing('register'),
  });
  // Registre figé : chaque exigence reste modifiable pour son avancement (le serveur fige le reste).
  const editEntry = canEdit && !viewingApproved ? (key: string) => setEditing({ key }) : undefined;

  if (editing && data) {
    return (
      <>
        {restoring.notice}
        <RequirementsRegisterEditor
          projectId={projectId}
          target={entryTarget(editing)}
          initialInput={requirementsDtoToInput(restoring.restored ?? data)}
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

  const requirements = [...(data?.requirements ?? [])].sort(byCategoryThenCode);

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
              {requirements.length > 0 && (
                <button type="button" className="btn btn--ghost" onClick={() => setEditing('register')}>
                  Éditer le registre
                </button>
              )}
              <button type="button" className="btn btn--primary" onClick={() => setEditing({ key: null })}>
                + Ajouter une exigence
              </button>
            </>
          )
        )}
      </PageActions>

      <DocumentApprovalBar projectId={projectId} approval={validation} />
      {loading && <p className="app__status">Chargement des exigences…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && (
        <article className="doc-page">
          <SummaryTiles
            tiles={[
              { label: 'Exigences actives', value: data.metrics.active },
              { label: 'Indispensables (Must)', value: data.metrics.must },
              { label: 'Vérifiées', value: data.metrics.verified, tone: 'success' },
              { label: 'Besoins non couverts', value: data.metrics.uncoveredNeeds.length, tone: 'danger' },
              { label: 'Sans méthode de vérification', value: data.metrics.unverifiable.length, tone: 'warning' },
            ]}
          />
          {requirements.length === 0 ? (
            <section className="doc-panel empty-state">
              <h2 className="empty-state__title">Aucune exigence enregistrée</h2>
              <p className="empty-state__text">
                Recueillez les besoins métier et des parties prenantes, puis les exigences de solution qui les
                satisfont : chacune est priorisée, vérifiable et reliée à un livrable.
              </p>
            </section>
          ) : (
            <section className="doc-panel">
              <Tabs
                label="Vues du registre des exigences"
                active={tab}
                onChange={setTab}
                tabs={[
                  { id: 'documentation', label: 'Documentation', count: requirements.length },
                  { id: 'traceability', label: 'Matrice de traçabilité' },
                  { id: 'coverage', label: 'Couverture des besoins' },
                ]}
              >
                {tab === 'documentation' && <RequirementsDocumentation requirements={requirements} onEdit={editEntry} />}
                {tab === 'traceability' && <TraceabilityMatrix requirements={requirements} />}
                {tab === 'coverage' && <NeedsCoverage requirements={requirements} />}
              </Tabs>
            </section>
          )}
        </article>
      )}
    </>
  );
}
