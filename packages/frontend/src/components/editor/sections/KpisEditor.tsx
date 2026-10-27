import type { KpiInput } from '@shared/index';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { Field } from '@/components/form/Field';
import { TextInput } from '@/components/form/controls';

interface KpisEditorProps {
  value: KpiInput[];
  onChange: (value: KpiInput[]) => void;
}

/** Section 11 — Indicateurs propres au projet, en plus de ceux que le projet calcule. */
export function KpisEditor({ value, onChange }: KpisEditorProps) {
  return (
    <fieldset className="editor-section">
      <legend>Autres indicateurs</legend>
      <p className="editor-section__note">
        Réalisé, SPI, CPI, estimation à l'achèvement, tâches en retard, risques critiques, problèmes ouverts et
        exigences vérifiées sont calculés : ajoutez ici les indicateurs propres au projet.
      </p>
      <ArrayEditor
        items={value}
        onChange={onChange}
        addLabel="Ajouter un indicateur"
        emptyLabel="Aucun autre indicateur."
        makeEmpty={() => ({ key: '', label: '', value: '', hint: null })}
        renderItem={(kpi, update) => (
          <div className="editor-grid editor-grid--kpi">
            <Field label="Clé" hint="ex. : SATISFACTION">
              <TextInput value={kpi.key} onChange={(key) => update({ key: key.toUpperCase() })} required />
            </Field>
            <Field label="Libellé">
              <TextInput value={kpi.label} onChange={(label) => update({ label })} required />
            </Field>
            <Field label="Valeur" hint="ex. : 92 %">
              <TextInput value={kpi.value} onChange={(text) => update({ value: text })} required />
            </Field>
            <Field label="Note (facultatif)">
              <TextInput value={kpi.hint ?? ''} onChange={(hint) => update({ hint: hint === '' ? null : hint })} />
            </Field>
          </div>
        )}
      />
    </fieldset>
  );
}
