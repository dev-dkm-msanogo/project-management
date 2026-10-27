import { useState } from 'react';
import type { ScopeDeliverableInput, ScopeStatementInput } from '@shared/index';
import { scopeStatementApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { DateInput, LinesInput, TextArea, TextInput } from '@/components/form/controls';
import type { DocumentEditorProps } from '@/features/DocumentFeature';
import { todayIso } from '@/lib/format';

const LINES_HINT = 'Un élément par ligne.';

interface ScopeStatementEditorProps extends DocumentEditorProps<ScopeStatementInput> {
  projectId: string;
  /** Création préremplie depuis la charte. */
  fromCharter: boolean;
}

/** Rédaction de l'énoncé du périmètre : description, livrables, acceptation, exclusions. */
export function ScopeStatementEditor({
  projectId,
  fromCharter,
  mode,
  initialInput,
  onCancel,
  onSaved,
}: ScopeStatementEditorProps) {
  const [input, setInput] = useState<ScopeStatementInput>(initialInput);
  const patch = (changes: Partial<ScopeStatementInput>) => setInput((current) => ({ ...current, ...changes }));

  return (
    <EditorShell
      title={mode === 'create' ? 'Nouvel énoncé du périmètre' : 'Énoncé du périmètre'}
      save={() => scopeStatementApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      {mode === 'create' && fromCharter && (
        <p className="editor__info">
          Prérempli depuis la charte (description, livrables et exclusions) : détaillez-les pour en faire la référence
          du périmètre.
        </p>
      )}

      <fieldset className="editor-section">
        <legend>Description du périmètre</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
        <Field label="Description" hint="Caractéristiques du produit, du service ou du résultat attendu.">
          <TextArea value={input.description} onChange={(description) => patch({ description })} rows={5} required />
        </Field>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Livrables du projet ({input.deliverables.length})</legend>
        <ArrayEditor<ScopeDeliverableInput>
          items={input.deliverables}
          onChange={(deliverables) => patch({ deliverables })}
          addLabel="Ajouter un livrable"
          emptyLabel="Aucun livrable."
          makeEmpty={() => ({ name: '', description: '' })}
          renderItem={(deliverable, update) => (
            <div className="editor-grid editor-grid--narrow-wide">
              <Field label="Livrable">
                <TextInput value={deliverable.name} onChange={(name) => update({ name })} required />
              </Field>
              <Field label="Contenu">
                <TextArea value={deliverable.description} onChange={(description) => update({ description })} rows={2} />
              </Field>
            </div>
          )}
        />
      </fieldset>

      <fieldset className="editor-section">
        <legend>Acceptation et exclusions</legend>
        <div className="editor-grid">
          <Field label="Critères d'acceptation du produit" hint={LINES_HINT}>
            <LinesInput
              value={input.acceptanceCriteria}
              onChange={(acceptanceCriteria) => patch({ acceptanceCriteria })}
              rows={5}
            />
          </Field>
          <Field label="Exclusions du projet" hint={LINES_HINT}>
            <LinesInput value={input.exclusions} onChange={(exclusions) => patch({ exclusions })} rows={5} />
          </Field>
        </div>
        <p className="doc-note">
          Les contraintes et les hypothèses proviennent du registre des hypothèses et contraintes : mettez-les à jour
          dans ce registre.
        </p>
      </fieldset>
    </EditorShell>
  );
}
