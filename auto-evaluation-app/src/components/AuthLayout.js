import React from 'react';

function SnapshotCard() {
  const rows = [
    { label: "Extraire l'information utile", value: 'A' },
    { label: 'Effectuer une mesure',          value: 'B' },
    { label: 'Estimer une incertitude',       value: 'C' },
    { label: 'Rédiger un compte-rendu',       value: 'A' },
  ];
  return (
    <div
      style={{
        marginTop: 44,
        padding: '18px 22px',
        background: 'var(--surface)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--r-lg)',
        maxWidth: 460,
        boxShadow:
          '0 1px 0 rgba(0,0,0,.02), 0 16px 32px -20px rgba(60,40,20,.18)',
      }}
    >
      <div className="row spread" style={{ marginBottom: 12 }}>
        <div>
          <div
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Aperçu
          </div>
          <div className="serif" style={{ fontSize: 14, marginTop: 2 }}>
            Terminale Spé Physique
          </div>
        </div>
        <span className="tag accent" style={{ fontSize: 10 }}>17 / 18</span>
      </div>
      <div className="col" style={{ gap: 8 }}>
        {rows.map((row, i) => (
          <div key={i} className="row" style={{ gap: 12 }}>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--ink-2)' }}>
              {row.label}
            </span>
            <span
              className="eval"
              data-v={row.value}
              style={{ height: 26, minWidth: 26, fontSize: 11 }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside
      style={{
        background: 'var(--paper-2)',
        borderRight: '1px solid var(--hairline)',
        padding: '48px 56px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="brand" style={{ fontSize: 18 }}>
        <span className="brand-mark" />
        <span>Suivi des acquis</span>
        <span className="brand-sub">v0.4 · bêta</span>
      </div>

      <div
        style={{
          marginTop: 'auto',
          marginBottom: 'auto',
          paddingTop: 64,
          paddingBottom: 64,
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: '.15em',
            textTransform: 'uppercase',
            color: 'var(--accent-ink)',
            marginBottom: 18,
          }}
        >
          Auto-évaluation par compétences
        </div>
        <h1
          className="serif"
          style={{
            fontSize: 'clamp(32px, 4.2vw, 56px)',
            lineHeight: 1.04,
            letterSpacing: '-0.015em',
            marginBottom: 24,
            maxWidth: '18ch',
          }}
        >
          Le carnet de compétences,<br />à hauteur d'élève.
        </h1>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.55,
            color: 'var(--ink-2)',
            maxWidth: 460,
          }}
        >
          Construisez votre référentiel, envoyez des formulaires
          d'auto-positionnement, et lisez d'un coup d'œil où en est chaque
          élève — sans tableur partagé.
        </p>

        <SnapshotCard />
      </div>

      <div
        className="row spread"
        style={{ fontSize: 12, color: 'var(--muted)' }}
      >
        <span>© 2025 — Suivi des acquis</span>
        <div className="row" style={{ gap: 18 }}>
          <span style={{ cursor: 'pointer' }}>Confidentialité</span>
          <span style={{ cursor: 'pointer' }}>Conditions</span>
        </div>
      </div>

      <svg
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: -80,
          top: -80,
          width: 260,
          height: 260,
          opacity: 0.55,
          pointerEvents: 'none',
        }}
        viewBox="0 0 100 100"
      >
        <circle cx="50" cy="50" r="48" fill="none" stroke="var(--accent-line)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="34" fill="none" stroke="var(--accent-line)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="20" fill="none" stroke="var(--accent-line)" strokeWidth="0.5" />
      </svg>
    </aside>
  );
}

export function AuthTabs({ mode, onModeChange }) {
  const tabs = [
    { id: 'login',    label: 'Connexion' },
    { id: 'register', label: 'Créer un compte' },
  ];
  return (
    <div
      className="row"
      style={{
        gap: 0,
        marginBottom: 28,
        border: '1px solid var(--line)',
        borderRadius: 999,
        padding: 4,
        background: 'var(--surface)',
        alignSelf: 'flex-start',
      }}
    >
      {tabs.map(t => {
        const active = mode === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onModeChange(t.id)}
            style={{
              padding: '7px 18px',
              borderRadius: 999,
              fontSize: 13,
              fontFamily: 'var(--mono)',
              letterSpacing: '.02em',
              background: active ? 'var(--ink)' : 'transparent',
              color: active ? 'var(--paper)' : 'var(--ink-2)',
              border: 0,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export function AuthField({ label, rightSlot, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div className="row spread" style={{ marginBottom: 6 }}>
        <span className="field-label" style={{ margin: 0 }}>{label}</span>
        {rightSlot}
      </div>
      {children}
    </label>
  );
}

export default function AuthLayout({ children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '7fr 5fr',
        background: 'var(--paper)',
      }}
    >
      <BrandPanel />
      <section
        style={{
          padding: '48px 56px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        {children}
      </section>
    </div>
  );
}
