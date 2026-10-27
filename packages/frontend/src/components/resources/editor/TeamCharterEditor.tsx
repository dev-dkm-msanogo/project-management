import { useState } from 'react';
import type { TeamCharterInput, TeamSignatureInput } from '@shared/index';
import { teamCharterApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { DateInput, LinesInput, TextArea, TextInput } from '@/components/form/controls';
import { PersonSelect } from '@/components/people/People';
import type { DocumentEditorProps } from '@/features/DocumentFeature';
import { todayIso } from '@/lib/format';

const LINES_HINT = 'Une règle par ligne. « Terme : explication » met le terme en évidence.';

/** Rédaction de la charte de l'équipe : valeurs, règles, décisions, conflits et signatures. */
export function TeamCharterEditor({
  projectId,
  mode,
  initialInput,
  onCancel,
  onSaved,
}: DocumentEditorProps<TeamCharterInput> & { projectId: string }) {
  const [input, setInput] = useState<TeamCharterInput>(initialInput);
  const patch = (changes: Partial<TeamCharterInput>) => setInput((current) => ({ ...current, ...changes }));
  const early = (signature: TeamSignatureInput) => signature.signedOn !== null && signature.signedOn < input.preparedOn;

  return (
    <EditorShell
      title={mode === 'create' ? "Nouvelle charte de l'équipe" : "Charte de l'équipe"}
      save={() => teamCharterApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <fieldset className="editor-section">
        <legend>Valeurs et règles de fonctionnement</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
        <Field label="Valeurs et principes" hint={LINES_HINT}>
          <LinesInput value={input.values} onChange={(values) => patch({ values })} rows={5} />
        </Field>
        <div className="editor-grid">
          <Field label="Règles de réunion" hint="Une règle par ligne.">
            <LinesInput value={input.meetingGuidelines} onChange={(meetingGuidelines) => patch({ meetingGuidelines })} rows={5} />
          </Field>
          <Field label="Règles de communication" hint="Une règle par ligne.">
            <LinesInput
              value={input.communicationGuidelines}
              onChange={(communicationGuidelines) => patch({ communicationGuidelines })}
              rows={5}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Décisions, conflits et autres accords</legend>
        <Field label="Prise de décision">
          <TextArea value={input.decisionMaking} onChange={(decisionMaking) => patch({ decisionMaking })} rows={4} />
        </Field>
        <Field label="Résolution des conflits">
          <TextArea value={input.conflictResolution} onChange={(conflictResolution) => patch({ conflictResolution })} rows={4} />
        </Field>
        <Field label="Autres accords" hint={LINES_HINT}>
          <LinesInput value={input.otherAgreements} onChange={(otherAgreements) => patch({ otherAgreements })} rows={5} />
        </Field>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Signatures ({input.signatures.length})</legend>
        <ArrayEditor<TeamSignatureInput>
          items={input.signatures}
          onChange={(signatures) => patch({ signatures })}
          addLabel="Ajouter un signataire"
          emptyLabel="Aucun signataire."
          makeEmpty={() => ({ resourceId: '', role: '', signedOn: null })}
          renderItem={(signature, update) => (
            <>
              <div className="editor-grid editor-grid--fluid">
                <Field label="Signataire">
                  <PersonSelect value={signature.resourceId || null} onChange={(id) => update({ resourceId: id ?? '' })} />
                </Field>
                <Field label="Rôle">
                  <TextInput value={signature.role} onChange={(role) => update({ role })} />
                </Field>
                <Field label="Date de signature">
                  <DateInput value={signature.signedOn} onChange={(signedOn) => update({ signedOn })} />
                </Field>
              </div>
              {early(signature) && (
                <p className="entry-form__warning" role="alert">
                  Une signature ne peut précéder la date de préparation de la charte.
                </p>
              )}
            </>
          )}
        />
      </fieldset>
    </EditorShell>
  );
}
