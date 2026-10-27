import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ProjectRole, Role, UserDto } from '@shared/index';
import { fetchCurrentUser, login as apiLogin, logout as apiLogout } from '@/api/auth-client';
import { UNAUTHORIZED_EVENT } from '@/api/http';

interface AuthContextValue {
  user: UserDto | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Remplace l'utilisateur courant (ex. après un changement de mot de passe). */
  updateUser: (user: UserDto) => void;
  /**
   * Peut rédiger : dans les pages d'un projet, selon son rôle sur ce projet (`ProjectRightsScope`) ;
   * ailleurs, créer des projets.
   */
  canEdit: boolean;
  /** Gère l'équipe et les informations du projet courant (chef de projet ou administrateur). */
  canManageProject: boolean;
  /** Peut supprimer des projets. */
  canAdminister: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Miroir UX des règles serveur (role.ts) — le serveur reste la seule autorité.
function canEditContent(role: Role): boolean {
  return role === 'ADMIN' || role === 'EDITOR';
}

/** Fournit la session courante à toute l'application. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaure la session à partir du cookie httpOnly (s'il est valide).
  useEffect(() => {
    const controller = new AbortController();
    fetchCurrentUser(controller.signal)
      .then((current) => setUser(current))
      .catch(() => {
        if (!controller.signal.aborted) setUser(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  // Session expirée pendant l'utilisation → retour à l'écran de connexion.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setUser(await apiLogin({ email, password }));
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      logout,
      updateUser: setUser,
      canEdit: user ? canEditContent(user.role) : false,
      canManageProject: user?.role === 'ADMIN',
      canAdminister: user?.role === 'ADMIN',
    }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Pages d'un projet : les droits sont ceux du rôle du compte sur ce projet (chef de projet et
 * contributeur rédigent, lecteur consulte) — miroir de la règle serveur. `null` : page hors projet,
 * droits du compte.
 */
export function ProjectRightsScope({ access, children }: { access: ProjectRole | null; children: ReactNode }) {
  const auth = useAuth();
  const value = useMemo<AuthContextValue>(
    () =>
      access === null
        ? auth
        : { ...auth, canEdit: access === 'MANAGER' || access === 'CONTRIBUTOR', canManageProject: access === 'MANAGER' },
    [auth, access],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>.");
  }
  return context;
}
