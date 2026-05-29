import React from 'react';

export function SectionHead({ eyebrow, title, desc, actions }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {desc && <div className="desc">{desc}</div>}
      </div>
      {actions && <div className="row" style={{ gap: 10 }}>{actions}</div>}
    </div>
  );
}
