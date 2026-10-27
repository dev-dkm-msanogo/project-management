import { useAuth } from '@/auth/AuthContext';
import { ChangePasswordForm } from '@/components/admin/ChangePasswordForm';
import { AppBrand } from '@/components/brand/AppBrand';

/**
 * Premier accès (ou mot de passe réinitialisé) : le mot de passe provisoire doit être remplacé
 * avant toute autre action. Le serveur bloque déjà le reste de l'API tant que ce n'est pas fait.
 */
export function PasswordChangeScreen() {
  const { user, logout, updateUser } = useAuth();

  return (
    <main className="login">
      <div className="login__card">
        <AppBrand className="login__brand" />

        <h1 className="login__title">Choisissez votre mot de passe</h1>
        <p className="login__notice login__notice--lead">
          Bonjour {user?.name}. Votre mot de passe actuel est provisoire : remplacez-le par un mot de passe
          personnel pour accéder à l'application.
        </p>

        <ChangePasswordForm currentLabel="Mot de passe provisoire" submitLabel="Valider et continuer" onChanged={updateUser} />

        <button type="button" className="btn btn--ghost login__secondary" onClick={() => void logout()}>
          Se déconnecter
        </button>
      </div>
    </main>
  );
}
