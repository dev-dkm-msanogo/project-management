import { useState, type ReactNode } from 'react';
import type { ApprovalDto, PlanBaselinesDto, ProjectManagementPlanDto } from '@shared/index';
import { PersonName } from '@/components/people/People';
import { Tabs } from '@/components/ui/Tabs';
import { sectionsOf, TextSections } from '@/components/ui/TextSections';
import { APPROVAL_STATUS_LABELS, APPROVAL_STATUS_MODIFIERS, approvalDate } from '@/lib/approval-format';
import { formatPercent } from '@/lib/cost-format';
import { formatFcfaMillions, formatLongDate, formatMillionsValue, formatShortDate } from '@/lib/format';
import { METHODOLOGY_HINTS, METHODOLOGY_LABELS } from '@/lib/project-format';
import {
  CHANGE_LABELS,
  CONFIGURATION_LABELS,
  DEVELOPMENT_TEXT_LABELS,
  PLAN_COMPONENT_GROUPS,
  type PlanComponent,
  type PlanTab,
} from '@/lib/pm-plan-format';
import type { AppView } from '@/navigation/pmp';

const TABS: readonly { id: PlanTab; label: string }[] = [
  { id: 'overview', label: 'Synthèse' },
  { id: 'baselines', label: 'Références de base' },
  { id: 'life-cycle', label: 'Cycle de vie' },
  { id: 'approach', label: 'Approche de développement' },
  { id: 'change', label: 'Modifications' },
  { id: 'configuration', label: 'Configuration' },
];

const TRACKED = PLAN_COMPONENT_GROUPS.flatMap((group) => group.items).filter((item) => item.key);

/** Composants du plan, numérotés dans l'ordre du modèle, avec leur état et un accès direct. */
function Components({ plan, onOpen }: { plan: ProjectManagementPlanDto; onOpen: (item: PlanComponent) => void }) {
  const ready = TRACKED.filter((item) => plan.components[item.key!]).length;
  let number = 0;

  return (
    <section className="doc-panel">
      <div className="doc-panel-head">
        <h2 className="plan__section-title">Composants du plan</h2>
        <span className="doc-meta">
          {ready} sur {TRACKED.length} prêts
        </span>
      </div>
      <div className="plan-progress" role="progressbar" aria-valuemin={0} aria-valuemax={TRACKED.length} aria-valuenow={ready}
        aria-label="Composants prêts">
        <span className="plan-progress__bar" style={{ width: `${(ready / TRACKED.length) * 100}%` }} />
      </div>
      {PLAN_COMPONENT_GROUPS.map((group) => (
        <div key={group.title} className="plan-components">
          <h3 className="doc-subtitle">{group.title}</h3>
          <ul className="component-list">
            {group.items.map((item) => {
              number += 1;
              const state = !item.key ? 'none' : plan.components[item.key] ? 'done' : 'todo';
              return (
                <li key={item.label} className="component-row">
                  <span className="component-row__number">{number}</span>
                  <span className="component-row__label">{item.label}</span>
                  <span
                    className={`status-badge status-badge--${state === 'done' ? 'green' : state === 'todo' ? 'amber' : 'grey'}`}
                  >
                    {state === 'done' ? group.done : state === 'todo' ? group.todo : 'Non outillé'}
                  </span>
                  {(item.view || item.tab) && (
                    <button type="button" className="ref-link" onClick={() => onOpen(item)} aria-label={`Ouvrir : ${item.label}`}>
                      Ouvrir →
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}

function BaselineCard({ title, children, link }: { title: string; children: ReactNode; link: ReactNode }) {
  return (
    <section className="baseline-card">
      <h3 className="doc-subtitle">{title}</h3>
      {children}
      {link}
    </section>
  );
}

/** Références du périmètre, de l'échéancier et des coûts, puis leur intégration (PMB). */
function Baselines({ baselines, onNavigate }: { baselines: PlanBaselinesDto; onNavigate: (view: AppView) => void }) {
  const { scope, schedule, cost, performance } = baselines;
  const link = (view: AppView, label: string) => (
    <button type="button" className="ref-link" onClick={() => onNavigate(view)}>
      {label} →
    </button>
  );
  const share = (amount: number) => (performance && performance.total > 0 ? formatPercent((amount / performance.total) * 100) : '—');

  return (
    <>
      <div className="baseline-cards">
        <BaselineCard title="Périmètre" link={link('scope-statement', 'Énoncé du périmètre')}>
          <p className="baseline-card__figure">{scope.wbsElements} éléments WBS</p>
          <p className="doc-meta">
            {scope.workPackages} lots de travaux · {scope.deliverables} livrables
          </p>
          {!scope.statementDrafted && <p className="baseline-card__warning">Énoncé du périmètre à rédiger.</p>}
        </BaselineCard>
        <BaselineCard title="Échéancier" link={link('gantt', 'Échéancier')}>
          {schedule ? (
            <>
              <p className="baseline-card__figure">
                {formatShortDate(schedule.start)} → {formatShortDate(schedule.finish)}
              </p>
              <p className="doc-meta">
                {schedule.durationDays} jours · {schedule.tasks} tâches
              </p>
            </>
          ) : (
            <p className="baseline-card__warning">Aucune tâche datée.</p>
          )}
        </BaselineCard>
        <BaselineCard title="Coûts" link={link('cost-baseline', 'Référence des coûts')}>
          {cost ? (
            <>
              <p className="baseline-card__figure">{formatFcfaMillions(cost.costBaseline)}</p>
              <p className="doc-meta">Financement total : {formatFcfaMillions(cost.totalFunding)}</p>
            </>
          ) : (
            <p className="baseline-card__warning">Coûts non estimés.</p>
          )}
        </BaselineCard>
      </div>

      <section className="doc-panel">
        <h2 className="plan__section-title">Référence de mesure de la performance</h2>
        {!performance ? (
          <p className="plan__empty">Elle s'établit dès que l'échéancier et les estimations des coûts existent.</p>
        ) : (
          <>
            <div className="wbs-scroll">
              <table className="register-table register-table--pmb">
                <thead>
                  <tr>
                    <th>WBS</th>
                    <th>Élément</th>
                    <th>Début</th>
                    <th>Fin</th>
                    <th className="num">Durée</th>
                    <th className="num">Budget (M FCFA)</th>
                    <th className="num">Part</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.rows.map((row) => (
                    <tr key={row.wbs}>
                      <td className="register-table__muted-cell">{row.wbs}</td>
                      <td className="register-table__title">{row.name}</td>
                      <td>{formatShortDate(row.start)}</td>
                      <td>{formatShortDate(row.finish)}</td>
                      <td className="num">{row.durationDays === null ? '—' : `${row.durationDays} j`}</td>
                      <td className="num">{formatMillionsValue(row.budget)}</td>
                      <td className="num">{share(row.budget)}</td>
                    </tr>
                  ))}
                  {performance.unallocated !== 0 && (
                    <tr>
                      <td />
                      <td className="register-table__title">Activités hors des éléments de 1er niveau</td>
                      <td colSpan={3} />
                      <td className="num">{formatMillionsValue(performance.unallocated)}</td>
                      <td className="num">{share(performance.unallocated)}</td>
                    </tr>
                  )}
                  <tr>
                    <td />
                    <td className="register-table__title">Réserve pour aléas</td>
                    <td colSpan={3} />
                    <td className="num">{formatMillionsValue(performance.contingencyReserve)}</td>
                    <td className="num">{share(performance.contingencyReserve)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row" colSpan={5}>
                      Total de la référence (BAC)
                    </th>
                    <td className="num">{formatMillionsValue(performance.total)}</td>
                    <td className="num">100 %</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="doc-note">
              Réserve de management, détenue par le sponsor et hors référence :{' '}
              {formatFcfaMillions(performance.managementReserve)}.
            </p>
          </>
        )}
      </section>
    </>
  );
}

interface ProjectManagementPlanViewProps {
  plan: ProjectManagementPlanDto;
  projectName: string;
  onNavigate: (view: AppView) => void;
  /** État du plan dans le circuit de validation ; `archived` : version approuvée consultée. */
  approval: ApprovalDto | null;
  archived: boolean;
}

/**
 * Plan de management du projet : synthèse des composants (lus en direct dans leurs pages),
 * références de base intégrées, puis les composants rédigés dans le plan lui-même.
 */
export function ProjectManagementPlanView({ plan, projectName, onNavigate, approval, archived }: ProjectManagementPlanViewProps) {
  // Version affichée : l'approuvée consultée, sinon la version en cours.
  const reference = approval?.approved ?? null;
  const shown = archived && reference ? { revision: reference.revision, status: 'APPROVED' as const } : approval;
  const approvedAt = archived || approval?.status === 'APPROVED' ? (reference?.at ?? null) : null;
  const [tab, setTab] = useState<PlanTab>('overview');
  const open = (item: PlanComponent) => (item.tab ? setTab(item.tab) : item.view && onNavigate(item.view));
  const { lifeCycle, developmentApproach } = plan;

  return (
    <article className="doc-page">
      <section className="doc-panel">
        <div className="doc-heading">
          <h2 className="doc-title">{projectName}</h2>
          <span className="doc-meta">Préparé le {formatLongDate(plan.preparedOn)}</span>
        </div>
        <dl className="plan-cover">
          <div>
            <dt>Version</dt>
            <dd>{shown ? `${shown.revision}.0` : '—'}</dd>
          </div>
          <div>
            <dt>Statut</dt>
            <dd>
              {shown && (
                <span className={`status-badge status-badge--${APPROVAL_STATUS_MODIFIERS[shown.status]}`}>
                  {APPROVAL_STATUS_LABELS[shown.status]}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt>Approuvé le</dt>
            <dd>{approvedAt ? approvalDate(approvedAt) : '—'}</dd>
          </div>
          <div>
            <dt>Chef de projet</dt>
            <dd>
              <PersonName id={plan.references.projectManagerId} />
            </dd>
          </div>
          <div>
            <dt>Sponsor</dt>
            <dd>
              <PersonName id={plan.references.sponsorId} />
            </dd>
          </div>
        </dl>
      </section>

      <Tabs label="Parties du plan de management" active={tab} onChange={setTab} tabs={TABS}>
        {tab === 'overview' && <Components plan={plan} onOpen={open} />}
        {tab === 'baselines' && <Baselines baselines={plan.baselines} onNavigate={onNavigate} />}
        {tab === 'life-cycle' && (
          <section className="doc-panel">
            {lifeCycle.overview ? <p className="doc-text">{lifeCycle.overview}</p> : <p className="plan__empty">Vue d'ensemble à rédiger.</p>}
            {lifeCycle.phases.length === 0 ? (
              <p className="plan__empty">Aucune phase définie.</p>
            ) : (
              <ol className="phase-track">
                {lifeCycle.phases.map((phase, index) => (
                  <li key={phase.name} className="phase-card">
                    <div className="phase-card__head">
                      <span className="phase-step">{index + 1}</span>
                      <strong>{phase.name}</strong>
                      {phase.period && <span className="doc-meta">{phase.period}</span>}
                    </div>
                    {phase.description && <p className="doc-text">{phase.description}</p>}
                    {phase.gate && <p className="phase-card__gate">Revue de passage : {phase.gate}</p>}
                  </li>
                ))}
              </ol>
            )}
            <TextSections sections={[{ key: 'gateReview', label: 'Revues de passage', text: lifeCycle.gateReview }]} />
          </section>
        )}
        {tab === 'approach' && (
          <section className="doc-panel">
            <div className="approach-head">
              <span className="approach-badge">Approche {METHODOLOGY_LABELS[developmentApproach.kind].toLowerCase()}</span>
              <span className="doc-meta">{METHODOLOGY_HINTS[developmentApproach.kind]}</span>
            </div>
            <TextSections sections={sectionsOf(DEVELOPMENT_TEXT_LABELS, developmentApproach)} />
          </section>
        )}
        {tab === 'change' && (
          <section className="doc-panel">
            <TextSections sections={sectionsOf(CHANGE_LABELS, plan.changeManagement)} />
          </section>
        )}
        {tab === 'configuration' && (
          <section className="doc-panel">
            <TextSections sections={sectionsOf(CONFIGURATION_LABELS, plan.configurationManagement)} />
          </section>
        )}
      </Tabs>
    </article>
  );
}
