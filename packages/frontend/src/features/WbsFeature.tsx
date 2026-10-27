import { useEffect, useState } from 'react';
import type { ProjectPlanDto } from '@shared/index';
import { planHistoryApi } from '@/api/plan-client';
import { useAuth } from '@/auth/AuthContext';
import { DocumentApprovalBar } from '@/components/approval/DocumentApprovalBar';
import { PageActions } from '@/components/header/PageActions';
import { useVersionRestore } from '@/components/history/VersionHistory';
import { PlanHeader } from '@/components/plan/PlanHeader';
import { WbsTable } from '@/components/plan/WbsTable';
import { PlanEditor } from '@/components/plan/editor/PlanEditor';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { useDocumentApproval } from '@/hooks/useDocumentApproval';
import { useProjectPlan } from '@/hooks/useProjectPlan';
import { blankPlanInput, planDtoToInput } from '@/lib/plan-input';

type Mode = 'view' | 'edit' | 'create';

/**
 * Page « Structure (WBS) » : tableau de découpage + édition du plan. La WBS est une référence de
 * base, validée avec le plan de management : figée, elle garde ses affectations modifiables.
 */
export function WbsFeature({ projectId }: { projectId: string }) {
  const current = useProjectPlan(projectId);
  const { reload } = current;
  const [mode, setMode] = useState<Mode>('view');
  const { canEdit } = useAuth();
  const validation = useDocumentApproval(projectId, 'PROJECT_MANAGEMENT_PLAN');
  const { locked, viewingApproved, reference } = validation;
  const { data, loading, error } = viewingApproved
    ? { ...reference, data: (reference.data?.documents.plan as ProjectPlanDto | undefined) ?? null }
    : current;

  useEffect(() => setMode('view'), [projectId]);
  const restoring = useVersionRestore(projectId, planHistoryApi, {
    canRestore: canEdit && !locked && !viewingApproved,
    edit: () => setMode('edit'),
  });
  const close = () => {
    setMode('view');
    restoring.clear();
  };

  if (mode === 'edit' && data) {
    return (
      <>
        {restoring.notice}
        <PlanEditor
          mode="edit"
          projectId={projectId}
          initialInput={planDtoToInput(restoring.restored ?? data)}
          onCancel={close}
          onSaved={() => {
            close();
            reload();
          }}
        />
      </>
    );
  }

  if (mode === 'create') {
    return (
      <PlanEditor
        mode="create"
        projectId={projectId}
        initialInput={blankPlanInput()}
        onCancel={() => setMode('view')}
        onSaved={() => {
          setMode('view');
          reload();
        }}
      />
    );
  }

  return (
    <>
      <PageActions>
        {data && restoring.history}
        {!canEdit ? (
          <ReadOnlyBadge />
        ) : viewingApproved ? null : data ? (
          <button type="button" className="btn btn--primary" onClick={() => setMode('edit')}>
            {locked ? 'Modifier les affectations' : 'Éditer le plan'}
          </button>
        ) : (
          !loading &&
          !locked && (
            <button type="button" className="btn btn--primary" onClick={() => setMode('create')}>
              + Créer un plan
            </button>
          )
        )}
      </PageActions>

      <DocumentApprovalBar projectId={projectId} approval={validation} component />
      {loading && <p className="app__status">Chargement du plan…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && (
        <article className="plan">
          <PlanHeader plan={data} />
          <section className="plan__section">
            <h2 className="plan__section-title">Structure de découpage du projet (WBS)</h2>
            <WbsTable tasks={data.tasks} />
          </section>
        </article>
      )}
    </>
  );
}
