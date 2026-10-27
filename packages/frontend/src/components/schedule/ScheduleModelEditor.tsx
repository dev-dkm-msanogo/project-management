import { useId, useState } from 'react';
import type {
  ActivityInput,
  DependencyInput,
  DependencyType,
  DurationBasisInput,
  DurationMethod,
  EffortType,
  HolidayInput,
  MilestoneType,
  ScheduleMilestoneInput,
  ScheduleModelInput,
} from '@shared/index';
import { scheduleModelApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { CheckboxInput, DateInput, NumberInput, SelectInput, TextArea, TextInput } from '@/components/form/controls';
import { PersonSelect } from '@/components/people/People';
import { useProjectPlan } from '@/hooks/useProjectPlan';
import { nextCode } from '@/lib/codes';
import { todayIso } from '@/lib/format';
import {
  blankActivity,
  blankBasis,
  DEPENDENCY_LABELS,
  DEPENDENCY_TYPES,
  DURATION_METHODS,
  EFFORT_TYPE_LABELS,
  EFFORT_TYPES,
  estimatedDays,
  formatDays,
  METHOD_LABELS,
  MILESTONE_TYPE_LABELS,
  MILESTONE_TYPES,
  WEEKDAY_LABELS,
} from '@/lib/schedule-format';

/** Partie du modèle d'ordonnancement rédigée par la page. */
export type ScheduleSection = 'activities' | 'milestones' | 'baseline';

const TITLES: Record<ScheduleSection, string> = {
  activities: 'Activités et durées',
  milestones: 'Jalons et calendrier',
  baseline: "Référence de l'échéancier",
};

const METHOD_OPTIONS = DURATION_METHODS.map((value) => ({ value, label: METHOD_LABELS[value] }));
const EFFORT_OPTIONS = EFFORT_TYPES.map((value) => ({ value, label: EFFORT_TYPE_LABELS[value] }));
const DEPENDENCY_OPTIONS = DEPENDENCY_TYPES.map((value) => ({ value, label: DEPENDENCY_LABELS[value] }));
const MILESTONE_OPTIONS = MILESTONE_TYPES.map((value) => ({ value, label: MILESTONE_TYPE_LABELS[value] }));

interface ScheduleModelEditorProps {
  projectId: string;
  section: ScheduleSection;
  initialInput: ScheduleModelInput;
  onCancel: () => void;
  onSaved: () => void;
}

/** Rédaction d'une partie du modèle d'ordonnancement ; l'enregistrement porte sur le modèle entier. */
export function ScheduleModelEditor({ projectId, section, initialInput, onCancel, onSaved }: ScheduleModelEditorProps) {
  const [input, setInput] = useState<ScheduleModelInput>(initialInput);
  const patch = (changes: Partial<ScheduleModelInput>) => setInput((current) => ({ ...current, ...changes }));

  return (
    <EditorShell title={TITLES[section]} save={() => scheduleModelApi.save(projectId, input)} onCancel={onCancel} onSaved={onSaved}>
      {section === 'activities' && <ActivitiesSection projectId={projectId} input={input} patch={patch} />}
      {section === 'milestones' && <MilestonesSection input={input} patch={patch} />}
      {section === 'baseline' && <BaselineSection input={input} patch={patch} />}
    </EditorShell>
  );
}

interface SectionProps {
  input: ScheduleModelInput;
  patch: (changes: Partial<ScheduleModelInput>) => void;
}

function ActivitiesSection({ projectId, input, patch }: SectionProps & { projectId: string }) {
  const { data: plan } = useProjectPlan(projectId);
  const peopleId = useId();
  const wbsOptions = (plan?.tasks ?? []).map((task) => ({ value: task.wbs, label: `${task.wbs} · ${task.name}` }));

  // Renommer ou retirer une activité met à jour les prédécesseurs qui la citent.
  const setActivities = (activities: ActivityInput[]) => {
    const renamed = new Map<string, string>();
    if (activities.length === input.activities.length) {
      activities.forEach((activity, index) => {
        const before = input.activities[index]!.code;
        if (before !== activity.code) renamed.set(before, activity.code);
      });
    }
    const kept = new Set(activities.map((activity) => activity.code));
    patch({
      activities: activities.map((activity) => ({
        ...activity,
        predecessors: activity.predecessors
          .map((dependency) => ({ ...dependency, activity: renamed.get(dependency.activity) ?? dependency.activity }))
          .filter((dependency) => kept.has(dependency.activity)),
      })),
    });
  };

  return (
    <>
      <fieldset className="editor-section">
        <legend>Modèle d'ordonnancement</legend>
        <div className="editor-grid editor-grid--fluid">
          <Field label="Date de préparation">
            <DateInput value={input.preparedOn} onChange={(preparedOn) => patch({ preparedOn: preparedOn ?? todayIso() })} required />
          </Field>
          <Field label="Début du réseau" hint="Les activités sans prédécesseur commencent au premier jour ouvré.">
            <DateInput value={input.projectStart} onChange={(projectStart) => patch({ projectStart: projectStart ?? todayIso() })} required />
          </Field>
        </div>
      </fieldset>

      <fieldset className="editor-section">
        <legend>Activités ({input.activities.length})</legend>
        <ArrayEditor<ActivityInput>
          items={input.activities}
          onChange={setActivities}
          addLabel="Ajouter une activité"
          emptyLabel="Aucune activité."
          makeEmpty={() => blankActivity(nextCode(input.activities, 'A'), wbsOptions[0]?.value ?? '1')}
          renderItem={(activity, update) => (
            <ActivityForm
              activity={activity}
              update={update}
              others={input.activities.map((other) => other.code).filter((code) => code && code !== activity.code)}
              wbsOptions={wbsOptions}
              peopleId={peopleId}
            />
          )}
        />
      </fieldset>
    </>
  );
}

interface ActivityFormProps {
  activity: ActivityInput;
  update: (changes: Partial<ActivityInput>) => void;
  others: string[];
  wbsOptions: { value: string; label: string }[];
  peopleId: string;
}

function ActivityForm({ activity, update, others, wbsOptions, peopleId }: ActivityFormProps) {
  const known = wbsOptions.some((option) => option.value === activity.wbsCode);
  const options = known ? wbsOptions : [{ value: activity.wbsCode, label: `${activity.wbsCode} (absent de la WBS)` }, ...wbsOptions];
  const computed = activity.basis ? estimatedDays(activity.basis, activity.effortHours) : null;

  return (
    <div className="entry-form">
      <section className="entry-form__step">
        <h4 className="entry-form__step-title">Activité</h4>
        <div className="editor-grid editor-grid--3">
          <Field label="Code">
            <TextInput value={activity.code} onChange={(code) => update({ code })} required />
          </Field>
          <Field label="Élément WBS">
            <SelectInput<string> value={activity.wbsCode} onChange={(wbsCode) => update({ wbsCode })} options={options} />
          </Field>
          <Field label="Responsable">
            <PersonSelect value={activity.ownerId || null} onChange={(id) => update({ ownerId: id ?? '' })} />
          </Field>
        </div>
        <Field label="Intitulé">
          <TextInput value={activity.name} onChange={(name) => update({ name })} required />
        </Field>
        <Field label="Description du travail">
          <TextArea value={activity.description} onChange={(description) => update({ description })} rows={2} />
        </Field>
      </section>

      <section className="entry-form__step">
        <h4 className="entry-form__step-title">Durée</h4>
        <div className="editor-grid editor-grid--3">
          <Field label="Effort (heures)">
            <NumberInput value={activity.effortHours} onChange={(effortHours) => update({ effortHours })} min={0} step={1} />
          </Field>
          <Field label="Méthode d'estimation">
            <SelectInput<DurationMethod>
              value={activity.method}
              onChange={(method) => update({ method, basis: activity.basis ? blankBasis(method) : null })}
              options={METHOD_OPTIONS}
            />
          </Field>
          <Field label="Durée retenue (jours ouvrés)" hint="0 pour un jalon.">
            <NumberInput value={activity.durationDays} onChange={(durationDays) => update({ durationDays })} min={0} step={1} />
          </Field>
        </div>
        <CheckboxInput
          label="Détailler l'estimation (feuille d'estimation)"
          checked={activity.basis !== null}
          onChange={(checked) => update({ basis: checked ? blankBasis(activity.method) : null })}
        />
        {activity.basis && (
          <>
            <BasisFields basis={activity.basis} onChange={(basis) => update({ basis })} />
            <p className="schedule-estimate">
              Durée calculée : <strong>{computed === null ? '—' : `${formatDays(computed)} j`}</strong>
              {computed !== null && Math.round(computed) !== activity.durationDays && (
                <button
                  type="button"
                  className="ref-link"
                  onClick={() => update({ durationDays: Math.max(0, Math.round(computed)) })}
                >
                  Retenir {Math.max(0, Math.round(computed))} j
                </button>
              )}
            </p>
          </>
        )}
      </section>

      <section className="entry-form__step">
        <h4 className="entry-form__step-title">Prédécesseurs</h4>
        <ArrayEditor<DependencyInput>
          items={activity.predecessors}
          onChange={(predecessors) => update({ predecessors })}
          addLabel="Ajouter un prédécesseur"
          emptyLabel="Aucun prédécesseur : l'activité démarre au début du réseau."
          makeEmpty={() => ({ activity: others[0] ?? '', type: 'FS', lagDays: 0 })}
          renderItem={(dependency, change) => (
            <div className="editor-grid editor-grid--3">
              <Field label="Activité">
                <SelectInput<string>
                  value={dependency.activity}
                  onChange={(code) => change({ activity: code })}
                  options={others.map((code) => ({ value: code, label: code }))}
                />
              </Field>
              <Field label="Relation">
                <SelectInput<DependencyType> value={dependency.type} onChange={(type) => change({ type })} options={DEPENDENCY_OPTIONS} />
              </Field>
              <Field label="Avance (–) ou décalage (+), en jours">
                <NumberInput value={dependency.lagDays} onChange={(lagDays) => change({ lagDays })} min={-365} max={365} step={1} />
              </Field>
            </div>
          )}
        />
      </section>

      <section className="entry-form__step">
        <h4 className="entry-form__step-title">Attributs</h4>
        <div className="editor-grid">
          <Field label="Type d'effort">
            <SelectInput<EffortType> value={activity.effortType} onChange={(effortType) => update({ effortType })} options={EFFORT_OPTIONS} />
          </Field>
          <Field label="Lieu de réalisation">
            <TextInput value={activity.location} onChange={(location) => update({ location })} />
          </Field>
          <Field label="Ressources requises">
            <TextInput value={activity.resources} onChange={(resources) => update({ resources })} />
          </Field>
          <Field label="Compétences">
            <TextInput value={activity.skills} onChange={(skills) => update({ skills })} />
          </Field>
          <Field label="Contraintes">
            <TextInput value={activity.constraints} onChange={(constraints) => update({ constraints })} />
          </Field>
          <Field label="Hypothèses">
            <TextInput value={activity.assumptions} onChange={(assumptions) => update({ assumptions })} />
          </Field>
        </div>
      </section>
    </div>
  );
}

function BasisFields({ basis, onChange }: { basis: DurationBasisInput; onChange: (basis: DurationBasisInput) => void }) {
  const number = (value: number, set: (value: number) => DurationBasisInput, step = 1) => (
    <NumberInput value={value} onChange={(next) => onChange(set(next))} min={0} step={step} />
  );
  switch (basis.method) {
    case 'ANALOGOUS':
      return (
        <div className="editor-grid editor-grid--3">
          <Field label="Activité de référence">
            <TextInput value={basis.reference} onChange={(reference) => onChange({ ...basis, reference })} />
          </Field>
          <Field label="Durée de référence (jours)">{number(basis.referenceDays, (referenceDays) => ({ ...basis, referenceDays }), 0.5)}</Field>
          <Field label="Coefficient d'ajustement">{number(basis.multiplier, (multiplier) => ({ ...basis, multiplier }), 0.1)}</Field>
        </div>
      );
    case 'PARAMETRIC':
      return (
        <div className="editor-grid editor-grid--4">
          <Field label="Ressources">{number(basis.resourceCount, (resourceCount) => ({ ...basis, resourceCount }))}</Field>
          <Field label="Heures par jour">{number(basis.hoursPerDay, (hoursPerDay) => ({ ...basis, hoursPerDay }), 0.5)}</Field>
          <Field label="Disponibilité (%)">{number(basis.availability, (availability) => ({ ...basis, availability }), 5)}</Field>
          <Field label="Facteur de performance">
            {number(basis.performanceFactor, (performanceFactor) => ({ ...basis, performanceFactor }), 0.1)}
          </Field>
        </div>
      );
    case 'THREE_POINT':
      return (
        <div className="editor-grid editor-grid--3">
          <Field label="Optimiste (jours)">{number(basis.optimistic, (optimistic) => ({ ...basis, optimistic }), 0.5)}</Field>
          <Field label="Plus probable (jours)">{number(basis.mostLikely, (mostLikely) => ({ ...basis, mostLikely }), 0.5)}</Field>
          <Field label="Pessimiste (jours)">{number(basis.pessimistic, (pessimistic) => ({ ...basis, pessimistic }), 0.5)}</Field>
        </div>
      );
  }
}

function MilestonesSection({ input, patch }: SectionProps) {
  const { calendar } = input;
  const setCalendar = (changes: Partial<ScheduleModelInput['calendar']>) => patch({ calendar: { ...calendar, ...changes } });

  return (
    <>
      <fieldset className="editor-section">
        <legend>Jalons ({input.milestones.length})</legend>
        <ArrayEditor<ScheduleMilestoneInput>
          items={input.milestones}
          onChange={(milestones) => patch({ milestones })}
          addLabel="Ajouter un jalon"
          emptyLabel="Aucun jalon."
          makeEmpty={() => ({ code: nextCode(input.milestones, 'J'), name: '', description: '', type: 'MAJOR', targetDate: todayIso(), achievedOn: null })}
          renderItem={(milestone, update) => (
            <div className="entry-form">
              <section className="entry-form__step">
                <div className="editor-grid editor-grid--3">
                  <Field label="Code">
                    <TextInput value={milestone.code} onChange={(code) => update({ code })} required />
                  </Field>
                  <Field label="Type">
                    <SelectInput<MilestoneType> value={milestone.type} onChange={(type) => update({ type })} options={MILESTONE_OPTIONS} />
                  </Field>
                  <Field label="Date cible">
                    <DateInput value={milestone.targetDate} onChange={(date) => update({ targetDate: date ?? todayIso() })} required />
                  </Field>
                </div>
                <Field label="Atteint le" hint="À renseigner quand le jalon est atteint : le rapport exécutif le reprend.">
                  <DateInput value={milestone.achievedOn} onChange={(achievedOn) => update({ achievedOn })} />
                </Field>
                <Field label="Jalon">
                  <TextInput value={milestone.name} onChange={(name) => update({ name })} required />
                </Field>
                <Field label="Description">
                  <TextInput value={milestone.description} onChange={(description) => update({ description })} />
                </Field>
              </section>
            </div>
          )}
        />
      </fieldset>

      <fieldset className="editor-section">
        <legend>Calendrier du projet</legend>
        <div className="pattern-options" role="group" aria-label="Jours ouvrés">
          {WEEKDAY_LABELS.map((label, index) => (
            <CheckboxInput
              key={label}
              label={label}
              checked={calendar.workingWeekdays.includes(index + 1)}
              onChange={(checked) =>
                setCalendar({
                  workingWeekdays: checked
                    ? [...calendar.workingWeekdays, index + 1].sort((a, b) => a - b)
                    : calendar.workingWeekdays.filter((day) => day !== index + 1),
                })
              }
            />
          ))}
        </div>
        <ArrayEditor<HolidayInput>
          items={calendar.holidays}
          onChange={(holidays) => setCalendar({ holidays })}
          addLabel="Ajouter un jour férié"
          emptyLabel="Aucun jour férié."
          makeEmpty={() => ({ date: todayIso(), name: '' })}
          renderItem={(holiday, update) => (
            <div className="editor-grid editor-grid--holiday">
              <Field label="Date">
                <DateInput value={holiday.date} onChange={(date) => update({ date: date ?? todayIso() })} required />
              </Field>
              <Field label="Jour férié">
                <TextInput value={holiday.name} onChange={(name) => update({ name })} required />
              </Field>
            </div>
          )}
        />
        <Field label="Notes">
          <TextArea value={calendar.notes} onChange={(notes) => setCalendar({ notes })} rows={2} />
        </Field>
      </fieldset>
    </>
  );
}

function BaselineSection({ input, patch }: SectionProps) {
  const { baseline } = input;
  const setBaseline = (changes: Partial<ScheduleModelInput['baseline']>) => patch({ baseline: { ...baseline, ...changes } });

  return (
    <fieldset className="editor-section">
      <legend>Référence de l'échéancier</legend>
      <Field label="Objet de la référence">
        <TextArea value={baseline.purpose} onChange={(purpose) => setBaseline({ purpose })} rows={3} />
      </Field>
      <Field label="Composants">
        <TextArea value={baseline.components} onChange={(components) => setBaseline({ components })} rows={3} />
      </Field>
      <p className="editor-section__note">La référence est approuvée avec le plan de management du projet.</p>
    </fieldset>
  );
}
