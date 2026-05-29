import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useCompetences } from '../contexts/CompetencesContext';
import { Icon } from './ui/Icon';
import { SectionHead } from './ui/SectionHead';
import { EmptyState } from './ui/EmptyState';

// Stable palette assigned by category index — keeps the rail varied without
// adding a color column to the database.
const CAT_PALETTE = ['#7a8a55', '#c97349', '#b85c3a', '#8a7c4a', '#5d6e7c', '#6a4f7a'];
const colorFor = (i) => CAT_PALETTE[i % CAT_PALETTE.length];

const DRAFT_ID = '__draft__';

export default function CompetencesTab() {
  const {
    categories,
    addCategory,
    updateCategoryById,
    deleteCategoryById,
    addCompetence,
    updateCompetenceById,
    deleteCompetenceById,
  } = useCompetences();

  const [activeCatId, setActiveCatId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);          // unsaved competence
  const [editingCat, setEditingCat] = useState(null); // { id, name, description } | { kind: 'new', name, description }

  // Pick a default active category once data has loaded.
  useEffect(() => {
    if (!activeCatId && categories.length) {
      setActiveCatId(categories[0].id);
    }
  }, [categories, activeCatId]);

  const activeCat = useMemo(
    () => categories.find((c) => c.id === activeCatId),
    [categories, activeCatId]
  );
  const activeCatIndex = useMemo(
    () => categories.findIndex((c) => c.id === activeCatId),
    [categories, activeCatId]
  );

  function startNewCompetence() {
    if (!activeCatId) return;
    setDraft({
      id: DRAFT_ID,
      name: '',
      description: '',
      controlPoints: [''],
      categoryId: activeCatId,
    });
    setEditingId(DRAFT_ID);
  }

  function cancelDraft() {
    setDraft(null);
    setEditingId(null);
  }

  async function persistCompetence(patch) {
    // patch is the full in-memory competence (existing or draft)
    if (patch.id === DRAFT_ID) {
      if (!patch.name?.trim()) {
        toast.error('Le nom est requis.');
        return;
      }
      try {
        await addCompetence({
          name: patch.name,
          description: patch.description,
          categoryId: patch.categoryId,
          controlPoints: patch.controlPoints.filter((cp) => cp.trim()),
        });
        toast.success('Compétence ajoutée');
        setDraft(null);
        setEditingId(null);
      } catch (err) {
        toast.error(`Erreur : ${err.message}`);
      }
      return;
    }
    try {
      await updateCompetenceById(patch.id, {
        name: patch.name,
        description: patch.description,
        categoryId: patch.categoryId,
        controlPoints: patch.controlPoints.filter((cp) => cp.trim()),
      });
      toast.success('Compétence mise à jour');
      setEditingId(null);
    } catch (err) {
      toast.error(`Erreur : ${err.message}`);
    }
  }

  async function removeCompetence(id) {
    try {
      await deleteCompetenceById(id, activeCatId);
      toast.success('Compétence supprimée');
      if (editingId === id) setEditingId(null);
    } catch (err) {
      toast.error(`Erreur : ${err.message}`);
    }
  }

  async function saveCategory() {
    if (!editingCat) return;
    if (!editingCat.name?.trim()) {
      toast.error('Le nom est requis.');
      return;
    }
    try {
      if (editingCat.kind === 'new') {
        const created = await addCategory({
          name: editingCat.name,
          description: editingCat.description ?? '',
        });
        toast.success('Catégorie ajoutée');
        if (created?.id) setActiveCatId(created.id);
      } else {
        await updateCategoryById(editingCat.id, {
          name: editingCat.name,
          description: editingCat.description ?? '',
        });
        toast.success('Catégorie mise à jour');
      }
      setEditingCat(null);
    } catch (err) {
      toast.error(`Erreur : ${err.message}`);
    }
  }

  async function removeActiveCategory() {
    if (!activeCat) return;
    if (activeCat.competences?.length) {
      toast.error('La catégorie contient encore des compétences.');
      return;
    }
    if (!window.confirm(`Supprimer la catégorie "${activeCat.name}" ?`)) return;
    try {
      await deleteCategoryById(activeCat.id);
      toast.success('Catégorie supprimée');
      setActiveCatId(categories.find((c) => c.id !== activeCat.id)?.id ?? null);
    } catch (err) {
      toast.error(`Erreur : ${err.message}`);
    }
  }

  // Build the list of competences shown in the right pane (draft + persisted).
  const shownComps = useMemo(() => {
    if (!activeCat) return [];
    const persisted = activeCat.competences ?? [];
    return draft && draft.categoryId === activeCat.id
      ? [...persisted, draft]
      : persisted;
  }, [activeCat, draft]);

  return (
    <div className="page">
      <SectionHead
        eyebrow="Référentiel"
        title="Compétences"
        desc="Le socle commun de votre établissement. Vos collègues peuvent lire ce référentiel ; seules vos créations restent modifiables par vous."
        actions={
          <button className="btn accent" onClick={startNewCompetence} disabled={!activeCat}>
            <Icon name="plus" size={14} /> Nouvelle compétence
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>
        {/* Categories rail */}
        <aside>
          <div className="row spread" style={{ marginBottom: 12 }}>
            <div className="field-label" style={{ margin: 0 }}>Catégories</div>
            <button
              className="btn ghost sm"
              title="Ajouter une catégorie"
              onClick={() => setEditingCat({ kind: 'new', name: '', description: '' })}
            >
              <Icon name="plus" size={12} />
            </button>
          </div>

          {editingCat?.kind === 'new' && (
            <CategoryInlineEditor
              value={editingCat}
              onChange={(v) => setEditingCat({ ...editingCat, ...v })}
              onSave={saveCategory}
              onCancel={() => setEditingCat(null)}
            />
          )}

          <div className="col" style={{ gap: 4 }}>
            {categories.map((c, i) => {
              const active = c.id === activeCatId;
              const count = c.competences?.length ?? 0;
              return (
                <button
                  key={c.id}
                  onClick={() => { setActiveCatId(c.id); setEditingId(null); setDraft(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid ' + (active ? 'var(--line)' : 'transparent'),
                    background: active ? 'var(--surface)' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{
                    width: 10, height: 10, borderRadius: 2,
                    background: colorFor(i),
                    transform: 'rotate(45deg)',
                    flexShrink: 0,
                  }} />
                  <span style={{ flex: 1 }}>
                    <span className="serif" style={{ display: 'block', fontSize: 15, lineHeight: 1.2 }}>
                      {c.name}
                    </span>
                    <span className="muted" style={{ fontSize: 11 }}>{count} compétences</span>
                  </span>
                  {active && <Icon name="chev-r" size={14} />}
                </button>
              );
            })}
          </div>

          <hr className="hairline" style={{ margin: '18px 0' }} />
          <div className="card" style={{ padding: 14, background: 'var(--paper-2)' }}>
            <div className="field-label" style={{ marginBottom: 6 }}>Conseil</div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55 }}>
              Une compétence devrait pouvoir être notée par n'importe quel collègue de la spé sans en discuter avec vous. Si ce n'est pas le cas, c'est qu'il manque des points de contrôle.
            </div>
          </div>
        </aside>

        {/* Active category content */}
        <section>
          {!activeCat ? (
            <EmptyState
              icon="book"
              title="Aucune catégorie"
              desc="Créez une première catégorie depuis le rail à gauche."
            />
          ) : editingCat?.kind === 'edit' && editingCat.id === activeCat.id ? (
            <CategoryInlineEditor
              value={editingCat}
              onChange={(v) => setEditingCat({ ...editingCat, ...v })}
              onSave={saveCategory}
              onCancel={() => setEditingCat(null)}
            />
          ) : (
            <div className="row spread" style={{ marginBottom: 18 }}>
              <div>
                <div className="mono" style={{
                  fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase',
                  color: colorFor(activeCatIndex), marginBottom: 4,
                }}>
                  {activeCat.name}
                </div>
                <div className="muted" style={{ maxWidth: 540 }}>
                  {activeCat.description || 'Pas de description.'}
                </div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button
                  className="btn sm"
                  onClick={() => setEditingCat({ kind: 'edit', id: activeCat.id, name: activeCat.name, description: activeCat.description || '' })}
                >
                  <Icon name="edit" size={12} /> Renommer
                </button>
                <button className="btn sm" onClick={removeActiveCategory}>
                  <Icon name="trash" size={12} /> Supprimer
                </button>
              </div>
            </div>
          )}

          {activeCat && (
            <div className="col" style={{ gap: 12 }}>
              {shownComps.length === 0 && (
                <EmptyState
                  icon="book"
                  title="Aucune compétence dans cette catégorie"
                  desc="Créez-en une pour commencer à construire votre référentiel."
                  action={
                    <button className="btn accent" onClick={startNewCompetence}>
                      <Icon name="plus" size={14} /> Nouvelle compétence
                    </button>
                  }
                />
              )}

              {shownComps.map((c, i) => (
                <CompetenceCard
                  key={c.id}
                  comp={c}
                  index={i}
                  editing={editingId === c.id}
                  accentColor={colorFor(activeCatIndex)}
                  onStartEdit={() => setEditingId(c.id)}
                  onCancel={() => (c.id === DRAFT_ID ? cancelDraft() : setEditingId(null))}
                  onChange={(patch) => {
                    if (c.id === DRAFT_ID) {
                      setDraft((d) => ({ ...d, ...patch }));
                    } else {
                      // edit-in-place: keep changes in local component state, see below
                      // (CompetenceCard owns the editing state for persisted comps)
                    }
                  }}
                  onSave={persistCompetence}
                  onDelete={() => removeCompetence(c.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function CategoryInlineEditor({ value, onChange, onSave, onCancel }) {
  return (
    <div className="card fade-in" style={{
      borderColor: 'var(--accent)', boxShadow: '0 0 0 3px var(--accent-soft)',
      marginBottom: 14,
    }}>
      <label>
        <span className="field-label">Nom de la catégorie</span>
        <input
          className="field"
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Ex. Réaliser"
        />
      </label>
      <label style={{ display: 'block', marginTop: 12 }}>
        <span className="field-label">Description</span>
        <textarea
          className="field"
          rows={2}
          value={value.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="À quoi sert cette catégorie ?"
        />
      </label>
      <div className="row" style={{ gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
        <button className="btn" onClick={onCancel}>Annuler</button>
        <button className="btn accent" onClick={onSave}>
          <Icon name="save" size={12} /> Enregistrer
        </button>
      </div>
    </div>
  );
}

function CompetenceCard({ comp, index, editing, accentColor, onStartEdit, onCancel, onSave, onDelete }) {
  // CompetenceCard owns the edit-in-progress state to keep typing snappy.
  const [local, setLocal] = useState({
    name: comp.name,
    description: comp.description ?? '',
    controlPoints: comp.controlPoints?.length ? comp.controlPoints : [''],
    categoryId: comp.categoryId,
    id: comp.id,
  });

  useEffect(() => {
    if (editing) {
      setLocal({
        name: comp.name,
        description: comp.description ?? '',
        controlPoints: comp.controlPoints?.length ? comp.controlPoints : [''],
        categoryId: comp.categoryId,
        id: comp.id,
      });
    }
  }, [editing, comp]);

  const numStr = String(index + 1).padStart(2, '0');

  if (!editing) {
    return (
      <div className="card fade-in" style={{ display: 'flex', gap: 18 }}>
        <div style={{
          flexShrink: 0,
          fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.08em',
          color: 'var(--muted)',
          width: 28,
        }}>{numStr}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row spread" style={{ alignItems: 'flex-start' }}>
            <div>
              <div className="serif" style={{ fontSize: 18, lineHeight: 1.25, marginBottom: 4 }}>
                {comp.name || <span className="muted">(sans titre)</span>}
              </div>
              <div className="muted" style={{ fontSize: 13, maxWidth: 620 }}>{comp.description}</div>
            </div>
            <div className="row" style={{ gap: 4 }}>
              <button className="btn ghost sm" onClick={onStartEdit}>
                <Icon name="edit" size={12} /> Modifier
              </button>
              <button className="btn ghost sm" onClick={onDelete}>
                <Icon name="trash" size={12} />
              </button>
            </div>
          </div>
          {comp.controlPoints?.length > 0 && (
            <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {comp.controlPoints.map((cp, j) => (
                <span key={j} className="tag" style={{
                  background: 'transparent',
                  borderColor: 'var(--hairline)',
                  fontFamily: 'var(--sans)',
                  textTransform: 'none',
                  letterSpacing: 'normal',
                  fontSize: 12,
                  color: 'var(--ink-2)',
                }}>
                  <span style={{
                    display: 'inline-block', width: 4, height: 4, borderRadius: '50%',
                    background: accentColor, marginRight: 2,
                  }} />
                  {cp}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card fade-in" style={{
      borderColor: 'var(--accent)', boxShadow: '0 0 0 3px var(--accent-soft)',
    }}>
      <div className="row" style={{ gap: 8, marginBottom: 14, alignItems: 'center' }}>
        <Icon name="edit" size={14} />
        <span className="mono" style={{
          fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase',
          color: 'var(--accent-ink)',
        }}>
          Édition · compétence {numStr}
        </span>
      </div>

      <div className="col" style={{ gap: 12 }}>
        <label>
          <span className="field-label">Nom</span>
          <input
            className="field"
            value={local.name}
            onChange={(e) => setLocal({ ...local, name: e.target.value })}
            placeholder="Ex. Effectuer une mesure"
          />
        </label>
        <label>
          <span className="field-label">Description courte</span>
          <textarea
            className="field"
            rows={2}
            value={local.description}
            onChange={(e) => setLocal({ ...local, description: e.target.value })}
            placeholder="Ce que l'élève doit savoir faire."
          />
        </label>

        <div>
          <div className="row spread" style={{ marginBottom: 8 }}>
            <span className="field-label" style={{ margin: 0 }}>Points de contrôle</span>
            <button
              className="btn ghost sm"
              onClick={() => setLocal({ ...local, controlPoints: [...local.controlPoints, ''] })}
            >
              <Icon name="plus" size={12} /> Ajouter
            </button>
          </div>
          <div className="col" style={{ gap: 6 }}>
            {local.controlPoints.map((cp, j) => (
              <div key={j} className="row" style={{ gap: 8 }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--muted)', width: 22, textAlign: 'right' }}>
                  {j + 1}
                </span>
                <input
                  className="field"
                  value={cp}
                  onChange={(e) => {
                    const next = [...local.controlPoints];
                    next[j] = e.target.value;
                    setLocal({ ...local, controlPoints: next });
                  }}
                  placeholder="Un critère vérifiable"
                />
                <button
                  className="btn ghost sm"
                  onClick={() => setLocal({
                    ...local,
                    controlPoints: local.controlPoints.filter((_, k) => k !== j),
                  })}
                >
                  <Icon name="x" size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="row" style={{ gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
        <button className="btn" onClick={onCancel}>Annuler</button>
        <button className="btn accent" onClick={() => onSave(local)}>
          <Icon name="save" size={12} /> Enregistrer
        </button>
      </div>
    </div>
  );
}
