import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useCompetences } from '../contexts/CompetencesContext';
import { Icon } from './ui/Icon';
import { EmptyState } from './ui/EmptyState';
import { FormFillBody } from './FormFillBody';

export default function StudentFormFill() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categories, getStudentPendingForms, submitStudentFormById } = useCompetences();

  const [pending, setPending] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user) return;
      try {
        const forms = await getStudentPendingForms(user.id);
        const found = forms.find((f) => f.id === formId);
        if (!active) return;
        if (!found) {
          setLoadError('Ce formulaire n\'est plus en attente ou ne vous est pas adressé.');
        } else {
          setPending(found);
        }
      } catch (err) {
        if (active) setLoadError(err.message);
      }
    }
    load();
    return () => { active = false; };
  }, [user, formId, getStudentPendingForms]);

  const allComps = useMemo(
    () => categories.flatMap((cat) => (cat.competences ?? []).map((c) => ({ ...c, categoryId: cat.id }))),
    [categories]
  );

  const pickedComps = useMemo(() => {
    if (!pending) return [];
    return (pending.competences || [])
      .map((id) => allComps.find((c) => c.id === id))
      .filter(Boolean);
  }, [pending, allComps]);

  const filled = Object.keys(answers).filter((k) => answers[k]).length;
  const total = pickedComps.length;
  const pct = total ? Math.round(filled / total * 100) : 0;
  const complete = total > 0 && filled === total;

  async function handleSubmit() {
    if (!pending) return;
    if (!complete) {
      toast.error('Répondez à toutes les compétences avant d\'envoyer.');
      return;
    }
    setSubmitting(true);
    try {
      await submitStudentFormById(pending.id, pending.studentId, answers);
      toast.success('Auto-évaluation envoyée');
      navigate('/confirmation');
    } catch (err) {
      toast.error(`Erreur : ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div className="page" style={{ maxWidth: 880 }}>
        <button className="btn ghost sm" onClick={() => navigate('/student')} style={{ marginBottom: 18 }}>
          <Icon name="arrow-l" size={12} /> Retour
        </button>
        <EmptyState icon="form" title="Formulaire indisponible" desc={loadError} />
      </div>
    );
  }

  if (!pending) {
    return (
      <div className="page" style={{ maxWidth: 880 }}>
        <div className="muted" style={{ padding: '40px 0', textAlign: 'center' }}>
          Chargement…
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 880 }}>
      <button
        className="btn ghost sm"
        onClick={() => navigate('/student')}
        style={{ marginBottom: 18, padding: '4px 8px' }}
      >
        <Icon name="arrow-l" size={12} /> Retour
      </button>

      <div style={{
        background: 'var(--paper)',
        borderBottom: '1px solid var(--hairline)',
        margin: '0 -28px 28px',
        padding: '0 28px 18px',
        position: 'sticky', top: 0, zIndex: 5,
      }}>
        <div className="mono" style={{
          fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase',
          color: 'var(--muted)', marginBottom: 6,
        }}>
          Auto-évaluation
        </div>
        <h1 style={{ fontSize: 28, lineHeight: 1.15, marginBottom: 14 }}>{pending.title}</h1>
        <div className="row" style={{ gap: 14, alignItems: 'center' }}>
          <div className="progress" style={{ flex: 1 }}>
            <div style={{ width: `${pct}%` }} />
          </div>
          <div className="mono" style={{
            fontSize: 12, color: 'var(--ink-2)', minWidth: 60, textAlign: 'right',
          }}>
            {filled} / {total}
          </div>
        </div>
      </div>

      <div className="card" style={{
        padding: '12px 16px', marginBottom: 22,
        background: 'var(--paper-2)', borderColor: 'var(--hairline)',
        display: 'flex', gap: 14, alignItems: 'flex-start',
      }}>
        <Icon name="dot" size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
          Positionnez-vous honnêtement sur chaque compétence. Vos réponses servent
          à votre professeur·e pour adapter le cours — il ne s'agit pas d'une note.
        </div>
      </div>

      <FormFillBody
        comps={pickedComps}
        categories={categories}
        answers={answers}
        onChange={(id, v) => setAnswers((o) => ({ ...o, [id]: v }))}
      />

      <div style={{
        marginTop: 32, padding: 20,
        border: '1px solid ' + (complete ? 'var(--accent-line)' : 'var(--hairline)'),
        borderRadius: 'var(--r-lg)',
        background: complete ? 'var(--accent-soft)' : 'var(--surface)',
        display: 'flex', alignItems: 'center', gap: 18,
      }}>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 18, lineHeight: 1.2 }}>
            {complete
              ? 'Tout est rempli — vous pouvez envoyer.'
              : `Il reste ${total - filled} compétence${total - filled > 1 ? 's' : ''} à évaluer.`}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Une fois envoyé, vous ne pourrez plus modifier vos réponses.
          </div>
        </div>
        <button
          className="btn accent"
          disabled={!complete || submitting}
          onClick={handleSubmit}
          style={{ padding: '10px 18px', opacity: complete && !submitting ? 1 : 0.5 }}
        >
          <Icon name="send" size={14} /> {submitting ? 'Envoi…' : 'Envoyer mes réponses'}
        </button>
      </div>
    </div>
  );
}
