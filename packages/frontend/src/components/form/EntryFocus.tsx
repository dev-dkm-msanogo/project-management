import { useState, type ReactNode } from 'react';
import { DeleteAction } from '@/components/ui/DeleteAction';

/** Entrée d'un registre à éditer seule : `key` = sa clé (code) ; `null` = nouvelle entrée. */
export interface EntryTarget {
  key: string | null;
}

/** Ce qu'édite une page de registre : tout le registre, une seule entrée, ou rien. */
export type RegisterEditing = 'register' | EntryTarget | null;

/** Entrée ciblée par l'édition en cours ; `undefined` : tout le registre. */
export const entryTarget = (editing: RegisterEditing): EntryTarget | undefined =>
  editing === 'register' || editing === null ? undefined : editing;

interface EntryFocusOptions<Entry> {
  entries: readonly Entry[];
  keyOf: (entry: Entry) => string;
  /** Absent : tout le registre est édité. */
  target: EntryTarget | undefined;
  blank: () => Entry;
  labels: {
    create: string;
    edit: (entry: Entry) => string;
    deleteTitle?: (key: string) => string;
    deleteMessage: string;
  };
  /** Enregistre le registre sans cette entrée (une référence ailleurs peut le faire refuser). */
  remove: (key: string) => Promise<unknown>;
  onRemoved: () => void;
}

export interface EntryFocus<Entry> {
  /** Entrées de départ de l'éditeur ; une nouvelle entrée est ajoutée en fin de liste. */
  entries: Entry[];
  /** Index de l'entrée éditée seule ; `null` : tout le registre. */
  index: number | null;
  /** Titre de l'éditeur d'une entrée ; `null` : celui du registre. */
  title: string | null;
  /** « Supprimer » de l'entrée existante, dans la barre de l'éditeur. */
  deleteAction: ReactNode;
}

/**
 * Édition d'une seule entrée d'un long registre : l'éditeur garde le registre entier en état (il
 * l'enregistre tel quel, sous contrôle de version) mais n'affiche que l'entrée ciblée. Une entrée
 * introuvable (supprimée entre-temps) rouvre le registre entier.
 */
export function useEntryFocus<Entry>({
  entries,
  keyOf,
  target,
  blank,
  labels,
  remove,
  onRemoved,
}: EntryFocusOptions<Entry>): EntryFocus<Entry> {
  const [initial] = useState(() => {
    if (!target) return { entries: [...entries], index: null };
    if (target.key === null) return { entries: [...entries, blank()], index: entries.length };
    const index = entries.findIndex((entry) => keyOf(entry) === target.key);
    return { entries: [...entries], index: index < 0 ? null : index };
  });
  if (initial.index === null) return { ...initial, title: null, deleteAction: null };

  const key = target?.key ?? null;
  return {
    ...initial,
    title: key === null ? labels.create : labels.edit(initial.entries[initial.index]!),
    deleteAction: key !== null && (
      <DeleteAction
        title={labels.deleteTitle ? labels.deleteTitle(key) : `Supprimer ${key} ?`}
        message={labels.deleteMessage}
        onDelete={async () => {
          await remove(key);
          onRemoved();
        }}
      />
    ),
  };
}

interface FocusedEntryProps<Entry> {
  entries: Entry[];
  index: number;
  onChange: (entries: Entry[]) => void;
  render: (entry: Entry, update: (patch: Partial<Entry>) => void, index: number) => ReactNode;
}

/** L'entrée ciblée, éditée en place dans la liste complète (même formulaire que dans le registre). */
export function FocusedEntry<Entry>({ entries, index, onChange, render }: FocusedEntryProps<Entry>) {
  const update = (patch: Partial<Entry>) => onChange(entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  return <fieldset className="editor-section">{render(entries[index]!, update, index)}</fieldset>;
}
