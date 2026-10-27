/** Contrats du registre de projets (gestion multi-projet). */

export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'CLOSED';

/**
 * Rôle d'un membre dans un projet : le chef de projet gère l'équipe et rédige, le contributeur
 * rédige, le lecteur consulte.
 */
export type ProjectRole = 'MANAGER' | 'CONTRIBUTOR' | 'READER';

export interface ProjectRecordDto {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
  /** Droits de l'utilisateur sur ce projet (un administrateur a ceux d'un chef de projet). */
  access: ProjectRole;
}

/** Création : l'identifiant (slug) est généré côté serveur à partir du nom. */
export interface CreateProjectInput {
  name: string;
  description: string | null;
  status: ProjectStatus;
}

/** Modification : mêmes informations ; l'identifiant, cité par tous les documents, ne change pas. */
export type UpdateProjectInput = CreateProjectInput;

/** Compte membre d'un projet. */
export interface ProjectMemberDto {
  userId: string;
  name: string;
  email: string;
  role: ProjectRole;
  active: boolean;
}

/** Compte qu'un chef de projet peut ajouter à l'équipe. */
export interface ProjectCandidateDto {
  userId: string;
  name: string;
  email: string;
}

export interface ProjectTeamDto {
  projectId: string;
  members: ProjectMemberDto[];
  /** Comptes actifs proposés à l'ajout : seulement pour qui gère l'équipe (sinon vide). */
  candidates: ProjectCandidateDto[];
}

export interface ProjectTeamInput {
  members: { userId: string; role: ProjectRole }[];
}
