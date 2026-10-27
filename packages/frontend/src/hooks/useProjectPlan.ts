import { useCallback, useEffect, useState } from 'react';
import type { ProjectPlanDto } from '@shared/index';
import { fetchProjectPlan } from '@/api/plan-client';

interface PlanState {
  data: ProjectPlanDto | null;
  loading: boolean;
  error: string | null;
}

interface UseProjectPlan extends PlanState {
  reload: () => void;
}

/** Hook de chargement du plan de projet, avec annulation propre et rechargement. */
export function useProjectPlan(projectId: string): UseProjectPlan {
  const [state, setState] = useState<PlanState>({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });

    fetchProjectPlan(projectId, controller.signal)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Erreur inconnue.',
        });
      });

    return () => controller.abort();
  }, [projectId, tick]);

  return { ...state, reload };
}
