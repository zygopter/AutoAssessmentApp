import React, { useState } from 'react';
import { Icon } from './ui/Icon';
import { EvalPicker } from './ui/Eval';

const CAT_PALETTE = ['#7a8a55', '#c97349', '#b85c3a', '#8a7c4a', '#5d6e7c', '#6a4f7a'];
const colorFor = (i) => CAT_PALETTE[i % CAT_PALETTE.length];

export function FormFillBody({ comps, categories, answers, onChange }) {
  // If parent doesn't manage answers, fall back to local state (preview mode).
  const [local, setLocal] = useState({});
  const A = answers ?? local;
  const setA = onChange ?? ((id, v) => setLocal((o) => ({ ...o, [id]: v })));

  const byCat = {};
  comps.forEach((c) => { (byCat[c.categoryId] = byCat[c.categoryId] || []).push(c); });

  return (
    <div className="col" style={{ gap: 28 }}>
      {categories.map((cat, ci) => {
        const ccs = byCat[cat.id];
        if (!ccs || ccs.length === 0) return null;
        return (
          <section key={cat.id}>
            <div className="row" style={{ gap: 10, marginBottom: 12, alignItems: 'center' }}>
              <span style={{
                width: 12, height: 12, background: colorFor(ci),
                borderRadius: 2, transform: 'rotate(45deg)',
              }} />
              <div>
                <div className="serif" style={{ fontSize: 20, lineHeight: 1.1 }}>{cat.name}</div>
                {cat.description && (
                  <div className="muted" style={{ fontSize: 12 }}>{cat.description}</div>
                )}
              </div>
            </div>
            <div className="col" style={{ gap: 14 }}>
              {ccs.map((c, i) => (
                <CompetenceQuestion
                  key={c.id}
                  comp={c}
                  index={i + 1}
                  value={A[c.id]}
                  onChange={(v) => setA(c.id, v)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function CompetenceQuestion({ comp, index, value, onChange }) {
  return (
    <div className="card">
      <div className="row" style={{ alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)',
          letterSpacing: '.08em', width: 32, paddingTop: 3,
        }}>
          {String(index).padStart(2, '0')}
        </div>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 18, lineHeight: 1.2, marginBottom: 4 }}>
            {comp.name}
          </div>
          {comp.description && (
            <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>{comp.description}</div>
          )}
          {comp.controlPoints?.length > 0 && (
            <details style={{ marginBottom: 6 }}>
              <summary className="row" style={{
                cursor: 'pointer', gap: 6, fontSize: 12,
                color: 'var(--ink-2)', listStyle: 'none',
              }}>
                <Icon name="chev-d" size={12} /> Points de contrôle
              </summary>
              <ul style={{
                margin: '8px 0 0 20px', padding: 0,
                fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.7,
              }}>
                {comp.controlPoints.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </details>
          )}
        </div>
      </div>
      <EvalPicker value={value} onChange={onChange} />
    </div>
  );
}
