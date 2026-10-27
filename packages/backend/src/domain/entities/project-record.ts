import { DomainError } from '@domain/errors/domain-errors';
import { isProjectMethodology, type ProjectMethodology } from '@domain/value-objects/project-methodology';
import { isProjectStatus, type ProjectStatus } from '@domain/value-objects/project-status';

/**
 * Projet enregistré dans le registre (source de vérité de l'existence d'un projet).
 * Les rapports et plans le référencent par son `id`.
 */
export class ProjectRecord {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly status: ProjectStatus,
    public readonly methodology: ProjectMethodology,
    public readonly createdAt: Date,
  ) {}

  static create(params: {
    id: string;
    name: string;
    description?: string | null;
    status?: ProjectStatus;
    methodology?: ProjectMethodology;
    createdAt?: Date;
  }): ProjectRecord {
    if (!/^[A-Za-z0-9_-]+$/.test(params.id)) {
      throw new DomainError(`Identifiant de projet invalide : "${params.id}".`);
    }
    if (!params.name.trim()) {
      throw new DomainError('Le nom du projet est requis.');
    }
    if (params.status && !isProjectStatus(params.status)) {
      throw new DomainError(`Statut de projet invalide : "${params.status}".`);
    }
    if (params.methodology && !isProjectMethodology(params.methodology)) {
      throw new DomainError(`Méthodologie de projet invalide : "${params.methodology}".`);
    }
    const description = params.description?.trim();
    return new ProjectRecord(
      params.id,
      params.name.trim(),
      description ? description : null,
      params.status ?? 'ACTIVE',
      params.methodology ?? 'PREDICTIVE',
      params.createdAt ? new Date(params.createdAt) : new Date(),
    );
  }

  /** Nom, description, statut et méthodologie modifiés ; identifiant et date de création conservés. */
  withDetails(details: {
    name: string;
    description: string | null;
    status: ProjectStatus;
    methodology: ProjectMethodology;
  }): ProjectRecord {
    return ProjectRecord.create({ ...details, id: this.id, createdAt: this.createdAt });
  }
}
