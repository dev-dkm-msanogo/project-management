import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type {
  ActivityInput,
  ProjectPlanDto,
  ScheduleModelDto,
  ScheduleModelInput,
  SchedulePreviewDto,
  ScheduledActivityDto,
  ScheduleMilestoneInput,
  TaskDto,
} from '@shared/index';
import { previewSchedule } from '@/api/plan-client';
import { scheduleModelApi } from '@/api/project-documents';
import { Field } from '@/components/form/Field';
import { DateInput, NumberInput } from '@/components/form/controls';
import { useUnsavedChanges } from '@/components/form/UnsavedChanges';
import { PageActions } from '@/components/header/PageActions';
import { formatShortDate } from '@/lib/format';
import { addDays, dayDiff, maxIso, minIso, workingDaysBetween } from '@/lib/gantt-format';
import { phasePalette } from '@/lib/plan-format';
import { dependencyLabel, isNonWorkingDay, scheduleModelDtoToInput } from '@/lib/schedule-format';

const LABEL_W = 270;
const ROW_H = 26;
const PAD_TOP = 34;
const RIGHT = 16;
const MONTH_FMT = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric', timeZone: 'UTC' });

type Row =
  | { kind: 'milestone'; milestone: ScheduleMilestoneInput }
  | { kind: 'wbs'; task: TaskDto; dates: { start: string; end: string } | null; scheduled: boolean }
  | { kind: 'activity'; activity: ActivityInput; scheduled: ScheduledActivityDto };

type Drag = { code: string; mode: 'move' | 'resize'; originX: number; delta: number };

interface ScheduleGanttProps {
  projectId: string;
  plan: ProjectPlanDto;
  model: ScheduleModelDto;
  /** Rédacteur et échéancier non figé par une approbation. */
  editable: boolean;
  onSaved: () => void;
}

const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/**
 * Gantt de l'échéancier unifié : la WBS, ses activités (le réseau en fixe les dates), les jalons, les
 * dépendances et le chemin critique. Déplacer une barre fixe un « début au plus tôt », l'étirer change
 * sa durée ; tout se recalcule à l'écran, puis « Enregistrer » crée une seule version.
 */
export function ScheduleGantt({ projectId, plan, model, editable, onSaved }: ScheduleGanttProps) {
  const original = useMemo(() => scheduleModelDtoToInput(model), [model]);
  const [draft, setDraft] = useState<ScheduleModelInput | null>(null);
  const [preview, setPreview] = useState<SchedulePreviewDto | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [status, setStatus] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });
  const request = useRef(0);
  const editorId = useId();
  const { setDirty } = useUnsavedChanges();

  useEffect(() => {
    setDirty(editorId, draft !== null);
    return () => setDirty(editorId, false);
  }, [editorId, draft, setDirty]);

  const input = draft ?? original;
  const network = preview?.network ?? model.network;
  const wbsDates = preview?.wbsDates ?? model.wbsDates;
  const scheduledByCode = new Map(network.activities.map((activity) => [activity.code, activity]));

  // Lignes : jalons, puis chaque élément de la WBS suivi de ses activités (dans l'ordre du réseau).
  const rows: Row[] = [
    ...input.milestones.map((milestone): Row => ({ kind: 'milestone', milestone })),
    ...plan.tasks.flatMap((task): Row[] => {
      const scheduled = wbsDates[task.wbs];
      const dates = scheduled ?? (task.start && task.end ? { start: task.start, end: task.end } : null);
      const activities = input.activities
        .filter((activity) => activity.wbsCode === task.wbs && scheduledByCode.has(activity.code))
        .map((activity): Row => ({ kind: 'activity', activity, scheduled: scheduledByCode.get(activity.code)! }))
        .sort((a, b) => (a.kind === 'activity' && b.kind === 'activity' ? a.scheduled.earlyStart.localeCompare(b.scheduled.earlyStart) : 0));
      return [{ kind: 'wbs', task, dates, scheduled: Boolean(scheduled) }, ...activities];
    }),
  ];

  const allDates = rows.flatMap((row) =>
    row.kind === 'milestone'
      ? [row.milestone.targetDate, ...(row.milestone.achievedOn ? [row.milestone.achievedOn] : [])]
      : row.kind === 'wbs'
        ? row.dates
          ? [row.dates.start, row.dates.end]
          : []
        : [row.scheduled.earlyStart, row.scheduled.earlyFinish],
  );
  if (allDates.length === 0) return <p className="plan__empty">Aucune date à représenter.</p>;

  const rangeStart = addDays(minIso(allDates), -2);
  const rangeEnd = addDays(maxIso(allDates), 3);
  const totalDays = dayDiff(rangeStart, rangeEnd) + 1;
  const dayW = Math.min(28, Math.max(7, 980 / totalDays));
  const width = LABEL_W + totalDays * dayW + RIGHT;
  const height = PAD_TOP + rows.length * ROW_H + 8;
  const x = (iso: string) => LABEL_W + dayDiff(rangeStart, iso) * dayW;
  const span = (start: string, end: string) => Math.max((dayDiff(start, end) + 1) * dayW, 3);
  const rowY = (index: number) => PAD_TOP + index * ROW_H;

  const days = Array.from({ length: totalDays }, (_, index) => addDays(rangeStart, index));
  const months = days.filter((day, index) => index === 0 || day.endsWith('-01'));

  // --- Modifications : brouillon recalculé par le serveur (réseau et dates de la WBS) ---
  const recompute = (next: ScheduleModelInput) => {
    const ticket = (request.current += 1);
    setStatus({ busy: true, error: null });
    previewSchedule(projectId, next)
      .then((result) => {
        if (ticket === request.current) {
          setPreview(result);
          setStatus({ busy: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (ticket === request.current) setStatus({ busy: false, error: error instanceof Error ? error.message : 'Erreur inconnue.' });
      });
  };
  const changeActivity = (code: string, changes: Partial<ActivityInput>) => {
    const next = { ...input, activities: input.activities.map((activity) => (activity.code === code ? { ...activity, ...changes } : activity)) };
    setDraft(next);
    setSelected(code);
    recompute(next);
  };
  const applyDelta = (code: string, mode: Drag['mode'], delta: number) => {
    const scheduled = scheduledByCode.get(code);
    if (!scheduled || delta === 0) return;
    if (mode === 'move') {
      changeActivity(code, { startNoEarlierThan: addDays(scheduled.earlyStart, delta) });
    } else {
      const end = maxIso([scheduled.earlyStart, addDays(scheduled.earlyFinish, delta)]);
      changeActivity(code, { durationDays: Math.max(1, workingDaysBetween(scheduled.earlyStart, end, input.calendar)) });
    }
  };
  const cancel = () => {
    request.current += 1;
    setDraft(null);
    setPreview(null);
    setStatus({ busy: false, error: null });
  };
  const save = async () => {
    if (!draft) return;
    setStatus({ busy: true, error: null });
    try {
      await scheduleModelApi.save(projectId, draft);
      setDraft(null);
      setPreview(null);
      setStatus({ busy: false, error: null });
      onSaved();
    } catch (error) {
      setStatus({ busy: false, error: error instanceof Error ? error.message : 'Erreur inconnue.' });
    }
  };

  // --- Gestes : glisser (début au plus tôt), étirer la fin (durée), flèches du clavier ---
  const startDrag = (event: PointerEvent<SVGElement>, code: string, mode: Drag['mode']) => {
    if (!editable) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ code, mode, originX: event.clientX, delta: 0 });
  };
  const moveDrag = (event: PointerEvent<SVGElement>) => {
    if (drag) setDrag({ ...drag, delta: Math.round((event.clientX - drag.originX) / dayW) });
  };
  const endDrag = () => {
    if (!drag) return;
    if (drag.delta === 0) setSelected(drag.code);
    else applyDelta(drag.code, drag.mode, drag.delta);
    setDrag(null);
  };
  const onKey = (event: KeyboardEvent<SVGGElement>, code: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelected(code);
    } else if (editable && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      applyDelta(code, event.shiftKey ? 'resize' : 'move', event.key === 'ArrowRight' ? 1 : -1);
    }
  };

  // Dépendances : extrémité de la barre selon la relation (fin-début, début-début, fin-fin, début-fin).
  const bars = new Map<string, { y: number; start: number; end: number }>();
  rows.forEach((row, index) => {
    if (row.kind === 'activity') {
      const start = x(row.scheduled.earlyStart);
      bars.set(row.activity.code, { y: rowY(index) + ROW_H / 2, start, end: start + span(row.scheduled.earlyStart, row.scheduled.earlyFinish) });
    }
  });
  const links = input.activities.flatMap((activity) => {
    const to = bars.get(activity.code);
    return activity.predecessors.flatMap((dependency) => {
      const from = bars.get(dependency.activity);
      if (!from || !to) return [];
      const x1 = dependency.type === 'FS' || dependency.type === 'FF' ? from.end : from.start;
      const x2 = dependency.type === 'FS' || dependency.type === 'SS' ? to.start : to.end;
      const bend = Math.max(x1 + 6, Math.min(x2 - 6, x1 + 6));
      return [{ key: `${dependency.activity}-${activity.code}`, d: `M ${x1} ${from.y} H ${bend} V ${to.y} H ${x2}` }];
    });
  });

  const selectedActivity = input.activities.find((activity) => activity.code === selected) ?? null;
  const selectedScheduled = selected ? scheduledByCode.get(selected) : undefined;

  return (
    <>
      {editable && draft && (
        <PageActions>
          <button type="button" className="btn btn--ghost" onClick={cancel} disabled={status.busy}>
            Annuler les modifications
          </button>
          <button type="button" className="btn btn--primary" onClick={() => void save()} disabled={status.busy}>
            {status.busy ? 'Calcul…' : "Enregistrer l'échéancier"}
          </button>
        </PageActions>
      )}

      <div className="gantt-toolbar">
        <span>
          Fin du projet : <strong>{formatShortDate(network.finish)}</strong> · {network.workingDays} jours ouvrés · chemin
          critique : <strong>{network.criticalPath.join(' → ') || '—'}</strong>
        </span>
        <span className="gantt-legend" aria-hidden="true">
          <span className="gantt-legend__item gantt-legend__item--activity">Activité</span>
          <span className="gantt-legend__item gantt-legend__item--critical">Critique</span>
          <span className="gantt-legend__item gantt-legend__item--summary">Lot planifié par le réseau</span>
          <span className="gantt-legend__item gantt-legend__item--milestone">Jalon</span>
        </span>
      </div>
      {editable && (
        <p className="gantt-help">
          Glissez une activité pour fixer son début au plus tôt, étirez son extrémité droite pour changer sa durée (ou
          sélectionnez-la et utilisez ← → ; Maj + ← → pour la durée). Le réseau se recalcule ; rien n'est enregistré avant
          « Enregistrer l'échéancier ».
        </p>
      )}
      {draft && <p className="restore-note" role="status">Échéancier modifié, non enregistré : dates et chemin critique recalculés à l'écran.</p>}
      {status.error && (
        <p className="editor__error" role="alert">
          {status.error}
        </p>
      )}

      <div className="gantt-scroll">
        <svg
          className={`gantt-net${editable ? ' gantt-net--editable' : ''}`}
          width={width}
          height={height}
          role="group"
          aria-label="Diagramme de Gantt de l'échéancier"
        >
          <defs>
            <marker id={`${editorId}-arrow`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" className="gantt__arrow" />
            </marker>
          </defs>

          {/* Jours non ouvrés et mois */}
          {days.map((day) =>
            isNonWorkingDay(day, input.calendar) ? (
              <rect key={day} className="gantt__offday" x={x(day)} y={PAD_TOP - 4} width={dayW} height={height - PAD_TOP} />
            ) : null,
          )}
          {months.map((day) => (
            <g key={`m-${day}`}>
              <line className="gantt__grid" x1={x(day)} y1={PAD_TOP - 10} x2={x(day)} y2={height} />
              <text className="gantt__axis" x={x(day) + 3} y={16}>
                {MONTH_FMT.format(new Date(`${day}T00:00:00Z`))}
              </text>
            </g>
          ))}

          {rows.map((row, index) => {
            const y = rowY(index);
            const stripe = index % 2 === 1 ? <rect className="gantt__stripe" x={0} y={y} width={width} height={ROW_H} /> : null;
            if (row.kind === 'milestone') {
              const at = x(row.milestone.achievedOn ?? row.milestone.targetDate) + dayW / 2;
              return (
                <g key={`ms-${row.milestone.code}`}>
                  {stripe}
                  <text className="gantt__label gantt__label--milestone" x={8} y={y + ROW_H / 2} dominantBaseline="middle">
                    {truncate(`◆ ${row.milestone.code}  ${row.milestone.name}`, 40)}
                  </text>
                  <path
                    className={`gantt__milestone${row.milestone.achievedOn ? ' gantt__milestone--done' : ''}`}
                    d={`M ${at} ${y + 5} L ${at + 8} ${y + ROW_H / 2} L ${at} ${y + ROW_H - 5} L ${at - 8} ${y + ROW_H / 2} Z`}
                  >
                    <title>{`${row.milestone.code} ${row.milestone.name} : ${formatShortDate(row.milestone.targetDate)}${row.milestone.achievedOn ? ` (atteint le ${formatShortDate(row.milestone.achievedOn)})` : ''}`}</title>
                  </path>
                </g>
              );
            }
            if (row.kind === 'wbs') {
              const { task, dates } = row;
              return (
                <g key={`wbs-${task.wbs}`}>
                  {stripe}
                  <text className={`gantt__label${task.level === 1 ? ' gantt__label--phase' : ''}`} x={8} y={y + ROW_H / 2} dominantBaseline="middle">
                    {truncate(`${task.wbs}  ${task.name}`, 40)}
                  </text>
                  {dates &&
                    (row.scheduled ? (
                      <path
                        className="gantt__summary"
                        d={`M ${x(dates.start)} ${y + 8} h ${span(dates.start, dates.end)} v 9 l -4 -4 H ${x(dates.start) + 4} l -4 4 Z`}
                      >
                        <title>{`${task.wbs} ${task.name} : ${formatShortDate(dates.start)} → ${formatShortDate(dates.end)} (dates du réseau)`}</title>
                      </path>
                    ) : (
                      <rect
                        x={x(dates.start)}
                        y={y + 7}
                        width={span(dates.start, dates.end)}
                        height={ROW_H - 14}
                        rx={3}
                        fill={phasePalette(task.wbs).solid}
                        fillOpacity={0.35}
                      >
                        <title>{`${task.wbs} ${task.name} : ${formatShortDate(dates.start)} → ${formatShortDate(dates.end)} (dates saisies)`}</title>
                      </rect>
                    ))}
                </g>
              );
            }
            const { activity, scheduled } = row;
            const moving = drag?.code === activity.code ? drag : null;
            const shift = moving?.mode === 'move' ? moving.delta * dayW : 0;
            const barX = x(scheduled.earlyStart) + shift;
            const barW = Math.max(span(scheduled.earlyStart, scheduled.earlyFinish) + (moving?.mode === 'resize' ? moving.delta * dayW : 0), dayW);
            const className = [
              'gantt__activity',
              scheduled.critical ? 'gantt__activity--critical' : '',
              selected === activity.code ? 'gantt__activity--selected' : '',
            ].join(' ');
            return (
              <g key={`a-${activity.code}`}>
                {stripe}
                <text className="gantt__label gantt__label--activity" x={22} y={y + ROW_H / 2} dominantBaseline="middle">
                  {truncate(`${activity.code}  ${activity.name}`, 38)}
                </text>
                {activity.startNoEarlierThan && (
                  <path className="gantt__constraint" d={`M ${x(activity.startNoEarlierThan)} ${y + 3} l 5 0 l -5 6 z`}>
                    <title>{`Début au plus tôt le ${formatShortDate(activity.startNoEarlierThan)}`}</title>
                  </path>
                )}
                <g
                  className={className}
                  role="button"
                  tabIndex={0}
                  aria-label={`${activity.code} ${activity.name}, du ${formatShortDate(scheduled.earlyStart)} au ${formatShortDate(scheduled.earlyFinish)}, ${activity.durationDays} jours ouvrés${scheduled.critical ? ', critique' : `, marge ${scheduled.totalFloat} j`}`}
                  onPointerDown={(event) => startDrag(event, activity.code, 'move')}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onClick={() => setSelected(activity.code)}
                  onKeyDown={(event) => onKey(event, activity.code)}
                >
                  <rect className="gantt__activity-bar" x={barX} y={y + 6} width={barW} height={ROW_H - 12} rx={3} />
                  {editable && (
                    <rect
                      className="gantt__handle"
                      x={barX + barW - 5}
                      y={y + 6}
                      width={7}
                      height={ROW_H - 12}
                      onPointerDown={(event) => startDrag(event, activity.code, 'resize')}
                      onPointerMove={moveDrag}
                      onPointerUp={endDrag}
                    />
                  )}
                  <title>{`${activity.code} ${activity.name} : ${formatShortDate(scheduled.earlyStart)} → ${formatShortDate(scheduled.earlyFinish)}`}</title>
                </g>
              </g>
            );
          })}

          {links.map((link) => (
            <path key={link.key} className="gantt__link" d={link.d} markerEnd={`url(#${editorId}-arrow)`} />
          ))}
        </svg>
      </div>

      {selectedActivity && selectedScheduled && (
        <section className="doc-panel gantt-panel" aria-label={`Activité ${selectedActivity.code}`}>
          <header className="gantt-panel__head">
            <h3 className="doc-subtitle">
              {selectedActivity.code} · {selectedActivity.name}
            </h3>
            <button type="button" className="btn btn--icon" aria-label="Fermer" onClick={() => setSelected(null)}>
              ✕
            </button>
          </header>
          <p className="gantt-panel__dates">
            Du <strong>{formatShortDate(selectedScheduled.earlyStart)}</strong> au{' '}
            <strong>{formatShortDate(selectedScheduled.earlyFinish)}</strong> · lot {selectedActivity.wbsCode} ·{' '}
            {selectedScheduled.critical ? 'critique' : `marge de ${selectedScheduled.totalFloat} jour(s) ouvré(s)`}
          </p>
          <div className="editor-grid editor-grid--fluid">
            <Field label="Durée (jours ouvrés)">
              {editable ? (
                <NumberInput
                  value={selectedActivity.durationDays}
                  onChange={(durationDays) => changeActivity(selectedActivity.code, { durationDays: Math.max(0, Math.round(durationDays)) })}
                  min={0}
                  step={1}
                />
              ) : (
                <span className="field__static">{selectedActivity.durationDays}</span>
              )}
            </Field>
            <Field label="Début au plus tôt le" hint="Vide : seules les dépendances placent l'activité.">
              {editable ? (
                <DateInput
                  value={selectedActivity.startNoEarlierThan}
                  onChange={(startNoEarlierThan) => changeActivity(selectedActivity.code, { startNoEarlierThan })}
                />
              ) : (
                <span className="field__static">{formatShortDate(selectedActivity.startNoEarlierThan)}</span>
              )}
            </Field>
          </div>
          <p className="gantt-panel__deps">
            Prédécesseurs :{' '}
            {selectedActivity.predecessors.length === 0
              ? 'aucun'
              : selectedActivity.predecessors.map((dependency) => dependencyLabel(dependency)).join(' ; ')}
            . Les dépendances se modifient dans « Activités et durées ».
          </p>
        </section>
      )}
    </>
  );
}
