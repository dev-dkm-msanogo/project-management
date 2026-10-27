import { useAuth } from '@/auth/AuthContext';
import { useUnsavedChanges } from '@/components/form/UnsavedChanges';
import { IconChevron, IconLogout, IconUser } from '@/components/nav/icons';
import { Menu, MenuHeader, MenuItem, MenuSeparator } from '@/components/ui/Menu';
import { ROLE_LABELS } from '@/lib/admin-format';
import { initials } from '@/lib/initials';

/** Compte connecté : identité, rôle, accès à « Mon compte » et déconnexion. */
export function AccountMenu({ onOpenAccount }: { onOpenAccount: () => void }) {
  const { user, logout } = useAuth();
  const { confirmLeave } = useUnsavedChanges();
  if (!user) return null;

  return (
    <Menu
      align="end"
      label="Compte"
      triggerClassName="account-trigger"
      triggerLabel={`Compte de ${user.name}`}
      trigger={
        <>
          <span className="avatar" aria-hidden="true">
            {initials(user.name)}
          </span>
          <span className="account-trigger__name">{user.name}</span>
          <span className="account-trigger__chevron">
            <IconChevron />
          </span>
        </>
      }
    >
      <MenuHeader>
        <span className="account-card">
          <span className="avatar avatar--lg" aria-hidden="true">
            {initials(user.name)}
          </span>
          <span className="account-card__identity">
            <span className="account-card__name">{user.name}</span>
            <span className="account-card__email">{user.email}</span>
            <span className={`role-badge role-badge--${user.role.toLowerCase()}`}>{ROLE_LABELS[user.role]}</span>
          </span>
        </span>
      </MenuHeader>
      <MenuSeparator />
      <MenuItem onSelect={onOpenAccount}>
        <span className="menu__icon">
          <IconUser />
        </span>
        <span className="menu__item-text">Mon compte</span>
      </MenuItem>
      <MenuItem
        onSelect={() =>
          void confirmLeave().then((leave) => {
            if (leave) void logout();
          })
        }
      >
        <span className="menu__icon">
          <IconLogout />
        </span>
        <span className="menu__item-text">Se déconnecter</span>
      </MenuItem>
    </Menu>
  );
}
