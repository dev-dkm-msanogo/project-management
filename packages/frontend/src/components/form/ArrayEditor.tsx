import type { ReactNode } from 'react';

interface ArrayEditorProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  makeEmpty: () => T;
  addLabel: string;
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  emptyLabel?: string;
}

/**
 * Éditeur de liste générique (DRY) : rendu des lignes, ajout, suppression.
 * `update` fusionne un patch partiel dans l'élément ciblé (mise à jour immuable).
 */
export function ArrayEditor<T>({
  items,
  onChange,
  makeEmpty,
  addLabel,
  renderItem,
  emptyLabel = 'Aucun élément.',
}: ArrayEditorProps<T>) {
  const updateAt = (index: number, patch: Partial<T>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const removeAt = (index: number) => onChange(items.filter((_, i) => i !== index));

  const add = () => onChange([...items, makeEmpty()]);

  return (
    <div className="array-editor">
      {items.length === 0 && <p className="array-editor__empty">{emptyLabel}</p>}
      {items.map((item, index) => (
        <div className="array-editor__row" key={index}>
          <div className="array-editor__fields">
            {renderItem(item, (patch) => updateAt(index, patch), index)}
          </div>
          <button
            type="button"
            className="btn btn--icon"
            onClick={() => removeAt(index)}
            aria-label="Supprimer la ligne"
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="btn btn--ghost" onClick={add}>
        + {addLabel}
      </button>
    </div>
  );
}
