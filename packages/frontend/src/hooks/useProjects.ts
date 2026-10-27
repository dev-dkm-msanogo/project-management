import { useCallback, useEffect, useState } from 'react';
import type { ProjectRecordDto } from '@shared/index';
import { fetchProjects } from '@/api/project-client';

interface ProjectsState {
  data: ProjectRecordDto[];
  loading: boolean;
  error: string | null;
}

interface UseProjects extends ProjectsState {
  reload: () => void;
}

/** Hook de chargement de la liste des projets, avec rechargement. */
export function useProjects(): UseProjects {
  const [state, setState] = useState<ProjectsState>({ data: [], loading: true, error: null });
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetchProjects(controller.signal)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          data: [],
          loading: false,
          error: err instanceof Error ? err.message : 'Erreur inconnue.',
        });
      });

    return () => controller.abort();
  }, [tick]);

  return { ...state, reload };
}
