// inbox-shared.jsx — shared data + primitives for inbox variation explorations.
// All variants pull from this set so they're comparable across designs.

const INBOX = [
  // PRIORITY — needs your attention
  { id:'r1', type:'incoming_ask', kind:'mentorship', dir:'incoming', from:'Jordan Lee',   cohort:2022, role:'Consultant, McKinsey',         ask:'I\u2019m a second-year at McKinsey considering a move into venture. Would love your perspective \u2014 what you wish you\u2019d known.', age:'2h',  unread:true,  state:'needs_reply', avatar:'#2563eb' },
  { id:'r2', type:'incoming_ask', kind:'advice',     dir:'incoming', from:'Nora Patel',   cohort:2024, role:'Student, Cornell',             ask:'Applying to APM programs this fall. Could you look at my resume and tell me what stands out and what\u2019s missing?',                  age:'1d',  unread:true,  state:'needs_reply', avatar:'#3b6e51' },
  { id:'fr1',type:'friend_request',kind:'connection',dir:'incoming', from:'Sofia Ramirez',cohort:2021, role:'Product Designer, Figma',      ask:'Hi! I came across your profile while searching for product people in NYC. I\u2019d love to connect.',                                    age:'5h',  unread:true,  state:'needs_reply', avatar:'#722f37' },

  // ACTIVE — open conversations
  { id:'t1', type:'active_thread',kind:'advice',     dir:'helping',  from:'Marcus Chen',  cohort:2019, role:'Finance, Goldman Sachs',       ask:'That\u2019s really helpful. Would you be open to a call this week?',                                                                       age:'1d',  unread:true,  state:'drafted',     avatar:'#a16207' },
  { id:'t2', type:'active_thread',kind:'mentorship', dir:'helping',  from:'Jamie Kim',    cohort:2020, role:'PM at Stripe',                  ask:'Hey \u2014 I revised the essays. Can you take a look before I submit?',                                                                    age:'3d',  unread:false, state:'drafted',     avatar:'#2563eb' },
  { id:'t3', type:'active_thread',kind:'mentorship', dir:'getting',  from:'Priya Nair',   cohort:2018, role:'Head of Strategy, Spotify',     ask:'How are the APM applications going? Any blockers I can help with?',                                                                          age:'2d',  unread:false, state:'drafted',     avatar:'#4d4d4a' },

  // SENT — awaiting them
  { id:'o1', type:'outgoing_ask', kind:'advice',     dir:'getting',  from:'Sam Chen',     cohort:2021, role:'Policy Lead, Meta',            ask:'I\u2019m exploring a move from consulting into product strategy. Would love 30 minutes to hear about your transition.',                  age:'2d',  unread:false, state:'awaiting',    avatar:'#722f37' },
  { id:'o2', type:'outgoing_ask', kind:'mentorship', dir:'getting',  from:'Alex Park',    cohort:2017, role:'Director, Stripe',             ask:'Would you consider being a mentor as I navigate the next year of my career?',                                                              age:'6d',  unread:false, state:'awaiting',    avatar:'#3b6e51' },

  // CLOSED / DONE
  { id:'dm1',type:'dm_thread',    kind:'connection', dir:'getting',  from:'David Liu',    cohort:2016, role:'EM at Google',                  ask:'Wanted to say thanks for the intro to Priya. Really helpful.',                                                                              age:'5d',  unread:false, state:'closed',      avatar:'#4d4d4a' },
  { id:'c1', type:'active_thread',kind:'advice',     dir:'helping',  from:'Maya Singh',   cohort:2023, role:'Founder, early-stage',          ask:'Thank you \u2014 going to revise the deck based on your notes and send back.',                                                              age:'1w',  unread:false, state:'closed',      avatar:'#a16207' },
];

const KIND_META = {
  advice:     { label:'Advice',     color:'#2563eb', tint:'rgba(37,99,235,.10)',  rule:'rgba(37,99,235,.22)'  },
  mentorship: { label:'Mentorship', color:'#3b6e51', tint:'rgba(59,110,81,.10)',  rule:'rgba(59,110,81,.22)'  },
  connection: { label:'Connection', color:'#722f37', tint:'rgba(114,47,55,.10)',  rule:'rgba(114,47,55,.22)'  },
};

const STATE_META = {
  needs_reply: { label:'Needs reply',     color:'#a16207', tint:'rgba(161,98,7,.10)' },
  drafted:     { label:'Drafted',         color:'#2563eb', tint:'rgba(37,99,235,.10)'  },
  awaiting:    { label:'Awaiting them',   color:'#4d4d4a', tint:'rgba(77,77,74,.10)'   },
  closed:      { label:'Closed this week',color:'#3b6e51', tint:'rgba(59,110,81,.10)'  },
};

function initials(name) {
  return (name||'?').split(/\s+/).map(w=>w[0]).filter(Boolean).slice(0,2).join('').toUpperCase();
}

function Avatar({ name, color = '#4d4d4a', size = 32, square = false, ring }) {
  return React.createElement('div', {
    style: {
      width:size, height:size, borderRadius: square ? 7 : '50%',
      background:color, display:'flex', alignItems:'center', justifyContent:'center',
      flexShrink:0, boxShadow: ring ? `0 0 0 2px ${ring}` : 'none',
      fontFamily:"'Inter Tight',sans-serif", fontSize:size*.34, fontWeight:700, color:'#fff',
      letterSpacing:'-.02em',
    },
  }, initials(name));
}

function Kicker({ children, color = '#2563eb' }) {
  return React.createElement('div', {
    style: { display:'inline-flex', alignItems:'center', gap:6, fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color },
  },
    React.createElement('span', { style:{ width:'1.4rem', height:2, background:color, borderRadius:99 } }),
    React.createElement('span', null, children)
  );
}

function Mono({ children, color = '#4d4d4a', size = 10 }) {
  return React.createElement('span', { style:{ fontFamily:"'JetBrains Mono',monospace", fontSize:size, color, letterSpacing:'.02em' } }, children);
}

function Pill({ tone='muted', children, size='md', solid=false }) {
  const palette = {
    advice:     { bg:'rgba(37,99,235,.10)',  fg:'#2563eb' },
    mentorship: { bg:'rgba(59,110,81,.10)',  fg:'#3b6e51' },
    connection: { bg:'rgba(114,47,55,.10)',  fg:'#722f37' },
    warn:       { bg:'rgba(161,98,7,.12)', fg:'#0c0c0b', border:'rgba(161,98,7,.30)' },
    info:       { bg:'rgba(37,99,235,.10)',  fg:'#2563eb' },
    muted:      { bg:'#f4f3ee',              fg:'#4d4d4a' },
    sage:       { bg:'rgba(59,110,81,.10)',  fg:'#3b6e51' },
    cta:        { bg:'#f59e0b',              fg:'#0c0c0b' },
    dark:       { bg:'#0c0c0b',              fg:'#fff' },
  };
  const p = palette[tone] || palette.muted;
  const sizeStyle = size === 'sm'
    ? { padding:'1px 6px', fontSize:9 }
    : { padding:'2px 8px', fontSize:10 };
  return React.createElement('span', {
    style:{
      display:'inline-flex', alignItems:'center', gap:4, borderRadius:99,
      ...sizeStyle, fontWeight:700, letterSpacing:'.02em',
      background: solid ? p.fg : p.bg, color: solid ? '#fff' : p.fg,
      border: p.border ? `1px solid ${p.border}` : '1px solid transparent',
      whiteSpace:'nowrap',
    },
  }, children);
}

// Lightweight icon set — stroke only, lucide-style
const I = {
  arrowRight: (p={}) => React.createElement('svg', { width:p.size||14, height:p.size||14, viewBox:'0 0 24 24', fill:'none', stroke:p.color||'currentColor', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round', ...p },
    React.createElement('path', { d:'M5 12h14' }), React.createElement('path', { d:'m12 5 7 7-7 7' })),
  check:      (p={}) => React.createElement('svg', { width:p.size||14, height:p.size||14, viewBox:'0 0 24 24', fill:'none', stroke:p.color||'currentColor', strokeWidth:2.5, strokeLinecap:'round', strokeLinejoin:'round', ...p },
    React.createElement('polyline', { points:'20 6 9 17 4 12' })),
  x:          (p={}) => React.createElement('svg', { width:p.size||14, height:p.size||14, viewBox:'0 0 24 24', fill:'none', stroke:p.color||'currentColor', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round', ...p },
    React.createElement('path', { d:'M18 6 6 18' }), React.createElement('path', { d:'m6 6 12 12' })),
  clock:      (p={}) => React.createElement('svg', { width:p.size||14, height:p.size||14, viewBox:'0 0 24 24', fill:'none', stroke:p.color||'currentColor', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round', ...p },
    React.createElement('circle', { cx:12, cy:12, r:10 }), React.createElement('polyline', { points:'12 6 12 12 16 14' })),
  reply:      (p={}) => React.createElement('svg', { width:p.size||14, height:p.size||14, viewBox:'0 0 24 24', fill:'none', stroke:p.color||'currentColor', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round', ...p },
    React.createElement('polyline', { points:'9 17 4 12 9 7' }), React.createElement('path', { d:'M20 18v-2a4 4 0 0 0-4-4H4' })),
  zap:        (p={}) => React.createElement('svg', { width:p.size||14, height:p.size||14, viewBox:'0 0 24 24', fill:'none', stroke:p.color||'currentColor', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round', ...p },
    React.createElement('polygon', { points:'13 2 3 14 12 14 11 22 21 10 12 10 13 2' })),
  arrowDown:  (p={}) => React.createElement('svg', { width:p.size||14, height:p.size||14, viewBox:'0 0 24 24', fill:'none', stroke:p.color||'currentColor', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round', ...p },
    React.createElement('path', { d:'M12 5v14' }), React.createElement('path', { d:'m19 12-7 7-7-7' })),
  arrowUp:    (p={}) => React.createElement('svg', { width:p.size||14, height:p.size||14, viewBox:'0 0 24 24', fill:'none', stroke:p.color||'currentColor', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round', ...p },
    React.createElement('path', { d:'M12 19V5' }), React.createElement('path', { d:'m5 12 7-7 7 7' })),
  send:       (p={}) => React.createElement('svg', { width:p.size||14, height:p.size||14, viewBox:'0 0 24 24', fill:'none', stroke:p.color||'currentColor', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round', ...p },
    React.createElement('path', { d:'m22 2-7 20-4-9-9-4 20-7z' })),
  search:     (p={}) => React.createElement('svg', { width:p.size||14, height:p.size||14, viewBox:'0 0 24 24', fill:'none', stroke:p.color||'currentColor', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round', ...p },
    React.createElement('circle', { cx:11, cy:11, r:8 }), React.createElement('path', { d:'m21 21-4.35-4.35' })),
  inbox:      (p={}) => React.createElement('svg', { width:p.size||14, height:p.size||14, viewBox:'0 0 24 24', fill:'none', stroke:p.color||'currentColor', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round', ...p },
    React.createElement('polyline', { points:'22 12 16 12 14 15 10 15 8 12 2 12' }),
    React.createElement('path', { d:'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z' })),
};

function Button({ variant='default', size='md', children, style, ...rest }) {
  const v = {
    default: { bg:'#0c0c0b', fg:'#fff',     border:'transparent' },
    cta:     { bg:'#f59e0b', fg:'#0c0c0b',  border:'transparent' },
    primary: { bg:'#2563eb', fg:'#fff',     border:'transparent' },
    outline: { bg:'#fff',    fg:'#0c0c0b',  border:'#dcdcd6'     },
    ghost:   { bg:'transparent', fg:'#0c0c0b', border:'transparent' },
    danger:  { bg:'#fff', fg:'#b9472a', border:'#dcdcd6' },
  }[variant] || { bg:'#0c0c0b', fg:'#fff', border:'transparent' };
  const s = size === 'sm'
    ? { height:28, padding:'0 10px', fontSize:11.5 }
    : size === 'lg'
    ? { height:42, padding:'0 18px', fontSize:14 }
    : { height:34, padding:'0 14px', fontSize:12.5 };
  return React.createElement('button', {
    ...rest,
    style: {
      ...s, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
      borderRadius:8, fontFamily:"'Inter',sans-serif", fontWeight:600,
      background:v.bg, color:v.fg, border:`1px solid ${v.border}`, cursor:'pointer',
      transition:'all 150ms', whiteSpace:'nowrap',
      ...(style||{}),
    },
  }, children);
}

// Kbd key cap — for keyboard hints in triage flow
function Kbd({ children, dark = false }) {
  return React.createElement('span', {
    style: {
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      minWidth:18, height:18, padding:'0 5px', borderRadius:4,
      background: dark ? 'rgba(255,255,255,.08)' : '#fff',
      border: dark ? '1px solid rgba(255,255,255,.18)' : '1px solid #dcdcd6',
      fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:600,
      color: dark ? 'rgba(255,255,255,.85)' : '#0c0c0b',
      boxShadow: dark ? 'none' : '0 1px 0 rgba(12,12,11,.06)',
    },
  }, children);
}

Object.assign(window, { INBOX, KIND_META, STATE_META, initials, Avatar, Kicker, Mono, Pill, Button, Kbd, I });
