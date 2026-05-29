import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCompetences } from '../contexts/CompetencesContext';
import { Icon } from './ui/Icon';
import { Eval, EvalLegend } from './ui/Eval';
import { EmptyState } from './ui/EmptyState';
import ImportStudents from './ImportStudents';

const CAT_PALETTE = ['#7a8a55', '#c97349', '#b85c3a', '#8a7c4a', '#5d6e7c', '#6a4f7a'];
const colorFor = (i) => CAT_PALETTE[i % CAT_PALETTE.length];

// Build { studentId: { competenceId: 'A'|'B'|'C'|'D' } } from raw submissions —
// most-recent value wins for each (student, competence) pair.
function buildGrades(submissions) {
  const ordered = [...submissions].sort(
    (a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)
  );
  const out = {};
  ordered.forEach((s) => {
    const slot = (out[s.studentId] = out[s.studentId] || {});
    Object.entries(s.responses || {}).forEach(([compId, value]) => {
      if (!(compId in slot)) slot[compId] = value;
    });
  });
  return out;
}

export default function ClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const {
    classes,
    categories,
    formulaires,
    getStudentsByClassId,
    getAssignmentsForClass,
    getSubmissionsForClass,
    sendFormToClassById,
    generateClassCodeById,
  } = useCompetences();

  const [students, setStudents]       = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState('eval');

  const cls = useMemo(() => classes.find((c) => c.id === classId), [classes, classId]);

  const reload = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const [stu, asg, sub] = await Promise.all([
        getStudentsByClassId(classId),
        getAssignmentsForClass(classId),
        getSubmissionsForClass(classId),
      ]);
      setStudents(stu);
      setAssignments(asg);
      setSubmissions(sub);
    } catch (err) {
      toast.error(`Erreur de chargement : ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [classId, getStudentsByClassId, getAssignmentsForClass, getSubmissionsForClass]);

  useEffect(() => { reload(); }, [reload]);

  const allComps = useMemo(
    () => categories.flatMap((cat) => (cat.competences ?? []).map((c) => ({ ...c, categoryId: cat.id }))),
    [categories]
  );

  const grades = useMemo(() => buildGrades(submissions), [submissions]);
  const joinedCount = students.filter((s) => s.userId).length;
  const expected = students.length * assignments.length;
  const coveredCompetences = useMemo(() => {
    const set = new Set();
    assignments.forEach((a) => (a.competences || []).forEach((id) => set.add(id)));
    return set.size;
  }, [assignments]);

  async function regenCode() {
    if (!window.confirm('Régénérer le code rendra l\'ancien code inutilisable. Continuer ?')) return;
    try {
      await generateClassCodeById(classId);
      toast.success('Nouveau code généré');
    } catch (err) {
      toast.error(`Erreur : ${err.message}`);
    }
  }

  function copyCode() {
    if (!cls?.code) return;
    navigator.clipboard.writeText(cls.code).then(
      () => toast.success('Code copié'),
      () => toast.error('Impossible de copier'),
    );
  }

  if (!cls) {
    return (
      <div className="page">
        <button className="btn ghost sm" onClick={() => navigate('/teacher/classes')}>
          <Icon name="arrow-l" size={12} /> Toutes les classes
        </button>
        <EmptyState icon="users" title="Classe introuvable" desc="Elle a peut-être été supprimée." />
      </div>
    );
  }

  return (
    <div className="page">
      <button
        className="btn ghost sm"
        onClick={() => navigate('/teacher/classes')}
        style={{ marginBottom: 18, padding: '4px 8px' }}
      >
        <Icon name="arrow-l" size={12} /> Toutes les classes
      </button>

      {/* Header */}
      <div className="row spread" style={{
        alignItems: 'flex-start',
        paddingBottom: 18,
        borderBottom: '1px solid var(--hairline)',
        marginBottom: 18,
      }}>
        <div>
          <div className="mono" style={{
            fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase',
            color: 'var(--muted)', marginBottom: 6,
          }}>
            Année {cls.year}
          </div>
          <h1 style={{ fontSize: 32, lineHeight: 1.1 }}>{cls.name}</h1>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <div className="card" style={{
            padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 14,
            background: 'var(--accent-soft)', borderColor: 'var(--accent-line)',
          }}>
            <div>
              <div className="mono" style={{
                fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase',
                color: 'var(--accent-ink)',
              }}>
                Code d'inscription
              </div>
              <div className="mono" style={{
                fontSize: 22, letterSpacing: '.15em',
                color: 'var(--accent-ink)', fontWeight: 500,
              }}>
                {cls.code}
              </div>
            </div>
            <button className="btn ghost sm" title="Copier" onClick={copyCode}>
              <Icon name="copy" size={12} />
            </button>
            <button className="btn ghost sm" title="Régénérer" onClick={regenCode}>
              <Icon name="refresh" size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="row" style={{ gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard label="Élèves"        value={students.length}    sub={`dont ${joinedCount} inscrits`} />
        <StatCard label="Formulaires envoyés" value={assignments.length} sub={assignments.length ? 'envois cette année' : 'aucun envoi'} />
        <StatCard
          label="Soumissions reçues"
          value={`${submissions.length}${expected ? ` / ${expected}` : ''}`}
          sub={expected ? `${Math.round(submissions.length / expected * 100)}% des élèves` : '—'}
          highlight
        />
        <StatCard
          label="Compétences couvertes"
          value={`${coveredCompetences} / ${allComps.length}`}
          sub="par les formulaires actifs"
        />
      </div>

      {/* Tabs */}
      <div className="row" style={{
        borderBottom: '1px solid var(--hairline)',
        marginBottom: 24, gap: 4,
      }}>
        {[
          { id: 'eval',     label: 'Évaluations',         icon: 'grid' },
          { id: 'students', label: 'Élèves',               icon: 'users' },
          { id: 'forms',    label: 'Formulaires envoyés', icon: 'send' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 14px',
              borderBottom: '2px solid ' + (tab === t.id ? 'var(--accent)' : 'transparent'),
              marginBottom: -1,
              color: tab === t.id ? 'var(--ink)' : 'var(--muted)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 14, cursor: 'pointer', background: 'none', border: 0,
            }}
          >
            <Icon name={t.icon} size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'eval' && (
        <EvalTab
          students={students}
          allComps={allComps}
          categories={categories}
          grades={grades}
        />
      )}

      {tab === 'students' && (
        <StudentsTab
          students={students}
          assignments={assignments}
          submissions={submissions}
          classId={classId}
          onChanged={reload}
        />
      )}

      {tab === 'forms' && (
        <FormsAssignedTab
          assignments={assignments}
          submissions={submissions}
          students={students}
          formulaires={formulaires}
          classId={classId}
          sendFormToClassById={sendFormToClassById}
          onSent={reload}
        />
      )}

      {loading && (
        <div className="muted" style={{ fontSize: 12, marginTop: 24, textAlign: 'center' }}>
          Mise à jour…
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, highlight }) {
  return (
    <div className="card" style={{
      flex: '1 1 180px',
      padding: '14px 16px',
      background: highlight ? 'var(--accent-soft)' : 'var(--surface)',
      borderColor: highlight ? 'var(--accent-line)' : 'var(--hairline)',
    }}>
      <div className="mono" style={{
        fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase',
        color: highlight ? 'var(--accent-ink)' : 'var(--muted)',
        marginBottom: 6,
      }}>
        {label}
      </div>
      <div className="serif" style={{
        fontSize: 26, lineHeight: 1.1,
        color: highlight ? 'var(--accent-ink)' : 'var(--ink)',
      }}>
        {value}
      </div>
      <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

// ============================================================================
// Tab: Évaluations
// ============================================================================
function EvalTab({ students, allComps, categories, grades }) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [view, setView] = useState('cards');

  const visibleComps = useMemo(
    () => (filterCat === 'all' ? allComps : allComps.filter((c) => c.categoryId === filterCat)),
    [filterCat, allComps]
  );

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (!q) return true;
      return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q);
    });
  }, [students, search]);

  return (
    <>
      <div className="row spread" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <div className="row" style={{
            padding: '0 10px',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-md)',
            background: 'var(--surface)',
            width: 260,
          }}>
            <Icon name="search" size={14} style={{ color: 'var(--muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un élève"
              style={{
                border: 0, outline: 0, padding: '8px 10px',
                background: 'transparent', flex: 1, fontSize: 13,
              }}
            />
          </div>
          <select
            className="field"
            style={{ width: 240, padding: '8px 10px' }}
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="row" style={{ gap: 14 }}>
          <EvalLegend compact />
          <div style={{
            display: 'inline-flex',
            border: '1px solid var(--line)',
            borderRadius: 999,
            padding: 3,
            background: 'var(--surface)',
          }}>
            {[
              { id: 'cards', label: 'Fiches', icon: 'cards' },
              { id: 'grid',  label: 'Tableau', icon: 'grid' },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() => setView(o.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  letterSpacing: '0.02em',
                  fontFamily: 'var(--mono)',
                  color: view === o.id ? 'var(--paper)' : 'var(--ink-2)',
                  background: view === o.id ? 'var(--ink)' : 'transparent',
                  border: 0, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                <Icon name={o.icon} size={12} /> {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <EmptyState icon="users" title="Aucun élève ne correspond" desc="Essayez un autre filtre ou réinitialisez la recherche." />
      ) : view === 'cards' ? (
        <StudentCardsView
          students={filteredStudents}
          comps={visibleComps}
          categories={categories}
          grades={grades}
        />
      ) : (
        <EvalGridView
          students={filteredStudents}
          comps={visibleComps}
          categories={categories}
          grades={grades}
        />
      )}
    </>
  );
}

function StudentCardsView({ students, comps, categories, grades }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
      gap: 14,
    }}>
      {students.map((s) => (
        <StudentCard
          key={s.id}
          student={s}
          comps={comps}
          categories={categories}
          grade={grades[s.id] || {}}
        />
      ))}
    </div>
  );
}

function StudentCard({ student, comps, categories, grade }) {
  const filledKeys = Object.keys(grade).filter((k) => comps.some((c) => c.id === k));
  const counts = { A: 0, B: 0, C: 0, D: 0 };
  filledKeys.forEach((k) => { counts[grade[k]] = (counts[grade[k]] || 0) + 1; });
  const total = filledKeys.length || 1;

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="row spread" style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--paper-2)',
            border: '1px solid var(--hairline)',
            display: 'grid', placeItems: 'center',
            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-2)',
          }}>
            {(student.firstName?.[0] || '?') + (student.lastName?.[0] || '?')}
          </div>
          <div>
            <div className="serif" style={{ fontSize: 16, lineHeight: 1.1 }}>
              {student.firstName}{' '}
              <span style={{ textTransform: 'uppercase', letterSpacing: '.01em' }}>
                {student.lastName}
              </span>
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
              {student.userId
                ? <><span style={{ color: 'var(--eval-a)' }}>●</span> Inscrit</>
                : <><span style={{ color: 'var(--muted)' }}>○</span> Fiche non réclamée</>}
            </div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden',
        marginBottom: 14, background: 'var(--paper-2)',
      }}>
        {['A', 'B', 'C', 'D'].map((k) => counts[k] ? (
          <div
            key={k}
            title={`${counts[k]} × ${k}`}
            style={{
              width: (counts[k] / total * 100) + '%',
              background: `var(--eval-${k.toLowerCase()})`,
            }}
          />
        ) : null)}
      </div>

      <div className="col" style={{ gap: 6 }}>
        {categories.map((cat) => {
          const ccs = (cat.competences ?? []).filter((c) => comps.some((x) => x.id === c.id));
          if (ccs.length === 0) return null;
          return (
            <div key={cat.id}>
              <div className="row" style={{ gap: 6, marginBottom: 4 }}>
                <span style={{
                  width: 6, height: 6,
                  background: colorFor(categories.findIndex((x) => x.id === cat.id)),
                  borderRadius: 1, transform: 'rotate(45deg)', display: 'inline-block',
                }} />
                <span className="mono" style={{
                  fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}>
                  {cat.name}
                </span>
              </div>
              <div className="col" style={{ gap: 2 }}>
                {ccs.map((c) => (
                  <div key={c.id} className="row" style={{
                    padding: '5px 8px', gap: 10, borderRadius: 4,
                  }}>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--ink-2)' }}>
                      {c.name}
                    </span>
                    <Eval value={grade[c.id]} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EvalGridView({ students, comps, categories, grades }) {
  if (comps.length === 0) {
    return <EmptyState icon="grid" title="Pas de données à croiser" desc="Élargissez le filtre pour afficher le tableau." />;
  }
  const compsByCat = categories
    .map((cat) => ({ cat, comps: comps.filter((c) => c.categoryId === cat.id) }))
    .filter((g) => g.comps.length > 0);

  return (
    <div className="grid-wrap">
      <table className="eval-grid">
        <thead>
          <tr>
            <th style={{ minWidth: 200 }}>Élève</th>
            {compsByCat.flatMap((g) =>
              g.comps.map((c, i) => (
                <th
                  key={c.id}
                  title={c.description}
                  style={{
                    minWidth: 70,
                    borderLeft: i === 0 ? '1px solid var(--line)' : '1px solid var(--hairline)',
                  }}
                >
                  {i === 0 && (
                    <span className="cat" style={{ color: colorFor(categories.findIndex((x) => x.id === g.cat.id)) }}>
                      {g.cat.name}
                    </span>
                  )}
                  <span style={{
                    display: 'block', fontSize: 11,
                    textTransform: 'none', letterSpacing: 'normal',
                  }}>
                    {c.name}
                  </span>
                </th>
              ))
            )}
            <th style={{ textAlign: 'center', minWidth: 70, borderLeft: '1px solid var(--line)' }}>
              Moy.
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const g = grades[s.id] || {};
            const vs = comps.map((c) => g[c.id]).filter((v) => 'ABCD'.includes(v));
            const score = vs.length
              ? vs.map((v) => ({ A: 4, B: 3, C: 2, D: 1 }[v])).reduce((a, b) => a + b, 0) / vs.length
              : null;
            const letter = score == null
              ? '-'
              : score >= 3.5 ? 'A' : score >= 2.5 ? 'B' : score >= 1.5 ? 'C' : 'D';
            return (
              <tr key={s.id}>
                <td className="student">
                  <span style={{
                    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                    background: s.userId ? 'var(--eval-a)' : 'var(--faint)',
                    marginRight: 8,
                  }} />
                  {s.firstName} <span style={{ textTransform: 'uppercase' }}>{s.lastName}</span>
                </td>
                {compsByCat.flatMap((grp) =>
                  grp.comps.map((c, i) => (
                    <td
                      key={c.id}
                      className="eval-cell"
                      style={{ borderLeft: i === 0 ? '1px solid var(--line)' : '1px solid var(--hairline)' }}
                    >
                      <Eval value={g[c.id]} />
                    </td>
                  ))
                )}
                <td className="eval-cell" style={{ borderLeft: '1px solid var(--line)' }}>
                  <Eval value={letter} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Tab: Élèves
// ============================================================================
function StudentsTab({ students, assignments, submissions, classId, onChanged }) {
  const [showImport, setShowImport] = useState(false);
  const submissionsByStudent = useMemo(() => {
    const m = {};
    submissions.forEach((s) => { m[s.studentId] = (m[s.studentId] || 0) + 1; });
    return m;
  }, [submissions]);

  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="row spread">
        <div className="muted" style={{ fontSize: 13 }}>
          {students.length} élèves — {students.filter((s) => s.userId).length} ont rejoint la classe
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn" onClick={() => setShowImport(true)}>
            <Icon name="import" size={14} /> Importer (CSV)
          </button>
        </div>
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon="users"
          title="Aucun élève dans cette classe"
          desc="Importez votre liste « Nom, Prénom » pour les ajouter en masse."
          action={
            <button className="btn accent" onClick={() => setShowImport(true)}>
              <Icon name="import" size={14} /> Importer la liste
            </button>
          }
        />
      ) : (
        <div className="grid-wrap">
          <table className="eval-grid">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prénom</th>
                <th>État du compte</th>
                <th>Soumissions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="student" style={{ position: 'static' }}>
                    <span style={{ textTransform: 'uppercase' }}>{s.lastName}</span>
                  </td>
                  <td>{s.firstName}</td>
                  <td>
                    {s.userId
                      ? <span className="tag"><span style={{ color: 'var(--eval-a)' }}>●</span> Inscrit</span>
                      : <span className="tag" style={{ borderStyle: 'dashed' }}><span style={{ color: 'var(--muted)' }}>○</span> Fiche non réclamée</span>}
                  </td>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                    {assignments.length
                      ? `${submissionsByStudent[s.id] || 0} / ${assignments.length}`
                      : <span className="muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showImport && (
        <div className="modal-backdrop" onClick={() => setShowImport(false)}>
          <div className="modal-card" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="row spread" style={{ marginBottom: 12 }}>
              <h2 className="serif" style={{ fontSize: 20 }}>Importer des élèves</h2>
              <button className="btn ghost sm" onClick={() => setShowImport(false)}>
                <Icon name="x" size={14} />
              </button>
            </div>
            <ImportStudents
              classId={classId}
              onImportComplete={() => { setShowImport(false); onChanged(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Tab: Formulaires envoyés
// ============================================================================
function FormsAssignedTab({ assignments, submissions, students, formulaires, classId, sendFormToClassById, onSent }) {
  const [sendOpen, setSendOpen] = useState(false);
  const [chosenForm, setChosenForm] = useState('');

  const submissionsByAssignment = useMemo(() => {
    const m = {};
    submissions.forEach((s) => { m[s.formAssignmentId] = (m[s.formAssignmentId] || 0) + 1; });
    return m;
  }, [submissions]);

  const sentFormIds = new Set(assignments.map((a) => a.formId));
  const sendable = formulaires.filter((f) => !sentFormIds.has(f.id));

  async function handleSend() {
    if (!chosenForm) {
      toast.error('Choisissez un formulaire.');
      return;
    }
    try {
      await sendFormToClassById(classId, chosenForm);
      toast.success('Formulaire envoyé');
      setSendOpen(false);
      setChosenForm('');
      onSent();
    } catch (err) {
      toast.error(`Erreur : ${err.message}`);
    }
  }

  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="row spread">
        <div className="muted" style={{ fontSize: 13 }}>
          {assignments.length} formulaires envoyés à cette classe
        </div>
        <button className="btn accent" onClick={() => setSendOpen(true)}>
          <Icon name="send" size={14} /> Envoyer un formulaire
        </button>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon="send"
          title="Aucun formulaire envoyé"
          desc="Choisissez un formulaire dans votre bibliothèque et envoyez-le à toute la classe d'un coup."
        />
      ) : (
        <div className="col" style={{ gap: 10 }}>
          {assignments.map((a) => {
            const got = submissionsByAssignment[a.id] || 0;
            const pct = students.length ? Math.round(got / students.length * 100) : 0;
            return (
              <div key={a.id} className="card row spread">
                <div>
                  <div className="serif" style={{ fontSize: 17, marginBottom: 4 }}>
                    {a.title || '(formulaire supprimé)'}
                  </div>
                  <div className="row" style={{ gap: 12, fontSize: 12, color: 'var(--muted)' }}>
                    <span className="row" style={{ gap: 4 }}>
                      <Icon name="calendar" size={12} />
                      Envoyé le {a.sentAt ? new Date(a.sentAt).toLocaleDateString('fr-FR') : '—'}
                    </span>
                    <span className="row" style={{ gap: 4 }}>
                      <Icon name="book" size={12} /> {a.competences.length} compétences
                    </span>
                    <span className="row" style={{ gap: 4 }}>
                      <Icon name="users" size={12} /> {got} / {students.length} soumissions
                    </span>
                  </div>
                </div>
                <div className="row" style={{ gap: 8, minWidth: 160, justifyContent: 'flex-end' }}>
                  <div style={{ width: 140 }}>
                    <div className="progress"><div style={{ width: `${pct}%` }} /></div>
                    <div className="mono" style={{
                      fontSize: 10, color: 'var(--muted)', marginTop: 4,
                      textAlign: 'right',
                    }}>
                      {pct}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sendOpen && (
        <div className="modal-backdrop" onClick={() => setSendOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="row spread" style={{ marginBottom: 12 }}>
              <h2 className="serif" style={{ fontSize: 20 }}>Envoyer un formulaire</h2>
              <button className="btn ghost sm" onClick={() => setSendOpen(false)}>
                <Icon name="x" size={14} />
              </button>
            </div>
            {sendable.length === 0 ? (
              <div className="muted" style={{ fontSize: 13 }}>
                Tous vos formulaires ont déjà été envoyés à cette classe.
              </div>
            ) : (
              <>
                <label>
                  <span className="field-label">Formulaire</span>
                  <select
                    className="field"
                    value={chosenForm}
                    onChange={(e) => setChosenForm(e.target.value)}
                  >
                    <option value="">— Choisir —</option>
                    {sendable.map((f) => (
                      <option key={f.id} value={f.id}>{f.title}</option>
                    ))}
                  </select>
                </label>
                <div className="row" style={{ gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                  <button className="btn" onClick={() => setSendOpen(false)}>Annuler</button>
                  <button className="btn accent" onClick={handleSend}>
                    <Icon name="send" size={12} /> Envoyer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
