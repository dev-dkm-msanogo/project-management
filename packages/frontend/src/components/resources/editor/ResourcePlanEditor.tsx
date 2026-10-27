import { useState } from 'react';
import type { ResourceManagementPlanInput, ResourceRoleInput } from '@shared/index';
import { resourcePlanApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { DateInput, SelectInput, TextArea, TextInput } from '@/components/form/controls';
import { PersonSelect } from '@/components/people/People';
import type { DocumentEditorProps } from '@/features/DocumentFeature';
import { todayIso } from '@/lib/format';
import { RESOURCE_PLAN_SECTIONS } from '@/lib/resource-format';

type SectionKey = keyof typeof RESOURCE_PLAN_SECTIONS;

const GROUPS: { legend: string; keys: SectionKey[] }[] = [
  { legend: "Acquisition et libération de l'équipe", keys: ['staffAcquisition', 'staffRelease'] },
  { legend: "Formation, reconnaissance et développement de l'équipe", keys: ['training', 'rewards', 'teamDevelopment'] },
  { legend: 'Ressources physiques', keys: ['resourceAcquisition', 'resourceManagement'] },
];

const TOP = '';

/** Rédaction du plan de gestion des ressources : rôles (organigramme) et rubriques du template. */
export function ResourcePlanEditor({
  projectId,
  mode,
  initialInput,
  onCancel,
  onSaved,
}: DocumentEditorProps<ResourceManagementPlanInput> & { projectId: string }) {
  const [input, setInput] = useState<ResourceManagementPlanInput>(initialInput);
  const patch = (changes: Partial<ResourceManagementPlanInput>) => setInput((current) => ({ ...current, ...changes }));

  // Renommer un rôle : ses subordonnés restent rattachés à lui.
  const renameRole = (index: number, name: string) =>
    setInput((current) => {
      const previous = current.roles[index]!.role;
      return {
        ...current,
        roles: current.roles.map((role, i) =>
          i === index ? { ...role, role: name } : role.reportsTo === previous && previous ? { ...role, reportsTo: name } : role,
        ),
      };
    });

  const renderRole = (role: ResourceRoleInput, update: (changes: Partial<ResourceRoleInput>) => void, index: number) => {
    const superiors = input.roles
      .filter((other, i) => i !== index && other.role.trim())
      .map((other) => ({ value: other.role, label: other.role }));
    return (
      <div className="entry-form">
        <section className="entry-form__step">
          <div className="editor-grid editor-grid--fluid">
            <Field label="Rôle">
              <TextInput value={role.role} onChange={(name) => renameRole(index, name)} required />
            </Field>
            <Field label="Titulaire">
              <PersonSelect value={role.holderId || null} onChange={(id) => update({ holderId: id ?? '' })} optional />
            </Field>
            <Field label="Rattaché à">
              <SelectInput
                value={role.reportsTo ?? TOP}
                onChange={(value) => update({ reportsTo: value === TOP ? null : value })}
                options={[{ value: TOP, label: "— Sommet de l'organigramme —" }, ...superiors]}
              />
            </Field>
          </div>
          <div className="editor-grid">
            <Field label="Responsabilités">
              <TextArea value={role.responsibility} onChange={(responsibility) => update({ responsibility })} rows={2} />
            </Field>
            <Field label="Autorité">
              <TextArea value={role.authority} onChange={(authority) => update({ authority })} rows={2} />
            </Field>
          </div>
        </section>
      </div>
    );
  };

  return (
    <EditorShell
      title={mode === 'create' ? 'Nouveau plan de gestion des ressources' : 'Plan de gestion des ressources'}
      save={() => resourcePlanApi.save(projectId, input)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <p className="editor__info">
        L'équipe et les ressources physiques du plan proviennent des besoins en ressources : mettez-les à jour sur cette
        page.
      </p>

      <fieldset className="editor-section">
        <legend>Rôles, responsabilités et autorité ({input.roles.length})</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(date) => patch({ preparedOn: date ?? todayIso() })} required />
          </Field>
        </div>
        <ArrayEditor<ResourceRoleInput>
          items={input.roles}
          onChange={(roles) => patch({ roles })}
          addLabel="Ajouter un rôle"
          emptyLabel="Aucun rôle."
          makeEmpty={() => ({ role: '', holderId: '', responsibility: '', authority: '', reportsTo: null })}
          renderItem={renderRole}
        />
      </fieldset>

      {GROUPS.map((group) => (
        <fieldset key={group.legend} className="editor-section">
          <legend>{group.legend}</legend>
          {group.keys.map((key) => (
            <Field key={key} label={RESOURCE_PLAN_SECTIONS[key].label} hint={RESOURCE_PLAN_SECTIONS[key].hint}>
              <TextArea value={input[key]} onChange={(text) => patch({ [key]: text })} rows={3} />
            </Field>
          ))}
        </fieldset>
      ))}
    </EditorShell>
  );
}
