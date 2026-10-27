import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  /** Rubrique obligatoire pour soumettre le document à validation (astérisque). */
  needed?: boolean;
  children: ReactNode;
}

/** Enveloppe libellé + contrôle (associe le label au champ qu'il contient). */
export function Field({ label, hint, needed = false, children }: FieldProps) {
  return (
    <label className="field">
      <span className="field__label">
        {label}
        {needed && (
          <span className="field__needed" title="Obligatoire pour soumettre à validation">
            {' '}
            *
          </span>
        )}
      </span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  );
}
