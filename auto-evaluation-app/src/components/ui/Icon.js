import React from 'react';

export function Icon({ name, size = 16, stroke = 1.6, style, className }) {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor',
    strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round',
    style, className,
  };
  switch (name) {
    case 'users':   return <svg {...props}><circle cx="9" cy="8" r="3.2"/><path d="M3 20c1-3.4 3.4-5 6-5s5 1.6 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c3 .4 4.5 2.2 5 6"/></svg>;
    case 'book':    return <svg {...props}><path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/></svg>;
    case 'form':    return <svg {...props}><rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>;
    case 'plus':    return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'check':   return <svg {...props}><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>;
    case 'x':       return <svg {...props}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'chev-r':  return <svg {...props}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chev-d':  return <svg {...props}><path d="M6 9l6 6 6-6"/></svg>;
    case 'chev-l':  return <svg {...props}><path d="M15 6l-6 6 6 6"/></svg>;
    case 'edit':    return <svg {...props}><path d="M4 20l4-1 11-11-3-3L5 16l-1 4z"/></svg>;
    case 'trash':   return <svg {...props}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>;
    case 'copy':    return <svg {...props}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></svg>;
    case 'eye':     return <svg {...props}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'send':    return <svg {...props}><path d="M21 3L3 11l8 3 3 8z"/><path d="M21 3l-10 10"/></svg>;
    case 'grid':    return <svg {...props}><rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/></svg>;
    case 'cards':   return <svg {...props}><rect x="4" y="4" width="16" height="7" rx="1.5"/><rect x="4" y="13" width="16" height="7" rx="1.5"/></svg>;
    case 'search':  return <svg {...props}><circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/></svg>;
    case 'calendar':return <svg {...props}><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>;
    case 'clock':   return <svg {...props}><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg>;
    case 'key':     return <svg {...props}><circle cx="8" cy="12" r="4"/><path d="M12 12h9l-3 3M18 12v3"/></svg>;
    case 'import':  return <svg {...props}><path d="M12 4v12M7 11l5 5 5-5M4 20h16"/></svg>;
    case 'save':    return <svg {...props}><path d="M5 5h11l3 3v11H5z"/><path d="M8 5v4h7V5"/></svg>;
    case 'refresh': return <svg {...props}><path d="M4 12a8 8 0 0 1 14-5l2-2v6h-6l2.4-2.4"/><path d="M20 12a8 8 0 0 1-14 5l-2 2v-6h6l-2.4 2.4"/></svg>;
    case 'arrow-r': return <svg {...props}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'arrow-l': return <svg {...props}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>;
    case 'open':    return <svg {...props}><path d="M14 5h5v5"/><path d="M19 5l-9 9"/><path d="M19 14v5H5V5h5"/></svg>;
    case 'dot':     return <svg {...props}><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>;
    case 'warn':    return <svg {...props}><path d="M12 4l10 17H2z"/><path d="M12 10v5M12 18v.5"/></svg>;
    default: return null;
  }
}
