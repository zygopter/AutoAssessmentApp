import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from './../contexts/AuthContext';
import AuthLayout, { AuthTabs, AuthField } from './AuthLayout';
import { Icon } from './ui/Icon';

const LoginPage = () => {
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [showPw, setShowPw]               = useState(false);
  const [remember, setRemember]           = useState(true);
  const [error, setError]                 = useState('');
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const user = await login({ email, password });
      toast.success('Connexion réussie !');
      navigate(`/${user.role}`);
    } catch (err) {
      const msg = err.message || 'Échec de la connexion. Vérifiez vos identifiants.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <AuthTabs mode="login" onModeChange={(id) => id === 'register' && navigate('/register')} />

      <div
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: '.15em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: 6,
        }}
      >
        Bon retour
      </div>
      <h2 className="serif" style={{ fontSize: 32, lineHeight: 1.15, marginBottom: 8 }}>
        Connectez-vous.
      </h2>
      <p className="muted" style={{ fontSize: 14, marginBottom: 28, maxWidth: 420 }}>
        Utilisez l'email associé à votre établissement.
      </p>

      <form className="col" style={{ gap: 16 }} onSubmit={handleSubmit}>
        <AuthField label="Adresse email">
          <input
            className="field"
            type="email"
            autoComplete="email"
            placeholder="vous@etablissement.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </AuthField>

        <AuthField
          label="Mot de passe"
          rightSlot={
            <button
              type="button"
              style={{
                fontSize: 11,
                color: 'var(--accent-ink)',
                fontFamily: 'var(--mono)',
                letterSpacing: '.04em',
                textTransform: 'uppercase',
                background: 'none',
                border: 0,
                cursor: 'pointer',
              }}
            >
              Oublié&nbsp;?
            </button>
          }
        >
          <div style={{ position: 'relative' }}>
            <input
              className="field"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? 'Masquer' : 'Afficher'}
              style={{
                position: 'absolute',
                right: 8,
                top: 0,
                bottom: 0,
                width: 32,
                display: 'grid',
                placeItems: 'center',
                color: 'var(--muted)',
                background: 'none',
                border: 0,
                cursor: 'pointer',
              }}
            >
              <Icon name="eye" size={14} />
            </button>
          </div>
        </AuthField>

        <label
          className="row"
          style={{
            gap: 8,
            fontSize: 13,
            color: 'var(--ink-2)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            style={{ accentColor: 'var(--accent)' }}
          />
          Rester connecté sur cet appareil
        </label>

        {error && (
          <div
            role="alert"
            style={{
              fontSize: 13,
              padding: '10px 12px',
              background: 'var(--eval-d-bg)',
              color: 'var(--eval-d)',
              border: '1px solid var(--eval-d)',
              borderRadius: 'var(--r-md)',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn accent"
          disabled={isSubmitting}
          style={{
            justifyContent: 'center',
            padding: '12px 16px',
            marginTop: 6,
            fontSize: 14,
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? 'Connexion…' : 'Se connecter'}
          {!isSubmitting && <Icon name="arrow-r" size={14} />}
        </button>
      </form>

      <div
        style={{
          marginTop: 28,
          paddingTop: 20,
          borderTop: '1px solid var(--hairline)',
        }}
      >
        <div className="row" style={{ gap: 6, fontSize: 13, color: 'var(--muted)' }}>
          Pas encore de compte&nbsp;?
          <button
            type="button"
            onClick={() => navigate('/register')}
            style={{
              color: 'var(--accent-ink)',
              textDecoration: 'underline',
              background: 'none',
              border: 0,
              cursor: 'pointer',
              padding: 0,
              font: 'inherit',
            }}
          >
            Créez-en un
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
