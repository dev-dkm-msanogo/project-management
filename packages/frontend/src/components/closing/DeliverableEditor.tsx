import { useState } from 'react';
import type {
  AcceptanceDecision,
  DeliverableAcceptanceInput,
  DeliverableRecordInput,
  DeliverablesDto,
  DeliverableVerificationInput,
} from '@shared/index';
import { deliverablesApi } from '@/api/project-documents';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { CheckboxInput, DateInput, SelectInput, TextArea } from '@/components/form/controls';
import { PersonSelect } from '@/components/people/People';
import { useChangeLog } from '@/hooks/useProjectDocuments';
import { formatShortDate, todayIso } from '@/lib/format';

const DECISION_OPTIONS: { value: AcceptanceDecision | ''; label: string }[] = [
  { value: '', label: 'En attente de décision' },
  { value: 'ACCEPTED', label: 'Accepté' },
  { value: 'REJECTED', label: 'Refusé' },
];

interface DeliverableEditorProps {
  projectId: string;
  register: DeliverablesDto;
  wbsCode: string;
  onCancel: () => void;
  onSaved: () => void;
}

/** Vérification et décision d'acceptation d'un livrable ; le reste du registre est enregistré tel quel. */
export function DeliverableEditor({ projectId, register, wbsCode, onCancel, onSaved }: DeliverableEditorProps) {
  const item = register.deliverables.find((deliverable) => deliverable.wbsCode === wbsCode)!;
  const [verification, setVerification] = useState<DeliverableVerificationInput | null>(item.verification);
  const [acceptance, setAcceptance] = useState<DeliverableAcceptanceInput | null>(item.acceptance);
  const { data: changes } = useChangeLog(projectId);

  const patchVerification = (changes: Partial<DeliverableVerificationInput>) =>
    setVerification((current) => current && { ...current, ...changes });
  const patchAcceptance = (changes: Partial<DeliverableAcceptanceInput>) =>
    setAcceptance((current) => current && { ...current, ...changes });
  const toggleVerified = (checked: boolean) => {
    setVerification(checked ? { verifiedOn: todayIso(), verifiedById: '', notes: '' } : null);
    if (!checked) setAcceptance(null);
  };
  const setDecision = (decision: AcceptanceDecision | '') =>
    setAcceptance((current) =>
      decision === ''
        ? null
        : { decidedOn: todayIso(), decidedById: '', comments: '', changeCode: null, ...current, decision },
    );
  const changeOptions = [
    { value: '', label: 'Aucune' },
    ...(changes?.requests ?? []).map((request) => ({ value: request.code, label: `${request.code} · ${request.title}` })),
  ];

  const save = () => {
    const records: DeliverableRecordInput[] = register.deliverables
      .map(({ wbsCode: code, verification: verified, acceptance: decided }) =>
        code === wbsCode ? { wbsCode: code, verification, acceptance } : { wbsCode: code, verification: verified, acceptance: decided },
      )
      .filter((record) => record.verification || record.acceptance);
    return deliverablesApi.save(projectId, { records });
  };

  return (
    <EditorShell title={`Livrable ${wbsCode}`} save={save} onCancel={onCancel} onSaved={onSaved}>
      <fieldset className="editor-section">
        <legend>{item.deliverable || item.name}</legend>
        <dl className="doc-facts">
          <div>
            <dt>Élément de la WBS</dt>
            <dd>
              {item.wbsCode} · {item.name}
            </dd>
          </div>
          <div>
            <dt>Fin prévue</dt>
            <dd>{formatShortDate(item.plannedFinish)}</dd>
          </div>
          <div>
            <dt>Production</dt>
            <dd>{item.percentComplete} % réalisé</dd>
          </div>
          <div>
            <dt>Critères d'acceptation</dt>
            <dd>{item.acceptanceCriteria || '—'}</dd>
          </div>
        </dl>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Vérification</legend>
        {item.percentComplete < 100 && !verification && (
          <p className="entry-form__warning" role="note">
            Le livrable n'est pas achevé ({item.percentComplete} %) : on vérifie normalement un livrable terminé.
          </p>
        )}
        <CheckboxInput checked={verification !== null} onChange={toggleVerified} label="Livrable vérifié, conforme à ses exigences" />
        {verification && (
          <>
            <div className="editor-grid">
              <Field label="Vérifié le">
                <DateInput value={verification.verifiedOn} onChange={(date) => patchVerification({ verifiedOn: date ?? todayIso() })} required />
              </Field>
              <Field label="Vérifié par">
                <PersonSelect value={verification.verifiedById || null} onChange={(id) => patchVerification({ verifiedById: id ?? '' })} />
              </Field>
            </div>
            <Field label="Contrôles réalisés et résultat">
              <TextArea value={verification.notes} onChange={(notes) => patchVerification({ notes })} rows={2} />
            </Field>
          </>
        )}
      </fieldset>

      {verification && (
        <fieldset className="editor-section">
          <legend>Décision d'acceptation</legend>
          <div className="editor-grid editor-grid--3">
            <Field label="Décision">
              <SelectInput<AcceptanceDecision | ''> value={acceptance?.decision ?? ''} onChange={setDecision} options={DECISION_OPTIONS} />
            </Field>
            {acceptance && (
              <>
                <Field label="Le">
                  <DateInput value={acceptance.decidedOn} onChange={(date) => patchAcceptance({ decidedOn: date ?? todayIso() })} required />
                </Field>
                <Field label="Par">
                  <PersonSelect value={acceptance.decidedById || null} onChange={(id) => patchAcceptance({ decidedById: id ?? '' })} />
                </Field>
              </>
            )}
          </div>
          {acceptance && (
            <div className="editor-grid">
              <Field label={acceptance.decision === 'REJECTED' ? 'Motif du refus' : 'Réserves éventuelles'}>
                <TextArea
                  value={acceptance.comments}
                  onChange={(comments) => patchAcceptance({ comments })}
                  rows={2}
                  required={acceptance.decision === 'REJECTED'}
                />
              </Field>
              {acceptance.decision === 'REJECTED' && (
                <Field label="Demande de modification">
                  <SelectInput
                    value={acceptance.changeCode ?? ''}
                    onChange={(code) => patchAcceptance({ changeCode: code || null })}
                    options={changeOptions}
                  />
                </Field>
              )}
            </div>
          )}
        </fieldset>
      )}
    </EditorShell>
  );
}
