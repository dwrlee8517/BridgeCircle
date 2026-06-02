// People Modern — shared sample data + atoms

const PEOPLE_MODERN = [
  { id:'p1', name:'Jamie Kim', initials:'JK', role:'Product Manager', company:'Stripe', city:'Brooklyn, NY', cohort:"'20",
    cohortLong:"Cornell '20", topics:['Career transitions','Product management','Tech recruiting'],
    rationale:"Spent 5 years in consulting before pivoting to PM at Stripe. Can speak directly to the McKinsey-to-product path.",
    matchTier:'strong', matchScore:94, mentorOpen:true, adviceOpen:true,
    capacity:2, capacityMax:5, mutual:'12 mutual', mutualNote:'Same cohort as Maya, David',
    responseDays:2, helped:18, replyRate:96,
  },
  { id:'p2', name:'Alex Wong', initials:'AW', role:'Principal', company:'Andreessen Horowitz', city:'San Francisco, CA', cohort:"'17",
    cohortLong:"Cornell '17", topics:['VC & Startups','Fundraising','Pitch decks'],
    rationale:"Deep VC experience after a consulting background — uniquely positioned to speak to this pivot.",
    matchTier:'strong', matchScore:91, mentorOpen:false, adviceOpen:true, isFriend:true,
    capacity:0, capacityMax:5, mutual:'8 mutual', mutualNote:'Connected through Jamie',
    responseDays:1, helped:24, replyRate:88,
  },
  { id:'p3', name:'Maya Reyes', initials:'MR', role:'Founder & CEO', company:'Kinetic Health', city:'New York, NY', cohort:"'19",
    cohortLong:"Cornell '19", topics:['Entrepreneurship','Health tech','Early-stage'],
    rationale:"Founded a health-tech startup after McKinsey. Direct experience with the consulting-to-founder path.",
    matchTier:'good', matchScore:82, mentorOpen:true, adviceOpen:true,
    capacity:3, capacityMax:5, mutual:'6 mutual', mutualNote:'Same cohort as Jamie',
    responseDays:3, helped:11, replyRate:90,
  },
  { id:'p4', name:'David Liu', initials:'DL', role:'Engineering Manager', company:'Google', city:'Seattle, WA', cohort:"'16",
    cohortLong:"Cornell '16", topics:['Engineering leadership','Big tech career paths'],
    rationale:null,
    matchTier:'good', matchScore:74, mentorOpen:true, adviceOpen:false,
    capacity:4, capacityMax:5, mutual:'4 mutual', mutualNote:null,
    responseDays:4, helped:32, replyRate:84,
  },
  { id:'p5', name:'Priya Nair', initials:'PN', role:'Head of Strategy', company:'Spotify', city:'London, UK', cohort:"'18",
    cohortLong:"Cornell '18", topics:['Strategy','Music & media','International'],
    rationale:null,
    matchTier:null, matchScore:null, mentorOpen:false, adviceOpen:false, paused:true,
    capacity:0, capacityMax:5, mutual:'3 mutual', mutualNote:null,
    responseDays:null, helped:8, replyRate:72,
  },
  { id:'p6', name:'Sam Chen', initials:'SC', role:'Policy Lead', company:'Meta', city:'Washington, DC', cohort:"'21",
    cohortLong:"Cornell '21", topics:['Policy','Government','Tech regulation'],
    rationale:"Moved from government consulting into tech policy — knows the public-sector-to-big-tech transition.",
    matchTier:'weak', matchScore:62, mentorOpen:false, adviceOpen:true,
    capacity:0, capacityMax:5, mutual:'2 mutual', mutualNote:null,
    responseDays:5, helped:5, replyRate:80,
  },
];

// ─── Avatar ──────────────────────────────────────────────────────────────
function Avatar({ p, size = 56, ring = true }) {
  const ratio = p.capacityMax > 0 ? p.capacity / p.capacityMax : 0;
  const dotCls = ratio <= 0.5 ? '' : ratio <= 0.85 ? 'warn' : 'full';
  const ringCls = !ring ? '' : p.paused ? 'av-ring-warn' : p.mentorOpen ? 'av-ring' : '';
  const showDot = p.mentorOpen && size >= 44;

  return (
    <div className={`av ${ringCls}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}>
      {p.initials}
      {showDot && <span className={`av-dot ${dotCls}`}></span>}
    </div>
  );
}

// ─── Match pill ──────────────────────────────────────────────────────────
function MatchPill({ tier, score }) {
  if (!tier) return null;
  const cfg = {
    strong: { cls: 'pill-strong', label: 'Strong match' },
    good:   { cls: 'pill-good',   label: 'Good match' },
    weak:   { cls: 'pill-weak',   label: 'Possible match' },
  }[tier];
  return (
    <span className={`pill ${cfg.cls}`}>
      <span className="dot"></span>
      {cfg.label}{score != null ? ` · ${score}%` : ''}
    </span>
  );
}

// ─── Status badge (mentor / advice / friend) ────────────────────────────
function StatusBits({ p, compact = false }) {
  const items = [];
  if (p.isFriend) items.push({ label: 'Friend', color: '#2563eb', bg: 'rgba(37,99,235,0.10)', border: 'rgba(37,99,235,0.22)' });
  if (p.mentorOpen) items.push({ label: 'Open as mentor', color: '#3b6e51', bg: 'rgba(59,110,81,0.10)', border: 'rgba(59,110,81,0.22)' });
  else if (p.adviceOpen) items.push({ label: 'Open for advice', color: '#3b6e51', bg: 'rgba(59,110,81,0.10)', border: 'rgba(59,110,81,0.22)' });
  else if (p.paused) items.push({ label: 'Paused', color: '#0c0c0b', bg: 'rgba(161,98,7,0.12)', border: 'rgba(161,98,7,0.28)' });
  else items.push({ label: 'Not open right now', color: '#4d4d4a', bg: '#ebebe5', border: 'rgba(12,12,11,0.10)' });

  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
      {items.map((it, i) => (
        <span key={i} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: compact ? '2px 7px' : '3px 9px',
          borderRadius: 999, fontSize: 11, fontWeight: 600,
          background: it.bg, color: it.color, border: `1px solid ${it.border}`,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: it.color }}></span>
          {it.label}
        </span>
      ))}
    </div>
  );
}

// ─── Capacity bar ───────────────────────────────────────────────────────
function CapacityBar({ p, w = 80 }) {
  if (!p.mentorOpen) return null;
  const ratio = p.capacityMax > 0 ? p.capacity / p.capacityMax : 0;
  const color = ratio <= 0.5 ? '#3b6e51' : ratio <= 0.85 ? '#a16207' : '#9b2c1f';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: w, height: 4, background: '#ebebe5', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${ratio * 100}%`, height: '100%', background: color }}></div>
      </div>
      <span className="mono" style={{ fontSize: 10, color: '#4d4d4a', letterSpacing: 0.4 }}>
        {p.capacity}/{p.capacityMax}
      </span>
    </div>
  );
}

// ─── Icons (inline SVGs) ────────────────────────────────────────────────
const Icon = {
  search: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path>
    </svg>
  ),
  arrow: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>
    </svg>
  ),
  filter: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M6 12h12M10 18h4"></path>
    </svg>
  ),
  command: (s = 12) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
    </svg>
  ),
  chevron: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"></path>
    </svg>
  ),
  sparkle: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
    </svg>
  ),
  pin: (s = 12) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  ),
  clock: (s = 12) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>
    </svg>
  ),
  quote: (s = 24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 17h3l2-4V7H3v6h3l-2 4zm10 0h3l2-4V7h-5v6h3l-2 4z"></path>
    </svg>
  ),
};

Object.assign(window, { PEOPLE_MODERN, Avatar, MatchPill, StatusBits, CapacityBar, Icon });
