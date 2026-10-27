import type { ReactNode } from 'react';
import type { PortfolioProjectDto } from '@shared/index';
import { IndexChip, ProgressBar } from '@/components/performance/Indicators';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { formatPercent } from '@/lib/cost-format';
import { formatMillionsValue, formatShortDate, RAG_LEGEND_LABELS, RAG_MODIFIERS } from '@/lib/format';
import { indexHealth } from '@/lib/performance-format';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_MODIFIERS } from '@/lib/project-format';

interface PortfolioDashboardProps {
  projects: readonly PortfolioProjectDto[];
  currentProjectId: string;
  onOpen: (projectId: string) => void;
  /** Actions de chaque ligne (modifier, supprimer selon le rôle) ; le nom du projet l'ouvre. */
  actions: (project: PortfolioProjectDto) => ReactNode;
}

const critical = (value: number | null) => indexHealth(value) === 'critical';

/**
 * Tableau de bord du portefeuille : une ligne par projet — santé déclarée, avancement, indices de
 * délai et de coût, budget consommé, alertes (tâches en retard, risques critiques, problèmes
 * ouverts) et prochain jalon. Les projets sans WBS ni estimations affichent « — ».
 */
export function PortfolioDashboard({ projects, currentProjectId, onOpen, actions }: PortfolioDashboardProps) {
  const active = projects.filter((project) => project.status === 'ACTIVE');
  return (
    <>
      <SummaryTiles
        tiles={[
          { label: 'Projets actifs', value: active.length },
          { label: 'En retard (SPI < 0,90)', value: active.filter((project) => critical(project.spi)).length, tone: 'danger' },
          { label: 'Coûts dépassés (CPI < 0,90)', value: active.filter((project) => critical(project.cpi)).length, tone: 'danger' },
          { label: 'Tâches en retard', value: active.reduce((sum, project) => sum + project.overdueTasks, 0), tone: 'warning' },
          { label: 'Risques critiques ouverts', value: active.reduce((sum, project) => sum + project.criticalRisks, 0), tone: 'alert' },
        ]}
      />
      <section className="doc-panel">
        <div className="wbs-scroll">
          <table className="register-table register-table--portfolio">
            <thead>
              <tr>
                <th>Projet</th>
                <th>Santé</th>
                <th>Réalisé (EV / BAC)</th>
                <th>SPI</th>
                <th>CPI</th>
                <th>Budget consommé</th>
                <th>Alertes</th>
                <th>Prochain jalon</th>
                <th className="register-table__edit">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className={project.id === currentProjectId ? 'portfolio-row--current' : undefined}>
                  <td className="register-table__title">
                    <span className="portfolio-name">
                      <button
                        type="button"
                        className="portfolio-open"
                        aria-label={`Ouvrir ${project.name}`}
                        onClick={() => onOpen(project.id)}
                      >
                        {project.name}
                      </button>
                      <span className={`status-badge status-badge--${PROJECT_STATUS_MODIFIERS[project.status]}`}>
                        {PROJECT_STATUS_LABELS[project.status]}
                      </span>
                    </span>
                    <span className="register-table__description">{project.description ?? project.id}</span>
                  </td>
                  <td>
                    {project.rag ? (
                      <span className={`status-badge status-badge--${RAG_MODIFIERS[project.rag]}`}>{RAG_LEGEND_LABELS[project.rag]}</span>
                    ) : (
                      <span className="register-table__muted">Pas de rapport</span>
                    )}
                  </td>
                  <td>
                    {project.percentComplete === null ? (
                      <span className="register-table__muted">Pas de WBS</span>
                    ) : (
                      <>
                        <ProgressBar value={project.percentComplete} late={project.overdueTasks > 0} />
                        {project.plannedEnd && (
                          <span className="register-table__description">Fin prévue {formatShortDate(project.plannedEnd)}</span>
                        )}
                      </>
                    )}
                  </td>
                  <td>
                    <IndexChip value={project.spi} label="délai" />
                  </td>
                  <td>
                    <IndexChip value={project.cpi} label="coût" />
                  </td>
                  <td className="register-table__muted-cell">
                    {project.bac ? (
                      <>
                        {formatMillionsValue(project.ac)} / {formatMillionsValue(project.bac)} M
                        <span className="register-table__description">
                          {formatPercent(Math.round((project.ac / project.bac) * 1000) / 10)} du budget
                        </span>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <ul className="portfolio-alerts">
                      {project.overdueTasks > 0 && <li>{project.overdueTasks} tâche(s) en retard</li>}
                      {project.criticalRisks > 0 && <li>{project.criticalRisks} risque(s) critique(s)</li>}
                      {project.openIssues > 0 && <li>{project.openIssues} problème(s) ouvert(s)</li>}
                      {project.overdueTasks + project.criticalRisks + project.openIssues === 0 && (
                        <li className="portfolio-alerts__none">Aucune</li>
                      )}
                    </ul>
                  </td>
                  <td className="register-table__muted-cell portfolio-milestone">
                    {project.nextMilestone ? (
                      <>
                        {project.nextMilestone.name}
                        <span className="register-table__description">{formatShortDate(project.nextMilestone.date)}</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="register-table__edit">
                    <span className="portfolio-actions">{actions(project)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="heat-matrix__caption">
          Cliquez sur un projet pour l'ouvrir. Santé : statut global du dernier rapport exécutif. SPI (délai) et CPI
          (coût) : indices de la valeur acquise à la dernière mesure d'avancement — ✓ dans les clous à partir de 0,95,
          ! à surveiller de 0,90 à 0,95, ✕ critique en dessous.
        </p>
      </section>
    </>
  );
}
