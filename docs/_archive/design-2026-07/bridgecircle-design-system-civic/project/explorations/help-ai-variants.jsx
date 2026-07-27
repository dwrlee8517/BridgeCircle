// Help page · AI-suggestion direction
// =====================================
// The shift: Help becomes a discovery surface. The AI proactively surfaces
// PEOPLE TO HELP (or QUESTIONS to answer) based on the user's mentoring /
// advising subjects — rather than just managing the incoming reply queue.
//
// Four directions:
//   F · Daily editorial brief  (one hero + supporting picks)
//   G · Subjects as channels    (your topics, each a stack of people)
//   H · Constellation map       (visual: topics → people)
//   I · Open questions stream   (reframe: surface questions, not people)

// ─── Shared sample data ───────────────────────────────────────────────────
const MY_SUBJECTS = [
  { id:'careers', label:'Career transitions',  ask:14, helped:12, color:'#2563eb' },
  { id:'pm',      label:'Product management',  ask:8,  helped:6,  color:'#3b6e51' },
  { id:'recruit', label:'Tech recruiting',     ask:6,  helped:4,  color:'#722f37' },
  { id:'mck',     label:'Consulting → tech',   ask:5,  helped:9,  color:'#a16207' },
];

const AI_PICKS = [
  {
    id:'a1', name:'Jordan Lee', initials:'JL', cohort:"'22", color:'#2563eb',
    role:'Associate · Bain', city:'New York',
    subject:'Career transitions', subjectId:'careers',
    fit:96, mode:'mentor',
    need:'Breaking into VC from consulting — should I network in or apply cold?',
    why:[
      "You made the same consulting → tech move in '21",
      "You list Career transitions as a help subject",
      "Quiet week — you've replied to 0 asks this week",
    ],
    posted:'2h ago', estReply:'~5 min',
  },
  {
    id:'a2', name:'Reese Walker', initials:'RW', cohort:"'26", color:'#3b6e51',
    role:'Senior · Cornell', city:'Ithaca',
    subject:'Product management', subjectId:'pm',
    fit:91, mode:'advice',
    need:'First PM job — what should I actually look for in an APM program?',
    why:[
      "Product management is on your help list",
      "You've answered 6 PM asks at >90% rate",
      "Reese just joined; no one has replied yet",
    ],
    posted:'5h ago', estReply:'~8 min',
  },
  {
    id:'a3', name:'Cam Ortiz', initials:'CO', cohort:"'23", color:'#722f37',
    role:'Recruiter · Lyft', city:'Brooklyn',
    subject:'Tech recruiting', subjectId:'recruit',
    fit:88, mode:'advice',
    need:'Resume review before Big Tech fall apps.',
    why:[
      "Tech recruiting is your subject",
      "You've done 4 resume reviews this quarter",
    ],
    posted:'1d ago', estReply:'~10 min',
  },
  {
    id:'a4', name:'Priya Nair', initials:'PN', cohort:"'24", color:'#a16207',
    role:'Analyst · McKinsey', city:'Chicago',
    subject:'Consulting → tech', subjectId:'mck',
    fit:84, mode:'mentor',
    need:'Two years in. Considering tech now or after MBA — would value your perspective.',
    why:[
      "Identical 2-yr consulting profile to you in '20",
      "Your subject: Consulting → tech",
    ],
    posted:'4h ago', estReply:'~15 min',
  },
  {
    id:'a5', name:'Devon King', initials:'DK', cohort:"'25", color:'#2563eb',
    role:'Junior · Cornell', city:'New York',
    subject:'Career transitions', subjectId:'careers',
    fit:79, mode:'advice',
    need:'Should I take the FAANG offer or the seed-stage role with a friend?',
    why:[
      "You've talked through 3 offer-decision asks before",
      "Career transitions match",
    ],
    posted:'1d ago', estReply:'~5 min',
  },
  {
    id:'a6', name:'Mae Liu', initials:'ML', cohort:"'26", color:'#3b6e51',
    role:'Junior · Cornell', city:'San Francisco',
    subject:'Product management', subjectId:'pm',
    fit:74, mode:'advice',
    need:"What's the difference between a PM internship and a strategy one?",
    why:[
      "Product management match",
    ],
    posted:'2d ago', estReply:'~3 min',
  },
];

// ─── Local primitives (unique names; styles are inline) ──────────────────
const HAITopBar = ({ availability = 'Open' }) => (
  <div style={{
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'12px 28px', borderBottom:'1px solid #ebebe5', background:'#fff',
    flexShrink:0,
  }}>
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div style={{
        width:22, height:22, borderRadius:6, background:'#0c0c0b',
        display:'flex', alignItems:'center', justifyContent:'center', color:'#fff',
        fontFamily:"'Inter Tight', sans-serif", fontWeight:700, fontSize:12,
      }}>B</div>
      <div style={{ fontFamily:"'Inter Tight', sans-serif", fontWeight:600, fontSize:13.5 }}>BridgeCircle</div>
      <div style={{ display:'flex', gap:18, marginLeft:18, color:'#4d4d4a', fontSize:12.5 }}>
        <span>Home</span><span>People</span>
        <span style={{ color:'#0c0c0b', fontWeight:600 }}>Help</span>
        <span>Inbox</span>
      </div>
    </div>
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <span style={{
        display:'inline-flex', alignItems:'center', gap:8,
        padding:'4px 10px 4px 8px', background:'#fff',
        border:'1px solid #dcdcd6', borderRadius:999, fontSize:12, fontWeight:500,
      }}>
        <span style={{ width:8, height:8, borderRadius:'50%',
          background:'#3b6e51', boxShadow:'0 0 0 3px rgba(59,110,81,0.18)' }} />
        {availability}
      </span>
      <div style={{ width:28, height:28, borderRadius:'50%', background:'#722f37', color:'#fff',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600 }}>RM</div>
    </div>
  </div>
);

const SubjectChip = ({ subject, active, onClick, size = 'md' }) => {
  const pad = size === 'sm' ? '3px 8px' : '5px 10px';
  const fs = size === 'sm' ? 11 : 12;
  return (
    <span onClick={onClick} style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding: pad, borderRadius: 6,
      background: active ? subject.color : `${subject.color}14`,
      color: active ? '#fff' : subject.color,
      border: `1px solid ${active ? subject.color : subject.color + '36'}`,
      fontFamily:"'Inter', sans-serif", fontWeight:600, fontSize: fs,
      cursor: onClick ? 'pointer' : 'default', whiteSpace:'nowrap',
    }}>
      <span style={{
        width:5, height:5, borderRadius:'50%',
        background: active ? '#fff' : subject.color,
      }} />
      {subject.label}
    </span>
  );
};

// Lucide-ish search icon
const IconLensSearch = ({ size = 14, stroke = 'currentColor', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke}
       strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);

// Reusable search input. variant: 'pill' | 'card' | 'minimal' | 'inline'
function HelpSearch({
  variant = 'card', placeholder = 'Search by name, role, company, or topic…',
  width = '100%', value = '', onChange, scopeLabel, kbd = true,
}) {
  const base = {
    display:'flex', alignItems:'center', gap:10,
    fontFamily:"'Inter', sans-serif", fontSize:13,
    width, color:'#0c0c0b',
  };
  const styles = {
    card: {
      ...base, background:'#fff', border:'1px solid #dcdcd6',
      borderRadius:10, padding:'10px 12px',
      boxShadow:'0 1px 0 rgba(12,12,11,0.03)',
    },
    pill: {
      ...base, background:'#fff', border:'1px solid #dcdcd6',
      borderRadius:999, padding:'9px 16px',
    },
    minimal: {
      ...base, background:'transparent', border:'none',
      borderBottom:'1px solid #0c0c0b', borderRadius:0, padding:'8px 0',
    },
    inline: {
      ...base, background:'#f4f3ee', border:'1px solid transparent',
      borderRadius:8, padding:'7px 10px',
    },
  };
  return (
    <div style={styles[variant]}>
      <IconLensSearch size={15} stroke="#4d4d4a" />
      {scopeLabel && (
        <span style={{
          display:'inline-flex', alignItems:'center', gap:5,
          padding:'2px 7px', borderRadius:5,
          background:'rgba(37,99,235,0.08)', color:'#2563eb',
          border:'1px solid rgba(37,99,235,0.20)',
          fontFamily:"'JetBrains Mono', monospace", fontSize:10.5, fontWeight:600,
          whiteSpace:'nowrap',
        }}>
          {scopeLabel}
          <span style={{ cursor:'pointer', display:'flex' }}>
            <IconX size={9} stroke="#2563eb" />
          </span>
        </span>
      )}
      <input
        defaultValue={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          flex:1, border:'none', outline:'none', background:'transparent',
          fontSize:13, color:'#0c0c0b',
          fontFamily:"'Inter', sans-serif", minWidth:0,
        }}
      />
      {kbd && (
        <span style={{
          fontFamily:"'JetBrains Mono', monospace", fontSize:10, fontWeight:600,
          padding:'2px 6px', borderRadius:4,
          background:'#f4f3ee', color:'#4d4d4a', border:'1px solid #ebebe5',
          whiteSpace:'nowrap',
        }}>⌘ K</span>
      )}
    </div>
  );
}

const AISparkleKicker = ({ children, tone = 'blue' }) => {
  const color = tone === 'ochre' ? '#a16207' : '#2563eb';
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:8,
      fontSize:10.5, fontWeight:700, letterSpacing:'0.12em',
      color, textTransform:'uppercase',
    }}>
      <IconSparkle size={11} stroke={color} />
      {children}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  VARIANT F — Daily AI brief (editorial morning digest)
// ═══════════════════════════════════════════════════════════════════════════
function VariantF() {
  const hero = AI_PICKS[0];
  const supporting = AI_PICKS.slice(1, 4);
  return (
    <div style={{ width:'100%', height:'100%', background:'#fafaf9', display:'flex', flexDirection:'column' }}>
      <HAITopBar />
      <div style={{ flex:1, overflow:'auto', padding:'30px 36px 32px' }}>
        <div style={{ maxWidth:920, margin:'0 auto' }}>
          {/* Masthead */}
          <div style={{
            display:'flex', alignItems:'flex-end', justifyContent:'space-between',
            paddingBottom:14, borderBottom:'1px solid #0c0c0b', marginBottom:20,
          }}>
            <div>
              <AISparkleKicker>Your Tuesday brief · Curated for you</AISparkleKicker>
              <h1 className="bc-heading" style={{
                fontSize:34, fontWeight:600, letterSpacing:'-0.02em',
                marginTop:6, lineHeight:1.1,
              }}>
                Three people you could help today.
              </h1>
            </div>
            <div className="bc-mono" style={{ fontSize:11, color:'#4d4d4a', whiteSpace:'nowrap' }}>
              Tue · May 27 · Vol. 12
            </div>
          </div>

          {/* Editorial lede */}
          <p style={{
            fontSize:14.5, color:'#4d4d4a', lineHeight:1.55,
            maxWidth:620, marginBottom:24,
            fontFamily:"'Inter', sans-serif",
          }}>
            Out of <span style={{ color:'#0c0c0b', fontWeight:600 }}>47 asks</span> posted across BridgeCircle in the last 24 hours,
            AI picked three that sit squarely in your wheelhouse — career transitions, product management, and the consulting-to-tech move you made yourself.
          </p>

          {/* Editorial search row */}
          <div style={{
            display:'flex', alignItems:'center', gap:14, marginBottom:24,
            paddingBottom:18, borderBottom:'1px dashed #dcdcd6',
          }}>
            <span style={{
              fontFamily:"'Inter Tight', sans-serif", fontStyle:'italic',
              fontSize:13.5, color:'#4d4d4a', flexShrink:0,
            }}>
              Or, find someone specific —
            </span>
            <HelpSearch variant="minimal"
              placeholder="Try “first PM job” or “Maya R.” or “Big Tech recruiting”…"
              kbd={false} />
            <button style={{
              background:'transparent', border:'1px solid #dcdcd6',
              borderRadius:8, padding:'7px 12px', fontSize:12, fontWeight:600,
              cursor:'pointer', color:'#0c0c0b', whiteSpace:'nowrap',
              display:'inline-flex', alignItems:'center', gap:6, flexShrink:0,
            }}>
              <IconLensSearch size={12} stroke="#0c0c0b" />
              Browse all
            </button>
          </div>

          {/* Hero pick */}
          <div style={{
            background:'#fff', border:'1px solid #dcdcd6', borderRadius:14,
            padding:'24px 26px', display:'grid',
            gridTemplateColumns:'1fr 240px', gap:28,
            boxShadow:'0 12px 34px -10px rgba(12,12,11,0.10)',
          }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <span style={{
                  display:'inline-flex', alignItems:'center', gap:6,
                  fontSize:10.5, fontWeight:700, letterSpacing:'0.10em',
                  color:'#a16207', textTransform:'uppercase',
                }}>
                  <IconSparkle size={11} stroke="#a16207" />
                  Lead story · {hero.fit}% fit
                </span>
              </div>
              <h2 className="bc-heading" style={{
                fontSize:22, fontWeight:600, lineHeight:1.35,
                letterSpacing:'-0.005em',
              }}>
                "{hero.need}"
              </h2>
              <div style={{
                fontSize:13.5, color:'#4d4d4a', marginTop:10,
                display:'flex', alignItems:'center', gap:8, flexWrap:'wrap',
              }}>
                <strong style={{ color:'#0c0c0b', fontWeight:600 }}>{hero.name}</strong>
                <span>·</span><span>{hero.role}</span>
                <span>·</span><span className="bc-mono">{hero.cohort}</span>
              </div>

              {/* Match rationale (italic blue pullquote) */}
              <div style={{
                marginTop:18, paddingLeft:14,
                borderLeft:'3px solid #2563eb',
              }}>
                <div style={{
                  fontSize:10, fontWeight:700, letterSpacing:'0.10em',
                  color:'#2563eb', textTransform:'uppercase', marginBottom:6,
                }}>Why we picked Jordan for you</div>
                <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:6 }}>
                  {hero.why.map((w, i) => (
                    <li key={i} style={{
                      fontSize:13, color:'#2563eb', fontStyle:'italic',
                      lineHeight:1.5, fontFamily:"'Inter', sans-serif",
                    }}>{w}</li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop:20, display:'flex', gap:8, alignItems:'center' }}>
                <HPBtn variant="cta" size="md">
                  <IconHand size={13} /> Offer help
                </HPBtn>
                <HPBtn variant="outline" size="md">Read in full</HPBtn>
                <HPBtn variant="ghost" size="sm" style={{ color:'#4d4d4a', marginLeft:'auto' }}>
                  Not now
                </HPBtn>
              </div>
            </div>

            {/* Right rail: portrait + meta */}
            <div style={{
              display:'flex', flexDirection:'column', alignItems:'center',
              borderLeft:'1px solid #ebebe5', paddingLeft:24,
            }}>
              <HPAvatar name={hero.name} color={hero.color} size={88} />
              <div style={{ textAlign:'center', marginTop:12 }}>
                <div className="bc-heading" style={{ fontSize:15, fontWeight:600 }}>{hero.name}</div>
                <div className="bc-mono" style={{ fontSize:11, color:'#4d4d4a', marginTop:2 }}>
                  Class of {hero.cohort.replace("'", "")}
                </div>
              </div>
              <div style={{ width:'100%', borderTop:'1px solid #ebebe5', margin:'14px 0', }} />
              <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  ['Subject',   hero.subject],
                  ['Mode',      'Asked for mentorship'],
                  ['Est. reply', hero.estReply],
                  ['Posted',    hero.posted],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:11.5 }}>
                    <span style={{ color:'#4d4d4a' }}>{k}</span>
                    <span style={{ color:'#0c0c0b', fontWeight:500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Supporting picks · 3-column */}
          <div style={{
            marginTop:22, paddingTop:18, borderTop:'1px solid #ebebe5',
          }}>
            <AISparkleKicker tone="ochre">Also worth your time today</AISparkleKicker>
            <div style={{
              marginTop:12, display:'grid',
              gridTemplateColumns:'1fr 1fr 1fr', gap:14,
            }}>
              {supporting.map(p => (
                <div key={p.id} style={{
                  background:'#fff', border:'1px solid #ebebe5', borderRadius:12,
                  padding:'14px 16px', display:'flex', flexDirection:'column', gap:10,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <HPAvatar name={p.name} color={p.color} size={36} />
                    <div style={{ minWidth:0, flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>{p.name}</div>
                      <div className="bc-mono" style={{ fontSize:10, color:'#4d4d4a' }}>
                        {p.cohort} · {p.fit}% fit · {p.estReply}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize:12.5, color:'#0c0c0b', lineHeight:1.45,
                    display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
                  }}>"{p.need}"</div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:'auto' }}>
                    <span style={{
                      fontFamily:"'JetBrains Mono', monospace",
                      fontSize:10, padding:'2px 7px', borderRadius:4,
                      background:`${p.color}14`, color:p.color,
                      border:`1px solid ${p.color}36`,
                    }}>{p.subject}</span>
                    <HPBtn variant="outline" size="xs" style={{ marginLeft:'auto' }}>Open</HPBtn>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <div style={{
            marginTop:22, paddingTop:14, borderTop:'1px solid #ebebe5',
            display:'flex', justifyContent:'space-between', alignItems:'center',
            fontSize:11.5, color:'#4d4d4a',
          }}>
            <span>Tomorrow's brief drops at 9:00 a.m. · Quiet days mean a shorter brief.</span>
            <a style={{ color:'#2563eb', fontWeight:600, textDecoration:'none', cursor:'pointer' }}>
              Tune what AI sends you →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  VARIANT G — Subjects as channels (Featured AI pick + user subjects)
// ═══════════════════════════════════════════════════════════════════════════
function VariantG() {
  const [active, setActive] = React.useState('featured');
  const isFeatured = active === 'featured';
  const activeSub = MY_SUBJECTS.find(s => s.id === active);
  const list = activeSub ? AI_PICKS.filter(p => p.subjectId === active) : [];

  const featuredPick = AI_PICKS[0];           // top-fit person
  const altPicks    = AI_PICKS.slice(1, 3);   // two alternates

  return (
    <div style={{ width:'100%', height:'100%', background:'#fafaf9', display:'flex', flexDirection:'column' }}>
      <HAITopBar />

      {/* Header */}
      <div style={{ padding:'24px 36px 0', flexShrink:0 }}>
        <AISparkleKicker>Find people to help · by subject</AISparkleKicker>
        <div style={{
          display:'flex', alignItems:'flex-end', justifyContent:'space-between',
          marginTop:6, gap:24,
        }}>
          <h1 className="bc-heading" style={{ fontSize:26, fontWeight:600, letterSpacing:'-0.015em' }}>
            Your subjects, with people behind them.
          </h1>
          <p style={{ fontSize:12.5, color:'#4d4d4a', maxWidth:340, textAlign:'right' }}>
            AI scans the network every hour for asks that match what you've said you can help with.
          </p>
        </div>

        {/* Search bar + recent searches */}
        <div style={{
          marginTop:16, display:'flex', gap:10, alignItems:'center',
        }}>
          <div style={{ flex:1, maxWidth:560 }}>
            <HelpSearch variant="card"
              placeholder="Search people who need help — by name, role, company, or topic…" />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, color:'#4d4d4a', fontSize:11.5 }}>
            <span>Recent:</span>
            {['APM programs', 'Stripe PM', 'Class of \'26'].map(t => (
              <span key={t} style={{
                padding:'4px 9px', borderRadius:6,
                background:'#fff', border:'1px solid #ebebe5',
                fontFamily:"'JetBrains Mono', monospace", fontSize:10.5,
                color:'#0c0c0b', cursor:'pointer', whiteSpace:'nowrap',
              }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Channel rail · featured + subjects as tabs */}
      <div style={{ padding:'12px 36px 0', flexShrink:0 }}>
        <div style={{ display:'flex', gap:8, borderBottom:'1px solid #ebebe5', alignItems:'flex-end' }}>
          {/* Featured AI tab */}
          <button onClick={() => setActive('featured')} style={{
            position:'relative', background:'transparent', border:'none', cursor:'pointer',
            padding:'12px 16px 14px', display:'flex', alignItems:'center', gap:10,
            color: isFeatured ? '#0c0c0b' : '#4d4d4a',
            fontFamily:"'Inter Tight', sans-serif", fontWeight:600, fontSize:14,
          }}>
            <IconSparkle size={13} stroke={isFeatured ? '#a16207' : '#4d4d4a'} />
            Featured
            <span style={{
              fontFamily:"'Inter', sans-serif", fontSize:10, fontWeight:700,
              letterSpacing:'0.08em', textTransform:'uppercase',
              color: isFeatured ? '#a16207' : '#4d4d4a',
            }}>AI pick</span>
            {isFeatured && (
              <span style={{
                position:'absolute', left:0, right:0, bottom:-1,
                height:2, background:'#a16207',
              }} />
            )}
          </button>

          {/* Visual separator between AI tab and user subjects */}
          <span style={{
            alignSelf:'center', width:1, height:18, background:'#dcdcd6', margin:'0 4px',
          }} />

          {/* User-created subjects */}
          <span style={{
            alignSelf:'center', fontSize:10, fontWeight:700, letterSpacing:'0.10em',
            textTransform:'uppercase', color:'#4d4d4a', marginRight:4,
          }}>Your subjects</span>

          {MY_SUBJECTS.map(s => {
            const isActive = s.id === active;
            return (
              <button key={s.id} onClick={() => setActive(s.id)} style={{
                position:'relative', background:'transparent', border:'none', cursor:'pointer',
                padding:'12px 14px 14px', display:'flex', alignItems:'center', gap:8,
                color: isActive ? '#0c0c0b' : '#4d4d4a',
                fontFamily:"'Inter Tight', sans-serif", fontWeight:600, fontSize:13.5,
              }}>
                <span style={{
                  width:8, height:8, borderRadius:'50%',
                  background: s.color, opacity: isActive ? 1 : 0.5,
                }} />
                {s.label}
                <span className="bc-mono" style={{
                  fontSize:10.5, padding:'2px 6px', borderRadius:4,
                  background: isActive ? '#0c0c0b' : '#ebebe5',
                  color: isActive ? '#fff' : '#4d4d4a', fontWeight:600,
                }}>{s.ask}</span>
                {isActive && (
                  <span style={{
                    position:'absolute', left:0, right:0, bottom:-1,
                    height:2, background:'#0c0c0b',
                  }} />
                )}
              </button>
            );
          })}
          <button style={{
            marginLeft:'auto', background:'transparent', border:'none', cursor:'pointer',
            padding:'12px 0', color:'#4d4d4a', fontSize:12.5, display:'inline-flex', gap:5, alignItems:'center',
          }}>+ Add subject</button>
        </div>
      </div>

      {/* Channel content */}
      <div style={{ flex:1, overflow:'auto', padding:'18px 36px 24px' }}>
        {isFeatured ? (
          /* ─── Featured AI pick panel ─── */
          <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:22 }}>
            <div>
              <div style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                marginBottom:12,
              }}>
                <div style={{ fontSize:13.5, color:'#4d4d4a' }}>
                  <strong style={{ color:'#0c0c0b' }}>One person</strong> AI thinks you'd be the right help for right now
                </div>
                <button style={{
                  background:'transparent', border:'none', color:'#4d4d4a', fontSize:12,
                  cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4,
                }}>
                  <IconRefresh size={11} /> Show me someone else
                </button>
              </div>

              {/* Hero AI card */}
              <div style={{
                background:'#fff',
                border:'1px solid rgba(161,98,7,0.30)', borderRadius:14,
                padding:'22px 24px', position:'relative', overflow:'hidden',
                boxShadow:'0 12px 34px -12px rgba(12,12,11,0.10)',
                backgroundImage:'linear-gradient(180deg, rgba(161,98,7,0.04), #fff 60%)',
              }}>
                {/* corner ribbon */}
                <div style={{
                  position:'absolute', top:14, right:14,
                  display:'inline-flex', alignItems:'center', gap:5,
                  padding:'4px 9px', borderRadius:999,
                  background:'rgba(161,98,7,0.12)', color:'#9a5a13',
                  border:'1px solid rgba(161,98,7,0.28)',
                  fontSize:10.5, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase',
                }}>
                  <IconSparkle size={11} stroke="#a16207" />
                  AI pick · {featuredPick.fit}% fit
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <HPAvatar name={featuredPick.name} color={featuredPick.color} size={56} />
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span className="bc-heading" style={{ fontSize:20, fontWeight:600 }}>
                        {featuredPick.name}
                      </span>
                      <span className="bc-mono" style={{ fontSize:11, color:'#4d4d4a' }}>
                        {featuredPick.cohort}
                      </span>
                      <span style={{
                        display:'inline-flex', alignItems:'center', gap:4,
                        padding:'2px 7px', borderRadius:4, fontSize:10.5, fontWeight:600,
                        background: featuredPick.mode === 'mentor' ? 'rgba(114,47,55,0.10)' : 'rgba(37,99,235,0.10)',
                        color: featuredPick.mode === 'mentor' ? '#722f37' : '#2563eb',
                        border: `1px solid ${featuredPick.mode === 'mentor' ? 'rgba(114,47,55,0.22)' : 'rgba(37,99,235,0.22)'}`,
                      }}>
                        Asked for {featuredPick.mode === 'mentor' ? 'mentorship' : 'advice'}
                      </span>
                    </div>
                    <div style={{ fontSize:12.5, color:'#4d4d4a', marginTop:3 }}>
                      {featuredPick.role} · {featuredPick.city} · {featuredPick.posted}
                    </div>
                  </div>
                </div>

                <p className="bc-heading" style={{
                  fontSize:18, lineHeight:1.45, color:'#0c0c0b', marginTop:16,
                  letterSpacing:'-0.005em',
                }}>
                  "{featuredPick.need}"
                </p>

                {/* Why AI picked them */}
                <div style={{
                  marginTop:16, padding:'12px 14px', borderRadius:10,
                  background:'#fafaf9', border:'1px solid #ebebe5',
                }}>
                  <div style={{
                    fontSize:10.5, fontWeight:700, letterSpacing:'0.10em',
                    color:'#4d4d4a', textTransform:'uppercase', marginBottom:8,
                    display:'flex', alignItems:'center', gap:6,
                  }}>
                    <IconSparkle size={10} stroke="#a16207" />
                    Why this is a {featuredPick.mode === 'mentor' ? 'mentorship' : 'advice'} match for you
                  </div>
                  <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:5 }}>
                    {featuredPick.why.map((w, i) => (
                      <li key={i} style={{ display:'flex', gap:8, fontSize:13, color:'#0c0c0b', lineHeight:1.45 }}>
                        <IconCheck size={12} stroke="#3b6e51" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ display:'flex', gap:8, marginTop:18, alignItems:'center' }}>
                  <HPBtn variant="cta" size="md">
                    <IconHand size={13} />
                    {featuredPick.mode === 'mentor' ? 'Offer mentorship' : 'Offer advice'}
                  </HPBtn>
                  <HPBtn variant="outline" size="md">Open profile</HPBtn>
                  <HPBtn variant="ghost" size="sm" style={{ color:'#4d4d4a', marginLeft:'auto' }}>
                    Not now
                  </HPBtn>
                </div>
              </div>

              {/* Alternates */}
              <div style={{ marginTop:18 }}>
                <div style={{
                  fontSize:10.5, fontWeight:700, letterSpacing:'0.10em',
                  color:'#4d4d4a', textTransform:'uppercase', marginBottom:8,
                }}>
                  Or, instead of {featuredPick.name.split(' ')[0]}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {altPicks.map(p => (
                    <div key={p.id} style={{
                      display:'flex', gap:10, alignItems:'flex-start',
                      padding:'12px 14px', border:'1px solid #ebebe5', borderRadius:12, background:'#fff',
                    }}>
                      <HPAvatar name={p.name} color={p.color} size={34} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ fontWeight:600, fontSize:13 }}>{p.name}</span>
                          <span className="bc-mono" style={{ fontSize:10, color:'#4d4d4a' }}>{p.cohort}</span>
                          <span className="bc-mono" style={{ fontSize:10, color: p.color, marginLeft:'auto' }}>{p.fit}%</span>
                        </div>
                        <div style={{
                          fontSize:11.5, color:'#4d4d4a', marginTop:4, lineHeight:1.45,
                          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
                        }}>
                          {p.need}
                        </div>
                        <div style={{ marginTop:6, fontSize:10.5, color:'#4d4d4a' }}>
                          {p.subject} · asked for {p.mode === 'mentor' ? 'mentorship' : 'advice'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Side: How AI picks + freshness */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{
                background:'#fff', border:'1px solid #ebebe5', borderRadius:12,
                padding:'14px 16px',
              }}>
                <div style={{
                  fontSize:10.5, fontWeight:700, letterSpacing:'0.10em',
                  color:'#4d4d4a', textTransform:'uppercase', marginBottom:10,
                }}>How AI ranks for you</div>
                <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:8, fontSize:12.5, color:'#0c0c0b' }}>
                  <li style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span>Subject overlap</span>
                    <span className="bc-mono" style={{ color:'#4d4d4a' }}>weight 0.45</span>
                  </li>
                  <li style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span>Your past help patterns</span>
                    <span className="bc-mono" style={{ color:'#4d4d4a' }}>0.30</span>
                  </li>
                  <li style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span>Cohort &amp; mutuals</span>
                    <span className="bc-mono" style={{ color:'#4d4d4a' }}>0.15</span>
                  </li>
                  <li style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span>Recency / queue age</span>
                    <span className="bc-mono" style={{ color:'#4d4d4a' }}>0.10</span>
                  </li>
                </ul>
              </div>

              <div style={{
                background:'#fff', border:'1px solid #ebebe5', borderRadius:12,
                padding:'14px 16px',
              }}>
                <div style={{
                  fontSize:10.5, fontWeight:700, letterSpacing:'0.10em',
                  color:'#4d4d4a', textTransform:'uppercase', marginBottom:8,
                }}>Today's queue</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                  <span className="bc-heading" style={{ fontSize:28, fontWeight:600 }}>6</span>
                  <span style={{ fontSize:12, color:'#4d4d4a' }}>matched · across 4 subjects</span>
                </div>
                <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:4 }}>
                  {MY_SUBJECTS.map(s => {
                    const n = AI_PICKS.filter(p => p.subjectId === s.id).length;
                    return (
                      <div key={s.id} style={{ display:'flex', alignItems:'center', gap:8, fontSize:11.5 }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:s.color }} />
                        <span style={{ flex:1 }}>{s.label}</span>
                        <span className="bc-mono" style={{ color:'#4d4d4a' }}>{n}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ─── User-subject feed ─── */
          <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:22 }}>
            {/* Feed */}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{
                display:'flex', alignItems:'baseline', justifyContent:'space-between',
                marginBottom:2,
              }}>
                <div style={{ fontSize:13.5, color:'#4d4d4a' }}>
                  <strong style={{ color:'#0c0c0b' }}>{list.length} people</strong> asked about <em style={{ color:activeSub.color, fontStyle:'normal', fontWeight:600 }}>{activeSub.label}</em> recently
                </div>
                <span style={{ fontSize:11.5, color:'#4d4d4a' }}>Sorted by AI fit</span>
              </div>
              {list.map(p => (
                <div key={p.id} style={{
                  display:'flex', gap:14, alignItems:'flex-start',
                  background:'#fff', border:'1px solid #ebebe5', borderRadius:12,
                  padding:'14px 16px',
                }}>
                  <HPAvatar name={p.name} color={p.color} size={42} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontWeight:600, fontSize:13.5 }}>{p.name}</span>
                      <span className="bc-mono" style={{ fontSize:10.5, color:'#4d4d4a' }}>{p.cohort}</span>
                      <span style={{ fontSize:11.5, color:'#4d4d4a' }}>{p.role}</span>
                      <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono', monospace",
                        fontSize:10.5, color:'#4d4d4a' }}>{p.posted}</span>
                    </div>
                    <p style={{ fontSize:13, color:'#0c0c0b', marginTop:6, lineHeight:1.5 }}>"{p.need}"</p>
                    <div style={{
                      marginTop:9, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
                    }}>
                      <span style={{
                        display:'inline-flex', alignItems:'center', gap:4,
                        fontSize:11, color:'#2563eb', fontStyle:'italic',
                      }}>
                        <IconSparkle size={10} stroke="#2563eb" />
                        {p.why[0]}
                      </span>
                      <span style={{ fontSize:11, color:'#4d4d4a' }}>· {p.fit}% fit · {p.estReply}</span>
                      <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
                        <HPBtn variant="ghost" size="xs" style={{ color:'#4d4d4a' }}>Pass</HPBtn>
                        <HPBtn variant="cta" size="xs">Offer help</HPBtn>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Side: your impact in this subject */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{
                background:'#fff', border:'1px solid #ebebe5', borderRadius:12,
                padding:'14px 16px',
              }}>
                <div style={{
                  fontSize:10.5, fontWeight:700, letterSpacing:'0.10em',
                  color:'#4d4d4a', textTransform:'uppercase', marginBottom:8,
                }}>
                  Your record · {activeSub.label}
                </div>
                <div className="bc-heading" style={{ fontSize:30, fontWeight:600, color: activeSub.color }}>
                  {activeSub.helped}
                </div>
                <div style={{ fontSize:12, color:'#4d4d4a' }}>people helped this year</div>
                <div style={{
                  marginTop:14, display:'grid',
                  gridTemplateColumns:'repeat(12, 1fr)', gap:3, alignItems:'end',
                  height:36,
                }}>
                  {[2,1,3,1,2,0,2,1,2,3,2,1].map((v, i) => (
                    <div key={i} style={{
                      height: `${(v / 3) * 100 || 8}%`,
                      background: v ? activeSub.color : '#ebebe5',
                      opacity: v ? 0.4 + (v/3)*0.6 : 1,
                      borderRadius:2,
                    }} />
                  ))}
                </div>
                <div style={{
                  marginTop:6, fontFamily:"'JetBrains Mono', monospace",
                  fontSize:10, color:'#4d4d4a', display:'flex', justifyContent:'space-between',
                }}>
                  <span>Jun</span><span>May</span>
                </div>
              </div>

              <div style={{
                background:'#fff', border:'1px solid #ebebe5', borderRadius:12,
                padding:'14px 16px',
              }}>
                <div style={{
                  fontSize:10.5, fontWeight:700, letterSpacing:'0.10em',
                  color:'#4d4d4a', textTransform:'uppercase', marginBottom:8,
                }}>
                  Tune this channel
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:12.5 }}>
                  <label style={{ display:'flex', justifyContent:'space-between', cursor:'pointer' }}>
                    <span>Email me new matches</span>
                    <span style={{
                      width:28, height:16, background:'#3b6e51', borderRadius:999,
                      position:'relative',
                    }}>
                      <span style={{
                        position:'absolute', top:2, right:2,
                        width:12, height:12, background:'#fff', borderRadius:'50%',
                      }} />
                    </span>
                  </label>
                  <label style={{ display:'flex', justifyContent:'space-between', cursor:'pointer' }}>
                    <span>Show low-fit (&lt;70%)</span>
                    <span style={{
                      width:28, height:16, background:'#dcdcd6', borderRadius:999,
                      position:'relative',
                    }}>
                      <span style={{
                        position:'absolute', top:2, left:2,
                        width:12, height:12, background:'#fff', borderRadius:'50%',
                      }} />
                    </span>
                  </label>
                </div>
                <button style={{
                  marginTop:12, width:'100%', background:'transparent',
                  border:'1px solid #dcdcd6', borderRadius:8, padding:'7px 10px',
                  fontSize:12, fontWeight:600, cursor:'pointer', color:'#0c0c0b',
                }}>Pause this subject</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  VARIANT H — Constellation map (visual: subjects → people)
// ═══════════════════════════════════════════════════════════════════════════
function VariantH() {
  const subjects = MY_SUBJECTS.slice(0, 4);
  // Layout: subjects as a vertical center spine, people radiating out left/right.
  const peopleBySubj = subjects.map(s => ({
    subject: s,
    people: AI_PICKS.filter(p => p.subjectId === s.id),
  }));

  return (
    <div style={{ width:'100%', height:'100%', background:'#fafaf9', display:'flex', flexDirection:'column' }}>
      <HAITopBar />
      <div style={{ flex:1, overflow:'hidden', display:'grid', gridTemplateColumns:'1fr 320px' }}>

        {/* Map canvas */}
        <div style={{
          position:'relative', padding:'24px 28px',
          background:'radial-gradient(ellipse at 35% 50%, rgba(37,99,235,0.04), transparent 60%), #fafaf9',
          overflow:'hidden',
        }}>
          <div style={{
            display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:18,
          }}>
            <div>
              <AISparkleKicker>The map · your subjects and who needs them</AISparkleKicker>
              <h1 className="bc-heading" style={{
                fontSize:22, fontWeight:600, marginTop:6, letterSpacing:'-0.01em',
              }}>
                Where people are pulling on your expertise.
              </h1>
            </div>
            {/* Floating search */}
            <div style={{ width:300, flexShrink:0 }}>
              <HelpSearch variant="pill"
                placeholder="Search the map…" kbd={true} />
              <div style={{
                marginTop:6, fontSize:10.5, color:'#4d4d4a', textAlign:'right',
              }}>Highlights matching nodes</div>
            </div>
          </div>

          {/* Constellation SVG */}
          <div style={{ position:'relative', marginTop:18, height:560 }}>
            <svg viewBox="0 0 640 560" width="100%" height="100%" style={{ position:'absolute', inset:0 }}>
              {/* Decorative concentric */}
              {[80, 160, 240].map(r => (
                <circle key={r} cx="320" cy="280" r={r}
                  fill="none" stroke="#0c0c0b" strokeOpacity="0.04" strokeDasharray="2 4" />
              ))}
              {/* Connection lines */}
              {peopleBySubj.flatMap((entry, si) => {
                const subjX = 320;
                const subjY = 80 + si * 130;
                return entry.people.map((p, pi) => {
                  const side = pi % 2 === 0 ? -1 : 1;
                  const distance = 180 + (pi >> 1) * 70;
                  const px = subjX + side * distance;
                  const py = subjY + ((pi >> 1) * 14) - 7;
                  const opacity = 0.18 + (p.fit / 100) * 0.35;
                  return (
                    <line key={`${si}-${pi}`} x1={subjX} y1={subjY} x2={px} y2={py}
                      stroke={entry.subject.color} strokeOpacity={opacity} strokeWidth="1.2" />
                  );
                });
              })}
            </svg>

            {/* Subject nodes (center column) */}
            {peopleBySubj.map((entry, si) => {
              const top = 80 + si * 130;
              return (
                <div key={entry.subject.id} style={{
                  position:'absolute', left:'50%', top: top,
                  transform:'translate(-50%, -50%)',
                }}>
                  <div style={{
                    background:'#fff', border:`1.5px solid ${entry.subject.color}`,
                    borderRadius:999, padding:'7px 14px',
                    fontFamily:"'Inter Tight', sans-serif", fontWeight:600, fontSize:13,
                    color: entry.subject.color, whiteSpace:'nowrap',
                    boxShadow:'0 4px 14px -4px rgba(12,12,11,0.10)',
                    display:'inline-flex', alignItems:'center', gap:8,
                  }}>
                    <span style={{
                      width:6, height:6, borderRadius:'50%', background: entry.subject.color,
                    }} />
                    {entry.subject.label}
                    <span className="bc-mono" style={{
                      fontSize:10, padding:'1px 5px', borderRadius:3,
                      background:`${entry.subject.color}18`,
                    }}>{entry.people.length}</span>
                  </div>
                </div>
              );
            })}

            {/* People nodes */}
            {peopleBySubj.flatMap((entry, si) => {
              const subjTop = 80 + si * 130;
              return entry.people.map((p, pi) => {
                const side = pi % 2 === 0 ? -1 : 1;
                const distance = 180 + (pi >> 1) * 70;
                const cx = 320 + side * distance;
                const cy = subjTop + ((pi >> 1) * 14) - 7;
                const isHero = p.id === 'a1';
                const size = isHero ? 56 : 42;
                // Convert SVG coords (640×560) → percent
                const left = (cx / 640) * 100;
                const top = (cy / 560) * 100;
                return (
                  <div key={p.id} style={{
                    position:'absolute',
                    left: `${left}%`, top: `${top}%`,
                    transform:'translate(-50%, -50%)',
                    textAlign:'center',
                  }}>
                    <div style={{
                      position:'relative', display:'inline-block',
                    }}>
                      <HPAvatar name={p.name} color={p.color} size={size} />
                      {isHero && (
                        <span style={{
                          position:'absolute', top:-4, right:-4,
                          width:18, height:18, borderRadius:'50%',
                          background:'#f59e0b', color:'#0c0c0b',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          border:'2px solid #fafaf9',
                        }}>
                          <IconSparkle size={9} stroke="#0c0c0b" />
                        </span>
                      )}
                    </div>
                    <div style={{
                      marginTop:4, fontSize:10.5, fontWeight:600,
                      whiteSpace:'nowrap', color:'#0c0c0b',
                    }}>{p.name}</div>
                    <div className="bc-mono" style={{
                      fontSize:9.5, color: p.color,
                    }}>{p.fit}% fit</div>
                  </div>
                );
              });
            })}

            {/* Self anchor (faint) */}
            <div style={{
              position:'absolute', left:'50%', top:'100%', transform:'translate(-50%, -100%)',
              fontSize:10.5, color:'#4d4d4a',
            }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ width:36, height:36, borderRadius:'50%',
                  background:'#0c0c0b', color:'#fff', display:'inline-flex',
                  alignItems:'center', justifyContent:'center',
                  fontFamily:"'Inter Tight', sans-serif", fontWeight:600, fontSize:13,
                  margin:'0 auto',
                }}>RM</div>
                <div style={{ marginTop:4, fontWeight:600, color:'#0c0c0b' }}>You</div>
              </div>
            </div>
          </div>
        </div>

        {/* Side panel · focused person */}
        <div style={{
          background:'#fff', borderLeft:'1px solid #ebebe5',
          padding:'24px 22px', display:'flex', flexDirection:'column', gap:16,
          overflow:'auto',
        }}>
          <AISparkleKicker tone="ochre">Currently in focus</AISparkleKicker>

          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <HPAvatar name={AI_PICKS[0].name} color={AI_PICKS[0].color} size={56} />
            <div>
              <div className="bc-heading" style={{ fontSize:16, fontWeight:600 }}>
                {AI_PICKS[0].name}
              </div>
              <div style={{ fontSize:11.5, color:'#4d4d4a' }}>{AI_PICKS[0].role}</div>
              <div className="bc-mono" style={{ fontSize:10.5, color:'#4d4d4a', marginTop:2 }}>
                {AI_PICKS[0].cohort} · {AI_PICKS[0].fit}% fit
              </div>
            </div>
          </div>

          <p style={{
            fontSize:13, lineHeight:1.5, color:'#0c0c0b',
            paddingLeft:12, borderLeft:'3px solid #2563eb',
            fontStyle:'italic',
          }}>
            "{AI_PICKS[0].need}"
          </p>

          <div>
            <div style={{
              fontSize:10.5, fontWeight:700, letterSpacing:'0.10em',
              color:'#4d4d4a', textTransform:'uppercase', marginBottom:8,
            }}>Where the line is from</div>
            <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:6 }}>
              {AI_PICKS[0].why.map((w, i) => (
                <li key={i} style={{
                  display:'flex', gap:8, fontSize:12.5, color:'#0c0c0b', lineHeight:1.4,
                }}>
                  <IconCheck size={12} stroke="#3b6e51" /> <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ display:'flex', gap:8, marginTop:'auto' }}>
            <HPBtn variant="cta" size="md" style={{ flex:1 }}>
              <IconHand size={13} /> Offer help
            </HPBtn>
            <HPBtn variant="outline" size="md">Profile</HPBtn>
          </div>

          <div style={{
            fontSize:11.5, color:'#4d4d4a', paddingTop:12, borderTop:'1px solid #ebebe5',
          }}>
            Click any node to focus. Lines fade with weaker fit.
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  VARIANT I — Open questions stream (reframe: questions, not people)
// ═══════════════════════════════════════════════════════════════════════════
function VariantI() {
  const all = AI_PICKS;
  return (
    <div style={{ width:'100%', height:'100%', background:'#fafaf9', display:'flex', flexDirection:'column' }}>
      <HAITopBar />

      {/* Header */}
      <div style={{ padding:'24px 36px 14px', flexShrink:0, borderBottom:'1px solid #ebebe5' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:24 }}>
          <div>
            <AISparkleKicker>Open questions · routed to your subjects</AISparkleKicker>
            <h1 className="bc-heading" style={{
              fontSize:26, fontWeight:600, letterSpacing:'-0.015em', marginTop:6,
            }}>
              Questions you could answer today.
            </h1>
            <p style={{ fontSize:13.5, color:'#4d4d4a', marginTop:4, maxWidth:520 }}>
              Live feed of asks across BridgeCircle that overlap your help subjects. Answer one, pass, or save for later.
            </p>
          </div>
          {/* Activity meter */}
          <div style={{
            background:'#fff', border:'1px solid #ebebe5', borderRadius:12,
            padding:'10px 14px', minWidth:220,
          }}>
            <div className="bc-mono" style={{ fontSize:10, color:'#4d4d4a', letterSpacing:'0.06em' }}>
              LAST 24H · YOUR SUBJECTS
            </div>
            <div style={{ display:'flex', alignItems:'baseline', gap:6, marginTop:4 }}>
              <span className="bc-heading" style={{ fontSize:24, fontWeight:600 }}>47</span>
              <span style={{ fontSize:12, color:'#4d4d4a' }}>open · 6 unanswered &gt;1 day</span>
            </div>
            {/* Activity bars */}
            <div style={{
              marginTop:8, display:'grid', gridTemplateColumns:'repeat(24, 1fr)', gap:2, height:18,
              alignItems:'end',
            }}>
              {[2,1,3,2,1,0,1,2,4,5,4,6,4,5,3,2,4,3,5,4,3,2,1,2].map((v,i) => (
                <div key={i} style={{
                  height: `${(v / 6) * 100 || 6}%`,
                  background: i >= 18 ? '#2563eb' : '#dcdcd6',
                  borderRadius:1.5,
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search + filter row */}
      <div style={{
        padding:'14px 36px', flexShrink:0, borderBottom:'1px solid #ebebe5',
        background:'#fff', display:'flex', flexDirection:'column', gap:10,
      }}>
        <HelpSearch variant="card"
          placeholder="Search open questions, askers, or topics — e.g. “APM programs”, “Reese”, “Bain → tech”"
          scopeLabel="In your subjects" />
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:12, color:'#4d4d4a' }}>Filter</span>
          <span style={{
            display:'inline-flex', alignItems:'center', gap:5,
            padding:'4px 9px', borderRadius:6,
            background:'#0c0c0b', color:'#fff',
            fontFamily:"'Inter', sans-serif", fontWeight:600, fontSize:11.5,
          }}>All subjects</span>
          {MY_SUBJECTS.map(s => (
            <SubjectChip key={s.id} subject={s} size="sm" />
          ))}
          <span style={{ marginLeft:'auto', fontSize:12, color:'#4d4d4a',
            display:'inline-flex', alignItems:'center', gap:6 }}>
            Sort
            <span style={{ color:'#0c0c0b', fontWeight:600 }}>AI fit ↓</span>
          </span>
        </div>
      </div>

      {/* Stream */}
      <div style={{ flex:1, overflow:'auto', padding:'8px 36px 20px' }}>
        {all.map((p, i) => {
          const isNew = i === 0;
          return (
            <div key={p.id} style={{
              display:'grid', gridTemplateColumns:'auto 1fr auto', gap:18,
              padding:'18px 0', borderBottom:'1px solid #ebebe5',
              alignItems:'flex-start',
            }}>
              {/* Left: avatar + fit dial */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, width:64 }}>
                <HPAvatar name={p.name} color={p.color} size={44} />
                {/* fit donut */}
                <div style={{
                  width:44, height:8, background:'#ebebe5', borderRadius:999, overflow:'hidden',
                  position:'relative',
                }}>
                  <div style={{
                    position:'absolute', inset:0, width:`${p.fit}%`,
                    background: p.color, borderRadius:999,
                  }} />
                </div>
                <div className="bc-mono" style={{ fontSize:10, color: p.color, fontWeight:600 }}>
                  {p.fit}%
                </div>
              </div>

              {/* Center: question */}
              <div style={{ minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontWeight:600, fontSize:13.5 }}>{p.name}</span>
                  <span className="bc-mono" style={{ fontSize:10.5, color:'#4d4d4a' }}>{p.cohort}</span>
                  <span style={{ fontSize:11.5, color:'#4d4d4a' }}>· {p.role}</span>
                  {isNew && (
                    <span style={{
                      fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
                      color:'#a16207',
                    }}>· NEW · 0 replies</span>
                  )}
                  <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono', monospace",
                    fontSize:10.5, color:'#4d4d4a' }}>{p.posted}</span>
                </div>
                <p className="bc-heading" style={{
                  fontSize:16, fontWeight:600, color:'#0c0c0b', marginTop:6,
                  lineHeight:1.4, letterSpacing:'-0.005em',
                }}>
                  "{p.need}"
                </p>
                <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                  <span style={{
                    display:'inline-flex', alignItems:'center', gap:5,
                    fontFamily:"'JetBrains Mono', monospace", fontSize:10,
                    padding:'2px 7px', borderRadius:4,
                    background:`${p.color}14`, color:p.color,
                    border:`1px solid ${p.color}36`,
                  }}>
                    <span style={{ width:5, height:5, borderRadius:'50%', background:p.color }} />
                    {p.subject}
                  </span>
                  <span style={{
                    fontSize:11.5, color:'#2563eb', fontStyle:'italic',
                    display:'inline-flex', alignItems:'center', gap:5,
                  }}>
                    <IconSparkle size={10} stroke="#2563eb" />
                    {p.why[0]}
                  </span>
                  <span style={{ fontSize:11.5, color:'#4d4d4a' }}>· {p.estReply}</span>
                </div>
              </div>

              {/* Right: actions */}
              <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
                <HPBtn variant="cta" size="sm">Answer</HPBtn>
                <HPBtn variant="ghost" size="sm" style={{ color:'#4d4d4a' }}>Save</HPBtn>
                <HPBtn variant="ghost" size="xs" style={{ color:'#4d4d4a' }}>Pass</HPBtn>
              </div>
            </div>
          );
        })}
        {/* End-of-feed note */}
        <div style={{
          padding:'18px 0 8px', textAlign:'center',
          fontSize:12, color:'#4d4d4a',
        }}>
          That's everything in your subjects right now. We'll surface new questions as they post.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  VariantF, VariantG, VariantH, VariantI,
  MY_SUBJECTS, AI_PICKS,
  HelpSearch, IconLensSearch,
});
