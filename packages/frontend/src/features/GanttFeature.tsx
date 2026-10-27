import { useAuth } from '@/auth/AuthContext';
import { GanttChart } from '@/components/plan/GanttChart';
import { PlanHeader } from '@/components/plan/PlanHeader';
import { ScheduleGantt } from '@/components/plan/ScheduleGantt';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { PageActions } from '@/components/header/PageActions';
import { useDocumentApproval } from '@/hooks/useDocumentApproval';
import { useScheduleModel } from '@/hooks/useProjectDocuments';
import { useProjectPlan } from '@/hooks/useProjectPlan';

/**
 * Page « Diagramme de Gantt » : l'échéancier unifié. Les activités du réseau fixent les dates des lots
 * de la WBS ; un rédacteur les déplace et les étire tant que le plan de management n'est pas figé.
 */
export function GanttFeature({ projectId }: { projectId: string }) {
  const plan = useProjectPlan(projectId);
  const schedule = useScheduleModel(projectId);
  const { canEdit } = useAuth();
  const { locked } = useDocumentApproval(projectId, 'PROJECT_MANAGEMENT_PLAN');
  const reload = () => {
    plan.reload();
    schedule.reload();
  };

  return (
    <>
      {!canEdit && (
        <PageActions>
          <ReadOnlyBadge />
        </PageActions>
      )}
      {(plan.loading || schedule.loading) && <p className="app__status">Chargement de l'échéancier…</p>}
      {plan.error && <p className="app__status app__status--error">{plan.error}</p>}
      {plan.data && !schedule.loading && (
        <article className="plan">
          <PlanHeader plan={plan.data} />
          <section className="plan__section">
            <div className="plan__section-head">
              <h2 className="plan__section-title">Diagramme de Gantt</h2>
              {locked && canEdit && (
                <span className="plan__hint">Échéancier figé par l'approbation du plan de management : révisez-le pour le modifier.</span>
              )}
            </div>
            {schedule.data ? (
              <ScheduleGantt
                projectId={projectId}
                plan={plan.data}
                model={schedule.data}
                editable={canEdit && !locked}
                onSaved={reload}
              />
            ) : (
              <>
                <p className="plan__hint">
                  Aucune activité : les dates viennent de la WBS. Décrivez les activités, leurs durées et leurs dépendances
                  dans « Activités et durées » pour planifier par le réseau.
                </p>
                <GanttChart plan={plan.data} />
              </>
            )}
          </section>
        </article>
      )}
    </>
  );
}
