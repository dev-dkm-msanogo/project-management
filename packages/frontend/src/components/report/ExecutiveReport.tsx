import type { ExecutiveStatusReportDto } from '@shared/contracts/executive-status-report';
import { ChangeSummaryCard } from '@/components/report/ChangeSummaryCard';
import { CostStatusCard } from '@/components/report/CostStatusCard';
import { DecisionsNeeded } from '@/components/report/DecisionsNeeded';
import { DimensionStatusCard } from '@/components/report/DimensionStatusCard';
import { ExecutiveSummary } from '@/components/report/ExecutiveSummary';
import { ForecastConfidence } from '@/components/report/ForecastConfidence';
import { KeyKpis } from '@/components/report/KeyKpis';
import { KeyMilestones } from '@/components/report/KeyMilestones';
import { NextPeriodPriorities } from '@/components/report/NextPeriodPriorities';
import { OverallStatus } from '@/components/report/OverallStatus';
import { RagLegend } from '@/components/report/RagLegend';
import { ReportHeader } from '@/components/report/ReportHeader';
import { TopRisks } from '@/components/report/TopRisks';

interface ExecutiveReportProps {
  report: ExecutiveStatusReportDto;
  onOpenRiskRegister?: () => void;
}

/** Assemble les 12 sections du rapport exécutif sur une grille 12 colonnes. */
export function ExecutiveReport({ report, onOpenRiskRegister }: ExecutiveReportProps) {
  return (
    <article className="report">
      <div className="report__grid">
        <ReportHeader header={report.header} />
        <OverallStatus overall={report.overall} />
        <ExecutiveSummary summary={report.executiveSummary} />
        <KeyMilestones milestones={report.milestones} />
        <DimensionStatusCard
          number={4}
          title="Statut du périmètre"
          dimension={report.scope}
          source="Registre des exigences"
          emptyText="Aucune exigence : le registre des exigences est vide."
        />
        <DimensionStatusCard
          number={5}
          title="Statut du planning"
          dimension={report.schedule}
          source="Avancement des tâches à la date du rapport"
          emptyText="Pas de WBS : le délai se mesure sur ses tâches élémentaires."
        />
        <CostStatusCard cost={report.cost} />
        <TopRisks majorRisks={report.majorRisks} onOpenRegister={onOpenRiskRegister} />
        <DecisionsNeeded decisions={report.decisions} />
        <ChangeSummaryCard changeSummary={report.changeSummary} />
        <NextPeriodPriorities priorities={report.priorities} />
        <KeyKpis kpis={report.kpis} />
        <ForecastConfidence forecast={report.forecast} />
        <RagLegend />
      </div>
    </article>
  );
}
