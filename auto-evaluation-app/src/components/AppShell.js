import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCompetences } from '../contexts/CompetencesContext';
import { Icon } from './ui/Icon';

function initialsOf(name) {
  if (!name) return '·';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0].toUpperCase())
    .join('');
}

function Topbar({ user, onLogout }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" />
        <span>Suivi des acquis</span>
        <span className="brand-sub">v0.4 · bêta</span>
      </div>
      <div className="grow" />
      <div className="role-pill">
        {user.role === 'teacher' ? 'Professeur·e' : 'Élève'}
      </div>
      <div className="user-chip">
        <span className="avatar">{initialsOf(user.name)}</span>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: 13 }}>{user.name}</div>
          {user.email && (
            <div className="muted" style={{ fontSize: 11 }}>{user.email}</div>
          )}
        </div>
        <button className="logout-btn" onClick={onLogout} title="Se déconnecter">
          Sortir
        </button>
      </div>
    </header>
  );
}

function TeacherSidebar({ classCount, competenceCount, formCount }) {
  const navigate = useNavigate();
  const path = useLocation().pathname;
  const items = [
    { id: 'classes',     label: 'Classes',     icon: 'users', count: classCount,      to: '/teacher/classes' },
    { id: 'competences', label: 'Compétences', icon: 'book',  count: competenceCount, to: '/teacher/competences' },
    { id: 'forms',       label: 'Formulaires', icon: 'form',  count: formCount,       to: '/teacher/formulaires' },
  ];
  const active =
    path.includes('/teacher/competences') ? 'competences' :
    path.includes('/teacher/formulaires') ? 'forms' :
    'classes';

  return (
    <aside className="sidebar">
      <div className="section-label">Espace professeur</div>
      {items.map(it => (
        <button
          key={it.id}
          type="button"
          className="nav-item"
          data-active={active === it.id}
          onClick={() => navigate(it.to)}
        >
          <Icon name={it.icon} size={16} />
          <span>{it.label}</span>
          <span className="count">{it.count}</span>
        </button>
      ))}

      <div style={{ flex: 1 }} />
      <hr className="hairline" style={{ margin: '10px 0' }} />
      <div className="card" style={{
        padding: 12, fontSize: 12, color: 'var(--ink-2)',
        background: 'var(--accent-soft)', borderColor: 'var(--accent-line)',
      }}>
        <div className="mono" style={{
          fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase',
          color: 'var(--accent-ink)', marginBottom: 4,
        }}>
          Astuce
        </div>
        Importez vos élèves en collant la liste « Nom, Prénom » dans l'onglet
        Élèves d'une classe.
      </div>
    </aside>
  );
}

function StudentTopnav() {
  return (
    <nav className="topnav">
      <div className="tab" data-active={true}>
        <Icon name="form" size={14} /> Mes formulaires
      </div>
    </nav>
  );
}

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { classes = [], categories = [], formulaires = [] } = useCompetences();

  if (!user) return <>{children}</>;

  const competenceCount = categories.reduce(
    (acc, cat) => acc + (cat.competences?.length || 0),
    0
  );

  return (
    <div className="app-shell">
      <Topbar user={user} onLogout={logout} />
      <div className="layout" data-role={user.role}>
        {user.role === 'teacher' ? (
          <TeacherSidebar
            classCount={classes.length}
            competenceCount={competenceCount}
            formCount={formulaires.length}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <StudentTopnav />
            <main className="main">{children}</main>
          </div>
        )}
        {user.role === 'teacher' && (
          <main className="main">{children}</main>
        )}
      </div>
    </div>
  );
}
