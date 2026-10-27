import type { ProductBacklogDto } from '@shared/index';
import { useAuth } from '@/auth/AuthContext';

export interface BacklogRights {
  /** Ordonner, prioriser, rédiger, accepter ou refuser : le Product Owner (à défaut, le chef de projet). */
  decide: boolean;
  /** Estimer et faire avancer les éléments jusqu'à la revue : l'équipe (les rédacteurs hors Product Owner). */
  develop: boolean;
}

/** Droits du compte connecté sur le carnet ; même règle que le serveur, qui reste seul juge. */
export function useBacklogRights(backlog: ProductBacklogDto | null): BacklogRights {
  const { user, canEdit, canManageProject } = useAuth();
  const owner = backlog?.productOwner ?? null;
  return {
    decide: owner ? owner.id === user?.id : canManageProject,
    develop: canEdit && owner?.id !== user?.id,
  };
}
