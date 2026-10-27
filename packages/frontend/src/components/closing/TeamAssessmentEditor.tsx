import { useState } from 'react';
import type { DevelopmentAreaInput, TeamAssessmentInput, TeamCriterion, TeamCriterionInput, TeamRating } from '@shared/index';
import { teamApi } from '@/api/project-documents';
import { ArrayEditor } from '@/components/form/ArrayEditor';
import { EditorShell } from '@/components/form/EditorShell';
import { Field } from '@/components/form/Field';
import { DateInput, LinesInput, SelectInput, TextArea, TextInput } from '@/components/form/controls';
import { TEAM_CRITERION_GROUPS, TEAM_CRITERION_LABELS, TEAM_RATING_LABELS } from '@/lib/closing-format';
import { todayIso } from '@/lib/format';

const RATING_OPTIONS: { value: TeamRating | ''; label: string }[] = [
  { value: '', label: 'Non évalué' },
  ...(Object.keys(TEAM_RATING_LABELS) as TeamRating[]).map((value) => ({ value, label: TEAM_RATING_LABELS[value] })),
];

interface TeamAssessmentEditorProps {
  projectId: string;
  initialInput: TeamAssessmentInput;
  onCancel: () => void;
  onSaved: () => void;
}

/** Évaluation de la performance de l'équipe : neuf critères notés et commentés, axes de progression. */
export function TeamAssessmentEditor({ projectId, initialInput, onCancel, onSaved }: TeamAssessmentEditorProps) {
  const [input, setInput] = useState<TeamAssessmentInput>(initialInput);
  const patchCriterion = (criterion: TeamCriterion, changes: Partial<TeamCriterionInput>) =>
    setInput((current) => ({
      ...current,
      criteria: { ...current.criteria, [criterion]: { ...current.criteria[criterion], ...changes } },
    }));

  return (
    <EditorShell title="Évaluation de l'équipe" save={() => teamApi.save(projectId, input)} onCancel={onCancel} onSaved={onSaved}>
      <fieldset className="editor-section">
        <legend>Évaluation</legend>
        <div className="editor-grid editor-grid--3">
          <Field label="Évaluée le">
            <DateInput value={input.assessedOn} onChange={(assessedOn) => setInput({ ...input, assessedOn: assessedOn ?? todayIso() })} required />
          </Field>
        </div>
      </fieldset>

      {TEAM_CRITERION_GROUPS.map((group) => (
        <fieldset className="editor-section" key={group.title}>
          <legend>{group.title}</legend>
          {group.criteria.map((criterion) => (
            <div className="editor-grid editor-grid--narrow-wide" key={criterion}>
              <Field label={TEAM_CRITERION_LABELS[criterion]}>
                <SelectInput<TeamRating | ''>
                  value={input.criteria[criterion].rating ?? ''}
                  onChange={(rating) => patchCriterion(criterion, { rating: rating || null })}
                  options={RATING_OPTIONS}
                />
              </Field>
              <Field label="Commentaires">
                <TextArea
                  value={input.criteria[criterion].comments}
                  onChange={(comments) => patchCriterion(criterion, { comments })}
                  rows={2}
                />
              </Field>
            </div>
          ))}
        </fieldset>
      ))}

      <fieldset className="editor-section">
        <legend>Axes de progression ({input.developmentAreas.length})</legend>
        <ArrayEditor<DevelopmentAreaInput>
          items={input.developmentAreas}
          onChange={(developmentAreas) => setInput({ ...input, developmentAreas })}
          addLabel="Ajouter un axe"
          emptyLabel="Aucun axe de progression."
          makeEmpty={() => ({ area: '', approach: '', actions: [] })}
          renderItem={(area, update) => (
            <div className="editor-grid editor-grid--3">
              <Field label="Axe">
                <TextInput value={area.area} onChange={(value) => update({ area: value })} required />
              </Field>
              <Field label="Constat et approche">
                <TextArea value={area.approach} onChange={(approach) => update({ approach })} rows={3} />
              </Field>
              <Field label="Actions" hint="Une action par ligne.">
                <LinesInput value={area.actions} onChange={(actions) => update({ actions })} rows={3} />
              </Field>
            </div>
          )}
        />
      </fieldset>
    </EditorShell>
  );
}
