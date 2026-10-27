import { useState } from 'react';
import type { UserAdminDto, UserCredentialsDto } from '@shared/index';
import { usersApi } from '@/api/admin-client';
import { useAuth } from '@/auth/AuthContext';
import { TemporaryPasswordDialog } from '@/components/admin/TemporaryPasswordDialog';
import { UserFormDialog } from '@/components/admin/UserFormDialog';
import { PageActions } from '@/components/header/PageActions';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { useResourceDirectory, useUsers } from '@/hooks/useAdministration';
import { formatDateTime, ROLE_LABELS } from '@/lib/admin-format';

type Editing = { user: UserAdminDto | null } | null;
type Shown = { credentials: UserCredentialsDto; reason: 'created' | 'reset' } | null;

/** Page « Utilisateurs » (administrateurs) : comptes, rôles, activation, mots de passe provisoires. */
export function UsersFeature() {
  const { user: me } = useAuth();
  const { data: users, loading, error, reload } = useUsers();
  const { data: directory } = useResourceDirectory();
  const [editing, setEditing] = useState<Editing>(null);
  const [shown, setShown] = useState<Shown>(null);
  const [resetting, setResetting] = useState<UserAdminDto | null>(null);

  const linkedResource = (userId: string) => directory?.resources.find((resource) => resource.userId === userId);
  const count = (predicate: (user: UserAdminDto) => boolean) => (users ?? []).filter(predicate).length;

  return (
    <>
      <PageActions>
        <button type="button" className="btn btn--primary" onClick={() => setEditing({ user: null })}>
          + Nouvel utilisateur
        </button>
      </PageActions>

      {loading && <p className="app__status">Chargement des comptes…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {users && (
        <article className="doc-page">
          <SummaryTiles
            tiles={[
              { label: 'Comptes actifs', value: count((user) => user.active) },
              { label: 'Administrateurs actifs', value: count((user) => user.active && user.role === 'ADMIN') },
              { label: 'Mots de passe provisoires', value: count((user) => user.active && user.mustChangePassword), tone: 'warning' },
              { label: 'Comptes désactivés', value: count((user) => !user.active) },
            ]}
          />
          <section className="doc-panel">
            <div className="wbs-scroll">
              <table className="register-table register-table--users">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Rôle</th>
                    <th>Statut</th>
                    <th>Dernière connexion</th>
                    <th>Ressource rattachée</th>
                    <th>
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isSelf = user.id === me?.id;
                    return (
                      <tr key={user.id} className={user.active ? undefined : 'register-row--muted'}>
                        <td className="register-table__title">
                          {user.name}
                          {isSelf && <span className="self-tag">vous</span>}
                          <span className="register-table__muted">{user.email}</span>
                        </td>
                        <td>
                          <span className={`role-badge role-badge--${user.role.toLowerCase()}`}>{ROLE_LABELS[user.role]}</span>
                        </td>
                        <td>
                          <span className={`status-badge status-badge--${user.active ? 'green' : 'grey'}`}>
                            {user.active ? 'Actif' : 'Désactivé'}
                          </span>
                          {user.active && user.mustChangePassword && (
                            <span className="register-table__muted">Mot de passe provisoire</span>
                          )}
                        </td>
                        <td className="register-table__muted-cell">{formatDateTime(user.lastLoginAt)}</td>
                        <td>{linkedResource(user.id)?.name ?? <span className="register-table__muted-cell">—</span>}</td>
                        <td className="row-actions">
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            aria-label={`Modifier le compte de ${user.name}`}
                            onClick={() => setEditing({ user })}
                          >
                            Modifier
                          </button>
                          {!isSelf && user.active && (
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              aria-label={`Réinitialiser le mot de passe de ${user.name}`}
                              onClick={() => setResetting(user)}
                            >
                              Réinitialiser
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="doc-note">
              Un compte désactivé ne peut plus se connecter et ses sessions sont fermées aussitôt ; un changement de
              rôle s'applique dès la requête suivante. Vous ne pouvez modifier ni votre propre rôle ni votre statut.
            </p>
          </section>
        </article>
      )}

      {editing && (
        <UserFormDialog
          user={editing.user}
          isSelf={editing.user?.id === me?.id}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
          onCreated={(credentials) => {
            setEditing(null);
            setShown({ credentials, reason: 'created' });
            reload();
          }}
        />
      )}
      <ConfirmDialog
        open={resetting !== null}
        title="Réinitialiser le mot de passe"
        message={
          <p>
            Un nouveau mot de passe provisoire sera généré pour <strong>{resetting?.name}</strong>. Ses sessions ouvertes
            seront fermées et il devra choisir un nouveau mot de passe à sa prochaine connexion.
          </p>
        }
        confirmLabel="Réinitialiser"
        danger
        onClose={() => setResetting(null)}
        onConfirm={async () => {
          if (!resetting) return;
          const credentials = await usersApi.resetPassword(resetting.id);
          setResetting(null);
          setShown({ credentials, reason: 'reset' });
          reload();
        }}
      />
      {shown && <TemporaryPasswordDialog credentials={shown.credentials} reason={shown.reason} onClose={() => setShown(null)} />}
    </>
  );
}
