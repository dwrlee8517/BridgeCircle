// HelpScreen.jsx
// ============================================================================
// Help page — Featured AI pick + user-created subjects with AI-ranked feeds.
// Keeps the existing availability hero exactly; replaces everything below.

// ─── Sample data ────────────────────────────────────────────────────────────
const HELP_AI_SUBJECTS = [
  { id: 'careers', label: 'Career transitions',  ask: 14, helped: 12, color: '#2563eb' },
  { id: 'pm',      label: 'Product management',  ask:  8, helped:  6, color: '#15a05f' },
  { id: 'recruit', label: 'Tech recruiting',     ask:  6, helped:  4, color: '#7c3aed' },
  { id: 'fund',    label: 'Fundraising for early-stage founders', ask: 4, helped: 2, color: '#a16207' },
  { id: 'design',  label: 'Design systems',      ask:  3, helped:  5, color: '#c4314b' },
  { id: 'ml',      label: 'Applied ML & evals',  ask:  2, helped:  1, color: '#0c6e6e' },
];

const HELP_AI_PICKS = [
  {
    id: 'a1', name: 'Jordan Lee', initials: 'JL', cohort: "'22",
    role: 'Associate · Bain', city: 'New York',
    subject: 'Career transitions', subjectId: 'careers', subjectColor: '#2563eb',
    fit: 96, mode: 'mentor',
    need: 'Breaking into VC from consulting — should I network in or apply cold?',
    why: [
      "You made the same consulting → tech move in '21",
      "You list Career transitions as a help subject",
      "Quiet week — you've replied to 0 asks this week",
    ],
    posted: '2h ago', estReply: '~5 min',
  },
  {
    id: 'a2', name: 'Reese Walker', initials: 'RW', cohort: "'26",
    role: 'Senior · Cornell', city: 'Ithaca',
    subject: 'Product management', subjectId: 'pm', subjectColor: '#15a05f',
    fit: 91, mode: 'advice',
    need: 'First PM job — what should I actually look for in an APM program?',
    why: [
      "Product management is on your help list",
      "You've answered 6 PM asks at >90% rate",
      "Reese just joined; no one has replied yet",
    ],
    posted: '5h ago', estReply: '~8 min',
  },
  {
    id: 'a3', name: 'Cam Ortiz', initials: 'CO', cohort: "'23",
    role: 'Recruiter · Lyft', city: 'Brooklyn',
    subject: 'Tech recruiting', subjectId: 'recruit', subjectColor: '#7c3aed',
    fit: 88, mode: 'advice',
    need: 'Resume review before Big Tech fall apps.',
    why: [
      "Tech recruiting is your subject",
      "You've done 4 resume reviews this quarter",
    ],
    posted: '1d ago', estReply: '~10 min',
  },
  {
    id: 'a4', name: 'Yuki Tanaka', initials: 'YT', cohort: "'25",
    role: 'PhD candidate · MIT', city: 'Cambridge',
    subject: 'Career transitions', subjectId: 'careers', subjectColor: '#2563eb',
    fit: 84, mode: 'mentor',
    need: 'Moving from academia to industry — where do I even start?',
    why: [
      "Career transitions match",
      "You've talked through 3 academia-to-industry asks before",
    ],
    posted: '4h ago', estReply: '~15 min',
  },
  {
    id: 'a5', name: 'Devon King', initials: 'DK', cohort: "'25",
    role: 'Junior · Cornell', city: 'New York',
    subject: 'Career transitions', subjectId: 'careers', subjectColor: '#2563eb',
    fit: 79, mode: 'advice',
    need: 'Should I take the FAANG offer or the seed-stage role with a friend?',
    why: ["Career transitions match"],
    posted: '1d ago', estReply: '~5 min',
  },
  {
    id: 'a6', name: 'Mae Liu', initials: 'ML', cohort: "'26",
    role: 'Junior · Cornell', city: 'San Francisco',
    subject: 'Product management', subjectId: 'pm', subjectColor: '#15a05f',
    fit: 74, mode: 'advice',
    need: "What's the difference between a PM internship and a strategy one?",
    why: ["Product management match"],
    posted: '2d ago', estReply: '~3 min',
  },
  {
    id: 'a7', name: 'Noor Haddad', initials: 'NH', cohort: "'21",
    role: 'Analyst · Goldman Sachs', city: 'New York',
    subject: 'Career transitions', subjectId: 'careers', subjectColor: '#2563eb',
    fit: 93, mode: 'mentor',
    need: 'Two years in banking — is it too early to jump to growth equity?',
    why: [
      "You did the banking \u2192 buyside move yourself",
      "Career transitions is on your help list",
      "Noor is in your '21 cohort",
    ],
    posted: '3h ago', estReply: '~7 min',
  },
  {
    id: 'a8', name: 'Tariq Bell', initials: 'TB', cohort: "'24",
    role: 'APM · Asana', city: 'San Francisco',
    subject: 'Product management', subjectId: 'pm', subjectColor: '#15a05f',
    fit: 89, mode: 'advice',
    need: 'Six months in as APM and my PM keeps overriding my specs \u2014 how do I push back?',
    why: [
      "You've coached 4 APMs through their first year",
      "PM is on your help list",
    ],
    posted: '6h ago', estReply: '~10 min',
  },
  {
    id: 'a9', name: 'Hana Park', initials: 'HP', cohort: "'23",
    role: 'Founding designer · Lattice', city: 'Remote',
    subject: 'Tech recruiting', subjectId: 'recruit', subjectColor: '#7c3aed',
    fit: 82, mode: 'advice',
    need: 'Negotiating equity at a Series B \u2014 what should I actually be asking for?',
    why: [
      "You've been through 3 Series B offers",
      "Tech recruiting match",
    ],
    posted: '8h ago', estReply: '~6 min',
  },
];

// ─── Topic pill (still used in the availability rail) ──────────────────────
function TopicPill({ style: pillStyle = 'tinted', accent = '#2563eb', children }) {
  const css = pillStyle === 'outline'
    ? { background: '#fff', color: accent, border: '1px solid ' + accent + '55' }
    : pillStyle === 'solid'
      ? { background: accent, color: '#fff', border: '1px solid ' + accent }
      : { background: accent + '14', color: accent, border: '1px solid ' + accent + '2e' };
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 500,
      padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap', ...css,
    }}>{children}</span>
  );
}

// ─── Mobile detection ──────────────────────────────────────────────────────
function useHelpIsMobile() {
  const [m, setM] = React.useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches
  );
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)');
    const onCh = (e) => setM(e.matches);
    mq.addEventListener ? mq.addEventListener('change', onCh) : mq.addListener(onCh);
    return () => mq.removeEventListener ? mq.removeEventListener('change', onCh) : mq.removeListener(onCh);
  }, []);
  return m;
}

// ─── Availability card — responsive layout ────────────────────────────────
// Desktop: classic horizontal row [Advice | Mentorship | Topics pills | Edit].
// Mobile:  stacked.  Status indicators side by side; topics collapse into a
//          dropdown so the pills don't overflow.  Edit button on its own row.
function AvailabilityCard({ topics, pillStyle, accent, onEdit }) {
  const isMobile = useHelpIsMobile();
  const [topicsOpen, setTopicsOpen] = React.useState(false);

  // Status indicator block — Advice or Mentorship
  const Status = ({ dot, label, sub, subColor, mono }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      <span style={{
        width: 12, height: 12, borderRadius: '50%',
        background: dot, boxShadow: `0 0 0 4px ${dot}2e`,
      }} />
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0c0c0b', lineHeight: 1.1 }}>{label}</div>
        <div style={{
          fontSize: 11, fontWeight: 500, color: subColor, lineHeight: 1.2, marginTop: 2,
          ...(mono ? { fontFamily: "'JetBrains Mono', monospace" } : {}),
        }}>{sub}</div>
      </div>
    </div>
  );

  const Divider = ({ vertical = true }) => (vertical
    ? <div style={{ width: 1, height: 36, background: '#ebebe5', flexShrink: 0 }} />
    : <div style={{ height: 1, width: '100%', background: '#ebebe5' }} />
  );

  // ── Mobile layout ──────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        background: '#fff',
        border: '1px solid #dcdcd6',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 12,
        boxShadow: '0 4px 12px -2px rgba(12,12,11,0.06), 0 1px 0 rgba(12,12,11,0.03)',
      }}>
        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Status dot="#2563eb" label="Advice" sub="Open" subColor="#4d4d4a" />
            <Divider />
            <Status dot="#15a05f" label="Mentorship" sub="2 / 5 active" subColor="#4d4d4a" mono />
          </div>
        </div>

        <Divider vertical={false} />

        {/* Topics dropdown */}
        <div>
          <button
            type="button"
            onClick={() => setTopicsOpen(o => !o)}
            aria-expanded={topicsOpen}
            style={{
              width: '100%', background: 'transparent', border: 'none', padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', font: 'inherit',
            }}
          >
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#4d4d4a',
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              Topics you offer · <span style={{ color: '#0c0c0b' }}>{topics.length}</span>
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11.5, fontWeight: 500, color: '#4d4d4a',
            }}>
              {topicsOpen ? 'Hide' : 'Show'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                   style={{ transform: topicsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </button>

          {topicsOpen && (
            <div style={{
              marginTop: 10,
              display: 'flex', flexWrap: 'wrap', gap: 6,
            }}>
              {topics.map(s => (
                <TopicPill key={s.label} style={pillStyle} accent={accent}>{s.label}</TopicPill>
              ))}
            </div>
          )}
        </div>

        {/* Edit button — full width on mobile */}
        <BCButton
          variant="outline" size="sm"
          onClick={onEdit}
          style={{ borderRadius: 8, width: '100%', justifyContent: 'center' }}
        >
          Edit availability
        </BCButton>
      </div>
    );
  }

  // ── Desktop layout ─────────────────────────────────────────────────────
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #dcdcd6',
      borderRadius: 12,
      padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 20,
      boxShadow: '0 4px 12px -2px rgba(12,12,11,0.06), 0 1px 0 rgba(12,12,11,0.03)',
    }}>
      <Status dot="#2563eb" label="Advice" sub="Open" subColor="#4d4d4a" />
      <Divider />
      <Status dot="#15a05f" label="Mentorship" sub="2 / 5 active" subColor="#4d4d4a" mono />
      <Divider />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 10.5, fontWeight: 600, color: '#4d4d4a',
          letterSpacing: '0.04em', marginBottom: 5,
        }}>Topics you offer</div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          {topics.map(s => (
            <TopicPill key={s.label} style={pillStyle} accent={accent}>{s.label}</TopicPill>
          ))}
        </div>
      </div>
      <BCButton
        variant="outline" size="sm"
        onClick={onEdit}
        style={{ borderRadius: 8, flexShrink: 0 }}
      >
        Edit availability
      </BCButton>
    </div>
  );
}

// ─── Local icons ───────────────────────────────────────────────────────────
const HS_Icon = ({ size = 14, stroke = 'currentColor', strokeWidth = 1.8, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke}
       strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
       style={{ flexShrink: 0 }}>{children}</svg>
);
const HSCheck = (p) => <HS_Icon {...p}><path d="M5 12l5 5 9-11" /></HS_Icon>;
const HSRefresh = (p) => (
  <HS_Icon {...p}>
    <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
    <path d="M3 21v-5h5" />
  </HS_Icon>
);
const HSHand = (p) => (
  <HS_Icon {...p}>
    <path d="M11 11V5a1.5 1.5 0 0 1 3 0v6" />
    <path d="M14 11V4a1.5 1.5 0 0 1 3 0v9" />
    <path d="M17 12V6a1.5 1.5 0 0 1 3 0v9a6 6 0 0 1-6 6h-1a7 7 0 0 1-5.6-2.8L4 14a1.5 1.5 0 0 1 2.4-1.8L8 14V5a1.5 1.5 0 0 1 3 0v6" />
  </HS_Icon>
);
const HSSearch = (p) => (
  <HS_Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </HS_Icon>
);
const HSPlus = (p) => <HS_Icon {...p}><path d="M12 5v14M5 12h14" /></HS_Icon>;

// ─── Featured AI hero card (simplified) ────────────────────────────────────
function FeaturedPickCard({ pick }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #ebebe5', borderRadius: 12,
      padding: '24px 26px',
      boxShadow: '0 1px 0 rgba(12,12,11,0.03)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <BCAvatar name={pick.name} size={52} square />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: "'Inter Tight', sans-serif", fontSize: 20, fontWeight: 600,
              letterSpacing: '-0.005em',
            }}>{pick.name}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#4d4d4a' }}>
              {pick.cohort}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#4d4d4a', marginTop: 3 }}>
            {pick.role} · {pick.posted}
          </div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 999,
          background: '#fafaf9', color: '#4d4d4a',
          border: '1px solid #ebebe5',
          fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          <SparklesIcon size={10} />
          {pick.fit}% fit
        </span>
      </div>

      <p style={{
        fontFamily: "'Inter Tight', sans-serif", fontSize: 18, lineHeight: 1.45,
        color: '#0c0c0b', marginTop: 18, letterSpacing: '-0.005em',
      }}>
        "{pick.need}"
      </p>

      <div style={{
        marginTop: 14, fontSize: 12.5, color: '#4d4d4a',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <SparklesIcon size={11} />
        <span style={{ fontStyle: 'italic' }}>{pick.why[0]}</span>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20, alignItems: 'center' }}>
        <BCButton variant="offer" size="default" style={{ borderRadius: 10 }}>
          {pick.mode === 'mentor' ? 'Offer mentorship' : 'Offer advice'}
        </BCButton>
        <BCButton variant="ghost" size="sm" style={{ borderRadius: 10, color: '#4d4d4a' }}>
          Not now
        </BCButton>
      </div>
    </div>
  );
}

// ─── Compact alt-pick card (used for the "More picks for you" list) ───────
function AltPickCard({ pick }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #ebebe5', borderRadius: 10,
      padding: '14px 16px',
      display: 'grid',
      gridTemplateColumns: '36px minmax(0,1fr) auto',
      columnGap: 12, alignItems: 'start',
    }}>
      <BCAvatar name={pick.name} size={36} square />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: "'Inter Tight', sans-serif", fontSize: 14, fontWeight: 600,
            color: '#0c0c0b', letterSpacing: '-0.005em',
          }}>{pick.name}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#4d4d4a' }}>
            {pick.cohort}
          </span>
          <span style={{ fontSize: 11.5, color: '#4d4d4a' }}>· {pick.role}</span>
        </div>
        <p style={{
          fontFamily: "'Inter Tight', sans-serif", fontSize: 14, lineHeight: 1.4,
          color: '#0c0c0b', marginTop: 6, letterSpacing: '-0.003em',
        }}>
          "{pick.need}"
        </p>
        <div style={{
          marginTop: 8, fontSize: 11.5, color: '#4d4d4a',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <SparklesIcon size={10} />
          <span style={{ fontStyle: 'italic' }}>{pick.why[0]}</span>
          <span aria-hidden style={{ color: '#dcdcd6' }}>·</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{pick.posted}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 999,
          background: '#fafaf9', color: '#4d4d4a',
          border: '1px solid #ebebe5',
          fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          <SparklesIcon size={9} />
          {pick.fit}% fit
        </span>
        <BCButton variant="outline" size="sm" style={{ borderRadius: 8 }}>
          {pick.mode === 'mentor' ? 'Mentor' : 'Help'}
        </BCButton>
      </div>
    </div>
  );
}

// ─── Side rail: today's queue rollup (single card) ─────────────────────────
function FeaturedSideRail() {
  return (
    <div style={{
      background: '#fff', border: '1px solid #ebebe5', borderRadius: 12,
      padding: '18px 20px', alignSelf: 'start',
    }}>
      <div style={{
        fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em',
        color: '#4d4d4a', textTransform: 'uppercase', marginBottom: 12,
      }}>Today's queue</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{
          fontFamily: "'Inter Tight', sans-serif", fontSize: 30, fontWeight: 600,
        }}>{HELP_AI_PICKS.length}</span>
        <span style={{ fontSize: 12.5, color: '#4d4d4a' }}>asks matched</span>
      </div>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {HELP_AI_SUBJECTS
          .map(s => ({ ...s, n: HELP_AI_PICKS.filter(p => p.subjectId === s.id).length }))
          .filter(s => s.n > 0)
          .sort((a, b) => b.n - a.n)
          .map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#4d4d4a', flexShrink: 0 }}>{s.n}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── Subject feed (when a user-created subject tab is active) ──────────────
function SubjectFeedRow({ p, onNavigate }) {
  return (
    <div style={{
      display: 'flex', gap: 16, alignItems: 'flex-start',
      background: '#fff', border: '1px solid #ebebe5', borderRadius: 12,
      padding: '16px 18px',
    }}>
      <BCAvatar name={p.name} size={44} square />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#4d4d4a' }}>{p.cohort}</span>
          <span style={{ fontSize: 12, color: '#4d4d4a' }}>{p.role}</span>
          <span style={{
            marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, color: '#4d4d4a',
          }}>{p.posted}</span>
        </div>
        <p style={{ fontSize: 13.5, color: '#0c0c0b', marginTop: 8, lineHeight: 1.5 }}>"{p.need}"</p>
        <div style={{
          marginTop: 10, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 11.5, color: '#2563eb', fontStyle: 'italic',
          }}>
            <SparklesIcon size={11} />
            {p.why[0]}
          </span>
          <span style={{ fontSize: 11.5, color: '#4d4d4a' }}>· {p.fit}% fit · {p.estReply}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <BCButton variant="ghost" size="sm" style={{ borderRadius: 8, color: '#4d4d4a' }}>Pass</BCButton>
            <BCButton variant="offer" size="sm" style={{ borderRadius: 8 }}
              onClick={() => onNavigate('ask_person', {
                name: p.name, currentTitle: p.role.split(' · ')[0], currentEmployer: p.role.split(' · ')[1] || '',
                city: p.city, graduationYear: 2000 + parseInt(p.cohort.replace(/[^\d]/g, ''), 10),
                mentoringTopics: [p.subject],
              })}>
              Offer help
            </BCButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubjectSideRail({ subject }) {
  const bars = [2, 1, 3, 1, 2, 0, 2, 1, 2, 3, 2, 1];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        background: '#fff', border: '1px solid #ebebe5', borderRadius: 12,
        padding: '16px 18px',
      }}>
        <div style={{
          fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em',
          color: '#4d4d4a', textTransform: 'uppercase', marginBottom: 10,
        }}>
          Your record · {subject.label}
        </div>
        <div style={{
          fontFamily: "'Inter Tight', sans-serif", fontSize: 32, fontWeight: 600,
          color: subject.color,
        }}>{subject.helped}</div>
        <div style={{ fontSize: 12.5, color: '#4d4d4a' }}>people helped this year</div>
        <div style={{
          marginTop: 16, display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)', gap: 3, alignItems: 'end', height: 40,
        }}>
          {bars.map((v, i) => (
            <div key={i} style={{
              height: `${(v / 3) * 100 || 8}%`,
              background: v ? subject.color : '#ebebe5',
              opacity: v ? 0.4 + (v / 3) * 0.6 : 1,
              borderRadius: 2,
            }} />
          ))}
        </div>
        <div style={{
          marginTop: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5,
          color: '#4d4d4a', display: 'flex', justifyContent: 'space-between',
        }}>
          <span>Jun</span><span>May</span>
        </div>
      </div>

      <div style={{
        background: '#fff', border: '1px solid #ebebe5', borderRadius: 12,
        padding: '16px 18px',
      }}>
        <div style={{
          fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em',
          color: '#4d4d4a', textTransform: 'uppercase', marginBottom: 10,
        }}>Tune this channel</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13 }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span>Email me new matches</span>
            <span style={{ width: 30, height: 17, background: '#15a05f', borderRadius: 999, position: 'relative' }}>
              <span style={{ position: 'absolute', top: 2, right: 2, width: 13, height: 13, background: '#fff', borderRadius: '50%' }} />
            </span>
          </label>
          <label style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span>Show low-fit (&lt;70%)</span>
            <span style={{ width: 30, height: 17, background: '#dcdcd6', borderRadius: 999, position: 'relative' }}>
              <span style={{ position: 'absolute', top: 2, left: 2, width: 13, height: 13, background: '#fff', borderRadius: '50%' }} />
            </span>
          </label>
        </div>
        <button style={{
          marginTop: 14, width: '100%', background: 'transparent',
          border: '1px solid #dcdcd6', borderRadius: 8, padding: '8px 10px',
          fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color: '#0c0c0b',
        }}>Pause this subject</button>
      </div>
    </div>
  );
}

// ─── Subject picker (scales to any list length / label length) ─────────────
function SubjectPicker({ subjects, activeId, onPick }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const rootRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const active = subjects.find(s => s.id === activeId);
  const filtered = q
    ? subjects.filter(s => s.label.toLowerCase().includes(q.toLowerCase()))
    : subjects;
  const showSearch = subjects.length > 6;

  // Trigger has a dot + truncated label + count + chevron
  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer',
          padding: '12px 14px 14px',
          display: 'inline-grid',
          gridTemplateColumns: 'auto minmax(0, 1fr) auto auto',
          alignItems: 'center', gap: 8,
          maxWidth: 280,
          color: active ? '#0c0c0b' : '#4d4d4a',
          fontFamily: "'Inter Tight', sans-serif", fontWeight: 600, fontSize: 14,
        }}
      >
        {active ? (
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: active.color, flexShrink: 0,
          }} />
        ) : (
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'transparent', border: '1.5px solid #4d4d4a', flexShrink: 0,
          }} />
        )}
        <span style={{
          minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {active ? active.label : 'Browse by subject'}
        </span>
        {active && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, color: '#4d4d4a', fontWeight: 500, flexShrink: 0,
          }}>{active.ask}</span>
        )}
        <span style={{
          display: 'inline-block', width: 0, height: 0,
          borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
          borderTop: '5px solid #4d4d4a', marginLeft: 2, flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 120ms',
        }} />
        {active && (
          <span style={{
            position: 'absolute', left: 0, right: 0, bottom: -1,
            height: 2, background: '#0c0c0b',
          }} />
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 30,
          width: 320, background: '#fff',
          border: '1px solid #dcdcd6', borderRadius: 10,
          boxShadow: '0 18px 40px -12px rgba(12,12,11,0.18), 0 2px 6px rgba(12,12,11,0.06)',
          padding: 6, overflow: 'hidden',
        }}>
          {showSearch && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', borderBottom: '1px solid #ebebe5', margin: '-6px -6px 6px',
              background: '#fafaf9',
            }}>
              <HSSearch size={13} stroke="#4d4d4a" />
              <input
                autoFocus value={q} onChange={e => setQ(e.target.value)}
                placeholder="Filter subjects…"
                style={{
                  flex: 1, border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 13, color: '#0c0c0b', fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>
          )}
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ padding: 14, fontSize: 13, color: '#4d4d4a', textAlign: 'center' }}>
                No subjects match.
              </div>
            )}
            {filtered.map(s => {
              const isActive = s.id === activeId;
              return (
                <button key={s.id}
                  onClick={() => { onPick(s.id); setOpen(false); setQ(''); }}
                  style={{
                    width: '100%', textAlign: 'left', background: isActive ? '#fafaf9' : 'transparent',
                    border: 'none', cursor: 'pointer', borderRadius: 6,
                    padding: '8px 10px',
                    display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr) auto',
                    alignItems: 'center', gap: 10, fontSize: 13.5,
                    color: '#0c0c0b', fontFamily: "'Inter', sans-serif",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#fafaf9'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{
                    minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontWeight: isActive ? 600 : 500,
                  }}>{s.label}</span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11, color: '#4d4d4a', flexShrink: 0,
                  }}>{s.ask}</span>
                </button>
              );
            })}
          </div>
          <div style={{
            borderTop: '1px solid #ebebe5', margin: '6px -6px -6px',
            padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 11.5, color: '#4d4d4a',
          }}>
            <span>{subjects.length} subjects total</span>
            <button style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#0c0c0b', fontSize: 11.5, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <HSPlus size={11} stroke="#0c0c0b" /> Add subject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Help screen — assembled ──────────────────────────────────────────────
function HelpScreen({ onNavigate, t, setTweak }) {
  const pillStyle = t.helpTopicPillStyle || 'solid';
  const accent = '#2563eb';

  const [active, setActive] = React.useState('featured');
  const [searchQuery, setSearchQuery] = React.useState('');
  const isFeatured = active === 'featured';
  const activeSub = HELP_AI_SUBJECTS.find(s => s.id === active);
  const list = activeSub ? HELP_AI_PICKS.filter(p => p.subjectId === active) : [];
  const featuredPick = HELP_AI_PICKS[0];
  const altPicks = HELP_AI_PICKS.slice(1, 5);

  return (
    <>
      <div style={{ background: '#fafaf9' }}>

        {/* ════════ HERO · availability rail (unchanged) ════════ */}
        <div style={{
          background: `linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0)),
            radial-gradient(circle at 18% 0%, rgba(21,160,95,0.07), transparent 38%),
            radial-gradient(circle at 82% 100%, rgba(161,98,7,0.05), transparent 40%), #fafaf9`,
          borderBottom: '1px solid #dcdcd6',
        }}>
          <div style={{
            maxWidth: 1280, margin: '0 auto', padding: '24px 32px 20px',
            display: 'flex', gap: 40, alignItems: 'flex-start',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Heading */}
              <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#a16207', boxShadow: '0 0 0 4px rgba(161,98,7,0.18)', flexShrink: 0,
                  }} />
                  <h1 style={{
                    fontFamily: "'Inter Tight', sans-serif", fontSize: 22, fontWeight: 600,
                    letterSpacing: '-0.01em', color: '#0c0c0b',
                  }}>
                    3 people are waiting on your reply.
                  </h1>
                </div>
                <p style={{
                  fontSize: 13, color: '#4d4d4a', lineHeight: 1.5, paddingLeft: 18,
                }}>
                  Advice open · Mentorship at 2/5 · Response rate 92%.
                </p>
              </div>

              {/* Availability card */}
              <AvailabilityCard
                topics={HELP_AI_SUBJECTS}
                pillStyle={pillStyle}
                accent={accent}
                onEdit={() => onNavigate('mentor_settings')}
              />
            </div>
          </div>
        </div>

        {/* ════════ FIND PEOPLE TO HELP ════════ */}
        <section style={{ maxWidth: 1280, margin: '0 auto', padding: '32px' }}>

          {/* Section heading */}
          <div style={{
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            gap: 24, marginBottom: 18, flexWrap: 'wrap',
          }}>
            <h2 style={{
              fontFamily: "'Inter Tight', sans-serif", fontSize: 22, fontWeight: 600,
              letterSpacing: '-0.015em',
            }}>
              Find people to help
            </h2>
            <div style={{
              flex: 1, maxWidth: 360, display: 'flex', alignItems: 'center', gap: 10,
              background: '#fff', border: '1px solid #dcdcd6', borderRadius: 10,
              padding: '9px 12px',
            }}>
              <HSSearch size={14} stroke="#4d4d4a" />
              <input
                type="text" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, role, or topic…"
                style={{
                  flex: 1, border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 13, color: '#0c0c0b', fontFamily: "'Inter', sans-serif",
                  minWidth: 0,
                }}
              />
            </div>
          </div>

          {/* Tab rail · Featured + subject picker */}
          <div style={{
            display: 'flex', gap: 4, borderBottom: '1px solid #ebebe5',
            alignItems: 'flex-end',
          }}>
            <button onClick={() => setActive('featured')} style={{
              position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '12px 14px 14px', display: 'flex', alignItems: 'center', gap: 8,
              color: isFeatured ? '#0c0c0b' : '#4d4d4a',
              fontFamily: "'Inter Tight', sans-serif", fontWeight: 600, fontSize: 14,
            }}>
              <SparklesIcon size={13} />
              Featured
              {isFeatured && (
                <span style={{
                  position: 'absolute', left: 0, right: 0, bottom: -1,
                  height: 2, background: '#0c0c0b',
                }} />
              )}
            </button>

            <SubjectPicker
              subjects={HELP_AI_SUBJECTS}
              activeId={isFeatured ? null : active}
              onPick={(id) => setActive(id)}
            />
          </div>

          {/* Tab content */}
          <div style={{ paddingTop: 22 }}>
            {isFeatured ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <FeaturedPickCard pick={featuredPick} />
                  <div style={{
                    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                    paddingTop: 4,
                  }}>
                    <div style={{
                      fontFamily: "'Inter Tight', sans-serif", fontSize: 13,
                      fontWeight: 600, color: '#0c0c0b',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                      More picks for you
                    </div>
                    <span style={{ fontSize: 12, color: '#4d4d4a' }}>Sorted by AI fit</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {altPicks.map(p => <AltPickCard key={p.id} pick={p} />)}
                  </div>
                </div>
                <FeaturedSideRail />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{
                    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                    marginBottom: 2,
                  }}>
                    <div style={{ fontSize: 14, color: '#4d4d4a' }}>
                      <strong style={{ color: '#0c0c0b' }}>{list.length} {list.length === 1 ? 'person' : 'people'}</strong>{' '}
                      asked about{' '}
                      <em style={{ color: activeSub.color, fontStyle: 'normal', fontWeight: 600 }}>
                        {activeSub.label}
                      </em> recently
                    </div>
                    <span style={{ fontSize: 12, color: '#4d4d4a' }}>Sorted by AI fit</span>
                  </div>
                  {list.length === 0 ? (
                    <div style={{
                      border: '1px solid #dcdcd6', borderRadius: 10, background: '#fff',
                      padding: 24, textAlign: 'center',
                    }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0c0c0b' }}>
                        No open asks in this subject right now.
                      </p>
                      <p style={{ fontSize: 13, color: '#4d4d4a', marginTop: 4 }}>
                        We'll notify you when one comes in.
                      </p>
                    </div>
                  ) : (
                    list.map(p => <SubjectFeedRow key={p.id} p={p} onNavigate={onNavigate} />)
                  )}
                </div>
                <SubjectSideRail subject={activeSub} />
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Tweaks panel — minimal for the new design */}
      <TweaksPanel>
        <TweakSection label="Topics in hero">
          <TweakRadio
            label="Pill style"
            value={t.helpTopicPillStyle || 'solid'}
            onChange={v => setTweak('helpTopicPillStyle', v)}
            options={[
              { value: 'tinted',  label: 'Tinted' },
              { value: 'outline', label: 'Outline' },
              { value: 'solid',   label: 'Solid' },
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

Object.assign(window, { HelpScreen, TopicPill });
