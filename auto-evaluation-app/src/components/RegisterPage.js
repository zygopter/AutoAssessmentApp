import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout, { AuthTabs, AuthField } from './AuthLayout';
import { Icon } from './ui/Icon';

function RoleChoice({ value, onChange }) {
  const opts = [
    {
      id: 'teacher',
      label: 'Professeur·e',
      desc: 'Je gère les classes, le référentiel et les formulaires.',
      iconName: 'edit',
    },
    {
      id: 'student',
      label: 'Élève',
      desc: 'Je rejoins une classe et je remplis des auto-évaluations.',
      iconName: 'check',
    },
  ];
  return (
    <div>
      <div className="field-label" style={{ marginBottom: 8 }}>Je suis…</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {opts.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              style={{
                padding: '14px 16px',
                textAlign: 'left',
                background: active ? 'var(--accent-soft)' : 'var(--surface)',
                border: '1px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
                boxShadow: active ? '0 0 0 3px var(--accent-soft)' : 'none',
                borderRadius: 'var(--r-md)',
                transition: 'all .12s',
                cursor: 'pointer',
              }}
            >
              <div className="row spread" style={{ marginBottom: 4 }}>
                <span
                  style={{
                    display: 'inline-grid',
                    placeItems: 'center',
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: active ? 'var(--accent)' : 'var(--paper-2)',
                    color: active ? 'white' : 'var(--ink-2)',
                    border:
                      '1px solid ' +
                      (active ? 'var(--accent)' : 'var(--hairline)'),
                  }}
                >
                  <Icon name={o.iconName} size={12} />
                </span>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border:
                      '1.5px solid ' +
                      (active ? 'var(--accent)' : 'var(--line)'),
                    display: 'grid',
                    placeItems: 'center',
                    background: active ? 'var(--accent)' : 'transparent',
                  }}
                >
                  {active && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'white',
                      }}
                    />
                  )}
                </span>
              </div>
              <div
                className="serif"
                style={{ fontSize: 15, lineHeight: 1.2, marginTop: 4 }}
              >
                {o.label}
              </div>
              <div
                className="muted"
                style={{ fontSize: 12, lineHeight: 1.4, marginTop: 2 }}
              >
                {o.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PasswordStrength({ password }) {
  const p = password || '';
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^a-zA-Z0-9]/.test(p)) score++;
  const labels = ['Trop court', 'Faible', 'Correct', 'Bon', 'Excellent'];
  const colors = [
    'var(--eval-empty)',
    'var(--eval-d)',
    'var(--eval-c)',
    'var(--eval-b)',
    'var(--eval-a)',
  ];
  const idx = p.length === 0 ? 0 : Math.max(1, score);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i < idx ? colors[idx] : 'var(--paper-2)',
              transition: 'background .15s',
            }}
          />
        ))}
      </div>
      <div
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginTop: 4,
        }}
      >
        {labels[idx]}
      </div>
    </div>
  );
}

const RegisterPage = () => {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('teacher');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate     = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const user = await register({ name, email, password, role });
      toast.success('Inscription réussie !');
      navigate(`/${user.role}`);
    } catch (err) {
      const msg = err.message || "Une erreur est survenue lors de l'inscription.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <AuthTabs
        mode="register"
        onModeChange={(id) => id === 'login' && navigate('/login')}
      />

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
        Inscription
      </div>
      <h2 className="serif" style={{ fontSize: 32, lineHeight: 1.15, marginBottom: 8 }}>
        Créez votre compte.
      </h2>
      <p className="muted" style={{ fontSize: 14, marginBottom: 28, maxWidth: 420 }}>
        Indiquez si vous êtes professeur·e ou élève — votre espace s'adaptera.
      </p>

      <form className="col" style={{ gap: 16 }} onSubmit={handleSubmit}>
        <RoleChoice value={role} onChange={setRole} />

        <AuthField label="Nom complet">
          <input
            className="field"
            autoComplete="name"
            placeholder={role === 'teacher' ? 'Hélène Vasseur' : 'Maëlys Olivier'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </AuthField>

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

        <AuthField label="Mot de passe">
          <div style={{ position: 'relative' }}>
            <input
              className="field"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Au moins 8 caractères"
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
          <PasswordStrength password={password} />
        </AuthField>

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
          {isSubmitting ? 'Création…' : 'Créer mon compte'}
          {!isSubmitting && <Icon name="arrow-r" size={14} />}
        </button>

        <p
          className="muted"
          style={{ fontSize: 11.5, lineHeight: 1.5, marginTop: 4 }}
        >
          En créant un compte, vous acceptez nos{' '}
          <span
            style={{
              color: 'var(--accent-ink)',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            conditions d'utilisation
          </span>{' '}
          et notre{' '}
          <span
            style={{
              color: 'var(--accent-ink)',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            politique de confidentialité
          </span>
          . Les comptes élèves de moins de 15 ans nécessitent une autorisation
          parentale.
        </p>
      </form>

      <div
        style={{
          marginTop: 28,
          paddingTop: 20,
          borderTop: '1px solid var(--hairline)',
        }}
      >
        <div className="row" style={{ gap: 6, fontSize: 13, color: 'var(--muted)' }}>
          Déjà un compte&nbsp;?
          <button
            type="button"
            onClick={() => navigate('/login')}
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
            Connectez-vous
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
