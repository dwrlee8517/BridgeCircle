// BridgeCircle UI Kit — Button.jsx
// Variants: cta, default (primary), offer, secondary, outline, ghost, destructive, link
//   cta   (amber)  — the single decisive commit per surface (send ask, RSVP, ask-from-profile)
//   default (blue) — ask / request + browse actions
//   offer  (emerald) — give actions: offer help, offer mentorship, accept a request
// Sizes: xs, sm, default, lg, icon
// Export: window.BCButton

const BCButtonStyles = {
  base: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '6px', fontFamily: "'Inter', sans-serif", fontWeight: 600,
    border: '1px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap',
    borderRadius: '10px', transition: 'all 150ms ease-out', outline: 'none',
    textDecoration: 'none', flexShrink: 0,
  },
  sizes: {
    xs:      { height: '28px', padding: '0 10px', fontSize: '11.5px', borderRadius: '8px' },
    sm:      { height: '32px', padding: '0 12px', fontSize: '12.5px', borderRadius: '10px' },
    default: { height: '40px', padding: '0 16px', fontSize: '13.5px' },
    lg:      { height: '44px', padding: '0 20px', fontSize: '15px' },
    icon:    { width: '40px', height: '40px', padding: '0', borderRadius: '10px' },
    'icon-sm': { width: '32px', height: '32px', padding: '0', borderRadius: '8px' },
  },
  variants: {
    cta:         { background: '#f59e0b', color: '#0c0c0b', borderColor: 'transparent' },
    default:     { background: '#2563eb', color: '#ffffff', borderColor: 'transparent' },
    offer:       { background: '#15a05f', color: '#ffffff', borderColor: 'transparent' },
    secondary:   { background: '#f4f3ee', color: '#0c0c0b', borderColor: 'transparent' },
    outline:     { background: '#ffffff', color: '#0c0c0b', borderColor: '#dcdcd6' },
    ghost:       { background: 'transparent', color: '#0c0c0b', borderColor: 'transparent' },
    destructive: { background: 'rgb(155 44 31 / 0.10)', color: '#9b2c1f', borderColor: 'rgba(155,44,31,0.2)' },
    link:        { background: 'transparent', color: '#2563eb', borderColor: 'transparent', textDecoration: 'underline', textUnderlineOffset: '3px' },
  },
  hoverVariants: {
    cta:         { background: '#d97706' },
    default:     { background: '#1d4ed8' },
    offer:       { background: '#11814d' },
    secondary:   { background: '#ebebe5' },
    outline:     { background: '#f4f3ee' },
    ghost:       { background: '#f4f3ee' },
    destructive: { background: 'rgb(155 44 31 / 0.15)' },
    link:        { color: '#1d4ed8' },
  },
};

function BCButton({
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  children,
  onClick,
  style = {},
  as: Tag = 'button',
  href,
  type = 'button',
  className,
}) {
  const [hovered, setHovered] = React.useState(false);
  const isDisabled = disabled || loading;

  const computedStyle = {
    ...BCButtonStyles.base,
    ...BCButtonStyles.sizes[size] || BCButtonStyles.sizes.default,
    ...BCButtonStyles.variants[variant] || BCButtonStyles.variants.default,
    ...(hovered && !isDisabled ? BCButtonStyles.hoverVariants[variant] : {}),
    ...(isDisabled ? { opacity: 0.6, cursor: 'not-allowed', pointerEvents: 'none' } : {}),
    ...style,
  };

  const props = {
    style: computedStyle,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onClick: isDisabled ? undefined : onClick,
    disabled: Tag === 'button' ? isDisabled : undefined,
    type: Tag === 'button' ? type : undefined,
    href: Tag === 'a' ? href : undefined,
  };

  return React.createElement(Tag, props,
    loading ? (children + '…') : children
  );
}

// Arrow icon helper used in many CTAs
function ArrowRight({ size = 14 }) {
  return React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    style: { flexShrink: 0 },
  },
    React.createElement('path', { d: 'M5 12h14' }),
    React.createElement('path', { d: 'm12 5 7 7-7 7' })
  );
}

function SearchIcon({ size = 16 }) {
  return React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    React.createElement('circle', { cx: 11, cy: 11, r: 8 }),
    React.createElement('path', { d: 'm21 21-4.35-4.35' })
  );
}

function ChevronRight({ size = 14 }) {
  return React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    React.createElement('path', { d: 'm9 18 6-6-6-6' })
  );
}

function MenuIcon({ size = 18 }) {
  return React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    React.createElement('line', { x1: 4, y1: 6, x2: 20, y2: 6 }),
    React.createElement('line', { x1: 4, y1: 12, x2: 20, y2: 12 }),
    React.createElement('line', { x1: 4, y1: 18, x2: 20, y2: 18 })
  );
}

function BellIcon({ size = 18, dot = false }) {
  return React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    style: { position: 'relative' },
  },
    React.createElement('path', { d: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' }),
    React.createElement('path', { d: 'M10.3 21a1.94 1.94 0 0 0 3.4 0' }),
    dot && React.createElement('circle', { cx: 18, cy: 6, r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 1.5 })
  );
}

function SparklesIcon({ size = 16 }) {
  return React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    React.createElement('path', { d: 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z' }),
    React.createElement('path', { d: 'M20 3v4' }),
    React.createElement('path', { d: 'M22 5h-4' }),
    React.createElement('path', { d: 'M4 17v2' }),
    React.createElement('path', { d: 'M5 18H3' })
  );
}

Object.assign(window, {
  BCButton, ArrowRight, SearchIcon, ChevronRight, MenuIcon, BellIcon, SparklesIcon,
  BCButtonStyles,
});
