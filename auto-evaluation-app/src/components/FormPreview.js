import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCompetences } from '../contexts/CompetencesContext';
import { Icon } from './ui/Icon';
import { SectionHead } from './ui/SectionHead';
import { EmptyState } from './ui/EmptyState';
import { FormFillBody } from './FormFillBody';

export default function FormPreview() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { formulaires, categories } = useCompetences();

  const form = useMemo(
    () => formulaires.find((f) => f.id === formId),
    [formulaires, formId]
  );

  const allComps = useMemo(
    () => categories.flatMap((cat) => (cat.competences ?? []).map((c) => ({ ...c, categoryId: cat.id }))),
    [categories]
  );

  if (!form) {
    return (
      <div className="page">
        <button className="btn ghost sm" onClick={() => navigate(-1)} style={{ marginBottom: 18 }}>
          <Icon name="arrow-l" size={12} /> Retour
        </button>
        <EmptyState
          icon="form"
          title="Formulaire introuvable"
          desc="Il a peut-être été supprimé."
        />
      </div>
    );
  }

  const pickedComps = (form.competences || [])
    .map((id) => allComps.find((c) => c.id === id))
    .filter(Boolean);

  const distinctCats = new Set(pickedComps.map((c) => c.categoryId)).size;

  function copyLink() {
    const url = `${window.location.origin}/formulaires/preview/${form.id}`;
    navigator.clipboard.writeText(url).then(
      () => {},
      () => {},
    );
  }

  return (
    <div className="page">
      <button
        className="btn ghost sm"
        onClick={() => navigate(-1)}
        style={{ marginBottom: 18, padding: '4px 8px' }}
      >
        <Icon name="arrow-l" size={12} /> Retour
      </button>

      <div className="card" style={{
        padding: 14, marginBottom: 24,
        background: 'var(--accent-soft)', borderColor: 'var(--accent-line)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Icon name="eye" size={16} style={{ color: 'var(--accent-ink)' }} />
        <div style={{ flex: 1, color: 'var(--accent-ink)' }}>
          <strong style={{ fontWeight: 500 }}>Mode aperçu — rendu côté élève.</strong>{' '}
          Les réponses ne seront pas enregistrées.
        </div>
        <button className="btn sm" onClick={copyLink}>
          <Icon name="copy" size={12} /> Copier le lien
        </button>
      </div>

      <SectionHead
        eyebrow="Aperçu"
        title={form.title}
        desc={`${pickedComps.length} compétences réparties en ${distinctCats} catégorie${distinctCats > 1 ? 's' : ''}.`}
      />

      {pickedComps.length === 0 ? (
        <EmptyState icon="form" title="Ce formulaire ne contient aucune compétence" />
      ) : (
        <FormFillBody comps={pickedComps} categories={categories} />
      )}
    </div>
  );
}
