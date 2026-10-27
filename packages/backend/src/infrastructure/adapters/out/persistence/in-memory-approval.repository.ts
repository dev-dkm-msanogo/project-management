import type { ApprovalSubject, DocumentApproval } from '@domain/entities/document-approval';
import { ConflictError } from '@application/errors/application-errors';
import type {
  ApprovalRepository,
  ApprovalSnapshot,
  ApprovalSnapshotRepository,
  ProjectApproverRepository,
} from '@application/ports/out/approval.repository';

/** « | » n'apparaît ni dans un identifiant de projet ni dans un document validé. */
const key = (projectId: string, subject: ApprovalSubject): string => `${projectId}|${subject}`;

/** Adaptateur SORTANT en mémoire (repli sans base) : historique de validation. */
export class InMemoryApprovalRepository implements ApprovalRepository {
  private readonly approvals = new Map<string, DocumentApproval>();

  constructor(seed: readonly DocumentApproval[] = []) {
    for (const approval of seed) this.approvals.set(key(approval.projectId, approval.subject), approval);
  }

  async find(projectId: string, subject: ApprovalSubject): Promise<DocumentApproval | null> {
    return this.approvals.get(key(projectId, subject)) ?? null;
  }

  async listByProject(projectId: string): Promise<DocumentApproval[]> {
    return [...this.approvals.values()].filter((approval) => approval.projectId === projectId);
  }

  async save(approval: DocumentApproval, expectedEvents: number): Promise<void> {
    const current = this.approvals.get(key(approval.projectId, approval.subject));
    if ((current?.events.length ?? 0) !== expectedEvents) {
      throw new ConflictError("Quelqu'un vient de faire avancer la validation de ce document : rechargez la page.");
    }
    this.approvals.set(key(approval.projectId, approval.subject), approval);
  }

  async delete(projectId: string): Promise<void> {
    for (const [entry, approval] of this.approvals) {
      if (approval.projectId === projectId) this.approvals.delete(entry);
    }
  }
}

/** Adaptateur SORTANT en mémoire : versions approuvées archivées. */
export class InMemoryApprovalSnapshotRepository implements ApprovalSnapshotRepository {
  private readonly snapshots: ApprovalSnapshot[] = [];

  async find(projectId: string, subject: ApprovalSubject, revision: number): Promise<ApprovalSnapshot | null> {
    return (
      this.snapshots.find(
        (snapshot) => snapshot.projectId === projectId && snapshot.subject === subject && snapshot.revision === revision,
      ) ?? null
    );
  }

  async revisions(projectId: string, subject: ApprovalSubject): Promise<number[]> {
    return this.snapshots
      .filter((snapshot) => snapshot.projectId === projectId && snapshot.subject === subject)
      .map((snapshot) => snapshot.revision)
      .sort((a, b) => a - b);
  }

  async save(snapshot: ApprovalSnapshot): Promise<void> {
    if (!(await this.find(snapshot.projectId, snapshot.subject, snapshot.revision))) this.snapshots.push(snapshot);
  }

  async delete(projectId: string): Promise<void> {
    for (let index = this.snapshots.length - 1; index >= 0; index -= 1) {
      if (this.snapshots[index].projectId === projectId) this.snapshots.splice(index, 1);
    }
  }
}

/** Adaptateur SORTANT en mémoire : valideurs par projet. */
export class InMemoryProjectApproverRepository implements ProjectApproverRepository {
  private readonly byProject = new Map<string, string[]>();

  constructor(seed: Record<string, readonly string[]> = {}) {
    for (const [projectId, userIds] of Object.entries(seed)) this.byProject.set(projectId, [...userIds]);
  }

  async listByProject(projectId: string): Promise<string[]> {
    return [...(this.byProject.get(projectId) ?? [])];
  }

  async listProjectsOf(userId: string): Promise<string[]> {
    return [...this.byProject.entries()].filter(([, ids]) => ids.includes(userId)).map(([projectId]) => projectId);
  }

  async replace(projectId: string, userIds: readonly string[]): Promise<void> {
    this.byProject.set(projectId, [...userIds]);
  }

  async delete(projectId: string): Promise<void> {
    this.byProject.delete(projectId);
  }
}
