import { useEffect, useId, useRef, useState, type ReactNode, type SyntheticEvent } from 'react';
import { useUnsavedChanges } from '@/components/form/UnsavedChanges';

interface EditorShellProps {
  title: string;
  /** Enregistre la saisie ; une erreur levée est affichée en tête du formulaire. */
  save: () => Promise<unknown>;
  onCancel: () => void;
  onSaved: () => void;
  /** Action de plus dans la barre du haut, ex. « Supprimer » l'entrée éditée. */
  extraActions?: ReactNode;
  children: ReactNode;
}

/**
 * Cadre commun d'un éditeur de document : barre d'actions, erreur, pied de formulaire. Dès la
 * première saisie (champ modifié, ligne ajoutée ou retirée), quitter l'éditeur demande confirmation.
 */
export function EditorShell({ title, save, onCancel, onSaved, extraActions, children }: EditorShellProps) {
  const editorId = useId();
  const { setDirty, confirmLeave } = useUnsavedChanges();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, markDirty] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setDirty(editorId, dirty);
    return () => setDirty(editorId, false);
  }, [editorId, dirty, setDirty]);

  // Enregistrer se clique aussi depuis le bas du formulaire : l'erreur doit rester visible.
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [error]);

  // Toute saisie, et tout bouton du formulaire hors Annuler / Enregistrer, modifie le document.
  const touch = () => markDirty(true);
  const touchByButton = (event: SyntheticEvent) => {
    const button = (event.target as Element).closest('button');
    if (button && !button.closest('.editor__actions')) markDirty(true);
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await save();
      markDirty(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setSaving(false);
    }
  }

  const cancel = async () => {
    if (!dirty || (await confirmLeave())) onCancel();
  };

  const actions = (extra?: ReactNode) => (
    <div className="editor__actions">
      {extra}
      <button type="button" className="btn btn--ghost" onClick={() => void cancel()} disabled={saving}>
        Annuler
      </button>
      <button type="submit" className="btn btn--primary" disabled={saving}>
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  );

  return (
    <form
      className="editor"
      onSubmit={handleSubmit}
      onInputCapture={touch}
      onChangeCapture={touch}
      onClickCapture={touchByButton}
    >
      <div className="editor__bar">
        <h2 className="editor__title">{title}</h2>
        {actions(extraActions)}
      </div>
      {error && (
        <p className="editor__error" role="alert" ref={errorRef}>
          {error}
        </p>
      )}
      {children}
      <div className="editor__footer">{actions()}</div>
    </form>
  );
}
