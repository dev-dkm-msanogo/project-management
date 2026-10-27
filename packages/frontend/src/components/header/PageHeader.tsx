import { VIEW_DESCRIPTIONS, viewTitle, type AppView } from '@/navigation/pmp';

interface PageHeaderProps {
  view: AppView;
  /** Reçoit l'élément où les pages rendent leurs actions (voir `PageActions`). */
  actionsRef: (element: HTMLDivElement | null) => void;
}

/** En-tête de page : titre, description et actions de la page courante. */
export function PageHeader({ view, actionsRef }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header__text">
        <h1 className="page-header__title">{viewTitle(view)}</h1>
        <p className="page-header__description">{VIEW_DESCRIPTIONS[view]}</p>
      </div>
      <div className="page-header__actions" ref={actionsRef} />
    </div>
  );
}
