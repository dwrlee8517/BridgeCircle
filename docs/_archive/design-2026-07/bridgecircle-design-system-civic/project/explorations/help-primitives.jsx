// Lightweight BC-style primitives for the Help-page exploration.
// Re-implements just what the variants need (avatar, button, badge, icons,
// shared sample data) without pulling the full UI kit script set.

// ─── Sample data ──────────────────────────────────────────────────────────
const HP_INCOMING = [
  { id:'r1', from:'Jordan Lee',  cohort:2022, type:'Mentorship', topic:'Career transitions',  ask:'Breaking into VC after 2 years in consulting. Would love your perspective on whether to network in or apply cold.', sent:'2h ago', avatarColor:'#2563eb', topicColor:'#2563eb', match:'Your consulting → PM transition fits. Topic match: Career transitions.' },
  { id:'r2', from:'Reese Walker', cohort:2026, type:'Advice',     topic:'Product management', ask:'First job in product — what should I look for in an APM program?', sent:'5h ago', avatarColor:'#3b6e51', topicColor:'#3b6e51', match:'You listed Product management. Reese just joined.' },
  { id:'r3', from:'Cam Ortiz',    cohort:2023, type:'Advice',     topic:'Tech recruiting',    ask:'Resume review before applying to Big Tech this fall.', sent:'1d ago', avatarColor:'#722f37', topicColor:'#722f37', match:'Quick resume read; ~10 min.' },
];

const HP_MY_TOPICS = ['Career transitions', 'Product management', 'Tech recruiting'];

const HP_RECENT = [
  { name:'Priya N.', when:'Mon', topic:'Resume review' },
  { name:'Sam C.',   when:'Apr 18', topic:'PM transition' },
  { name:'Mae L.',   when:'Apr 12', topic:'Career transitions' },
  { name:'Devon K.', when:'Mar 30', topic:'Tech recruiting' },
];

// ─── Avatar (initial + warm color) ────────────────────────────────────────
function HPAvatar({ name, color, size = 40, square = true }) {
  const initials = name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: square ? size * 0.18 : '50%',
      background: color || '#4d4d4a', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter Tight', sans-serif", fontWeight: 600,
      fontSize: size * 0.4, letterSpacing: '0.02em',
    }}>{initials}</div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────
const HP_BTN_VARIANTS = {
  cta:       { background:'#f59e0b', color:'#0c0c0b', borderColor:'transparent' },
  primary:   { background:'#0c0c0b', color:'#fff',    borderColor:'transparent' },
  blue:      { background:'#2563eb', color:'#fff',    borderColor:'transparent' },
  outline:   { background:'#fff',    color:'#0c0c0b', borderColor:'#dcdcd6' },
  ghost:     { background:'transparent', color:'#4d4d4a', borderColor:'transparent' },
  soft:      { background:'#f4f3ee', color:'#0c0c0b', borderColor:'transparent' },
};
const HP_BTN_SIZES = {
  xs:  { height:26, padding:'0 10px', fontSize:11,   borderRadius:7 },
  sm:  { height:32, padding:'0 12px', fontSize:12.5, borderRadius:9 },
  md:  { height:38, padding:'0 16px', fontSize:13,   borderRadius:10 },
  lg:  { height:46, padding:'0 22px', fontSize:14.5, borderRadius:11 },
};
function HPBtn({ variant='outline', size='sm', children, style={}, ...rest }) {
  const v = HP_BTN_VARIANTS[variant] || HP_BTN_VARIANTS.outline;
  const s = HP_BTN_SIZES[size] || HP_BTN_SIZES.sm;
  return (
    <button {...rest} style={{
      display:'inline-flex', alignItems:'center', gap:6, justifyContent:'center',
      fontFamily:"'Inter', sans-serif", fontWeight:600,
      border:`1px solid ${v.borderColor}`, cursor:'pointer', whiteSpace:'nowrap',
      ...s, ...v, ...style,
    }}>{children}</button>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────
const HP_BADGE_TONES = {
  open:  { bg:'rgb(59 110 81 / 0.10)', color:'#3b6e51', border:'rgba(59,110,81,0.22)', dot:'#3b6e51' },
  warn:  { bg:'rgb(161 98 7 / 0.12)', color:'#9a5a13', border:'rgba(161,98,7,0.28)', dot:'#a16207' },
  info:  { bg:'rgb(37 99 235 / 0.10)', color:'#2563eb', border:'rgba(37,99,235,0.22)', dot:'#2563eb' },
  plum:  { bg:'rgb(114 47 55 / 0.10)', color:'#722f37', border:'rgba(114,47,55,0.22)', dot:'#722f37' },
  muted: { bg:'#ebebe5', color:'#4d4d4a', border:'rgba(12,12,11,0.08)', dot:'#4d4d4a' },
};
function HPBadge({ tone='muted', children, dot=false, style={} }) {
  const t = HP_BADGE_TONES[tone] || HP_BADGE_TONES.muted;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      fontFamily:"'Inter', sans-serif", fontWeight:600, fontSize:10.5,
      padding:'2px 7px', borderRadius:4, height:18,
      background:t.bg, color:t.color, border:`1px solid ${t.border}`,
      whiteSpace:'nowrap', ...style,
    }}>
      {dot && <span style={{width:5, height:5, borderRadius:'50%', background:t.dot}} />}
      {children}
    </span>
  );
}

// ─── Lucide-style icons (just the few used) ───────────────────────────────
function HPIcon({ d, size=14, fill='none', stroke='currentColor', strokeWidth=1.8, viewBox='0 0 24 24', children }) {
  return (
    <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke={stroke}
         strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      {children || <path d={d} />}
    </svg>
  );
}
const IconArrow    = (p) => <HPIcon {...p} d="M5 12h14M13 6l6 6-6 6" />;
const IconChevron  = (p) => <HPIcon {...p} d="M9 6l6 6-6 6" />;
const IconChevDown = (p) => <HPIcon {...p} d="M6 9l6 6 6-6" />;
const IconCheck    = (p) => <HPIcon {...p} d="M5 12l5 5 9-11" />;
const IconX        = (p) => <HPIcon {...p} d="M6 6l12 12M18 6L6 18" />;
const IconClock    = (p) => (
  <HPIcon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </HPIcon>
);
const IconInbox    = (p) => (
  <HPIcon {...p}>
    <path d="M3 13v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6" />
    <path d="M3 13l3-8h12l3 8" />
    <path d="M3 13h5l2 3h4l2-3h5" />
  </HPIcon>
);
const IconPause    = (p) => (
  <HPIcon {...p}>
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </HPIcon>
);
const IconHand     = (p) => (
  <HPIcon {...p}>
    <path d="M11 11V5a1.5 1.5 0 0 1 3 0v6" />
    <path d="M14 11V4a1.5 1.5 0 0 1 3 0v9" />
    <path d="M17 12V6a1.5 1.5 0 0 1 3 0v9a6 6 0 0 1-6 6h-1a7 7 0 0 1-5.6-2.8L4 14a1.5 1.5 0 0 1 2.4-1.8L8 14V5a1.5 1.5 0 0 1 3 0v6" />
  </HPIcon>
);
const IconSparkle  = (p) => <HPIcon {...p} d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8L12 3z" />;
const IconUser     = (p) => (
  <HPIcon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20a8 8 0 0 1 16 0" />
  </HPIcon>
);
const IconSearch   = (p) => (
  <HPIcon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </HPIcon>
);
const IconRefresh  = (p) => (
  <HPIcon {...p}>
    <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
    <path d="M3 21v-5h5" />
  </HPIcon>
);
const IconPlay     = (p) => <HPIcon {...p} fill="currentColor" stroke="none" d="M8 5v14l11-7z" />;

Object.assign(window, {
  HP_INCOMING, HP_MY_TOPICS, HP_RECENT,
  HPAvatar, HPBtn, HPBadge,
  IconArrow, IconChevron, IconChevDown, IconCheck, IconX, IconClock,
  IconInbox, IconPause, IconHand, IconSparkle, IconUser, IconSearch, IconRefresh, IconPlay,
});
