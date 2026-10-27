import { useState, type ReactNode } from 'react';
import type { BacklogItemInput, BacklogItemStatus, BacklogItemType, BacklogPriority, ProductBacklogDto, ProductBacklogInput } from '@shared/index';
import { STORY_POINTS } from '@shared/index';
import { backlogApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { FocusedEntry, useEntryFocus, type EntryTarget } from '@/components/form/EntryFocus';
import { Field } from '@/components/form/Field';
import { SelectInput, TextArea, TextInput } from '@/components/form/controls';
import { PersonSelect } from '@/components/people/People';
import { useBacklogRights } from '@/hooks/useBacklogRights';
import { useCurrentProject } from '@/hooks/useCurrentProject';
import { useRequirementsRegister } from '@/hooks/useProjectDocuments';
import { blankItem, ITEM_STATUS_LABELS, ITEM_TYPE_LABELS, productBacklogDtoToInput, withStatus } from '@/lib/agile-format';
import { formatShortDate } from '@/lib/format';
import { PRIORITY_DESCRIPTIONS } from '@/lib/requirements-format';

const options = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));

const POINT_OPTIONS = [{ value: '', label: 'Non estimé' }, ...STORY_POINTS.map((points) => ({ value: String(points), label: `${points}` }))];

/** L'équipe fait avancer un élément jusqu'à la revue ; « Terminé » vient de la décision du Product Owner. */
const WORK_STATUSES: Record<Exclude<BacklogItemStatus, 'DONE'>, string> = {
  TODO: ITEM_STATUS_LABELS.TODO,
  IN_PROGRESS: ITEM_STATUS_LABELS.IN_PROGRESS,
  IN_REVIEW: ITEM_STATUS_LABELS.IN_REVIEW,
};

/** Valeur affichée sans saisie, quand le compte n'a pas la main sur la rubrique. */
const Static = ({ children }: { children: ReactNode }) => <p className="field__static">{children || '—'}</p>;

interface BacklogItemEditorProps {
  projectId: string;
  backlog: ProductBacklogDto;
  /** Élément édité seul ; nouvel élément si `key` est `null`. */
  target: EntryTarget;
  /** Type d'un nouvel élément. */
  newType?: BacklogItemType;
  onCancel: () => void;
  onSaved: () => void;
}

/**
 * Rédaction d'un élément du carnet de produit ; le reste du carnet est enregistré tel quel. Le
 * Product Owner rédige et priorise, l'équipe estime et fait avancer ; un élément nouveau se rédige
 * entièrement (l'équipe le propose, il s'ajoute en fin de carnet).
 */
export function BacklogItemEditor({ projectId, backlog, target, newType = 'STORY', onCancel, onSaved }: BacklogItemEditorProps) {
  const initial = productBacklogDtoToInput(backlog);
  const rights = useBacklogRights(backlog);
  const focus = useEntryFocus({
    entries: initial.items,
    keyOf: (item) => item.code,
    target,
    blank: () => blankItem(initial.items, newType),
    labels: {
      create: newType === 'EPIC' ? 'Nouvelle épopée' : rights.decide ? 'Nouvel élément du carnet' : 'Proposer un élément',
      edit: (item) => `${ITEM_TYPE_LABELS[item.type]} ${item.code}`,
      deleteMessage: "L'élément disparaît du carnet. Une épopée ne se retire qu'une fois ses éléments détachés.",
    },
    remove: (code) => backlogApi.save(projectId, { ...initial, items: initial.items.filter((item) => item.code !== code) }),
    onRemoved: onSaved,
  });
  const [input, setInput] = useState<ProductBacklogInput>({ ...initial, items: focus.entries });
  const { data: requirements } = useRequirementsRegister(projectId);
  const methodology = useCurrentProject()?.methodology;
  const workPackages = Object.entries(backlog.references.workPackages);
  const epics = input.items.filter((item) => item.type === 'EPIC');
  const existing = new Set(initial.items.map((item) => item.code));

  const iterationOptions = [
    { value: '', label: 'Carnet (non planifié)' },
    ...input.iterations.map((iteration) => ({ value: iteration.code, label: `${iteration.code} · ${iteration.name}` })),
  ];
  const epicOptions = [{ value: '', label: 'Aucune' }, ...epics.map((epic) => ({ value: epic.code, label: `${epic.code} · ${epic.title}` }))];
  const requirementOptions = [
    { value: '', label: 'Aucune' },
    ...(requirements?.requirements ?? []).map((requirement) => ({
      value: requirement.code,
      label: `${requirement.code} · ${requirement.statement}`,
    })),
  ];
  const workPackageOptions = [
    { value: '', label: 'Aucun' },
    ...workPackages.map(([code, name]) => ({ value: code, label: `${code} · ${name}` })),
  ];
  const label = (options: { value: string; label: string }[], value: string | null) =>
    options.find((option) => option.value === (value ?? ''))?.label ?? value;

  const renderItem = (item: BacklogItemInput, update: (changes: Partial<BacklogItemInput>) => void) => {
    const epic = item.type === 'EPIC';
    // Contenu : au Product Owner ; un élément nouveau se rédige entièrement (proposition de l'équipe).
    const writes = rights.decide || !existing.has(item.code);
    const setType = (type: BacklogItemType) =>
      update(type === 'EPIC' ? { type, points: null, iterationCode: null, epicCode: null } : { type });
    return (
      <div className="entry-form">
        {item.refusal && (
          <p className="entry-form__warning" role="note">
            Refusé le {formatShortDate(item.refusal.on)} par {item.refusal.by} : {item.refusal.reason}
          </p>
        )}
        <section className="entry-form__step">
          <div className="editor-grid editor-grid--3">
            <Field label="Code">
              {writes ? <TextInput value={item.code} onChange={(code) => update({ code })} required /> : <Static>{item.code}</Static>}
            </Field>
            <Field label="Type">
              {writes ? (
                <SelectInput<BacklogItemType> value={item.type} onChange={setType} options={options(ITEM_TYPE_LABELS)} />
              ) : (
                <Static>{ITEM_TYPE_LABELS[item.type]}</Static>
              )}
            </Field>
            <Field label="Priorité">
              {writes ? (
                <SelectInput<BacklogPriority>
                  value={item.priority}
                  onChange={(priority) => update({ priority })}
                  options={options(PRIORITY_DESCRIPTIONS)}
                />
              ) : (
                <Static>{PRIORITY_DESCRIPTIONS[item.priority]}</Static>
              )}
            </Field>
          </div>
          <Field label="Titre">
            {writes ? <TextInput value={item.title} onChange={(title) => update({ title })} required /> : <Static>{item.title}</Static>}
          </Field>
          <div className="editor-grid">
            <Field label="Description" hint={epic || !writes ? undefined : 'En tant que …, je veux … afin de …'}>
              {writes ? (
                <TextArea value={item.description} onChange={(description) => update({ description })} rows={3} />
              ) : (
                <Static>{item.description}</Static>
              )}
            </Field>
            <Field label="Critères d'acceptation">
              {writes ? (
                <TextArea value={item.acceptanceCriteria} onChange={(acceptanceCriteria) => update({ acceptanceCriteria })} rows={3} />
              ) : (
                <Static>{item.acceptanceCriteria}</Static>
              )}
            </Field>
          </div>
        </section>
        {!epic && (
          <section className="entry-form__step">
            <div className="editor-grid editor-grid--3">
              <Field label="Estimation (points)" hint={rights.develop ? undefined : "L'équipe estime."}>
                {rights.develop ? (
                  <SelectInput
                    value={item.points === null ? '' : String(item.points)}
                    onChange={(points) => update({ points: points === '' ? null : Number(points) })}
                    options={POINT_OPTIONS}
                  />
                ) : (
                  <Static>{item.points === null ? 'Non estimé' : String(item.points)}</Static>
                )}
              </Field>
              <Field label="Statut" hint={item.status === 'DONE' || !rights.develop ? undefined : "« Terminé » : décision du Product Owner."}>
                {item.status === 'DONE' ? (
                  <Static>
                    Terminé le {formatShortDate(item.doneOn)}
                    {item.acceptedBy && `, accepté par ${item.acceptedBy.name}`}
                  </Static>
                ) : rights.develop ? (
                  <SelectInput<Exclude<BacklogItemStatus, 'DONE'>>
                    value={item.status}
                    onChange={(status) => update(withStatus(item, status))}
                    options={options(WORK_STATUSES)}
                  />
                ) : (
                  <Static>{ITEM_STATUS_LABELS[item.status]}</Static>
                )}
              </Field>
            </div>
            <div className="editor-grid editor-grid--3">
              <Field label="Itération">
                <SelectInput value={item.iterationCode ?? ''} onChange={(code) => update({ iterationCode: code || null })} options={iterationOptions} />
              </Field>
              <Field label="Épopée">
                {writes ? (
                  <SelectInput value={item.epicCode ?? ''} onChange={(code) => update({ epicCode: code || null })} options={epicOptions} />
                ) : (
                  <Static>{label(epicOptions, item.epicCode)}</Static>
                )}
              </Field>
              <Field label="Affecté à">
                <PersonSelect value={item.assigneeId} onChange={(assigneeId) => update({ assigneeId })} optional />
              </Field>
            </div>
          </section>
        )}
        <section className="entry-form__step">
          <div className="editor-grid">
            <Field label="Exigence satisfaite">
              {writes ? (
                <SelectInput
                  value={item.requirementCode ?? ''}
                  onChange={(code) => update({ requirementCode: code || null })}
                  options={requirementOptions}
                />
              ) : (
                <Static>{label(requirementOptions, item.requirementCode)}</Static>
              )}
            </Field>
            {!epic && (methodology === 'HYBRID' || item.wbsCode) && (
              <Field label="Lot de la WBS" hint="Le lot prend son avancement des points terminés de ses éléments.">
                {writes ? (
                  <SelectInput value={item.wbsCode ?? ''} onChange={(code) => update({ wbsCode: code || null })} options={workPackageOptions} />
                ) : (
                  <Static>{label(workPackageOptions, item.wbsCode)}</Static>
                )}
              </Field>
            )}
          </div>
        </section>
      </div>
    );
  };

  return (
    <EditorShell
      title={focus.title ?? 'Carnet de produit'}
      save={() => backlogApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
      extraActions={rights.decide ? focus.deleteAction : null}
    >
      {focus.index === null ? (
        <fieldset className="editor-section">
          <legend>Éléments ({input.items.length})</legend>
          <ArrayEditor<BacklogItemInput>
            items={input.items}
            onChange={(items) => setInput({ ...input, items })}
            addLabel="Ajouter un élément"
            emptyLabel="Aucun élément."
            makeEmpty={() => blankItem(input.items)}
            renderItem={renderItem}
          />
        </fieldset>
      ) : (
        <FocusedEntry entries={input.items} index={focus.index} onChange={(items) => setInput({ ...input, items })} render={renderItem} />
      )}
    </EditorShell>
  );
}
