import { ProjectRecord } from '@domain/entities/project-record';

const d = (month1to12: number, day: number): Date =>
  new Date(Date.UTC(2025, month1to12 - 1, day));

/** Projets de démonstration du registre (seul « project-alpha » a un rapport et un plan). */
export function buildProjectRecords(): ProjectRecord[] {
  return [
    ProjectRecord.create({
      id: 'project-alpha',
      name: 'Projet Alpha',
      description: 'Programme de transformation digitale.',
      status: 'ACTIVE',
      methodology: 'HYBRID',
      createdAt: d(1, 2),
    }),
    ProjectRecord.create({
      id: 'project-beta',
      name: 'Projet Beta',
      description: 'Refonte du système billettique.',
      status: 'ACTIVE',
      createdAt: d(2, 10),
    }),
    ProjectRecord.create({
      id: 'project-gamma',
      name: 'Projet Gamma',
      description: 'Déploiement de la flotte électrique.',
      status: 'ON_HOLD',
      createdAt: d(3, 5),
    }),
  ];
}
