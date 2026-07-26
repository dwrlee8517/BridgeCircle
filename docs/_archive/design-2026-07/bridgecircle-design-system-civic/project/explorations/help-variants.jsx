// Five Help-page direction sketches.
// Each VariantX is a self-contained 1040×760 mock that fits the BridgeCircle
// visual language (warm-paper background, ink-near-black text, blue accent,
// ochre warm CTA). They are static demos — no real interaction logic.

// ─── Shared layout helpers ────────────────────────────────────────────────
const Frame = ({ children, style = {} }) => (
  <div style={{
    width: '100%', height: '100%', overflow: 'hidden',
    background: '#fafaf9', color: '#0c0c0b',
    display: 'flex', flexDirection: 'column',
    fontSize: 13.5, lineHeight: 1.5, ...style,
  }}>{children}</div>
);

const SoftRule = ({ style = {} }) => (
  <div style={{ height: 1, background: '#ebebe5', ...style }} />
);

// Tiny availability pill used in headers
const AvailabilityChip = ({ compact }) => (
  <div style={{
    display:'inline-flex', alignItems:'center', gap:8,
    padding: compact ? '4px 10px 4px 8px' : '5px 12px 5px 10px',
    background:'#fff', border:'1px solid #dcdcd6', borderRadius:999,
    fontSize:12, fontWeight:500,
  }}>
    <span style={{ width:8, height:8, borderRadius:'50%', background:'#3b6e51', boxShadow:'0 0 0 3px rgba(59,110,81,0.18)' }} />
    Open to help
    {!compact && <span style={{ color:'#4d4d4a' }}>· 2/5 mentees</span>}
  </div>
);

// A topic chip
const Topic = ({ children, tone = 'blue' }) => {
  const t = tone === 'blue'
    ? { bg:'rgba(37,99,235,0.08)', color:'#2563eb', border:'rgba(37,99,235,0.20)' }
    : { bg:'#f4f3ee', color:'#4d4d4a', border:'#dcdcd6' };
  return <span style={{
    fontFamily:"'JetBrains Mono', monospace", fontSize:10, fontWeight:500,
    padding:'3px 8px', borderRadius:4,
    background:t.bg, color:t.color, border:`1px solid ${t.border}`, whiteSpace:'nowrap',
  }}>{children}</span>;
};

// Mini app chrome — slim top bar used by most variants
const TopBar = ({ right }) => (
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
        <span>Home</span><span>People</span><span style={{ color:'#0c0c0b', fontWeight:600 }}>Help</span><span>Inbox</span>
      </div>
    </div>
    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
      {right}
      <div style={{ width:28, height:28, borderRadius:'50%', background:'#722f37', color:'#fff',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600 }}>RM</div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
//  VARIANT A — Inbox-zero ritual: one ask at a time, smart-reply chips
// ═══════════════════════════════════════════════════════════════════════════
function VariantA() {
  const current = HP_INCOMING[0];
  return (
    <Frame>
      <TopBar right={<AvailabilityChip compact />} />

      {/* Queue strip */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 28px', borderBottom:'1px solid #ebebe5',
        background:'linear-gradient(180deg, #fff, #fafaf9)', flexShrink:0,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span className="bc-kicker">Reply session</span>
          <span style={{ fontSize:12, color:'#4d4d4a' }}>1 of 3 waiting · ~3 min each</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {[0,1,2].map(i => (
            <span key={i} style={{
              width: i===0 ? 22 : 6, height: 6, borderRadius:999,
              background: i===0 ? '#0c0c0b' : '#dcdcd6',
            }} />
          ))}
        </div>
      </div>

      {/* Stage */}
      <div style={{ flex:1, overflow:'auto', display:'flex', justifyContent:'center', padding:'32px 28px' }}>
        <div style={{ width:'100%', maxWidth:680, display:'flex', flexDirection:'column', gap:18 }}>
          {/* Identity */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
            <HPAvatar name={current.from} color={current.avatarColor} size={52} />
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <span className="bc-heading" style={{ fontSize:19, fontWeight:600 }}>{current.from}</span>
                <span className="bc-mono" style={{ fontSize:11, color:'#4d4d4a' }}>Class of '22</span>
                <Topic>{current.topic}</Topic>
              </div>
              <div style={{ fontSize:12, color:'#4d4d4a', marginTop:3 }}>
                Asked for {current.type.toLowerCase()} · {current.sent}
              </div>
            </div>
          </div>

          {/* The question, in editorial type */}
          <p className="bc-heading" style={{ fontSize:22, lineHeight:1.4, color:'#0c0c0b', letterSpacing:'-0.005em' }}>
            "{current.ask}"
          </p>

          {/* Match rationale */}
          <div style={{
            display:'flex', gap:10, padding:'10px 14px',
            borderLeft:'3px solid #2563eb', background:'rgba(37,99,235,0.04)',
            borderRadius:'0 8px 8px 0',
          }}>
            <IconSparkle size={14} stroke="#2563eb" />
            <span style={{ fontSize:12.5, color:'#2563eb', fontStyle:'italic', lineHeight:1.5 }}>{current.match}</span>
          </div>

          {/* Smart-reply chips */}
          <div>
            <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'0.08em', color:'#4d4d4a', textTransform:'uppercase', marginBottom:8 }}>Quick replies</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {['Happy to chat — 30m next week', 'Send my notes on the move', 'Not a fit, but try Maya R.'].map(t => (
                <button key={t} style={{
                  border:'1px solid #dcdcd6', background:'#fff', borderRadius:999,
                  padding:'7px 12px', fontSize:12, fontWeight:500, cursor:'pointer',
                  color:'#0c0c0b', display:'inline-flex', alignItems:'center', gap:6,
                }}>
                  <IconCheck size={11} stroke="#3b6e51" />
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Reply field */}
          <div style={{
            border:'1px solid #dcdcd6', borderRadius:12, background:'#fff',
            padding:'12px 14px',
            boxShadow:'0 1px 0 rgba(12,12,11,0.03), 0 4px 12px -6px rgba(12,12,11,0.08)',
          }}>
            <div style={{ fontSize:12, color:'#bdbdb7', minHeight:60 }}>
              Type a reply, or pick a quick reply above…
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10 }}>
              <div style={{ display:'flex', gap:6, color:'#4d4d4a', fontSize:11.5 }}>
                <span>Tone: warm</span><span>·</span><span>~3 sentences</span>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <HPBtn variant="ghost" size="sm">Skip</HPBtn>
                <HPBtn variant="outline" size="sm">Decline</HPBtn>
                <HPBtn variant="cta" size="sm">Send &amp; next →</HPBtn>
              </div>
            </div>
          </div>

          {/* Up next preview */}
          <div style={{ marginTop:6, opacity:0.6 }}>
            <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'0.08em', color:'#4d4d4a', textTransform:'uppercase', marginBottom:8 }}>Up next</div>
            <div style={{ display:'flex', gap:10 }}>
              {HP_INCOMING.slice(1).map(r => (
                <div key={r.id} style={{
                  flex:1, display:'flex', gap:10, alignItems:'center',
                  border:'1px solid #ebebe5', borderRadius:10, background:'#fff', padding:'10px 12px',
                }}>
                  <HPAvatar name={r.from} color={r.avatarColor} size={30} />
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.from}</div>
                    <div style={{ fontSize:11, color:'#4d4d4a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.ask}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  VARIANT B — Two-mode switch: replies queue vs. browse, no overlap
// ═══════════════════════════════════════════════════════════════════════════
function VariantB() {
  return (
    <Frame>
      <TopBar right={<AvailabilityChip />} />

      <div style={{ padding:'28px 36px 18px', flexShrink:0 }}>
        <div className="bc-kicker" style={{ marginBottom:8 }}>Help</div>
        <h1 className="bc-heading" style={{ fontSize:26, fontWeight:600, color:'#0c0c0b' }}>
          Where your experience matters.
        </h1>
        <p style={{ fontSize:13.5, color:'#4d4d4a', marginTop:4, maxWidth:560 }}>
          Reply to people who asked you — or browse for someone else you can help.
        </p>
      </div>

      {/* Mode switch */}
      <div style={{ padding:'0 36px', flexShrink:0 }}>
        <div style={{
          display:'inline-flex', background:'#f4f3ee', border:'1px solid #dcdcd6',
          borderRadius:12, padding:4, gap:2,
        }}>
          <button style={{
            display:'inline-flex', alignItems:'center', gap:8,
            padding:'9px 16px', borderRadius:8, border:'none', cursor:'pointer',
            background:'#fff', color:'#0c0c0b', fontWeight:600, fontSize:13,
            boxShadow:'0 1px 0 rgba(12,12,11,0.05), 0 1px 2px rgba(12,12,11,0.06)',
          }}>
            <IconInbox size={14} stroke="#0c0c0b" />
            Replies needed
            <span style={{
              fontFamily:"'JetBrains Mono', monospace", fontSize:11, fontWeight:700,
              padding:'1px 6px', borderRadius:4, background:'#9b2c1f', color:'#fff',
            }}>3</span>
          </button>
          <button style={{
            display:'inline-flex', alignItems:'center', gap:8,
            padding:'9px 16px', borderRadius:8, border:'none', cursor:'pointer',
            background:'transparent', color:'#4d4d4a', fontWeight:600, fontSize:13,
          }}>
            <IconSearch size={14} />
            Browse who needs help
          </button>
          <button style={{
            display:'inline-flex', alignItems:'center', gap:8,
            padding:'9px 16px', borderRadius:8, border:'none', cursor:'pointer',
            background:'transparent', color:'#4d4d4a', fontWeight:600, fontSize:13,
          }}>
            <IconHand size={14} />
            Active mentees
            <span className="bc-mono" style={{ fontSize:11, color:'#4d4d4a' }}>2</span>
          </button>
        </div>
      </div>

      {/* Active tab content */}
      <div style={{ flex:1, overflow:'auto', padding:'20px 36px 28px' }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:14 }}>
          <p style={{ fontSize:13, color:'#4d4d4a' }}>
            People who already chose you. Reply when you can — short answers count.
          </p>
          <button style={{ background:'none', border:'none', color:'#4d4d4a', fontSize:12, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4 }}>
            Sort: Oldest first
            <IconChevDown size={12} />
          </button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {HP_INCOMING.map(r => (
            <div key={r.id} style={{
              border:'1px solid #dcdcd6', borderRadius:12, background:'#fff', padding:'16px 18px',
              display:'flex', gap:14, alignItems:'flex-start',
            }}>
              <HPAvatar name={r.from} color={r.avatarColor} size={44} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span className="bc-heading" style={{ fontSize:14, fontWeight:600 }}>{r.from}</span>
                  <span className="bc-mono" style={{ fontSize:10.5, color:'#4d4d4a' }}>Class of '{String(r.cohort).slice(-2)}</span>
                  <HPBadge tone={r.type === 'Mentorship' ? 'plum' : 'info'}>{r.type}</HPBadge>
                  <Topic>{r.topic}</Topic>
                  <span className="bc-mono" style={{ fontSize:10.5, color:'#4d4d4a', marginLeft:'auto' }}>{r.sent}</span>
                </div>
                <p style={{ fontSize:13, color:'#0c0c0b', marginTop:8, lineHeight:1.55 }}>{r.ask}</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end', flexShrink:0 }}>
                <HPBtn variant="cta" size="sm">Reply</HPBtn>
                <HPBtn variant="ghost" size="sm" style={{ color:'#4d4d4a' }}>Decline</HPBtn>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  VARIANT C — Calm helper dashboard: status page, not a task list
// ═══════════════════════════════════════════════════════════════════════════
function VariantC() {
  const stats = [
    { label:'Replies this month', value:'4',   sub:'+1 vs April' },
    { label:'Active mentees',     value:'2/5', sub:'1 paused' },
    { label:'Median reply time',  value:'14h', sub:'within your norm' },
    { label:'Availability',       value:'Open', sub:'Updated 12d ago', tone:'open' },
  ];
  return (
    <Frame>
      <TopBar />
      <div style={{ flex:1, overflow:'auto', padding:'28px 36px' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:18 }}>
          <div>
            <div className="bc-kicker bc-kicker--muted" style={{ marginBottom:8 }}>Your helping · May 2026</div>
            <h1 className="bc-heading" style={{ fontSize:26, fontWeight:600 }}>A quiet record of who you've shown up for.</h1>
          </div>
          <HPBtn variant="outline" size="sm">Edit availability</HPBtn>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:22 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              border:'1px solid #ebebe5', background:'#fff', borderRadius:12, padding:'14px 16px',
            }}>
              <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'0.08em', color:'#4d4d4a', textTransform:'uppercase' }}>{s.label}</div>
              <div className="bc-heading" style={{
                fontSize:26, fontWeight:600, marginTop:6,
                color: s.tone === 'open' ? '#3b6e51' : '#0c0c0b',
              }}>{s.value}</div>
              <div style={{ fontSize:11.5, color:'#4d4d4a', marginTop:2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Two columns */}
        <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:24 }}>
          {/* Asks waiting */}
          <div>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10 }}>
              <div className="bc-kicker bc-kicker--ochre">3 asks waiting</div>
              <span style={{ fontSize:11.5, color:'#4d4d4a' }}>oldest: 1 day</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {HP_INCOMING.map(r => (
                <div key={r.id} style={{
                  display:'flex', gap:10, alignItems:'center',
                  padding:'10px 12px', border:'1px solid #ebebe5', borderRadius:10, background:'#fff',
                }}>
                  <HPAvatar name={r.from} color={r.avatarColor} size={32} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontWeight:600, fontSize:12.5 }}>{r.from}</span>
                      <span className="bc-mono" style={{ fontSize:10, color:'#4d4d4a' }}>'{String(r.cohort).slice(-2)}</span>
                      <Topic tone="muted">{r.topic}</Topic>
                    </div>
                    <div style={{ fontSize:11.5, color:'#4d4d4a', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.ask}</div>
                  </div>
                  <span className="bc-mono" style={{ fontSize:10.5, color:'#4d4d4a' }}>{r.sent}</span>
                  <HPBtn variant="outline" size="xs">Open</HPBtn>
                </div>
              ))}
            </div>
            <button style={{
              marginTop:10, background:'none', border:'none', color:'#2563eb',
              fontSize:12.5, fontWeight:600, cursor:'pointer', display:'inline-flex', gap:4, alignItems:'center',
            }}>Open inbox <IconArrow size={11} /></button>
          </div>

          {/* Freshness + recent */}
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div style={{ border:'1px solid #ebebe5', borderRadius:12, background:'#fff', padding:'14px 16px' }}>
              <div className="bc-kicker bc-kicker--muted" style={{ marginBottom:8 }}>Freshness check</div>
              <p style={{ fontSize:13, color:'#0c0c0b', lineHeight:1.5 }}>
                Still want these topics routed to you?
              </p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
                {HP_MY_TOPICS.map(t => (
                  <span key={t} style={{
                    display:'inline-flex', alignItems:'center', gap:6,
                    padding:'4px 8px 4px 10px', borderRadius:6,
                    background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.18)',
                    fontSize:11.5, color:'#2563eb', fontWeight:500,
                  }}>
                    {t}
                    <button style={{ background:'none', border:'none', color:'#2563eb', cursor:'pointer', display:'flex' }}>
                      <IconX size={11} />
                    </button>
                  </span>
                ))}
                <button style={{
                  fontSize:11.5, color:'#4d4d4a', background:'transparent',
                  border:'1px dashed #c8c8bf', borderRadius:6, padding:'4px 10px', cursor:'pointer',
                }}>+ add topic</button>
              </div>
              <div style={{ marginTop:12, display:'flex', gap:8 }}>
                <HPBtn variant="outline" size="xs">Looks right</HPBtn>
                <HPBtn variant="ghost" size="xs" style={{ color:'#4d4d4a' }}>Pause requests</HPBtn>
              </div>
            </div>

            <div>
              <div className="bc-kicker bc-kicker--muted" style={{ marginBottom:8 }}>Recent help you gave</div>
              <ul style={{ listStyle:'none', border:'1px solid #ebebe5', borderRadius:10, background:'#fff', overflow:'hidden' }}>
                {HP_RECENT.map((r, i) => (
                  <li key={r.name} style={{
                    display:'flex', alignItems:'center', gap:10,
                    padding:'8px 12px', borderTop: i ? '1px solid #ebebe5' : 'none',
                    fontSize:12.5,
                  }}>
                    <IconCheck size={12} stroke="#3b6e51" />
                    <span style={{ fontWeight:600 }}>{r.name}</span>
                    <span style={{ color:'#4d4d4a' }}>· {r.topic}</span>
                    <span className="bc-mono" style={{ fontSize:10.5, color:'#4d4d4a', marginLeft:'auto' }}>{r.when}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  VARIANT D — One question: "Who should I help next?"
// ═══════════════════════════════════════════════════════════════════════════
function VariantD() {
  const top = HP_INCOMING[0];
  return (
    <Frame>
      <TopBar right={<AvailabilityChip compact />} />
      <div style={{ flex:1, overflow:'auto', padding:'36px 36px 28px' }}>
        <div style={{ maxWidth:880, margin:'0 auto' }}>
          <div className="bc-kicker" style={{ marginBottom:10 }}>Help · the one decision</div>
          <h1 className="bc-heading" style={{ fontSize:36, fontWeight:600, letterSpacing:'-0.02em', color:'#0c0c0b', lineHeight:1.15 }}>
            Who should you help next?
          </h1>
          <p style={{ fontSize:14, color:'#4d4d4a', marginTop:6, maxWidth:520 }}>
            One person at a time. We picked who fits you best right now — overrule us anytime.
          </p>

          {/* Hero card */}
          <div style={{
            marginTop:20, border:'1px solid #dcdcd6', borderRadius:16, background:'#fff',
            padding:'22px 24px', position:'relative', overflow:'hidden',
            boxShadow:'0 8px 28px -12px rgba(12,12,11,0.10), 0 1px 0 rgba(12,12,11,0.03)',
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
              Best fit for you
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <HPAvatar name={top.from} color={top.avatarColor} size={56} />
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span className="bc-heading" style={{ fontSize:20, fontWeight:600 }}>{top.from}</span>
                  <span className="bc-mono" style={{ fontSize:11, color:'#4d4d4a' }}>Class of '22</span>
                </div>
                <div style={{ fontSize:12.5, color:'#4d4d4a', marginTop:3 }}>
                  {top.type} · {top.topic} · {top.sent}
                </div>
              </div>
            </div>

            <p className="bc-heading" style={{ fontSize:18, lineHeight:1.45, color:'#0c0c0b', marginTop:16, letterSpacing:'-0.005em' }}>
              "{top.ask}"
            </p>

            <div style={{ marginTop:16, padding:'12px 14px', borderRadius:10, background:'#fafaf9', border:'1px solid #ebebe5' }}>
              <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'0.08em', color:'#4d4d4a', textTransform:'uppercase', marginBottom:6 }}>
                Why we picked Jordan for you
              </div>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:4, fontSize:12.5, color:'#0c0c0b' }}>
                <li style={{ display:'flex', gap:8 }}><IconCheck size={12} stroke="#3b6e51" /> You made the same consulting → tech move in '21</li>
                <li style={{ display:'flex', gap:8 }}><IconCheck size={12} stroke="#3b6e51" /> Career transitions is on your help list</li>
                <li style={{ display:'flex', gap:8 }}><IconCheck size={12} stroke="#3b6e51" /> ~15 min answer; matches your normal reply length</li>
              </ul>
            </div>

            <div style={{ display:'flex', gap:8, marginTop:18, alignItems:'center' }}>
              <HPBtn variant="cta" size="lg" style={{ flex:'0 0 auto' }}>
                <IconHand size={14} /> Reply to Jordan
              </HPBtn>
              <HPBtn variant="outline" size="md">Open profile</HPBtn>
              <HPBtn variant="ghost" size="md" style={{ color:'#4d4d4a', marginLeft:'auto' }}>
                <IconRefresh size={13} /> Show me someone else
              </HPBtn>
            </div>
          </div>

          {/* Secondary candidates */}
          <div style={{ marginTop:22 }}>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10 }}>
              <div className="bc-kicker bc-kicker--muted">Or, after this one</div>
              <button style={{ background:'none', border:'none', color:'#2563eb', fontSize:12.5, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4 }}>
                See all 3 waiting <IconArrow size={11} />
              </button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {HP_INCOMING.slice(1).map(r => (
                <div key={r.id} style={{
                  display:'flex', gap:10, alignItems:'flex-start',
                  padding:'12px 14px', border:'1px solid #ebebe5', borderRadius:12, background:'#fff',
                }}>
                  <HPAvatar name={r.from} color={r.avatarColor} size={34} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontWeight:600, fontSize:13 }}>{r.from}</span>
                      <span className="bc-mono" style={{ fontSize:10, color:'#4d4d4a' }}>'{String(r.cohort).slice(-2)}</span>
                    </div>
                    <div style={{ fontSize:12, color:'#4d4d4a', marginTop:3, lineHeight:1.45,
                      display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                      {r.ask}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  VARIANT E — 15-minute help session: time-boxed practice
// ═══════════════════════════════════════════════════════════════════════════
function VariantE() {
  const items = [
    { ...HP_INCOMING[0], est:'~5 min', kind:'Reply' },
    { ...HP_INCOMING[1], est:'~3 min', kind:'Reply' },
    { ...HP_INCOMING[2], est:'~4 min', kind:'Resume review' },
  ];
  // 4-week streak (placeholder)
  const streak = ['M','T','W','T','F','S','S'].flatMap((_,col) =>
    [0,1,2,3].map(row => ({ col, row, done: (row*7+col) % 3 === 0 }))
  );
  return (
    <Frame>
      <TopBar right={<AvailabilityChip compact />} />
      <div style={{ flex:1, overflow:'auto', padding:'28px 36px' }}>
        <div className="bc-kicker bc-kicker--ochre" style={{ marginBottom:8 }}>Your helping practice</div>
        <h1 className="bc-heading" style={{ fontSize:28, fontWeight:600, letterSpacing:'-0.015em' }}>
          Want to spend 15 minutes helping today?
        </h1>
        <p style={{ fontSize:14, color:'#4d4d4a', marginTop:4 }}>
          Three short asks, batched into one focused session. No commitments after.
        </p>

        <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:20, marginTop:22 }}>
          {/* Session start card + queue preview */}
          <div>
            <div style={{
              border:'1px solid rgba(161,98,7,0.30)', borderRadius:14,
              background:'linear-gradient(135deg, rgba(161,98,7,0.06), #fff 60%)',
              padding:'18px 20px', display:'flex', alignItems:'center', gap:16,
              boxShadow:'0 4px 16px -6px rgba(161,98,7,0.20)',
            }}>
              <button style={{
                width:64, height:64, borderRadius:'50%',
                background:'#f59e0b', color:'#0c0c0b', border:'none', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 6px 18px -4px rgba(245,158,11,0.55)',
              }}>
                <IconPlay size={26} />
              </button>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span className="bc-heading" style={{ fontSize:18, fontWeight:600 }}>Start session</span>
                  <span style={{
                    display:'inline-flex', alignItems:'center', gap:4,
                    padding:'2px 8px', borderRadius:999,
                    background:'rgba(12,12,11,0.06)', fontSize:11, fontWeight:600, color:'#0c0c0b',
                  }}>
                    <IconClock size={11} /> ~12 min
                  </span>
                </div>
                <div style={{ fontSize:12.5, color:'#4d4d4a', marginTop:3 }}>
                  3 asks · we'll guide you one at a time · you can stop anytime
                </div>
              </div>
              <button style={{
                background:'transparent', border:'1px solid #dcdcd6',
                borderRadius:10, padding:'8px 12px', fontSize:12, fontWeight:600, cursor:'pointer',
                color:'#0c0c0b',
              }}>Customize…</button>
            </div>

            {/* Numbered queue preview */}
            <div style={{ marginTop:16 }}>
              <div className="bc-kicker bc-kicker--muted" style={{ marginBottom:10 }}>In this session</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {items.map((it, i) => (
                  <div key={it.id} style={{
                    display:'flex', gap:12, alignItems:'center',
                    border:'1px solid #ebebe5', borderRadius:10, background:'#fff', padding:'10px 14px',
                  }}>
                    <div style={{
                      width:26, height:26, borderRadius:'50%',
                      background:'#0c0c0b', color:'#fff',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontFamily:"'Inter Tight', sans-serif", fontWeight:600, fontSize:12,
                      flexShrink:0,
                    }}>{i+1}</div>
                    <HPAvatar name={it.from} color={it.avatarColor} size={30} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:13, fontWeight:600 }}>{it.from}</span>
                        <span className="bc-mono" style={{ fontSize:10, color:'#4d4d4a' }}>'{String(it.cohort).slice(-2)}</span>
                        <Topic>{it.topic}</Topic>
                      </div>
                      <div style={{ fontSize:11.5, color:'#4d4d4a', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {it.ask}
                      </div>
                    </div>
                    <span className="bc-mono" style={{ fontSize:10.5, color:'#4d4d4a' }}>{it.est}</span>
                    <button style={{ background:'none', border:'none', color:'#4d4d4a', cursor:'pointer', display:'flex' }}>
                      <IconX size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <button style={{
                marginTop:10, background:'transparent', border:'1px dashed #c8c8bf', borderRadius:10,
                padding:'8px 12px', fontSize:12, color:'#4d4d4a', cursor:'pointer', width:'100%',
              }}>+ Add one more (we'll suggest)</button>
            </div>
          </div>

          {/* Practice / streak side */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ border:'1px solid #ebebe5', borderRadius:12, background:'#fff', padding:'14px 16px' }}>
              <div className="bc-kicker bc-kicker--muted" style={{ marginBottom:10 }}>This month</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                <span className="bc-heading" style={{ fontSize:30, fontWeight:600, color:'#3b6e51' }}>4</span>
                <span style={{ fontSize:12, color:'#4d4d4a' }}>sessions · 14 asks answered</span>
              </div>
              {/* Mini calendar */}
              <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:5 }}>
                {streak.map((d,i) => (
                  <div key={i} style={{
                    aspectRatio:'1 / 1', borderRadius:4,
                    background: d.done ? 'rgba(59,110,81,0.85)' : '#f0eee9',
                    border: d.done ? '1px solid #3b6e51' : '1px solid #e2e0d9',
                  }} />
                ))}
              </div>
              <div style={{ fontSize:11, color:'#4d4d4a', marginTop:8 }}>Each green square is a session. Don't aim for a streak — just show up sometimes.</div>
            </div>

            <div style={{
              border:'1px solid #ebebe5', borderRadius:12, background:'#fff', padding:'14px 16px',
            }}>
              <div className="bc-kicker bc-kicker--muted" style={{ marginBottom:8 }}>Session length</div>
              <div style={{ display:'flex', gap:6 }}>
                {[10, 15, 30].map(m => (
                  <button key={m} style={{
                    flex:1, padding:'8px 0', borderRadius:8, cursor:'pointer',
                    border: m===15 ? '1px solid #0c0c0b' : '1px solid #dcdcd6',
                    background: m===15 ? '#0c0c0b' : '#fff',
                    color: m===15 ? '#fff' : '#0c0c0b',
                    fontWeight:600, fontSize:12.5,
                  }}>{m} min</button>
                ))}
              </div>
            </div>

            <div style={{
              borderLeft:'3px solid #2563eb', background:'rgba(37,99,235,0.04)',
              borderRadius:'0 10px 10px 0', padding:'12px 14px',
            }}>
              <div style={{ fontSize:13, fontWeight:600 }}>Pause for a while?</div>
              <div style={{ fontSize:12, color:'#4d4d4a', marginTop:2 }}>You can pause new asks without going dark. Mentees stay active.</div>
              <HPBtn variant="outline" size="xs" style={{ marginTop:8 }}>
                <IconPause size={11} /> Pause new asks
              </HPBtn>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

Object.assign(window, { VariantA, VariantB, VariantC, VariantD, VariantE });
