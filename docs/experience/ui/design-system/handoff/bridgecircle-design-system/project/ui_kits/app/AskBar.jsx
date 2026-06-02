// BridgeCircle UI Kit — AskBar.jsx
// AskBar (bc-command-surface), PromptChips, NetworkMotif (Midnight editorial panel)
// Export: window.BCAskBar, window.BCPromptChips, window.BCNetworkMotif, window.BCSectionKicker

function BCSectionKicker({ children, style = {} }) {
  return React.createElement('div', {
    style: {
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700,
      letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2563eb',
      ...style,
    },
  },
    React.createElement('span', {
      style: { display: 'block', width: '1.75rem', height: '2px', borderRadius: '999px', background: '#2563eb', flexShrink: 0 },
    }),
    children
  );
}

function CircleHelpIcon({ size = 20 }) {
  return React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    React.createElement('circle', { cx: 12, cy: 12, r: 10 }),
    React.createElement('path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' }),
    React.createElement('path', { d: 'M12 17h.01' })
  );
}

function BCAskBar({ onSubmit, compact = false, defaultValue = '' }) {
  const [query, setQuery] = React.useState(defaultValue);
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches
  );
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 760px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener ? mq.addEventListener('change', handler) : mq.addListener(handler);
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', handler) : mq.removeListener(handler);
    };
  }, []);

  // On mobile, even when called with `compact=false` we treat the bar as
  // compact so it stops dominating the hero. Icon shrinks, button drops to
  // default (40px tall), padding tightens.
  const tight = compact || isMobile;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit && query.trim()) onSubmit(query);
  };

  return React.createElement('form', {
    onSubmit: handleSubmit,
    style: {
      position: 'relative', isolation: 'isolate', overflow: 'hidden',
      border: '1px solid color-mix(in srgb, #2563eb 18%, transparent)',
      borderColor: 'rgba(37,99,235,0.18)',
      borderRadius: '10px',
      padding: tight ? (isMobile ? '10px 12px' : '8px') : '14px 16px',
      background: `
        radial-gradient(circle at 8% 30%, rgba(37,99,235,0.055), transparent 32%),
        radial-gradient(circle at 78% 10%, rgba(21,160,95,0.035), transparent 30%),
        #ffffff
      `,
      boxShadow: '0 0 0 1px rgba(37,99,235,0.04), 0 20px 58px rgba(37,99,235,0.07), 0 14px 34px rgba(12,12,11,0.07)',
    },
  },
    React.createElement('div', {
      style: { display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '12px' },
    },
      React.createElement('div', {
        style: {
          width: isMobile ? '34px' : '44px',
          height: isMobile ? '34px' : '44px',
          borderRadius: isMobile ? '8px' : '10px',
          background: '#2563eb', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        },
      },
        React.createElement(CircleHelpIcon, { size: isMobile ? 16 : 20 })
      ),
      React.createElement('input', {
        type: 'text',
        value: query,
        onChange: e => setQuery(e.target.value),
        placeholder: 'What are you trying to figure out?',
        style: {
          flex: 1, border: 'none', background: 'transparent', outline: 'none',
          fontFamily: "'Inter', sans-serif",
          fontSize: isMobile ? '14px' : (compact ? '15px' : '17px'),
          fontWeight: 500, color: '#0c0c0b',
          minWidth: 0,
        },
      }),
      React.createElement(BCButton, {
        type: 'submit',
        variant: 'cta',
        size: isMobile ? 'sm' : (compact ? 'default' : 'lg'),
        style: { borderRadius: '8px' },
      },
        isMobile ? React.createElement(ArrowRight, { size: 14 }) : 'Find people',
        !isMobile && React.createElement(ArrowRight, { size: 14 })
      )
    )
  );
}

const DEFAULT_PROMPTS = [
  'I want to move from consulting into product',
  'I need college advice from someone who studied in the US',
  'I am moving to Seoul and want to meet alumni nearby',
  'Can someone review my resume or portfolio?',
  'I am looking for an ongoing mentor',
];

function BCPromptChips({ prompts = DEFAULT_PROMPTS, onSelect }) {
  return React.createElement('div', {
    style: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  },
    prompts.map(p =>
      React.createElement('button', {
        key: p, type: 'button',
        onClick: () => onSelect && onSelect(p),
        style: {
          display: 'inline-flex', alignItems: 'center',
          borderRadius: '9999px',
          border: '1px solid #dcdcd6',
          background: '#fff',
          padding: '8px 16px',
          fontSize: '12px', fontWeight: 500,
          fontFamily: "'Inter', sans-serif",
          color: '#4d4d4a', cursor: 'pointer',
          transition: 'all 150ms ease-out',
        },
        onMouseEnter: e => {
          e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)';
          e.currentTarget.style.background = 'rgba(37,99,235,0.04)';
          e.currentTarget.style.color = '#0c0c0b';
        },
        onMouseLeave: e => {
          e.currentTarget.style.borderColor = '#dcdcd6';
          e.currentTarget.style.background = '#fff';
          e.currentTarget.style.color = '#4d4d4a';
        },
      }, p)
    )
  );
}

function BCNetworkMotif({ helperCount = 24, requestCount = 7, eventCount = 3 }) {
  return React.createElement('div', {
    style: {
      position: 'relative', minHeight: '280px', overflow: 'hidden',
      borderRadius: '12px', border: '1px solid #081126',
      background: '#081126', padding: '20px',
      color: '#fafaf9',
      boxShadow: '0 12px 34px -8px rgba(12,12,11,0.10)',
    },
  },
    // SVG motif
    React.createElement('svg', {
      style: { position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.7 },
      viewBox: '0 0 520 320', 'aria-hidden': true,
    },
      React.createElement('defs', null,
        React.createElement('linearGradient', { id: 'nl', x1: '0', x2: '1', y1: '0', y2: '1' },
          React.createElement('stop', { offset: '0%', stopColor: 'rgba(147,197,253,0.72)' }),
          React.createElement('stop', { offset: '52%', stopColor: 'rgba(112,169,130,0.64)' }),
          React.createElement('stop', { offset: '100%', stopColor: 'rgba(221,161,80,0.58)' }),
        )
      ),
      React.createElement('path', { d: 'M72 226 C142 92 232 84 312 158 S430 244 478 92', fill: 'none', stroke: 'url(#nl)', strokeWidth: 1.6 }),
      React.createElement('path', { d: 'M62 86 C150 138 212 232 318 198 S414 124 466 222', fill: 'none', stroke: 'rgba(250,250,249,0.16)', strokeWidth: 1 }),
      [[72,226],[156,124],[252,184],[336,154],[448,96]].map(([cx,cy], i) =>
        React.createElement('g', { key: i },
          React.createElement('circle', { cx, cy, r: 8, fill: 'rgba(250,250,249,0.94)' }),
          React.createElement('circle', { cx, cy, r: 18, fill: 'none', stroke: 'rgba(250,250,249,0.14)' })
        )
      )
    ),
    // Content
    React.createElement('div', {
      style: { position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '240px' },
    },
      React.createElement('div', null,
        React.createElement('p', {
          style: { fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#93c5fd' },
        }, 'Live school circle'),
        React.createElement('h2', {
          style: { fontFamily: "'Inter Tight', sans-serif", fontSize: '22px', fontWeight: 600, lineHeight: 1.25, marginTop: '8px', maxWidth: '280px' },
        }, 'A trusted map of people who can help, and people you can help.')
      ),
      React.createElement('div', {
        style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' },
      },
        [
          { value: helperCount, label: 'Open helpers' },
          { value: requestCount, label: 'Need reply' },
          { value: eventCount, label: 'School events' },
        ].map(({ value, label }) =>
          React.createElement('div', {
            key: label,
            style: {
              border: '1px solid rgba(250,250,249,0.16)',
              borderRadius: '8px', background: 'rgba(255,255,255,0.06)',
              padding: '10px',
            },
          },
            React.createElement('div', {
              style: { fontFamily: "'Inter Tight', sans-serif", fontSize: '24px', fontWeight: 600, lineHeight: 1 },
            }, value),
            React.createElement('div', {
              style: { fontSize: '9px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(250,250,249,0.6)', marginTop: '4px' },
            }, label)
          )
        )
      )
    )
  );
}

Object.assign(window, { BCAskBar, BCPromptChips, BCNetworkMotif, BCSectionKicker, CircleHelpIcon });
