import { DirectoryResource, type DirectoryResourceProps } from '@domain/entities/directory-resource';

type Seed = Omit<DirectoryResourceProps, 'email' | 'userId' | 'active'> &
  Partial<Pick<DirectoryResourceProps, 'email' | 'userId' | 'active'>>;

const resource = (seed: Seed): DirectoryResource =>
  DirectoryResource.create({ email: null, userId: null, active: true, ...seed });

const DSI = "Direction des systèmes d'information";

/**
 * Référentiel des ressources de démonstration (personnes fictives, cohérentes avec le Projet
 * Alpha). Trois ressources sont rattachées aux comptes de démonstration.
 */
export function buildResourceDirectory(): DirectoryResource[] {
  return [
    resource({
      id: 'res-awa-diop',
      name: 'Awa Diop',
      kind: 'INTERNAL',
      jobTitle: "Directrice des systèmes d'information",
      department: DSI,
      skills: ['Gouvernance SI', 'Arbitrage budgétaire'],
      userId: 'u-admin',
    }),
    resource({
      id: 'res-mamadou-ba',
      name: 'Mamadou Ba',
      kind: 'INTERNAL',
      jobTitle: 'Chef de projet',
      department: 'PMO',
      skills: ['Gestion de projet', 'PMP', 'Pilotage des prestataires'],
      userId: 'u-editor',
    }),
    resource({
      id: 'res-fatou-sow',
      name: 'Fatou Sow',
      kind: 'INTERNAL',
      jobTitle: 'Contrôleuse de gestion',
      department: 'Direction financière',
      skills: ['Contrôle de gestion', 'Suivi budgétaire'],
      userId: 'u-viewer',
    }),
    resource({
      id: 'res-fatou-ndiaye',
      name: 'Fatou Ndiaye',
      kind: 'INTERNAL',
      jobTitle: 'Analyste métier',
      department: DSI,
      skills: ['Recueil des exigences', "Processus d'exploitation"],
    }),
    resource({
      id: 'res-ibrahima-fall',
      name: 'Ibrahima Fall',
      kind: 'INTERNAL',
      jobTitle: 'Architecte solution',
      department: DSI,
      skills: ['Architecture', 'Intégration ERP', 'Sécurité'],
    }),
    resource({
      id: 'res-khady-sarr',
      name: 'Khady Sarr',
      kind: 'INTERNAL',
      jobTitle: 'Responsable qualité',
      department: DSI,
      skills: ['Recette', 'Tests de charge'],
    }),
    resource({
      id: 'res-aminata-diallo',
      name: 'Aminata Diallo',
      kind: 'INTERNAL',
      jobTitle: 'Chargée de formation',
      department: 'Ressources humaines',
      skills: ['Ingénierie de formation', 'Conduite du changement'],
    }),
    resource({
      id: 'res-cheikh-ndour',
      name: 'Cheikh Ndour',
      kind: 'INTERNAL',
      jobTitle: 'Administrateur systèmes',
      department: DSI,
      skills: ['Hébergement', 'Supervision'],
    }),
    resource({
      id: 'res-integrateur',
      name: 'Prestataire intégrateur',
      kind: 'EXTERNAL',
      jobTitle: "Équipe de développement et d'intégration",
      department: 'Société intégratrice (contrat cadre)',
      skills: ['Développement', 'Migration de données', 'Tableaux de bord'],
    }),
    resource({
      id: 'res-maintenance',
      name: 'Ancien prestataire de maintenance',
      kind: 'EXTERNAL',
      jobTitle: 'Maintenance applicative',
      department: 'Contrat échu en 2024',
      skills: ['Maintenance'],
      active: false,
    }),
    // Directions désignées comme responsables (bénéfices, rôles, hypothèses) : ressources à part entière.
    resource({
      id: 'res-direction-exploitation',
      name: "Direction de l'exploitation",
      kind: 'INTERNAL',
      jobTitle: 'Direction métier',
      department: "Direction de l'exploitation",
      skills: ["Processus d'exploitation"],
    }),
    resource({
      id: 'res-service-marches',
      name: 'Service des marchés',
      kind: 'INTERNAL',
      jobTitle: 'Achats et marchés publics',
      department: 'Direction financière',
      skills: ['Marchés publics'],
    }),
  ];
}
