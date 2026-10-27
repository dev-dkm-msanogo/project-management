import { useId, useState } from 'react';
import type { SourceSelectionInput, SourceSelectionsInput } from '@shared/index';
import { sourceSelectionsApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { FocusedEntry, useEntryFocus, type EntryTarget } from '@/components/form/EntryFocus';
import { Field } from '@/components/form/Field';
import { ScoringCriteriaEditor } from '@/components/form/ScoringCriteriaEditor';
import { DateInput, TextArea, TextInput } from '@/components/form/controls';
import { useProcurementPlan } from '@/hooks/useProjectDocuments';
import { todayIso } from '@/lib/format';
import { blankSelection } from '@/lib/procurement-format';
import { TOTAL_WEIGHT, withOptionAdded, withOptionRemoved } from '@/lib/scoring';

const MAX_CANDIDATES = 10;

interface SelectionFormProps {
  selection: SourceSelectionInput;
  update: (changes: Partial<SourceSelectionInput>) => void;
  sellerListId: string;
}

/** Une grille : candidats, critères pondérés notés pour chaque candidat, aperçu des totaux. */
function SelectionForm({ selection, update, sellerListId }: SelectionFormProps) {
  const { candidates, criteria } = selection;
  const candidateLabel = (index: number) => candidates[index] || `Candidat ${index + 1}`;

  const renameCandidate = (index: number, name: string) =>
    update({ candidates: candidates.map((other, i) => (i === index ? name : other)) });
  // Ajouter ou retirer un candidat ajoute ou retire sa note sur chaque critère.
  const addCandidate = () => update({ candidates: [...candidates, ''], criteria: withOptionAdded(criteria) });
  const removeCandidate = (index: number) =>
    update({ candidates: candidates.filter((_, i) => i !== index), criteria: withOptionRemoved(criteria, index) });

  return (
    <div className="entry-form">
      <section className="entry-form__step">
        <div className="editor-grid editor-grid--wide-narrow">
          <Field label="Achat évalué">
            <TextInput value={selection.procurement} onChange={(procurement) => update({ procurement })} required />
          </Field>
          <Field label="Date d'évaluation">
            <DateInput value={selection.preparedOn} onChange={(date) => update({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
      </section>

      <section className="entry-form__step">
        <h4 className="entry-form__step-title">Candidats ({candidates.length})</h4>
        <div className="candidate-list">
          {candidates.map((name, index) => (
            <div key={index} className="candidate-list__row">
              <Field label={`Candidat ${index + 1}`}>
                <TextInput value={name} onChange={(value) => renameCandidate(index, value)} list={sellerListId} required />
              </Field>
              <button
                type="button"
                className="btn btn--icon"
                onClick={() => removeCandidate(index)}
                disabled={candidates.length === 1}
                aria-label={`Retirer ${candidateLabel(index)}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {candidates.length < MAX_CANDIDATES && (
          <button type="button" className="btn btn--ghost candidate-list__add" onClick={addCandidate}>
            + Ajouter un candidat
          </button>
        )}
      </section>

      <section className="entry-form__step">
        <h4 className="entry-form__step-title">Critères ({criteria.length})</h4>
        <ScoringCriteriaEditor
          options={candidates.map((_, index) => candidateLabel(index))}
          criteria={criteria}
          onChange={(next) => update({ criteria: next })}
        />
      </section>

      <section className="entry-form__step">
        <Field label="Recommandation">
          <TextArea value={selection.recommendation} onChange={(recommendation) => update({ recommendation })} rows={3} />
        </Field>
      </section>
    </div>
  );
}

interface SourceSelectionEditorProps {
  projectId: string;
  initialInput: SourceSelectionsInput;
  /** Entrée éditée seule ; absente : tout le registre. */
  target?: EntryTarget;
  onCancel: () => void;
  onSaved: () => void;
}

/** Rédaction des grilles de sélection ; candidats suggérés depuis les fournisseurs présélectionnés du plan. */
export function SourceSelectionEditor({ projectId, initialInput, target, onCancel, onSaved }: SourceSelectionEditorProps) {
  const focus = useEntryFocus({
    entries: initialInput.evaluations,
    keyOf: (selection) => selection.procurement,
    target,
    blank: blankSelection,
    labels: {
      create: 'Nouvelle grille',
      edit: (selection) => `Grille « ${selection.procurement} »`,
      deleteTitle: (procurement) => `Supprimer la grille « ${procurement} » ?`,
      deleteMessage: 'La grille, ses notes et sa recommandation seront supprimées.',
    },
    remove: (procurement) =>
      sourceSelectionsApi.save(projectId, {
        ...initialInput,
        evaluations: initialInput.evaluations.filter((selection) => selection.procurement !== procurement),
      }),
    onRemoved: onSaved,
  });
  const [input, setInput] = useState<SourceSelectionsInput>({ ...initialInput, evaluations: focus.entries });
  const sellerListId = useId();
  const { data: plan } = useProcurementPlan(projectId);

  return (
    <EditorShell
      title={focus.title ?? 'Sélection des fournisseurs'}
      save={() => sourceSelectionsApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
      extraActions={focus.deleteAction}
    >
      <p className="editor__info">
        Une grille par achat : les pondérations des critères totalisent {TOTAL_WEIGHT} %, chaque candidat est noté de 1
        à 5 sur chaque critère.
      </p>
      {focus.index === null ? (
        <>
          <fieldset className="editor-section">
            <legend>Grilles ({input.evaluations.length})</legend>
            <ArrayEditor<SourceSelectionInput>
              items={input.evaluations}
              onChange={(evaluations) => setInput({ evaluations })}
              addLabel="Ajouter une grille"
              emptyLabel="Aucune grille."
              makeEmpty={blankSelection}
              renderItem={(selection, update) => (
                <SelectionForm selection={selection} update={update} sellerListId={sellerListId} />
              )}
            />
          </fieldset>
        </>
      ) : (
        <FocusedEntry
          entries={input.evaluations}
          index={focus.index}
          onChange={(evaluations) => setInput({ evaluations })}
          render={(selection, update) => <SelectionForm selection={selection} update={update} sellerListId={sellerListId} />}
        />
      )}
      <datalist id={sellerListId}>
        {(plan?.sellers ?? []).map((seller) => (
          <option key={seller.name} value={seller.name} />
        ))}
      </datalist>
    </EditorShell>
  );
}
