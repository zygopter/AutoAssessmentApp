import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCompetences } from '../contexts/CompetencesContext';
import { Icon } from './ui/Icon';
import { SectionHead } from './ui/SectionHead';

const CAT_PALETTE = ['#7a8a55', '#c97349', '#b85c3a', '#8a7c4a', '#5d6e7c', '#6a4f7a'];
const colorFor = (i) => CAT_PALETTE[i % CAT_PALETTE.length];

export default function FormCreate() {
  const navigate = useNavigate();
  const { categories, addFormulaire } = useCompetences();
  const [title, setTitle] = useState('');
  const [picked, setPicked] = useState(() => new Set());
  const [saving, setSaving] = useState(false);

  function toggle(id) {
    setPicked((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error('Le titre est requis.');
      return;
    }
    if (picked.size === 0) {
      toast.error('Sélectionnez au moins une compétence.');
      return;
    }
    setSaving(true);
    try {
      await addFormulaire({ title: title.trim(), competences: Array.from(picked) });
      toast.success('Formulaire enregistré');
      navigate('/teacher/formulaires');
    } catch (err) {
      toast.error(`Erreur : ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <button
        className="btn ghost sm"
        onClick={() => navigate('/teacher/formulaires')}
        style={{ marginBottom: 18, padding: '4px 8px' }}
      >
        <Icon name="arrow-l" size={12} /> Tous les formulaires
      </button>

      <SectionHead
        eyebrow="Nouveau formulaire"
        title="Composer une auto-évaluation"
        desc="Cochez les compétences que les élèves devront s'auto-évaluer. Vous pouvez piocher entre catégories."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Picker */}
        <div className="col" style={{ gap: 16 }}>
          <div className="card">
            <label>
              <span className="field-label">Titre du formulaire</span>
              <input
                className="field"
                placeholder="Ex. TP n°6 — Ondes stationnaires"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </label>
          </div>

          {categories.length === 0 ? (
            <div className="muted" style={{ fontSize: 13, padding: '20px 0' }}>
              Aucune catégorie n'a encore été créée. Commencez par alimenter le
              référentiel dans l'onglet Compétences.
            </div>
          ) : (
            <div className="col" style={{ gap: 12 }}>
              {categories.map((cat, ci) => {
                const ccs = cat.competences ?? [];
                const pickedInCat = ccs.filter((c) => picked.has(c.id)).length;
                return (
                  <div key={cat.id} className="card" style={{ padding: 0 }}>
                    <div className="row spread" style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--hairline)',
                    }}>
                      <div className="row" style={{ gap: 8 }}>
                        <span style={{
                          width: 10, height: 10, background: colorFor(ci),
                          borderRadius: 2, transform: 'rotate(45deg)',
                        }} />
                        <span className="serif" style={{ fontSize: 16 }}>{cat.name}</span>
                        <span className="muted" style={{ fontSize: 12 }}>
                          · {ccs.length} compétences
                        </span>
                      </div>
                      <div className="row" style={{ gap: 8 }}>
                        <span className="mono" style={{
                          fontSize: 11,
                          color: pickedInCat > 0 ? 'var(--accent-ink)' : 'var(--muted)',
                        }}>
                          {pickedInCat} / {ccs.length}
                        </span>
                        <button
                          className="btn ghost sm"
                          onClick={() => {
                            const allOn = pickedInCat === ccs.length;
                            setPicked((p) => {
                              const next = new Set(p);
                              ccs.forEach((c) => allOn ? next.delete(c.id) : next.add(c.id));
                              return next;
                            });
                          }}
                          disabled={ccs.length === 0}
                        >
                          {pickedInCat === ccs.length && ccs.length > 0
                            ? 'Tout désélectionner'
                            : 'Tout sélectionner'}
                        </button>
                      </div>
                    </div>
                    <div className="col" style={{ gap: 0 }}>
                      {ccs.map((c) => (
                        <label
                          key={c.id}
                          className="row"
                          style={{
                            padding: '10px 16px',
                            gap: 12,
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--hairline)',
                            background: picked.has(c.id) ? 'var(--accent-soft)' : 'transparent',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={picked.has(c.id)}
                            onChange={() => toggle(c.id)}
                            style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, color: 'var(--ink)' }}>{c.name}</div>
                            <div className="muted" style={{ fontSize: 12, marginTop: 1 }}>
                              {c.description}
                            </div>
                          </div>
                          <span className="mono muted" style={{ fontSize: 10 }}>
                            {c.controlPoints?.length || 0} pts ctrl
                          </span>
                        </label>
                      ))}
                      {ccs.length === 0 && (
                        <div className="muted" style={{
                          padding: '14px 16px', fontSize: 12, fontStyle: 'italic',
                        }}>
                          Aucune compétence dans cette catégorie.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        <aside style={{ position: 'sticky', top: 88, alignSelf: 'flex-start' }}>
          <div className="card">
            <div className="mono" style={{
              fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase',
              color: 'var(--muted)', marginBottom: 8,
            }}>
              Résumé
            </div>
            <div className="serif" style={{ fontSize: 22, lineHeight: 1.1, marginBottom: 12 }}>
              {title || <span className="muted">Sans titre</span>}
            </div>

            <div className="row spread" style={{
              padding: '10px 0',
              borderTop: '1px solid var(--hairline)',
              borderBottom: '1px solid var(--hairline)',
              marginBottom: 12,
            }}>
              <span className="muted" style={{ fontSize: 12 }}>Compétences</span>
              <span className="serif" style={{ fontSize: 22 }}>{picked.size}</span>
            </div>

            <div className="col" style={{ gap: 4, marginBottom: 14 }}>
              {categories.map((cat, ci) => {
                const n = (cat.competences ?? []).filter((c) => picked.has(c.id)).length;
                if (n === 0) return null;
                return (
                  <div key={cat.id} className="row" style={{ gap: 8, fontSize: 12 }}>
                    <span style={{
                      width: 6, height: 6, background: colorFor(ci),
                      borderRadius: 1, transform: 'rotate(45deg)',
                    }} />
                    <span style={{ flex: 1, color: 'var(--ink-2)' }}>{cat.name}</span>
                    <span className="mono muted">×{n}</span>
                  </div>
                );
              })}
              {picked.size === 0 && (
                <div className="muted" style={{ fontSize: 12, fontStyle: 'italic' }}>
                  Cochez des compétences pour les ajouter au formulaire.
                </div>
              )}
            </div>

            <div className="col" style={{ gap: 8 }}>
              <button
                className="btn accent"
                disabled={picked.size === 0 || !title.trim() || saving}
                onClick={handleSave}
                style={{
                  justifyContent: 'center',
                  opacity: (picked.size === 0 || !title.trim() || saving) ? 0.5 : 1,
                }}
              >
                <Icon name="save" size={12} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>

          <div style={{
            marginTop: 14, padding: '12px 14px',
            fontSize: 12, color: 'var(--muted)',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <Icon name="warn" size={14} style={{
              flexShrink: 0, marginTop: 1, color: 'var(--accent-ink)',
            }} />
            <div>
              Un formulaire ne devrait pas être modifié après envoi à une classe —
              les soumissions déjà reçues garderaient une référence aux compétences
              initiales.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
