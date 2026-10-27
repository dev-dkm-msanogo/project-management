import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Emplacement des actions dans l'en-tête de page (fourni par le shell applicatif). */
export const PageActionsSlot = createContext<HTMLElement | null>(null);

/** Rend ses enfants dans la zone d'actions de l'en-tête de page courant. */
export function PageActions({ children }: { children: ReactNode }) {
  const slot = useContext(PageActionsSlot);
  return slot ? createPortal(children, slot) : null;
}
