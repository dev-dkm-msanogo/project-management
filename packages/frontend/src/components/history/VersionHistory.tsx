import { useEffect, useState } from 'react';
import type { DocumentVersionsDto } from '@shared/index';
import type { DocumentHistoryApi } from '@/api/project-documents';
import { Dialog } from '@/components/ui/Dialog';
import { formatDateTime } from '@/lib/admin-format';

interface VersionHistoryProps<Dto> {
  projectId: string;
  api: DocumentHistoryApi<Dto>;
  /** Restaurer : rédacteur, document non figé. */
  canRestore: boolean;
  /** Version choisie : son contenu, à reprendre dans l'éditeur (enregistré comme nouvelle version). */
  onRestore: (dto: Dto, version: number) => void;
}

/**
 * Historique d'un document : chaque version enregistrée, son auteur et sa date. Restaurer reprend une
 * version dans l'éditeur ; elle n'est rétablie qu'à l'enregistrement, comme nouvelle version.
 */
export function VersionHistory<Dto>({ projectId, api, canRestore, onRestore }: VersionHistoryProps<Dto>) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<{ data: DocumentVersionsDto | null; error: string | null }>({ data: null, error: null });
  const [loading, setLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setState({ data: null, error: null });
    api
      .versions(projectId, controller.signal)
      .then((data) => setState({ data, error: null }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ data: null, error: error instanceof Error ? error.message : 'Erreur inconnue.' });
      });
    return () => controller.abort();
    // `api.versions` est stable (client de module) ; l'objet `api` peut être recréé à chaque rendu.
  }, [open, api.versions, projectId]);

  const restore = async (version: number) => {
    setLoading(version);
    try {
      const dto = await api.fetchVersion(projectId, version);
      setOpen(false);
      onRestore(dto, version);
    } catch (error) {
      setState((current) => ({ ...current, error: error instanceof Error ? error.message : 'Erreur inconnue.' }));
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <button type="button" className="btn btn--ghost" onClick={() => setOpen(true)}>
        Historique
      </button>
      {open && (
        <Dialog open title="Historique des versions" variant="drawer" onClose={() => setOpen(false)}>
          <div className="dialog__body">
            <p className="dialog__message">
              Chaque enregistrement crée une version. Restaurer reprend une version dans l'éditeur : elle n'est rétablie
              qu'une fois enregistrée, comme nouvelle version.
            </p>
            {!state.data && !state.error && <p className="app__status">Chargement de l'historique…</p>}
            {state.error && (
              <p className="editor__error" role="alert">
                {state.error}
              </p>
            )}
            {state.data && state.data.versions.length === 0 && <p className="app__status">Aucune version enregistrée.</p>}
            {state.data && state.data.versions.length > 0 && (
              <ol className="version-list">
                {state.data.versions.map((entry) => (
                  <li key={entry.version} className={`version-list__item${entry.current ? ' version-list__item--current' : ''}`}>
                    <span className="version-list__number">Version {entry.version}</span>
                    <span className="version-list__meta">
                      {formatDateTime(entry.savedAt)} · {entry.savedBy ?? 'Auteur non enregistré'}
                    </span>
                    {entry.current ? (
                      <span className="version-list__badge">En vigueur</span>
                    ) : (
                      canRestore && (
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          disabled={loading !== null}
                          onClick={() => void restore(entry.version)}
                        >
                          {loading === entry.version ? 'Chargement…' : 'Restaurer'}
                        </button>
                      )
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
          <footer className="dialog__footer">
            <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
              Fermer
            </button>
          </footer>
        </Dialog>
      )}
    </>
  );
}

/** Bandeau au-dessus de l'éditeur quand il contient une version restaurée. */
export function RestoredNotice({ version }: { version: number }) {
  return (
    <p className="restore-note" role="status">
      Version {version} reprise dans l'éditeur : enregistrez pour la rétablir (une nouvelle version sera créée), ou
      annulez pour garder la version en vigueur.
    </p>
  );
}

/**
 * Restauration dans l'éditeur d'un registre : le bouton « Historique », la version reprise (à la place
 * du registre en vigueur) et le bandeau de l'éditeur.
 */
export function useVersionRestore<Dto>(
  projectId: string,
  api: DocumentHistoryApi<Dto>,
  options: { canRestore: boolean; edit: () => void },
) {
  const [restored, setRestored] = useState<{ dto: Dto; version: number } | null>(null);
  useEffect(() => setRestored(null), [projectId]);
  return {
    restored: restored?.dto ?? null,
    clear: () => setRestored(null),
    notice: restored ? <RestoredNotice version={restored.version} /> : null,
    history: (
      <VersionHistory
        projectId={projectId}
        api={api}
        canRestore={options.canRestore}
        onRestore={(dto, version) => {
          setRestored({ dto, version });
          options.edit();
        }}
      />
    ),
  };
}
