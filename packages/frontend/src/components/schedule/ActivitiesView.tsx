import { useState } from 'react';
import type { ActivityInput, ScheduleModelDto } from '@shared/index';
import { PersonName } from '@/components/people/People';
import { Tabs } from '@/components/ui/Tabs';
import { formatShortDate } from '@/lib/format';
import {
  basisFormula,
  dependencyLabel,
  DURATION_METHODS,
  EFFORT_TYPE_LABELS,
  formatDays,
  METHOD_LABELS,
} from '@/lib/schedule-format';

type Tab = 'list' | 'attributes' | 'estimates' | 'worksheet';

/** Liste et attributs des activités, estimations des durées et feuille d'estimation. */
export function ActivitiesView({ model }: { model: ScheduleModelDto }) {
  const [tab, setTab] = useState<Tab>('list');
  const estimated = model.activities.filter((activity) => activity.basis);

  return (
    <Tabs
      label="Activités"
      active={tab}
      onChange={setTab}
      tabs={[
        { id: 'list', label: 'Liste des activités', count: model.activities.length },
        { id: 'attributes', label: 'Attributs' },
        { id: 'estimates', label: 'Estimations des durées' },
        { id: 'worksheet', label: "Feuille d'estimation", count: estimated.length },
      ]}
    >
      {model.activities.length === 0 ? (
        <section className="doc-panel">
          <p className="plan__empty">Aucune activité définie.</p>
        </section>
      ) : (
        <>
          {tab === 'list' && <ActivityList model={model} />}
          {tab === 'attributes' && <ActivityAttributes model={model} />}
          {tab === 'estimates' && <DurationEstimates model={model} />}
          {tab === 'worksheet' && <EstimatingWorksheet model={model} activities={estimated} />}
        </>
      )}
    </Tabs>
  );
}

function wbsLabel(model: ScheduleModelDto, wbsCode: string) {
  return (
    <span className="schedule-wbs">
      <span className="schedule-wbs__code">{wbsCode}</span>
      {model.wbsNames[wbsCode] ?? ''}
    </span>
  );
}

function ActivityList({ model }: { model: ScheduleModelDto }) {
  const scheduled = new Map(model.network.activities.map((item) => [item.code, item]));
  return (
    <section className="doc-panel">
      <div className="wbs-scroll">
        <table className="register-table register-table--activities">
          <thead>
            <tr>
              <th>Code</th>
              <th>Activité</th>
              <th>Élément WBS</th>
              <th>Responsable</th>
              <th className="num">Durée</th>
              <th>Prédécesseurs</th>
              <th>Début</th>
              <th>Fin</th>
              <th className="num">Marge</th>
            </tr>
          </thead>
          <tbody>
            {model.activities.map((activity) => {
              const item = scheduled.get(activity.code)!;
              return (
                <tr key={activity.code} className={item.critical ? 'schedule-row--critical' : undefined}>
                  <td className="register-table__code">{activity.code}</td>
                  <td className="register-table__response">
                    <strong className="schedule-name">{activity.name}</strong>
                    {activity.description && <span className="schedule-description">{activity.description}</span>}
                  </td>
                  <td>{wbsLabel(model, activity.wbsCode)}</td>
                  <td>
                    <PersonName id={activity.ownerId} />
                  </td>
                  <td className="num">{activity.durationDays} j</td>
                  <td className="register-table__muted-cell">
                    {activity.predecessors.length === 0 ? '—' : activity.predecessors.map(dependencyLabel).join(', ')}
                  </td>
                  <td className="register-table__muted-cell">{formatShortDate(item.earlyStart)}</td>
                  <td className="register-table__muted-cell">{formatShortDate(item.earlyFinish)}</td>
                  <td className="num">
                    {item.critical ? <span className="status-badge status-badge--red">Critique</span> : `${item.totalFloat} j`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const ATTRIBUTES: { key: keyof ActivityInput; label: string }[] = [
  { key: 'resources', label: 'Ressources requises' },
  { key: 'skills', label: 'Compétences' },
  { key: 'location', label: 'Lieu de réalisation' },
  { key: 'constraints', label: 'Contraintes' },
  { key: 'assumptions', label: 'Hypothèses' },
];

function ActivityAttributes({ model }: { model: ScheduleModelDto }) {
  return (
    <div className="activity-cards">
      {model.activities.map((activity) => (
        <section key={activity.code} className="doc-panel activity-card">
          <header className="activity-card__head">
            <span className="register-table__code">{activity.code}</span>
            <h3 className="activity-card__title">{activity.name}</h3>
            <span className="skill-chip">{EFFORT_TYPE_LABELS[activity.effortType]}</span>
          </header>
          {activity.description && <p className="doc-text">{activity.description}</p>}
          <dl className="activity-card__facts">
            <div>
              <dt>Élément WBS</dt>
              <dd>{wbsLabel(model, activity.wbsCode)}</dd>
            </div>
            <div>
              <dt>Responsable</dt>
              <dd>
                <PersonName id={activity.ownerId} />
              </dd>
            </div>
            <div>
              <dt>Effort · durée</dt>
              <dd>
                {formatDays(activity.effortHours)} h · {activity.durationDays} j
              </dd>
            </div>
            <div>
              <dt>Prédécesseurs</dt>
              <dd>{activity.predecessors.length === 0 ? '—' : activity.predecessors.map(dependencyLabel).join(', ')}</dd>
            </div>
            {ATTRIBUTES.map(({ key, label }) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{(activity[key] as string) || '—'}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

/** Durées calculées par le serveur à partir des bases d'estimation. */
const estimatesOf = (model: ScheduleModelDto) =>
  new Map(model.network.activities.map((item) => [item.code, item.estimatedDays]));

function DurationEstimates({ model }: { model: ScheduleModelDto }) {
  const estimates = estimatesOf(model);
  return (
    <section className="doc-panel">
      <div className="wbs-scroll">
        <table className="register-table register-table--estimates">
          <thead>
            <tr>
              <th>Code</th>
              <th>Activité</th>
              <th>Méthode</th>
              <th className="num">Effort</th>
              <th className="num">Durée calculée</th>
              <th className="num">Durée retenue</th>
            </tr>
          </thead>
          <tbody>
            {model.activities.map((activity) => {
              const computed = estimates.get(activity.code) ?? null;
              const gap = computed !== null && Math.abs(computed - activity.durationDays) >= 1;
              return (
                <tr key={activity.code}>
                  <td className="register-table__code">{activity.code}</td>
                  <td>{activity.name}</td>
                  <td>
                    <span className="skill-chip">{METHOD_LABELS[activity.method]}</span>
                  </td>
                  <td className="num">{formatDays(activity.effortHours)} h</td>
                  <td className="num register-table__muted-cell">
                    {computed === null ? 'Sans feuille' : `${formatDays(computed)} j`}
                  </td>
                  <td className={`num${gap ? ' schedule-gap' : ''}`} title={gap ? 'Écart avec la durée calculée' : undefined}>
                    {activity.durationDays} j
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EstimatingWorksheet({ model, activities }: { model: ScheduleModelDto; activities: ActivityInput[] }) {
  const estimates = estimatesOf(model);
  if (activities.length === 0) {
    return (
      <section className="doc-panel">
        <p className="plan__empty">Aucune activité ne porte de base d'estimation détaillée.</p>
      </section>
    );
  }
  return (
    <>
      {DURATION_METHODS.map((method) => {
        const rows = activities.filter((activity) => activity.basis?.method === method);
        if (rows.length === 0) return null;
        return (
          <section key={method} className="doc-panel">
            <h2 className="plan__section-title">{METHOD_LABELS[method]}</h2>
            <div className="wbs-scroll">
              <table className="register-table register-table--worksheet">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Activité</th>
                    {method === 'ANALOGOUS' && <th>Référence</th>}
                    <th>Calcul</th>
                    <th className="num">Durée calculée</th>
                    <th className="num">Durée retenue</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((activity) => {
                    const basis = activity.basis!;
                    const computed = estimates.get(activity.code) ?? null;
                    return (
                      <tr key={activity.code}>
                        <td className="register-table__code">{activity.code}</td>
                        <td>{activity.name}</td>
                        {basis.method === 'ANALOGOUS' && <td>{basis.reference || '—'}</td>}
                        <td className="schedule-formula">{basisFormula(basis, activity.effortHours)}</td>
                        <td className="num">{computed === null ? '—' : `${formatDays(computed)} j`}</td>
                        <td className="num">{activity.durationDays} j</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </>
  );
}
