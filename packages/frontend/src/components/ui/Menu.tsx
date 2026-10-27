import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

const ITEM_SELECTOR = '[role="menuitem"], [role="menuitemradio"]';

const MenuContext = createContext<() => void>(() => undefined);

function itemsOf(menu: HTMLElement | null): HTMLElement[] {
  return menu ? Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) : [];
}

interface MenuProps {
  /** Contenu du bouton déclencheur. */
  trigger: ReactNode;
  triggerClassName: string;
  /** Nom accessible du déclencheur, si son contenu n'est pas explicite. */
  triggerLabel?: string;
  /** Nom accessible du menu. */
  label: string;
  /** Alignement horizontal du menu sur le déclencheur. */
  align?: 'start' | 'end';
  children: ReactNode;
}

/**
 * Menu déroulant accessible (motif WAI-ARIA « menu button ») : ouverture au clic
 * ou aux flèches, navigation ↑ ↓ Début Fin, fermeture par Échap, Tab ou clic
 * extérieur, puis retour du focus sur le déclencheur.
 */
export function Menu({ trigger, triggerClassName, triggerLabel, label, align = 'start', children }: MenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    // Focus sur l'élément coché (ex. projet courant), sinon sur le premier.
    const items = itemsOf(menuRef.current);
    (items.find((item) => item.getAttribute('aria-checked') === 'true') ?? items[0])?.focus();

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const onTriggerKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
    }
  };

  const onMenuKeyDown = (event: KeyboardEvent) => {
    const items = itemsOf(menuRef.current);
    const index = items.indexOf(document.activeElement as HTMLElement);
    const focusAt = (position: number) => items[(position + items.length) % items.length]?.focus();

    switch (event.key) {
      case 'ArrowDown':
        focusAt(index + 1);
        break;
      case 'ArrowUp':
        focusAt(index - 1);
        break;
      case 'Home':
        focusAt(0);
        break;
      case 'End':
        focusAt(items.length - 1);
        break;
      case 'Escape':
        close();
        break;
      case 'Tab':
        setOpen(false);
        return;
      default:
        return;
    }
    event.preventDefault();
  };

  return (
    <div className="menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={triggerClassName}
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onTriggerKeyDown}
      >
        {trigger}
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          className={`menu__popover menu__popover--${align}`}
          onKeyDown={onMenuKeyDown}
        >
          <MenuContext.Provider value={close}>{children}</MenuContext.Provider>
        </div>
      )}
    </div>
  );
}

interface MenuItemProps {
  onSelect: () => void;
  /** Défini : élément à choix unique (`menuitemradio`) coché ou non. */
  checked?: boolean;
  children: ReactNode;
}

/** Élément de menu : exécute l'action puis referme le menu. */
export function MenuItem({ onSelect, checked, children }: MenuItemProps) {
  const close = useContext(MenuContext);
  return (
    <button
      type="button"
      role={checked === undefined ? 'menuitem' : 'menuitemradio'}
      aria-checked={checked}
      tabIndex={-1}
      className="menu__item"
      onClick={() => {
        close();
        onSelect();
      }}
    >
      {children}
    </button>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="menu__separator" />;
}

/** En-tête non interactif du menu (titre de section, identité…). */
export function MenuHeader({ children }: { children: ReactNode }) {
  return (
    <div role="none" className="menu__header">
      {children}
    </div>
  );
}
