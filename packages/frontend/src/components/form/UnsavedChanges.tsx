import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Dialog } from '@/components/ui/Dialog';

interface UnsavedChangesApi {
  /** Un éditeur signale qu'il contient (ou non) des saisies non enregistrées. */
  setDirty(editorId: string, dirty: boolean): void;
  /** `true` si l'on peut quitter : aucune saisie en cours, ou abandon confirmé. */
  confirmLeave(): Promise<boolean>;
}

const UnsavedChangesContext = createContext<UnsavedChangesApi | null>(null);

/**
 * Protège les saisies non enregistrées : demande confirmation avant de quitter un éditeur
 * (navigation dans l'application, annulation) et avant de fermer ou recharger l'onglet.
 */
export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const dirty = useRef(new Set<string>());
  const [pending, setPending] = useState<((leave: boolean) => void) | null>(null);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty.current.size === 0) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const api = useMemo<UnsavedChangesApi>(
    () => ({
      setDirty: (editorId, isDirty) => {
        if (isDirty) dirty.current.add(editorId);
        else dirty.current.delete(editorId);
      },
      confirmLeave: () =>
        dirty.current.size === 0 ? Promise.resolve(true) : new Promise<boolean>((resolve) => setPending(() => resolve)),
    }),
    [],
  );

  const answer = (leave: boolean) => {
    if (leave) dirty.current.clear();
    pending?.(leave);
    setPending(null);
  };

  return (
    <UnsavedChangesContext.Provider value={api}>
      {children}
      <Dialog open={pending !== null} title="Quitter sans enregistrer ?" onClose={() => answer(false)}>
        <div className="dialog__body">
          <p className="dialog__message">Les modifications en cours ne sont pas enregistrées : elles seront perdues.</p>
        </div>
        <footer className="dialog__footer">
          <button type="button" className="btn btn--ghost" onClick={() => answer(false)}>
            Continuer la saisie
          </button>
          <button type="button" className="btn btn--danger" onClick={() => answer(true)}>
            Quitter sans enregistrer
          </button>
        </footer>
      </Dialog>
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges(): UnsavedChangesApi {
  const api = useContext(UnsavedChangesContext);
  if (!api) throw new Error('useUnsavedChanges doit être utilisé sous UnsavedChangesProvider.');
  return api;
}
