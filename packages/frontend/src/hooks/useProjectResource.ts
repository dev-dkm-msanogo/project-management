import { useCallback, useEffect, useState } from 'react';

interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface ProjectResource<T> extends ResourceState<T> {
  reload: () => void;
}

/**
 * Charge une ressource d'un projet, avec annulation propre au changement de projet
 * et rechargement à la demande. `load` doit être stable (fonction de module).
 */
export function useProjectResource<T>(
  projectId: string,
  load: (projectId: string, signal: AbortSignal) => Promise<T>,
): ProjectResource<T> {
  const [state, setState] = useState<ResourceState<T>>({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });

    load(projectId, controller.signal)
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
  }, [projectId, tick, load]);

  return { ...state, reload };
}
