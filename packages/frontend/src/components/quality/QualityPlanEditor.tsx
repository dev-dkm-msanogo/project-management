import { useState } from 'react';
import type { QualityManagementPlanInput, QualityObjectiveInput, RoleResponsibilityInput } from '@shared/index';
import { qualityPlanApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { DateInput, LinesInput, TextArea, TextInput } from '@/components/form/controls';
import type { DocumentEditorProps } from '@/features/DocumentFeature';
import { useScopeStatement } from '@/hooks/useProjectDocuments';
import { todayIso } from '@/lib/format';
import { QUALITY_TEXT_LABELS } from '@/lib/quality-risk-format';

const LINES_HINT = 'Un élément par ligne.';

/** Rôles et responsabilités (plans qualité et risques). */
export function RolesEditor({
  roles,
  onChange,
}: {
  roles: RoleResponsibilityInput[];
  onChange: (roles: RoleResponsibilityInput[]) => void;
}) {
  return (
    <ArrayEditor<RoleResponsibilityInput>
      items={roles}
      onChange={onChange}
      addLabel="Ajouter un rôle"
      emptyLabel="Aucun rôle."
      makeEmpty={() => ({ role: '', responsibility: '' })}
      renderItem={(item, update) => (
        <div className="editor-grid editor-grid--narrow-wide">
          <Field label="Rôle">
            <TextInput value={item.role} onChange={(role) => update({ role })} required />
          </Field>
          <Field label="Responsabilités">
            <TextArea value={item.responsibility} onChange={(responsibility) => update({ responsibility })} rows={2} />
          </Field>
        </div>
      )}
    />
  );
}

/** Rédaction du plan de gestion de la qualité ; les livrables peuvent être repris de l'énoncé du périmètre. */
export function QualityPlanEditor({
  projectId,
  mode,
  initialInput,
  onCancel,
  onSaved,
}: DocumentEditorProps<QualityManagementPlanInput> & { projectId: string }) {
  const [input, setInput] = useState<QualityManagementPlanInput>(initialInput);
  const patch = (changes: Partial<QualityManagementPlanInput>) => setInput((current) => ({ ...current, ...changes }));
  const { data: statement } = useScopeStatement(projectId);
  const scopeDeliverables = statement?.deliverables.map((item) => item.name) ?? [];
  // Remonte la saisie des livrables après une reprise (le champ garde son texte localement).
  const [deliverablesKey, setDeliverablesKey] = useState(0);

  return (
    <EditorShell
      title={mode === 'create' ? 'Nouveau plan de gestion de la qualité' : 'Plan de gestion de la qualité'}
      save={() => qualityPlanApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <fieldset className="editor-section">
        <legend>Normes et objectifs</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
        <Field label="Normes et référentiels" hint={LINES_HINT}>
          <LinesInput value={input.standards} onChange={(standards) => patch({ standards })} rows={4} />
        </Field>
        <ArrayEditor<QualityObjectiveInput>
          items={input.objectives}
          onChange={(objectives) => patch({ objectives })}
          addLabel="Ajouter un objectif qualité"
          emptyLabel="Aucun objectif qualité."
          makeEmpty={() => ({ objective: '', measure: '' })}
          renderItem={(item, update) => (
            <div className="editor-grid">
              <Field label="Objectif">
                <TextInput value={item.objective} onChange={(objective) => update({ objective })} required />
              </Field>
              <Field label="Indicateur et mesure">
                <TextInput value={item.measure} onChange={(measure) => update({ measure })} required />
              </Field>
            </div>
          )}
        />
      </fieldset>

      <fieldset className="editor-section">
        <legend>Rôles et responsabilités ({input.roles.length})</legend>
        <RolesEditor roles={input.roles} onChange={(roles) => patch({ roles })} />
      </fieldset>

      <fieldset className="editor-section">
        <legend>Livrables et processus soumis à revue</legend>
        {scopeDeliverables.length > 0 && (
          <button
            type="button"
            className="btn btn--ghost quality-import"
            onClick={() => {
              patch({ deliverables: [...new Set([...input.deliverables, ...scopeDeliverables])] });
              setDeliverablesKey((key) => key + 1);
            }}
          >
            + Reprendre les livrables de l'énoncé du périmètre
          </button>
        )}
        <div className="editor-grid">
          <Field label="Livrables" hint={LINES_HINT}>
            <LinesInput key={deliverablesKey} value={input.deliverables} onChange={(deliverables) => patch({ deliverables })} rows={6} />
          </Field>
          <Field label="Processus" hint={LINES_HINT}>
            <LinesInput value={input.processes} onChange={(processes) => patch({ processes })} rows={6} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Assurance et contrôle de la qualité</legend>
        {(Object.keys(QUALITY_TEXT_LABELS) as (keyof typeof QUALITY_TEXT_LABELS)[]).map((key) => (
          <Field key={key} label={QUALITY_TEXT_LABELS[key]}>
            <TextArea value={input[key]} onChange={(text) => patch({ [key]: text })} rows={4} />
          </Field>
        ))}
      </fieldset>
    </EditorShell>
  );
}
