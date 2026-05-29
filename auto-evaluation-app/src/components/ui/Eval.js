import React from 'react';

export const EVAL_LABELS = {
  A: { label: 'Maîtrisé',     hint: 'Acquis et réutilisable' },
  B: { label: 'Satisfaisant', hint: 'Acquis, à consolider' },
  C: { label: 'Commencé',     hint: "En cours d'acquisition" },
  D: { label: 'Insuffisant',  hint: 'À retravailler' },
};

export function Eval({ value }) {
  const v = value || '-';
  return (
    <span className="eval" data-v={v}>
      <span className="letter">{v}</span>
    </span>
  );
}

export function EvalPicker({ value, onChange }) {
  return (
    <div className="eval-picker" role="radiogroup">
      {['A', 'B', 'C', 'D'].map(k => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={value === k}
          data-selected={value === k}
          data-v={k}
          className="opt"
          onClick={() => onChange(k)}
        >
          <span className="letter">{k}</span>
          <span style={{ fontSize: 13, color: 'var(--ink)' }}>{EVAL_LABELS[k].label}</span>
          <span className="lbl">{EVAL_LABELS[k].hint}</span>
        </button>
      ))}
    </div>
  );
}

export function EvalLegend({ compact }) {
  return (
    <div className="row" style={{ gap: 14, flexWrap: 'wrap', fontSize: 12 }}>
      {['A', 'B', 'C', 'D'].map(k => (
        <span key={k} className="row" style={{ gap: 6 }}>
          <Eval value={k} />
          {!compact && <span className="muted">{EVAL_LABELS[k].label}</span>}
        </span>
      ))}
    </div>
  );
}
