import { useState } from 'react';
import type { MoneyDto } from '@shared/index';

/** Contrôles de formulaire contrôlés, fins et cohérents (DRY). */

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

/** `list` : identifiant d'une <datalist> de suggestions (saisie libre conservée). */
export function TextInput({ value, onChange, placeholder, required, list }: TextInputProps & { list?: string }) {
  return (
    <input
      className="form-input"
      type="text"
      value={value}
      placeholder={placeholder}
      required={required}
      list={list}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

interface TextAreaProps extends TextInputProps {
  rows?: number;
}

export function TextArea({ value, onChange, placeholder, required, rows = 3 }: TextAreaProps) {
  return (
    <textarea
      className="form-input form-input--area"
      value={value}
      placeholder={placeholder}
      required={required}
      rows={rows}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

interface LinesInputProps {
  value: readonly string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  rows?: number;
}

/**
 * Liste saisie à raison d'un élément par ligne (lignes vides ignorées).
 * Le texte brut reste local pour pouvoir taper des retours à la ligne librement.
 */
export function LinesInput({ value, onChange, placeholder, rows = 4 }: LinesInputProps) {
  const [text, setText] = useState(() => value.join('\n'));
  return (
    <textarea
      className="form-input form-input--area"
      value={text}
      placeholder={placeholder}
      rows={rows}
      onChange={(event) => {
        setText(event.target.value);
        onChange(event.target.value.split('\n').map((line) => line.trim()).filter(Boolean));
      }}
    />
  );
}

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberInput({ value, onChange, min, max, step }: NumberInputProps) {
  return (
    <input
      className="form-input"
      type="number"
      value={Number.isFinite(value) ? value : ''}
      min={min}
      max={max}
      step={step}
      onChange={(event) =>
        onChange(event.target.value === '' ? 0 : Number(event.target.value))
      }
    />
  );
}

interface DateInputProps {
  value: string | null;
  onChange: (value: string | null) => void;
  required?: boolean;
}

/** Champ date (ISO YYYY-MM-DD) ; vide → null. */
export function DateInput({ value, onChange, required }: DateInputProps) {
  return (
    <input
      className="form-input"
      type="date"
      value={value ?? ''}
      required={required}
      onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}
    />
  );
}

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectInputProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SelectOption<T>[];
}

export function SelectInput<T extends string>({ value, onChange, options }: SelectInputProps<T>) {
  return (
    <select
      className="form-input"
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

interface MoneyInputProps {
  value: MoneyDto;
  onChange: (value: MoneyDto) => void;
}

/** Montant en FCFA (la devise XOF est implicite — application mono-devise). */
export function MoneyInput({ value, onChange }: MoneyInputProps) {
  return (
    <span className="money-input">
      <input
        className="form-input"
        type="number"
        step={1_000_000}
        value={Number.isFinite(value.amount) ? value.amount : ''}
        onChange={(event) =>
          onChange({
            ...value,
            amount: event.target.value === '' ? 0 : Number(event.target.value),
          })
        }
      />
      <span className="money-input__suffix">FCFA</span>
    </span>
  );
}

interface AmountInputProps {
  value: number;
  onChange: (value: number) => void;
  /** Unité affichée après le champ (FCFA par défaut). */
  suffix?: string;
}

/**
 * Montant ou quantité positive, avec son unité (FCFA par défaut). Saisie libre
 * (`step="any"`) : aucune valeur n'est refusée pour un pas d'incrément.
 */
export function AmountInput({ value, onChange, suffix = 'FCFA' }: AmountInputProps) {
  return (
    <span className="money-input">
      <input
        className="form-input"
        type="number"
        min={0}
        step="any"
        value={Number.isFinite(value) ? value : ''}
        onChange={(event) => onChange(event.target.value === '' ? 0 : Number(event.target.value))}
      />
      {suffix && <span className="money-input__suffix">{suffix}</span>}
    </span>
  );
}

interface CheckboxInputProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function CheckboxInput({ checked, onChange, label }: CheckboxInputProps) {
  return (
    <label className="checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
