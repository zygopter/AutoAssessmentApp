import React from 'react';
import { Icon } from './Icon';

export function EmptyState({ icon = 'form', title, desc, action }) {
  return (
    <div className="empty">
      <Icon name={icon} size={36} stroke={1.2} style={{ marginBottom: 10 }} />
      <div className="serif" style={{ fontSize: 18, color: 'var(--ink)', marginBottom: 6 }}>
        {title}
      </div>
      {desc && <div style={{ maxWidth: 360 }}>{desc}</div>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}
