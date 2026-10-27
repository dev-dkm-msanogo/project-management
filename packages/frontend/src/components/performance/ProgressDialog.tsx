import { useState } from 'react';
import type { TaskProgressInput, TaskStatus } from '@shared/index';
import { updateTaskProgress } from '@/api/performance-client';
import { Field } from '@/components/form/Field';
import { DateInput, NumberInput, SelectInput, TextArea } from '@/components/form/controls';
import { Dialog, useAsyncAction } from '@/components/ui/Dialog';
import { todayIso } from '@/lib/format';
import { TASK_STATUS_LABELS } from '@/lib/plan-format';

const STATUS_OPTIONS = (Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((value) => ({
  value,
  label: TASK_STATUS_LABELS[value],
}));

interface ProgressDialogProps {
  projectId: string;
  task: { wbs: string; name: string };
  initial: TaskProgressInput;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Mise à jour de l'avancement d'une tâche, dans un panneau latéral. Le statut cadre la saisie :
 * non commencée = 0 % sans date réelle, terminée = 100 % avec ses dates réelles ; le serveur
 * revérifie tout (dates jamais dans le futur, cohérence statut / % / dates).
 */
export function ProgressDialog({ projectId, task, initial, onClose, onSaved }: ProgressDialogProps) {
  const [input, setInput] = useState<TaskProgressInput>(initial);
  const patch = (changes: Partial<TaskProgressInput>) => setInput((current) => ({ ...current, ...changes }));
  const [saving, error, save] = useAsyncAction(async () => {
    await updateTaskProgress(projectId, task.wbs, { ...input, note: input.note?.trim() || null });
    onSaved();
  });

  const changeStatus = (status: TaskStatus) => {
    if (status === 'NOT_STARTED') {
      patch({ status, percentComplete: 0, actualStart: null, actualFinish: null });
    } else if (status === 'COMPLETE') {
      patch({
        status,
        percentComplete: 100,
        actualStart: input.actualStart ?? input.asOf,
        actualFinish: input.actualFinish ?? input.asOf,
      });
    } else {
      patch({
        status,
        percentComplete: input.percentComplete === 100 ? 90 : input.percentComplete,
        actualStart: input.actualStart ?? input.asOf,
        actualFinish: null,
      });
    }
  };
  const started = input.status !== 'NOT_STARTED';
  const fixedPercent = input.status === 'NOT_STARTED' || input.status === 'COMPLETE';

  return (
    <Dialog open variant="drawer" title={`Avancement · ${task.wbs} ${task.name}`} onClose={onClose}>
      <form
        className="dialog__form"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="dialog__body">
          <div className="editor-grid">
            <Field label="Statut">
              <SelectInput value={input.status} onChange={changeStatus} options={STATUS_OPTIONS} />
            </Field>
            <Field label="Réalisé (%)" hint={fixedPercent ? 'Fixé par le statut.' : 'De 0 à 99 % : à 100 %, passez la tâche à « Terminé ».'}>
              {fixedPercent ? (
                <input className="form-input" value={`${input.percentComplete} %`} readOnly />
              ) : (
                <NumberInput
                  value={input.percentComplete}
                  min={0}
                  max={99}
                  step={5}
                  onChange={(percentComplete) => patch({ percentComplete: Math.round(percentComplete) })}
                />
              )}
            </Field>
          </div>
          {started && (
            <div className="editor-grid">
              <Field label="Début réel">
                <DateInput value={input.actualStart} onChange={(actualStart) => patch({ actualStart })} required />
              </Field>
              {input.status === 'COMPLETE' && (
                <Field label="Fin réelle">
                  <DateInput value={input.actualFinish} onChange={(actualFinish) => patch({ actualFinish })} required />
                </Field>
              )}
            </div>
          )}
          <Field label="Situation au" hint="Date à laquelle cet avancement est constaté (aujourd'hui par défaut).">
            <DateInput value={input.asOf} onChange={(asOf) => patch({ asOf: asOf ?? todayIso() })} required />
          </Field>
          <Field label="Commentaire (facultatif)" hint="Point bloquant, dépendance, prochaine étape…">
            <TextArea value={input.note ?? ''} onChange={(note) => patch({ note })} rows={3} />
          </Field>
          {error && (
            <p className="editor__error" role="alert">
              {error}
            </p>
          )}
        </div>
        <footer className="dialog__footer">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
            Annuler
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
