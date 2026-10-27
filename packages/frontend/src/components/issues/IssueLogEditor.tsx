import { useState } from 'react';
import type { IssueInput, IssueLogInput, IssuePriority, IssueStatus, IssueType } from '@shared/index';
import { issueLogApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { FocusedEntry, useEntryFocus, type EntryTarget } from '@/components/form/EntryFocus';
import { Field } from '@/components/form/Field';
import { DateInput, SelectInput, TextArea, TextInput } from '@/components/form/controls';
import { PersonSelect } from '@/components/people/People';
import { useChangeLog, useRiskRegister } from '@/hooks/useProjectDocuments';
import { nextCode } from '@/lib/codes';
import { todayIso } from '@/lib/format';
import { blankIssue, ISSUE_PRIORITY_LABELS, ISSUE_STATUS_LABELS, ISSUE_TYPE_LABELS } from '@/lib/issue-format';

const options = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));

interface IssueLogEditorProps {
  projectId: string;
  initialInput: IssueLogInput;
  /** Entrée éditée seule ; absente : tout le registre. */
  target?: EntryTarget;
  onCancel: () => void;
  onSaved: () => void;
}

/** Rédaction du journal des problèmes ; risques et demandes liés choisis dans leurs registres. */
export function IssueLogEditor({ projectId, initialInput, target, onCancel, onSaved }: IssueLogEditorProps) {
  const focus = useEntryFocus({
    entries: initialInput.issues,
    keyOf: (issue) => issue.code,
    target,
    blank: () => blankIssue(nextCode(initialInput.issues, 'I')),
    labels: {
      create: 'Nouveau problème',
      edit: (issue) => `Problème ${issue.code}`,
      deleteMessage: "Le problème disparaît du journal. Préférez le marquer résolu s'il a été traité.",
    },
    remove: (code) =>
      issueLogApi.save(projectId, { ...initialInput, issues: initialInput.issues.filter((issue) => issue.code !== code) }),
    onRemoved: onSaved,
  });
  const [input, setInput] = useState<IssueLogInput>({ ...initialInput, issues: focus.entries });
  const { data: risks } = useRiskRegister(projectId);
  const { data: changes } = useChangeLog(projectId);

  const riskOptions = [
    { value: '', label: 'Aucun' },
    ...(risks?.risks ?? []).map((risk) => ({ value: risk.code, label: `${risk.code} · ${risk.title}` })),
  ];
  const changeOptions = [
    { value: '', label: 'Aucune' },
    ...(changes?.requests ?? []).map((request) => ({ value: request.code, label: `${request.code} · ${request.title}` })),
  ];

  const renderIssue = (issue: IssueInput, update: (changes: Partial<IssueInput>) => void) => {
    // Résolu : date du jour par défaut ; sinon, pas de date de résolution.
    const setStatus = (status: IssueStatus) =>
      update({ status, resolvedOn: status === 'RESOLVED' ? (issue.resolvedOn ?? todayIso()) : null });
    return (
      <div className="entry-form">
        <section className="entry-form__step">
          <div className="editor-grid editor-grid--3">
            <Field label="Code">
              <TextInput value={issue.code} onChange={(code) => update({ code })} required />
            </Field>
            <Field label="Type">
              <SelectInput<IssueType> value={issue.type} onChange={(type) => update({ type })} options={options(ISSUE_TYPE_LABELS)} />
            </Field>
            <Field label="Priorité">
              <SelectInput<IssuePriority>
                value={issue.priority}
                onChange={(priority) => update({ priority })}
                options={options(ISSUE_PRIORITY_LABELS)}
              />
            </Field>
          </div>
          <Field label="Description">
            <TextArea value={issue.description} onChange={(description) => update({ description })} rows={2} required />
          </Field>
          <div className="editor-grid editor-grid--3">
            <Field label="Impact sur les objectifs">
              <TextInput value={issue.impact} onChange={(impact) => update({ impact })} placeholder="ex. Délai : une semaine" />
            </Field>
            <Field label="Responsable">
              <PersonSelect value={issue.ownerId || null} onChange={(id) => update({ ownerId: id ?? '' })} />
            </Field>
            <Field label="Signalé le">
              <DateInput value={issue.raisedOn} onChange={(date) => update({ raisedOn: date ?? todayIso() })} required />
            </Field>
          </div>
        </section>
        <section className="entry-form__step">
          <div className="editor-grid editor-grid--3">
            <Field label="Statut">
              <SelectInput<IssueStatus> value={issue.status} onChange={setStatus} options={options(ISSUE_STATUS_LABELS)} />
            </Field>
            {issue.status === 'RESOLVED' && (
              <Field label="Résolu le">
                <DateInput value={issue.resolvedOn} onChange={(resolvedOn) => update({ resolvedOn })} required />
              </Field>
            )}
          </div>
          <div className="editor-grid">
            <Field label={issue.status === 'RESOLVED' ? 'Résolution' : 'Action en cours'}>
              <TextArea
                value={issue.resolution}
                onChange={(resolution) => update({ resolution })}
                rows={2}
                required={issue.status === 'RESOLVED'}
              />
            </Field>
            <Field label="Commentaires">
              <TextArea value={issue.comments} onChange={(comments) => update({ comments })} rows={2} />
            </Field>
          </div>
          <div className="editor-grid">
            <Field label="Risque concrétisé">
              <SelectInput value={issue.riskCode ?? ''} onChange={(code) => update({ riskCode: code || null })} options={riskOptions} />
            </Field>
            <Field label="Demande de modification">
              <SelectInput
                value={issue.changeCode ?? ''}
                onChange={(code) => update({ changeCode: code || null })}
                options={changeOptions}
              />
            </Field>
          </div>
        </section>
      </div>
    );
  };

  return (
    <EditorShell
      title={focus.title ?? 'Journal des problèmes'}
      save={() => issueLogApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
      extraActions={focus.deleteAction}
    >
      {focus.index === null ? (
        <>
          <fieldset className="editor-section">
            <legend>Problèmes ({input.issues.length})</legend>
            <ArrayEditor<IssueInput>
              items={input.issues}
              onChange={(issues) => setInput({ issues })}
              addLabel="Ajouter un problème"
              emptyLabel="Aucun problème."
              makeEmpty={() => blankIssue(nextCode(input.issues, 'I'))}
              renderItem={renderIssue}
            />
          </fieldset>
        </>
      ) : (
        <FocusedEntry
          entries={input.issues}
          index={focus.index}
          onChange={(issues) => setInput({ issues })}
          render={renderIssue}
        />
      )}
    </EditorShell>
  );
}
