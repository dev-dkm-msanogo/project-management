import { useState, type ReactNode } from 'react';
import { Field } from '@/components/form/Field';
import { Dialog, useAsyncAction } from '@/components/ui/Dialog';

interface DecisionDialogProps<Choice extends string> {
  open: boolean;
  title: string;
  /** Rappel de ce qui est décidé (demande, achat…). */
  context: ReactNode;
  choiceLabel: string;
  choices: readonly { value: Choice; label: string }[];
  initialChoice: Choice;
  confirmLabel: string;
  onConfirm: (choice: Choice, rationale: string) => Promise<void>;
  onClose: () => void;
}

/** Décision d'un valideur : un choix et sa justification (obligatoire), confirmés ensemble. */
export function DecisionDialog<Choice extends string>({
  open,
  title,
  context,
  choiceLabel,
  choices,
  initialChoice,
  confirmLabel,
  onConfirm,
  onClose,
}: DecisionDialogProps<Choice>) {
  const [choice, setChoice] = useState<Choice>(initialChoice);
  const [rationale, setRationale] = useState('');
  const [busy, error, run] = useAsyncAction(() => onConfirm(choice, rationale.trim()));
  const close = () => {
    setChoice(initialChoice);
    setRationale('');
    onClose();
  };

  return (
    <Dialog open={open} title={title} onClose={close}>
      <div className="dialog__body">
        <div className="dialog__message">{context}</div>
        <fieldset className="decision-choices">
          <legend className="field__label">{choiceLabel}</legend>
          {choices.map((item) => (
            <label key={item.value} className="decision-choices__option">
              <input
                type="radio"
                name="decision"
                value={item.value}
                checked={choice === item.value}
                onChange={() => setChoice(item.value)}
              />
              {item.label}
            </label>
          ))}
        </fieldset>
        <Field label="Justification">
          <textarea
            className="form-input"
            rows={3}
            maxLength={2000}
            value={rationale}
            onChange={(event) => setRationale(event.target.value)}
            required
          />
        </Field>
        {error && (
          <p className="editor__error" role="alert">
            {error}
          </p>
        )}
      </div>
      <footer className="dialog__footer">
        <button type="button" className="btn btn--ghost" onClick={close} disabled={busy}>
          Annuler
        </button>
        <button type="button" className="btn btn--primary" onClick={run} disabled={busy || rationale.trim() === ''}>
          {busy ? 'En cours…' : confirmLabel}
        </button>
      </footer>
    </Dialog>
  );
}
