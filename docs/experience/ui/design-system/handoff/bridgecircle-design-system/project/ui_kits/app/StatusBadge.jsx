// BridgeCircle UI Kit — StatusBadge.jsx
// Tone-mapped semantic state badges
// Export: window.BCStatusBadge, window.BCLifecycleBadge, window.BCAvatar

const toneStyles = {
  open:  { bg: 'rgb(21 160 95 / 0.10)', color: '#15a05f', border: 'rgba(21,160,95,0.2)', dot: '#15a05f' },
  warn:  { bg: 'rgb(161 98 7 / 0.12)', color: '#0c0c0b', border: 'rgba(161,98,7,0.25)', dot: '#a16207' },
  alert: { bg: 'rgb(155 44 31 / 0.10)', color: '#9b2c1f', border: 'rgba(155,44,31,0.2)', dot: '#9b2c1f' },
  info:  { bg: 'rgb(37 99 235 / 0.10)', color: '#2563eb', border: 'rgba(37,99,235,0.2)', dot: '#2563eb' },
  muted: { bg: '#ebebe5', color: '#4d4d4a', border: 'rgba(12,12,11,0.08)', dot: '#4d4d4a' },
  plum:  { bg: 'rgb(124 58 237 / 0.10)', color: '#7c3aed', border: 'rgba(124,58,237,0.2)', dot: '#7c3aed' },
  rust:  { bg: 'rgb(155 44 31 / 0.10)', color: '#9b2c1f', border: 'rgba(155,44,31,0.2)', dot: '#c4314b' },
  sage:  { bg: 'rgb(21 160 95 / 0.10)', color: '#15a05f', border: 'rgba(21,160,95,0.2)', dot: '#15a05f' },
  ochre: { bg: 'rgb(161 98 7 / 0.12)', color: '#0c0c0b', border: 'rgba(161,98,7,0.25)', dot: '#a16207' },
};

const sizeStyles = {
  sm: { height: '16px', padding: '0 6px', fontSize: '9px', gap: '3px', borderRadius: '4px' },
  md: { height: '20px', padding: '0 8px', fontSize: '11px', gap: '4px', borderRadius: '4px' },
};

function BCStatusBadge({ tone = 'muted', size = 'md', dot = false, children, style = {} }) {
  const t = toneStyles[tone] || toneStyles.muted;
  const s = sizeStyles[size] || sizeStyles.md;
  return React.createElement('span', {
    style: {
      display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap',
      fontFamily: "'Inter', sans-serif", fontWeight: 600, letterSpacing: '0.01em',
      background: t.bg, color: t.color,
      border: `1px solid ${t.border}`,
      ...s, ...style,
    },
  },
    dot && React.createElement('span', {
      'aria-hidden': true,
      style: {
        width: size === 'sm' ? '4px' : '6px',
        height: size === 'sm' ? '4px' : '6px',
        borderRadius: '50%', background: t.dot, flexShrink: 0,
      },
    }),
    children
  );
}

const lifecycleMap = {
  pending:   { tone: 'warn',  label: 'pending',   dot: true },
  accepted:  { tone: 'info',  label: 'accepted',  dot: true },
  active:    { tone: 'info',  label: 'active',    dot: true },
  completed: { tone: 'open',  label: 'completed', dot: true },
  declined:  { tone: 'alert', label: 'declined',  dot: true },
  revoked:   { tone: 'alert', label: 'revoked',   dot: true },
  expired:   { tone: 'muted', label: 'expired',   dot: false },
  paused:    { tone: 'warn',  label: 'paused',    dot: true },
  unread:    { tone: 'warn',  label: 'unread',    dot: true },
  disabled:  { tone: 'muted', label: 'disabled',  dot: false },
  error:     { tone: 'alert', label: 'error',     dot: true },
};

function BCLifecycleBadge({ status, size = 'md', children }) {
  const cfg = lifecycleMap[status] || lifecycleMap.muted;
  return React.createElement(BCStatusBadge, { tone: cfg.tone, size, dot: cfg.dot },
    children || cfg.label
  );
}

// Avatar — circular or square, photo-first, initials fallback
const STABLE_BG = '#ebebe5';

function BCAvatar({ name = '', avatarUrl = null, size = 40, square = false, capacityRatio = null, style = {} }) {
  const initials = (name || '?')
    .split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  const dotColor = capacityRatio === null ? null
    : capacityRatio <= 0.5 ? '#15a05f'
    : capacityRatio <= 0.85 ? '#a16207'
    : '#9b2c1f';

  const fontSize = size <= 28 ? size * 0.38 : size <= 40 ? size * 0.36 : size * 0.33;
  const radius = square ? '10px' : '50%';

  return React.createElement('div', {
    style: {
      position: 'relative', width: size, height: size, borderRadius: radius,
      background: avatarUrl ? 'transparent' : STABLE_BG,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0, ...style,
    },
  },
    avatarUrl
      ? React.createElement('img', {
          src: avatarUrl, alt: '',
          style: { width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 },
        })
      : React.createElement('span', {
          style: {
            fontFamily: "'Inter Tight', sans-serif", fontWeight: 700,
            fontSize, color: '#4d4d4a', position: 'relative', zIndex: 1,
          },
        }, initials),
    dotColor && React.createElement('span', {
      'aria-hidden': true,
      style: {
        position: 'absolute', bottom: '2px', right: '2px',
        width: size <= 36 ? '8px' : '10px', height: size <= 36 ? '8px' : '10px',
        borderRadius: '50%', background: dotColor,
        border: '2px solid #fff', zIndex: 2,
      },
    })
  );
}

Object.assign(window, { BCStatusBadge, BCLifecycleBadge, BCAvatar, toneStyles });
