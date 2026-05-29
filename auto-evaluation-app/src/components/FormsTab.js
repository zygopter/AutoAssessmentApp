import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCompetences } from '../contexts/CompetencesContext';
import { Icon } from './ui/Icon';
import { SectionHead } from './ui/SectionHead';
import { EmptyState } from './ui/EmptyState';

const CAT_PALETTE = ['#7a8a55', '#c97349', '#b85c3a', '#8a7c4a', '#5d6e7c', '#6a4f7a'];
const colorFor = (i) => CAT_PALETTE[i % CAT_PALETTE.length];

export default function FormsTab() {
  const navigate = useNavigate();
  const {
    formulaires,
    categories,
    classes,
    deleteFormulaireById,
    sendFormToClassById,
  } = useCompetences();
  const [search, setSearch] = useState('');
  const [sendingForm, setSendingForm] = useState(null);

  const competenceById = useMemo(() => {
    const m = {};
    categories.forEach((cat) => {
      (cat.competences ?? []).forEach((c) => { m[c.id] = { ...c, categoryId: cat.id }; });
    });
    return m;
  }, [categories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return formulaires.filter((f) => !q || f.title.toLowerCase().includes(q));
  }, [formulaires, search]);

  async function handleDelete(form) {
    if (!window.confirm(`Supprimer le formulaire "${form.title}" ?`)) return;
    try {
      await deleteFormulaireById(form.id);
      toast.success('Formulaire supprimé');
    } catch (err) {
      toast.error(`Erreur : ${err.message}`);
    }
  }

  return (
    <div className="page">
      <SectionHead
        eyebrow="Mes formulaires"
        title="Formulaires"
        desc="Composez un formulaire en piochant des compétences dans votre référentiel, puis envoyez-le à une classe."
        actions={
          <>
            <div className="row" style={{
              padding: '0 10px',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-md)',
              background: 'var(--surface)',
              width: 240,
            }}>
              <Icon name="search" size={14} style={{ color: 'var(--muted)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un formulaire"
                style={{
                  border: 0, outline: 0, padding: '8px 10px',
                  background: 'transparent', flex: 1, fontSize: 13,
                }}
              />
            </div>
            <button className="btn accent" onClick={() => navigate('/teacher/formulaires/new')}>
              <Icon name="plus" size={14} /> Nouveau formulaire
            </button>
          </>
        }
      />

      {filtered.length === 0 && formulaires.length === 0 ? (
        <EmptyState
          icon="form"
          title="Pas encore de formulaire"
          desc="Créez votre premier formulaire pour démarrer une auto-évaluation."
          action={
            <button className="btn accent" onClick={() => navigate('/teacher/formulaires/new')}>
              <Icon name="plus" size={14} /> Nouveau formulaire
            </button>
          }
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 16,
        }}>
          {filtered.map((f) => (
            <FormCard
              key={f.id}
              form={f}
              categories={categories}
              competenceById={competenceById}
              onPreview={() => navigate(`/formulaires/preview/${f.id}`)}
              onSend={() => setSendingForm(f)}
              onDelete={() => handleDelete(f)}
            />
          ))}

          <button
            className="card"
            onClick={() => navigate('/teacher/formulaires/new')}
            style={{
              border: '1px dashed var(--line)',
              background: 'transparent',
              color: 'var(--muted)',
              display: 'grid', placeItems: 'center',
              minHeight: 200,
              cursor: 'pointer',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <Icon name="plus" size={20} stroke={1.4} />
              <div className="mono" style={{
                fontSize: 11, letterSpacing: '.1em',
                marginTop: 8, textTransform: 'uppercase',
              }}>
                Nouveau formulaire
              </div>
            </div>
          </button>
        </div>
      )}

      {sendingForm && (
        <SendFormModal
          form={sendingForm}
          classes={classes}
          onClose={() => setSendingForm(null)}
          onSend={async (classId) => {
            try {
              await sendFormToClassById(classId, sendingForm.id);
              toast.success('Formulaire envoyé');
              setSendingForm(null);
            } catch (err) {
              toast.error(`Erreur : ${err.message}`);
            }
          }}
        />
      )}
    </div>
  );
}

function FormCard({ form, categories, competenceById, onPreview, onSend, onDelete }) {
  const byCat = {};
  (form.competences || []).forEach((id) => {
    const c = competenceById[id];
    if (!c) return;
    (byCat[c.categoryId] = byCat[c.categoryId] || []).push(c);
  });

  return (
    <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'var(--pad-card)', flex: 1 }}>
        <div className="row spread" style={{ marginBottom: 14 }}>
          <span className="tag accent">
            <Icon name="form" size={10} /> Formulaire
          </span>
        </div>
        <div className="serif" style={{ fontSize: 19, lineHeight: 1.2, marginBottom: 14 }}>
          {form.title}
        </div>

        <div className="col" style={{ gap: 6, marginBottom: 14 }}>
          {Object.entries(byCat).map(([catId, comps]) => {
            const cat = categories.find((c) => c.id === catId);
            const i = categories.findIndex((c) => c.id === catId);
            if (!cat) return null;
            return (
              <div key={catId} className="row" style={{ gap: 8, fontSize: 12 }}>
                <span style={{
                  width: 8, height: 8, background: colorFor(i),
                  borderRadius: 2, transform: 'rotate(45deg)',
                }} />
                <span style={{ color: 'var(--ink-2)', flex: 1 }}>{cat.name}</span>
                <span className="mono muted" style={{ fontSize: 11 }}>×{comps.length}</span>
              </div>
            );
          })}
          {Object.keys(byCat).length === 0 && (
            <div className="muted" style={{ fontSize: 12, fontStyle: 'italic' }}>
              Aucune compétence sélectionnée.
            </div>
          )}
        </div>
      </div>

      <div className="row" style={{
        padding: '12px var(--pad-card)',
        borderTop: '1px solid var(--hairline)',
        gap: 8,
        background: 'var(--paper-2)',
      }}>
        <button className="btn sm" onClick={onPreview}>
          <Icon name="eye" size={12} /> Aperçu
        </button>
        <button className="btn sm" onClick={onSend}>
          <Icon name="send" size={12} /> Envoyer
        </button>
        <div style={{ flex: 1 }} />
        <button className="btn ghost sm" onClick={onDelete} title="Supprimer">
          <Icon name="trash" size={12} />
        </button>
      </div>
    </div>
  );
}

function SendFormModal({ form, classes, onClose, onSend }) {
  const [classId, setClassId] = useState('');
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="row spread" style={{ marginBottom: 12 }}>
          <h2 className="serif" style={{ fontSize: 20 }}>Envoyer "{form.title}"</h2>
          <button className="btn ghost sm" onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
        </div>
        {classes.length === 0 ? (
          <div className="muted" style={{ fontSize: 13 }}>
            Vous n'avez pas encore de classe.
          </div>
        ) : (
          <>
            <label>
              <span className="field-label">Classe</span>
              <select
                className="field"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                <option value="">— Choisir une classe —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.year})</option>
                ))}
              </select>
            </label>
            <div className="row" style={{ gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={onClose}>Annuler</button>
              <button
                className="btn accent"
                disabled={!classId}
                onClick={() => onSend(classId)}
                style={{ opacity: classId ? 1 : 0.5 }}
              >
                <Icon name="send" size={12} /> Envoyer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
