import type { CostEstimates } from '@domain/entities/cost-estimates';
import type { ProjectPlan } from '@domain/entities/project-plan';
import type { ProjectScopedStore } from '@application/ports/out/project-document.repository';

/**
 * Références de base de performance figées à l'approbation du plan de management : la WBS datée
 * (échéancier, périmètre) et les estimations des coûts telles qu'approuvées.
 */
export interface ApprovedBaseline {
  projectId: string;
  /** Version approuvée du plan de management. */
  revision: number;
  approvedAt: Date;
  plan: ProjectPlan;
  estimates: CostEstimates | null;
}

/** Port SORTANT : références de base approuvées, une par version du plan de management. */
export interface BaselineRepository extends ProjectScopedStore {
  /** Dernière référence approuvée ; `null` si le plan de management n'a jamais été approuvé. */
  latest(projectId: string): Promise<ApprovedBaseline | null>;
  save(baseline: ApprovedBaseline): Promise<void>;
}
