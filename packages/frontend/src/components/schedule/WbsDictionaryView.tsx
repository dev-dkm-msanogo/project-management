import type { WbsDictionaryDto } from '@shared/index';
import { PersonName } from '@/components/people/People';
import { EditEntryButton } from '@/components/ui/EditEntry';
import { TextSections, sectionsOf } from '@/components/ui/TextSections';
import { formatFcfa, formatShortDate } from '@/lib/format';
import { formatDays, WBS_ENTRY_SECTIONS } from '@/lib/schedule-format';

/** Dictionnaire de la WBS : une fiche par élément, avec effort et coûts relus des autres documents. */
export function WbsDictionaryView({
  dictionary,
  onEdit,
}: {
  dictionary: WbsDictionaryDto;
  onEdit?: (wbsCode: string) => void;
}) {
  if (dictionary.entries.length === 0) {
    return (
      <section className="doc-panel">
        <p className="plan__empty">Aucune fiche rédigée.</p>
      </section>
    );
  }

  return (
    <>
      {dictionary.entries.map((entry) => (
        <section key={entry.wbsCode} className="doc-panel wbs-entry">
          <header className="activity-card__head">
            <span className="schedule-wbs__code">{entry.wbsCode}</span>
            <h2 className="activity-card__title">{entry.name}</h2>
            {onEdit && <EditEntryButton label={`la fiche ${entry.wbsCode}`} onEdit={() => onEdit(entry.wbsCode)} />}
          </header>
          <p className="doc-text">{entry.description}</p>

          <dl className="doc-facts">
            <div>
              <dt>Responsable</dt>
              <dd>
                <PersonName id={entry.responsibleId} />
              </dd>
            </div>
            <div>
              <dt>Livrable clé</dt>
              <dd>{entry.keyDeliverable || '—'}</dd>
            </div>
            <div>
              <dt>Effort des activités</dt>
              <dd>{entry.effortHours === null ? '—' : `${formatDays(entry.effortHours)} h`}</dd>
            </div>
            <div>
              <dt>Coût estimé</dt>
              <dd>{entry.costLines.length === 0 ? '—' : `${formatFcfa(entry.costTotal)}`}</dd>
            </div>
          </dl>

          <div className="doc-columns">
            <div>
              <h3 className="doc-subtitle">Jalons</h3>
              {entry.milestones.length === 0 ? (
                <p className="plan__empty">Aucun jalon.</p>
              ) : (
                <ul className="doc-refs">
                  {entry.milestones.map((milestone) => (
                    <li key={`${milestone.name}-${milestone.dueDate}`}>
                      <strong>{formatShortDate(milestone.dueDate)}</strong>
                      {milestone.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="doc-subtitle">Estimations des coûts</h3>
              {entry.costLines.length === 0 ? (
                <p className="plan__empty">Aucune activité estimée sur cet élément.</p>
              ) : (
                <ul className="doc-refs">
                  {entry.costLines.map((line) => (
                    <li key={line.code}>
                      <strong>{line.code}</strong>
                      {line.name}
                      <span>{formatFcfa(line.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <TextSections
            sections={sectionsOf<keyof typeof WBS_ENTRY_SECTIONS>(WBS_ENTRY_SECTIONS, entry).filter((section) => section.text)}
          />
        </section>
      ))}
    </>
  );
}
