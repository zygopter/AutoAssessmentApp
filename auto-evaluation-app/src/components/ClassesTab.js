import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCompetences } from '../contexts/CompetencesContext';
import { Icon } from './ui/Icon';
import { SectionHead } from './ui/SectionHead';

function currentAcademicYear() {
  const now = new Date();
  const y = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export default function ClassesTab() {
  const navigate = useNavigate();
  const { classes, addClass, deleteClassById } = useCompetences();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  async function handleCreate() {
    if (!newName.trim()) {
      toast.error('Le nom de la classe est requis.');
      return;
    }
    try {
      const created = await addClass({ name: newName.trim(), year: currentAcademicYear() });
      toast.success('Classe créée');
      setCreating(false);
      setNewName('');
      if (created?.id) navigate(`/teacher/classes/${created.id}`);
    } catch (err) {
      toast.error(`Erreur : ${err.message}`);
    }
  }

  async function handleDelete(cls, e) {
    e.stopPropagation();
    if (!window.confirm(`Supprimer la classe "${cls.name}" ?`)) return;
    try {
      await deleteClassById(cls.id);
      toast.success('Classe supprimée');
    } catch (err) {
      toast.error(`Erreur : ${err.message}`);
    }
  }

  return (
    <div className="page">
      <SectionHead
        eyebrow="Mes classes"
        title="Classes"
        desc="Une classe regroupe vos élèves et reçoit vos formulaires d'auto-évaluation."
        actions={
          <button className="btn accent" onClick={() => setCreating(true)}>
            <Icon name="plus" size={14} /> Nouvelle classe
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {classes.map((cls) => (
          <div
            key={cls.id}
            onClick={() => navigate(`/teacher/classes/${cls.id}`)}
            className="card"
            style={{
              textAlign: 'left',
              cursor: 'pointer',
              padding: 0,
              overflow: 'hidden',
              transition: 'transform .12s, border-color .12s, box-shadow .12s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ink-2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--hairline)'; }}
          >
            <div style={{ padding: 'var(--pad-card)', paddingBottom: 14 }}>
              <div className="row spread" style={{ alignItems: 'flex-start', marginBottom: 10 }}>
                <div className="mono" style={{
                  fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}>
                  {cls.year}
                </div>
                <span className="tag accent">
                  <Icon name="key" size={10} /> {cls.code}
                </span>
              </div>
              <div className="serif" style={{ fontSize: 22, lineHeight: 1.15, marginBottom: 4 }}>
                {cls.name}
              </div>
            </div>

            <div className="row spread" style={{
              padding: '12px var(--pad-card)',
              borderTop: '1px solid var(--hairline)',
              background: 'var(--paper-2)',
              fontSize: 12,
            }}>
              <span className="row" style={{ gap: 6, color: 'var(--ink-2)' }}>
                <Icon name="users" size={14} /> {cls.studentCount ?? 0} élèves
              </span>
              <span className="row" style={{ gap: 8 }}>
                <button
                  className="btn ghost sm"
                  title="Supprimer"
                  onClick={(e) => handleDelete(cls, e)}
                >
                  <Icon name="trash" size={12} />
                </button>
                <span className="row" style={{ gap: 4, color: 'var(--muted)' }}>
                  Ouvrir <Icon name="arrow-r" size={14} />
                </span>
              </span>
            </div>
          </div>
        ))}

        <button
          className="card"
          onClick={() => setCreating(true)}
          style={{
            border: '1px dashed var(--line)',
            background: 'transparent',
            color: 'var(--muted)',
            display: 'grid', placeItems: 'center',
            minHeight: 156,
            cursor: 'pointer',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <Icon name="plus" size={20} stroke={1.4} />
            <div className="mono" style={{
              fontSize: 11, letterSpacing: '.1em', marginTop: 8,
              textTransform: 'uppercase',
            }}>
              Créer une classe
            </div>
          </div>
        </button>
      </div>

      {creating && (
        <div className="modal-backdrop" onClick={() => setCreating(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="row spread" style={{ marginBottom: 12 }}>
              <h2 className="serif" style={{ fontSize: 20 }}>Nouvelle classe</h2>
              <button className="btn ghost sm" onClick={() => setCreating(false)}>
                <Icon name="x" size={14} />
              </button>
            </div>
            <label>
              <span className="field-label">Nom de la classe</span>
              <input
                className="field"
                placeholder="Ex. Terminale Spé Physique"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </label>
            <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
              Année académique <strong>{currentAcademicYear()}</strong> assignée automatiquement.
              Un code d'inscription unique sera généré.
            </div>
            <div className="row" style={{ gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setCreating(false)}>Annuler</button>
              <button className="btn accent" onClick={handleCreate}>
                <Icon name="plus" size={12} /> Créer la classe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
