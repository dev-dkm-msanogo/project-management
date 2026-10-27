import { GanttChart } from '@/components/plan/GanttChart';
import { PlanHeader } from '@/components/plan/PlanHeader';
import { useProjectPlan } from '@/hooks/useProjectPlan';

/** Page « Diagramme de Gantt » : visualisation temporelle du plan (lecture seule). */
export function GanttFeature({ projectId }: { projectId: string }) {
  const { data, loading, error } = useProjectPlan(projectId);

  return (
    <>
      {loading && <p className="app__status">Chargement du plan…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {data && (
        <article className="plan">
          <PlanHeader plan={data} />
          <section className="plan__section">
            <div className="plan__section-head">
              <h2 className="plan__section-title">Diagramme de Gantt</h2>
              <span className="plan__hint">Modifiez les tâches depuis « Structure (WBS) ».</span>
            </div>
            <GanttChart plan={data} />
          </section>
        </article>
      )}
    </>
  );
}
