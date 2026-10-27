import { useState } from 'react';
import type {
  RaciActivityInput,
  RaciCode,
  RaciParticipantInput,
  ResponsibilityMatrixInput,
} from '@shared/index';
import { raciApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { DateInput, TextInput } from '@/components/form/controls';
import { PersonSelect, usePersonName } from '@/components/people/People';
import type { DocumentEditorProps } from '@/features/DocumentFeature';
import { todayIso } from '@/lib/format';
import { RACI_CODES, accountableCount, newParticipantKey, raciGaps } from '@/lib/raci-format';

/** Rédaction de la matrice RACI : participants (colonnes) puis affectations par activité. */
export function RaciEditor({
  projectId,
  mode,
  initialInput,
  onCancel,
  onSaved,
}: DocumentEditorProps<ResponsibilityMatrixInput> & { projectId: string }) {
  const [input, setInput] = useState<ResponsibilityMatrixInput>(initialInput);
  const nameOf = usePersonName();
  const patch = (changes: Partial<ResponsibilityMatrixInput>) => setInput((current) => ({ ...current, ...changes }));
  const gaps = raciGaps(input.activities);

  // Retirer un participant retire aussi ses affectations (sinon référence orpheline).
  const changeParticipants = (participants: RaciParticipantInput[]) => {
    const keys = new Set(participants.map((participant) => participant.key));
    patch({
      participants,
      activities: input.activities.map((activity) => ({
        ...activity,
        assignments: Object.fromEntries(Object.entries(activity.assignments).filter(([key]) => keys.has(key))),
      })),
    });
  };

  const updateActivity = (index: number, changes: Partial<RaciActivityInput>) =>
    patch({ activities: input.activities.map((activity, i) => (i === index ? { ...activity, ...changes } : activity)) });

  const assign = (index: number, key: string, code: RaciCode | '') => {
    const { [key]: _previous, ...others } = input.activities[index]!.assignments;
    updateActivity(index, { assignments: code === '' ? others : { ...others, [key]: code } });
  };

  return (
    <EditorShell
      title={mode === 'create' ? 'Nouvelle matrice RACI' : 'Matrice RACI'}
      save={() => raciApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <fieldset className="editor-section">
        <legend>Participants ({input.participants.length})</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
        <ArrayEditor<RaciParticipantInput>
          items={input.participants}
          onChange={changeParticipants}
          addLabel="Ajouter un participant"
          emptyLabel="Aucun participant."
          makeEmpty={() => ({ key: newParticipantKey(), resourceId: '', role: '' })}
          renderItem={(participant, update) => (
            <div className="editor-grid">
              <Field label="Participant">
                <PersonSelect value={participant.resourceId || null} onChange={(id) => update({ resourceId: id ?? '' })} />
              </Field>
              <Field label="Rôle">
                <TextInput value={participant.role} onChange={(role) => update({ role })} />
              </Field>
            </div>
          )}
        />
      </fieldset>

      <fieldset className="editor-section">
        <legend>Affectations ({input.activities.length} activités)</legend>
        {input.participants.length === 0 ? (
          <p className="editor-section__note">Ajoutez d'abord les participants.</p>
        ) : (
          <div className="wbs-scroll">
            <table className="raci-table raci-table--editor">
              <thead>
                <tr>
                  <th className="raci-table__activity">Lot de travail / activité</th>
                  {input.participants.map((participant) => (
                    <th key={participant.key}>{nameOf(participant.resourceId) || '—'}</th>
                  ))}
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {input.activities.map((activity, index) => (
                  <tr key={index} className={accountableCount(activity) > 1 ? 'raci-row--invalid' : undefined}>
                    <th scope="row" className="raci-table__activity">
                      <TextInput value={activity.name} onChange={(name) => updateActivity(index, { name })} required />
                    </th>
                    {input.participants.map((participant) => {
                      const code = activity.assignments[participant.key] ?? '';
                      return (
                        <td key={participant.key} className={code ? `raci-cell raci-cell--${code}` : 'raci-cell'}>
                          <select
                            className="raci-select"
                            value={code}
                            aria-label={`${activity.name || 'Activité'} — ${nameOf(participant.resourceId)}`}
                            onChange={(event) => assign(index, participant.key, event.target.value as RaciCode | '')}
                          >
                            <option value="">—</option>
                            {RACI_CODES.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                    <td>
                      <button
                        type="button"
                        className="btn btn--icon"
                        aria-label="Supprimer l'activité"
                        onClick={() => patch({ activities: input.activities.filter((_, i) => i !== index) })}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button
          type="button"
          className="btn btn--ghost"
          disabled={input.participants.length === 0}
          onClick={() => patch({ activities: [...input.activities, { name: '', assignments: {} }] })}
        >
          + Ajouter une activité
        </button>
        {input.activities.some((activity) => accountableCount(activity) > 1) && (
          <p className="entry-form__warning" role="alert">
            Une activité ne peut avoir qu'un seul « A » : une seule personne rend compte du résultat.
          </p>
        )}
        {gaps.length > 0 && (
          <p className="editor-section__note">
            À compléter : {gaps.map((gap) => `${gap.activity || 'activité sans nom'} (sans ${gap.missing.join(' ni ')})`).join(' ; ')}.
          </p>
        )}
      </fieldset>
    </EditorShell>
  );
}
