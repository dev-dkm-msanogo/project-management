import type { ApprovalDto, ScheduleModelDto } from '@shared/index';
import { TextSections } from '@/components/ui/TextSections';
import { approvalDate } from '@/lib/approval-format';
import { formatShortDate } from '@/lib/format';
import type { AppView } from '@/navigation/pmp';

interface ScheduleBaselineViewProps {
  model: ScheduleModelDto;
  onNavigate: (view: AppView) => void;
  /** Validation du plan de management, qui approuve la référence ; `archived` : version approuvée consultée. */
  approval: ApprovalDto | null;
  archived: boolean;
}

/** Référence de l'échéancier : objet, composants, dates clés et approbations (celles du plan de management). */
export function ScheduleBaselineView({ model, onNavigate, approval, archived }: ScheduleBaselineViewProps) {
  const { baseline, network } = model;
  const reference = approval?.approved ?? null;
  const approved = reference !== null && (archived || approval?.status === 'APPROVED') ? reference : null;
  const submittedAt = approved?.submittedAt ?? (approval?.status === 'SUBMITTED' ? (approval.submitted?.at ?? null) : null);
  const lastMilestone = [...model.milestones].sort((a, b) => b.targetDate.localeCompare(a.targetDate))[0];

  return (
    <>
      <p className={`doc-status${approved ? ' doc-status--done' : ''}`}>
        {approved
          ? `Référence approuvée avec le plan de management (version ${approved.revision}) le ${approvalDate(approved.at)} par ${approved.by.name} : elle ne change que par une révision du plan.`
          : "Référence en attente d'approbation avec le plan de management."}
      </p>

      <section className="doc-panel">
        <dl className="doc-facts">
          <div>
            <dt>Début du réseau</dt>
            <dd>{formatShortDate(network.start)}</dd>
          </div>
          <div>
            <dt>Fin du réseau</dt>
            <dd>{model.activities.length > 0 ? formatShortDate(network.finish) : '—'}</dd>
          </div>
          <div>
            <dt>Durée</dt>
            <dd>{network.workingDays} jours ouvrés</dd>
          </div>
          <div>
            <dt>Dernier jalon</dt>
            <dd>{lastMilestone ? `${formatShortDate(lastMilestone.targetDate)} · ${lastMilestone.name}` : '—'}</dd>
          </div>
        </dl>
        <TextSections
          sections={[
            { key: 'purpose', label: 'Objet de la référence', text: baseline.purpose },
            { key: 'components', label: 'Composants', text: baseline.components },
          ]}
        />
      </section>

      <div className="doc-columns">
        <section className="doc-panel">
          <h2 className="plan__section-title">Approbations</h2>
          <ul className="doc-refs">
            <li>
              <strong>Chef de projet</strong>
              <span>{submittedAt ? `Soumise le ${approvalDate(submittedAt)}` : 'En attente'}</span>
            </li>
            <li>
              <strong>Valideur</strong>
              <span>{approved ? `${approved.by.name}, le ${approvalDate(approved.at)}` : 'En attente'}</span>
            </li>
          </ul>
        </section>
        <section className="doc-panel">
          <h2 className="plan__section-title">Composants détaillés</h2>
          <div className="schedule-links">
            <button type="button" className="ref-link" onClick={() => onNavigate('schedule-activities')}>
              Activités et durées ({model.activities.length}) →
            </button>
            <button type="button" className="ref-link" onClick={() => onNavigate('schedule-network')}>
              Réseau du projet ({network.criticalPath.length} activités critiques) →
            </button>
            <button type="button" className="ref-link" onClick={() => onNavigate('schedule-milestones')}>
              Jalons et calendrier ({model.milestones.length} jalons) →
            </button>
            <button type="button" className="ref-link" onClick={() => onNavigate('gantt')}>
              Échéancier (Gantt) →
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
