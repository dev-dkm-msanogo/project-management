import { useState } from 'react';
import type { BacklogItemInput, BacklogItemStatus, BacklogItemType, BacklogPriority, ProductBacklogDto, ProductBacklogInput } from '@shared/index';
import { STORY_POINTS } from '@shared/index';
import { backlogApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { FocusedEntry, useEntryFocus, type EntryTarget } from '@/components/form/EntryFocus';
import { Field } from '@/components/form/Field';
import { DateInput, SelectInput, TextArea, TextInput } from '@/components/form/controls';
import { PersonSelect } from '@/components/people/People';
import { useCurrentProject } from '@/hooks/useCurrentProject';
import { useRequirementsRegister } from '@/hooks/useProjectDocuments';
import { blankItem, ITEM_STATUS_LABELS, ITEM_TYPE_LABELS, productBacklogDtoToInput, withStatus } from '@/lib/agile-format';
import { todayIso } from '@/lib/format';
import { PRIORITY_DESCRIPTIONS } from '@/lib/requirements-format';

const options = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));

const POINT_OPTIONS = [{ value: '', label: 'Non estimé' }, ...STORY_POINTS.map((points) => ({ value: String(points), label: `${points}` }))];

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

/** Rédaction d'un élément du carnet de produit ; le reste du carnet est enregistré tel quel. */
export function BacklogItemEditor({ projectId, backlog, target, newType = 'STORY', onCancel, onSaved }: BacklogItemEditorProps) {
  const initial = productBacklogDtoToInput(backlog);
  const focus = useEntryFocus({
    entries: initial.items,
    keyOf: (item) => item.code,
    target,
    blank: () => blankItem(initial.items, newType),
    labels: {
      create: newType === 'EPIC' ? 'Nouvelle épopée' : 'Nouvel élément du carnet',
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

  const renderItem = (item: BacklogItemInput, update: (changes: Partial<BacklogItemInput>) => void) => {
    const epic = item.type === 'EPIC';
    const setType = (type: BacklogItemType) =>
      update(type === 'EPIC' ? { type, points: null, iterationCode: null, epicCode: null } : { type });
    return (
      <div className="entry-form">
        <section className="entry-form__step">
          <div className="editor-grid editor-grid--3">
            <Field label="Code">
              <TextInput value={item.code} onChange={(code) => update({ code })} required />
            </Field>
            <Field label="Type">
              <SelectInput<BacklogItemType> value={item.type} onChange={setType} options={options(ITEM_TYPE_LABELS)} />
            </Field>
            <Field label="Priorité">
              <SelectInput<BacklogPriority>
                value={item.priority}
                onChange={(priority) => update({ priority })}
                options={options(PRIORITY_DESCRIPTIONS)}
              />
            </Field>
          </div>
          <Field label="Titre">
            <TextInput value={item.title} onChange={(title) => update({ title })} required />
          </Field>
          <div className="editor-grid">
            <Field label="Description" hint={epic ? undefined : 'En tant que …, je veux … afin de …'}>
              <TextArea value={item.description} onChange={(description) => update({ description })} rows={3} />
            </Field>
            <Field label="Critères d'acceptation">
              <TextArea value={item.acceptanceCriteria} onChange={(acceptanceCriteria) => update({ acceptanceCriteria })} rows={3} />
            </Field>
          </div>
        </section>
        {!epic && (
          <section className="entry-form__step">
            <div className="editor-grid editor-grid--3">
              <Field label="Estimation (points)">
                <SelectInput
                  value={item.points === null ? '' : String(item.points)}
                  onChange={(points) => update({ points: points === '' ? null : Number(points) })}
                  options={POINT_OPTIONS}
                />
              </Field>
              <Field label="Statut">
                <SelectInput<BacklogItemStatus>
                  value={item.status}
                  onChange={(status) => update(withStatus(item, status))}
                  options={options(ITEM_STATUS_LABELS)}
                />
              </Field>
              {item.status === 'DONE' && (
                <Field label="Terminé le">
                  <DateInput value={item.doneOn} onChange={(doneOn) => update({ doneOn: doneOn ?? todayIso() })} required />
                </Field>
              )}
            </div>
            <div className="editor-grid editor-grid--3">
              <Field label="Itération">
                <SelectInput value={item.iterationCode ?? ''} onChange={(code) => update({ iterationCode: code || null })} options={iterationOptions} />
              </Field>
              <Field label="Épopée">
                <SelectInput value={item.epicCode ?? ''} onChange={(code) => update({ epicCode: code || null })} options={epicOptions} />
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
              <SelectInput
                value={item.requirementCode ?? ''}
                onChange={(code) => update({ requirementCode: code || null })}
                options={requirementOptions}
              />
            </Field>
            {!epic && (methodology === 'HYBRID' || item.wbsCode) && (
              <Field label="Lot de la WBS" hint="Le lot prend son avancement des points terminés de ses éléments.">
                <SelectInput value={item.wbsCode ?? ''} onChange={(code) => update({ wbsCode: code || null })} options={workPackageOptions} />
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
      extraActions={focus.deleteAction}
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
