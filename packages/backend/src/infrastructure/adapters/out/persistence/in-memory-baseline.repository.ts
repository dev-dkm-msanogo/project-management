import type { ApprovedBaseline, BaselineRepository } from '@application/ports/out/baseline.repository';

/** Repli sans base : références de base approuvées, en mémoire. */
export class InMemoryBaselineRepository implements BaselineRepository {
  private readonly baselines: ApprovedBaseline[] = [];

  async latest(projectId: string): Promise<ApprovedBaseline | null> {
    return (
      this.baselines.filter((baseline) => baseline.projectId === projectId).sort((a, b) => b.revision - a.revision)[0] ?? null
    );
  }

  async save(baseline: ApprovedBaseline): Promise<void> {
    if (!this.baselines.some((item) => item.projectId === baseline.projectId && item.revision === baseline.revision)) {
      this.baselines.push(baseline);
    }
  }

  async delete(projectId: string): Promise<void> {
    this.baselines.splice(0, this.baselines.length, ...this.baselines.filter((baseline) => baseline.projectId !== projectId));
  }
}
