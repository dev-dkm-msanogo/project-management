import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { AppBrand } from '@/components/brand/AppBrand';
import { Field } from '@/components/form/Field';

/** Écran de connexion (e-mail + mot de passe). */
export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login">
      <form className="login__card" onSubmit={handleSubmit} noValidate>
        <AppBrand className="login__brand" />

        <h1 className="login__title">Connexion</h1>

        <Field label="Adresse e-mail">
          <input
            className="form-input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoFocus
          />
        </Field>

        <Field label="Mot de passe">
          <input
            className="form-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>

        {error && (
          <p className="editor__error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn--primary login__submit"
          disabled={submitting || !email || !password}
        >
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>

        <p className="login__notice">
          Accès réservé au personnel autorisé. Vos identifiants servent uniquement à vous
          authentifier ; la session est conservée dans un cookie sécurisé pendant 8 heures.
        </p>
      </form>
    </main>
  );
}
