/** « Modifier » d'une entrée de registre : ouvre l'éditeur de cette seule entrée (éditeurs seulement). */
export function EditEntryButton({ label, onEdit }: { label: string; onEdit: () => void }) {
  return (
    <button
      type="button"
      className="btn btn--ghost btn--sm"
      aria-label={`Modifier ${label}`}
      onClick={(event) => {
        // La ligne peut avoir son propre clic (ex. déplier les détails).
        event.stopPropagation();
        onEdit();
      }}
    >
      Modifier
    </button>
  );
}

/** En-tête de la colonne « Modifier » d'un tableau de registre. */
export function EditHeader({ rowSpan }: { rowSpan?: number }) {
  return (
    <th rowSpan={rowSpan} className="register-table__edit">
      <span className="visually-hidden">Modifier</span>
    </th>
  );
}

/** Cellule « Modifier » d'une ligne de registre. */
export function EditCell({ label, onEdit }: { label: string; onEdit: () => void }) {
  return (
    <td className="register-table__edit">
      <EditEntryButton label={label} onEdit={onEdit} />
    </td>
  );
}
