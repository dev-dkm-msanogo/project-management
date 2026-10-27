import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { ChangePasswordForm } from '@/components/admin/ChangePasswordForm';
import { useResourceDirectory } from '@/hooks/useAdministration';
import { RESOURCE_KIND_LABELS, ROLE_LABELS } from '@/lib/admin-format';
import { initials } from '@/lib/initials';

/** Page « Mon compte » : profil, ressource rattachée et changement de mot de passe. */
export function AccountFeature() {
  const { user, updateUser } = useAuth();
  const { data: directory } = useResourceDirectory();
  const [changed, setChanged] = useState(false);
  if (!user) return null;

  const resource = directory?.resources.find((item) => item.userId === user.id);

  return (
    <article className="doc-page account-page">
      <section className="doc-panel">
        <div className="account-profile">
          <span className="avatar avatar--xl" aria-hidden="true">
            {initials(user.name)}
          </span>
          <div className="account-profile__identity">
            <h2 className="doc-title">{user.name}</h2>
            <span className="doc-meta">{user.email}</span>
            <span className={`role-badge role-badge--${user.role.toLowerCase()}`}>{ROLE_LABELS[user.role]}</span>
          </div>
        </div>
        <h3 className="doc-subtitle">Ressource rattachée</h3>
        {resource ? (
          <p className="doc-text">
            <strong>{resource.jobTitle || resource.name}</strong>
            {resource.department && ` · ${resource.department}`} · {RESOURCE_KIND_LABELS[resource.kind]}
          </p>
        ) : (
          <p className="plan__empty">Aucune ressource du référentiel n'est rattachée à ce compte.</p>
        )}
      </section>

      <section className="doc-panel">
        <h2 className="plan__section-title">Mot de passe</h2>
        {changed && (
          <p className="account-page__success" role="status">
            Mot de passe modifié. Vos autres sessions ouvertes ont été fermées.
          </p>
        )}
        <ChangePasswordForm
          onChanged={(updated) => {
            setChanged(true);
            updateUser(updated);
          }}
        />
      </section>
    </article>
  );
}
