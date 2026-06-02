// Help Page · final composition
// ==============================
// Keeps the existing /help hero exactly (kicker, h1, lede, status badges,
// 2 CTAs, "Helper state" rail) and replaces the priority-queue + likely-fit
// blocks below it with Variant G's pattern:
//   · Featured · AI pick tab (advice or mentorship match, default-active)
//   · Then user-created subjects, each with their own AI-ranked feed.

// ─── Local icons not in help-primitives ──────────────────────────────────
const HPIcon2 = ({ size=16, stroke='currentColor', strokeWidth=1.8, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke}
       strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
       style={{ flexShrink:0 }}>{children}</svg>
);
const IconHandHelping = (p) => (
  <HPIcon2 {...p}>
    <path d="M11 12h2a2 2 0 0 0 0-4h-3.5a3 3 0 0 0-2.12.88L1.5 14.75A1.77 1.77 0 0 0 4 17.25l1.06-1.06A2 2 0 0 1 6.5 15.6h3a2 2 0 0 0 1.42-.58l2.05-2.05"/>
    <path d="M5 12 3 14"/>
    <path d="m22.5 13.25-6.88 6.88a3 3 0 0 1-2.12.88H10a2 2 0 0 1-1.42-.58L8 19.87"/>
    <path d="M16 14.5 14 16"/>
  </HPIcon2>
);
const IconSettings2 = (p) => (
  <HPIcon2 {...p}>
    <path d="M20 7h-9"/><path d="M14 17H5"/>
    <circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>
  </HPIcon2>
);
const IconUserCheck = (p) => (
  <HPIcon2 {...p}>
    <path d="M2 21a8 8 0 0 1 13.292-6"/>
    <circle cx="10" cy="8" r="5"/>
    <path d="m16 19 2 2 4-4"/>
  </HPIcon2>
);

// ─── Helper metric (right rail in hero) ──────────────────────────────────
function HelperMetric({ icon, value, label }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12,
      padding:12, borderRadius:8,
      border:'1px solid #dcdcd6', background:'rgba(244,243,238,0.45)',
    }}>
      <div style={{
        width:32, height:32, borderRadius:8,
        background:'rgba(37,99,235,0.08)', color:'#2563eb',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
      }}>{icon}</div>
      <div>
        <div style={{
          fontFamily:"'Inter Tight', sans-serif", fontSize:20, fontWeight:600,
          lineHeight:1, color:'#0c0c0b',
        }}>{value}</div>
        <div style={{
          marginTop:5, fontSize:10, fontWeight:600, letterSpacing:'0.10em',
          textTransform:'uppercase', color:'#4d4d4a',
        }}>{label}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Help Page (final)
// ═══════════════════════════════════════════════════════════════════════════
function HelpPageFinal() {
  const [active, setActive] = React.useState('featured');
  const isFeatured = active === 'featured';
  const activeSub  = MY_SUBJECTS.find(s => s.id === active);
  const list       = activeSub ? AI_PICKS.filter(p => p.subjectId === active) : [];
  const featuredPick = AI_PICKS[0];
  const altPicks     = AI_PICKS.slice(1, 3);

  return (
    <div style={{
      width:'100%', minHeight:'100%', background:'#fafaf9',
      fontFamily:"'Inter', sans-serif", color:'#0c0c0b', fontSize:14,
    }}>

      {/* ════════════════════════════════════════════════════════════════
         HERO · unchanged from current /help page
         ════════════════════════════════════════════════════════════════ */}
      <section style={{
        borderBottom:'1px solid #dcdcd6',
        background:`
          radial-gradient(ellipse 60% 80% at 28% 40%, rgba(37,99,235,0.07), transparent 62%),
          linear-gradient(180deg, #fff 0%, #fafaf9 100%)
        `,
      }}>
        <div style={{
          maxWidth:1152, margin:'0 auto',
          padding:'32px 32px 36px',
          display:'grid', gridTemplateColumns:'minmax(0,1fr) 340px', gap:24,
        }}>
          {/* Left column */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div className="bc-kicker">Help · Offer help where your experience fits</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, maxWidth:600 }}>
              <h1 style={{
                fontFamily:"'Inter Tight', sans-serif", fontSize:30, fontWeight:600,
                lineHeight:1.2, letterSpacing:'-0.015em', color:'#0c0c0b',
              }}>
                Your experience can shorten someone else's path.
              </h1>
              <p style={{
                fontSize:16, color:'#4d4d4a', lineHeight:1.55,
              }}>
                Help does not have to mean a formal mentorship. Reply to a quick ask, make
                a useful suggestion, or keep your availability clear so the right people find you.
              </p>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <HPBadge tone="open" dot>Available to help</HPBadge>
              <HPBadge tone="info">Quick advice</HPBadge>
              <HPBadge tone="info">Mentorship</HPBadge>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <HPBtn variant="cta" size="lg">
                <IconHandHelping size={16} stroke="#0c0c0b" /> Review requests
              </HPBtn>
              <HPBtn variant="outline" size="lg">
                <IconSettings2 size={15} stroke="#0c0c0b" /> Set availability
              </HPBtn>
            </div>
          </div>

          {/* Right column · Helper state */}
          <div style={{
            alignSelf:'flex-end',
            background:'#fff', border:'1px solid #dcdcd6', borderRadius:12,
            padding:'20px', boxShadow:'0 1px 0 rgba(12,12,11,0.03), 0 4px 12px -6px rgba(12,12,11,0.06)',
          }}>
            <div className="bc-kicker">Helper state</div>
            <div style={{ marginTop:18, display:'flex', flexDirection:'column', gap:12 }}>
              <HelperMetric icon={<IconInbox size={16} stroke="#2563eb" />} value="3" label="Needs reply" />
              <HelperMetric icon={<IconUserCheck size={16} stroke="#2563eb" />} value="6" label="Possible fits" />
              <HelperMetric icon={<IconSettings2 size={16} stroke="#2563eb" />} value="On" label="Availability" />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
         FIND PEOPLE TO HELP · Variant G pattern
         ════════════════════════════════════════════════════════════════ */}
      <section style={{
        maxWidth:1280, margin:'0 auto',
        padding:'32px 32px 48px',
      }}>
        {/* Section header */}
        <div style={{
          display:'flex', alignItems:'flex-end', justifyContent:'space-between',
          gap:24, marginBottom:18,
        }}>
          <div>
            <AISparkleKicker>Find people to help · by subject</AISparkleKicker>
            <h2 style={{
              fontFamily:"'Inter Tight', sans-serif", fontSize:24, fontWeight:600,
              letterSpacing:'-0.015em', marginTop:8,
            }}>
              Your subjects, with people behind them.
            </h2>
            <p style={{ fontSize:14, color:'#4d4d4a', marginTop:4, maxWidth:560 }}>
              AI scans the network for asks that match what you've said you can help with.
              Featured below is today's best pick; switch tabs to browse a subject yourself.
            </p>
          </div>
        </div>

        {/* Search + recent searches */}
        <div style={{
          display:'flex', gap:14, alignItems:'center', marginBottom:6,
        }}>
          <div style={{ flex:1, maxWidth:600 }}>
            <HelpSearch variant="card"
              placeholder="Search people who need help — by name, role, company, or topic…" />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, color:'#4d4d4a', fontSize:12 }}>
            <span>Recent:</span>
            {['APM programs', 'Stripe PM', "Class of '26"].map(t => (
              <span key={t} style={{
                padding:'4px 9px', borderRadius:6,
                background:'#fff', border:'1px solid #ebebe5',
                fontFamily:"'JetBrains Mono', monospace", fontSize:11,
                color:'#0c0c0b', cursor:'pointer', whiteSpace:'nowrap',
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Channel rail · Featured + Your subjects */}
        <div style={{
          marginTop:18, display:'flex', gap:6, borderBottom:'1px solid #ebebe5',
          alignItems:'flex-end', flexWrap:'wrap',
        }}>
          {/* Featured AI tab */}
          <button onClick={() => setActive('featured')} style={{
            position:'relative', background:'transparent', border:'none', cursor:'pointer',
            padding:'12px 16px 14px', display:'flex', alignItems:'center', gap:10,
            color: isFeatured ? '#0c0c0b' : '#4d4d4a',
            fontFamily:"'Inter Tight', sans-serif", fontWeight:600, fontSize:14.5,
          }}>
            <IconSparkle size={14} stroke={isFeatured ? '#a16207' : '#4d4d4a'} />
            Featured
            <span style={{
              fontFamily:"'Inter', sans-serif", fontSize:10.5, fontWeight:700,
              letterSpacing:'0.10em', textTransform:'uppercase',
              color: isFeatured ? '#a16207' : '#4d4d4a',
            }}>AI pick</span>
            {isFeatured && (
              <span style={{
                position:'absolute', left:0, right:0, bottom:-1,
                height:2, background:'#a16207',
              }} />
            )}
          </button>

          {/* Divider + section label */}
          <span style={{
            alignSelf:'center', width:1, height:18, background:'#dcdcd6', margin:'0 6px',
          }} />
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
                fontFamily:"'Inter Tight', sans-serif", fontWeight:600, fontSize:14,
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
            padding:'12px 0', color:'#4d4d4a', fontSize:12.5,
            display:'inline-flex', gap:5, alignItems:'center',
          }}>+ Add subject</button>
        </div>

        {/* ─── Tab content ─── */}
        <div style={{ paddingTop:22 }}>
          {isFeatured ? (
            /* FEATURED · AI pick panel */
            <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 320px', gap:24 }}>
              <div>
                <div style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  marginBottom:14,
                }}>
                  <div style={{ fontSize:14, color:'#4d4d4a' }}>
                    <strong style={{ color:'#0c0c0b' }}>One person</strong> AI thinks you'd be the right help for right now
                  </div>
                  <button style={{
                    background:'transparent', border:'none', color:'#4d4d4a', fontSize:13,
                    cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5,
                  }}>
                    <IconRefresh size={12} /> Show me someone else
                  </button>
                </div>

                {/* Hero AI card */}
                <div style={{
                  background:'#fff',
                  border:'1px solid rgba(161,98,7,0.30)', borderRadius:14,
                  padding:'26px 28px', position:'relative', overflow:'hidden',
                  boxShadow:'0 12px 34px -12px rgba(12,12,11,0.10), 0 1px 0 rgba(12,12,11,0.03)',
                  backgroundImage:'linear-gradient(180deg, rgba(161,98,7,0.04), #fff 60%)',
                }}>
                  {/* AI pick ribbon */}
                  <div style={{
                    position:'absolute', top:18, right:18,
                    display:'inline-flex', alignItems:'center', gap:5,
                    padding:'5px 11px', borderRadius:999,
                    background:'rgba(161,98,7,0.12)', color:'#9a5a13',
                    border:'1px solid rgba(161,98,7,0.28)',
                    fontSize:10.5, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
                  }}>
                    <IconSparkle size={11} stroke="#a16207" />
                    AI pick · {featuredPick.fit}% fit
                  </div>

                  <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                    <HPAvatar name={featuredPick.name} color={featuredPick.color} size={64} />
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                        <span style={{
                          fontFamily:"'Inter Tight', sans-serif", fontSize:22, fontWeight:600,
                          letterSpacing:'-0.005em',
                        }}>{featuredPick.name}</span>
                        <span className="bc-mono" style={{ fontSize:12, color:'#4d4d4a' }}>
                          {featuredPick.cohort}
                        </span>
                        <span style={{
                          display:'inline-flex', alignItems:'center', gap:5,
                          padding:'3px 9px', borderRadius:4, fontSize:11, fontWeight:600,
                          background: featuredPick.mode === 'mentor' ? 'rgba(114,47,55,0.10)' : 'rgba(37,99,235,0.10)',
                          color: featuredPick.mode === 'mentor' ? '#722f37' : '#2563eb',
                          border: `1px solid ${featuredPick.mode === 'mentor' ? 'rgba(114,47,55,0.22)' : 'rgba(37,99,235,0.22)'}`,
                        }}>
                          Asked for {featuredPick.mode === 'mentor' ? 'mentorship' : 'advice'}
                        </span>
                      </div>
                      <div style={{ fontSize:13.5, color:'#4d4d4a', marginTop:4 }}>
                        {featuredPick.role} · {featuredPick.city} · {featuredPick.posted}
                      </div>
                    </div>
                  </div>

                  <p style={{
                    fontFamily:"'Inter Tight', sans-serif", fontSize:19,
                    lineHeight:1.45, color:'#0c0c0b', marginTop:20,
                    letterSpacing:'-0.005em',
                  }}>
                    "{featuredPick.need}"
                  </p>

                  {/* Why AI picked them */}
                  <div style={{
                    marginTop:18, padding:'14px 16px', borderRadius:10,
                    background:'#fafaf9', border:'1px solid #ebebe5',
                  }}>
                    <div style={{
                      fontSize:10.5, fontWeight:700, letterSpacing:'0.10em',
                      color:'#4d4d4a', textTransform:'uppercase', marginBottom:10,
                      display:'flex', alignItems:'center', gap:6,
                    }}>
                      <IconSparkle size={10} stroke="#a16207" />
                      Why this is {featuredPick.mode === 'mentor' ? 'a mentorship' : 'an advice'} match for you
                    </div>
                    <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:6 }}>
                      {featuredPick.why.map((w, i) => (
                        <li key={i} style={{
                          display:'flex', gap:10, fontSize:13.5, color:'#0c0c0b', lineHeight:1.5,
                        }}>
                          <IconCheck size={13} stroke="#3b6e51" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display:'flex', gap:10, marginTop:20, alignItems:'center' }}>
                    <HPBtn variant="cta" size="md">
                      <IconHand size={14} />
                      {featuredPick.mode === 'mentor' ? 'Offer mentorship' : 'Offer advice'}
                    </HPBtn>
                    <HPBtn variant="outline" size="md">Open profile</HPBtn>
                    <HPBtn variant="ghost" size="sm" style={{ color:'#4d4d4a', marginLeft:'auto' }}>
                      Not now
                    </HPBtn>
                  </div>
                </div>

                {/* Alternates */}
                <div style={{ marginTop:24 }}>
                  <div style={{
                    fontSize:10.5, fontWeight:700, letterSpacing:'0.10em',
                    color:'#4d4d4a', textTransform:'uppercase', marginBottom:10,
                  }}>
                    Or, instead of {featuredPick.name.split(' ')[0]}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {altPicks.map(p => (
                      <div key={p.id} style={{
                        display:'flex', gap:12, alignItems:'flex-start',
                        padding:'14px 16px', border:'1px solid #ebebe5',
                        borderRadius:12, background:'#fff',
                      }}>
                        <HPAvatar name={p.name} color={p.color} size={40} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <span style={{ fontWeight:600, fontSize:13.5 }}>{p.name}</span>
                            <span className="bc-mono" style={{ fontSize:10.5, color:'#4d4d4a' }}>{p.cohort}</span>
                            <span className="bc-mono" style={{
                              fontSize:10.5, color: p.color, marginLeft:'auto', fontWeight:600,
                            }}>{p.fit}%</span>
                          </div>
                          <div style={{
                            fontSize:12.5, color:'#4d4d4a', marginTop:5, lineHeight:1.5,
                            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
                          }}>"{p.need}"</div>
                          <div style={{ marginTop:8, fontSize:11.5, color:'#4d4d4a' }}>
                            {p.subject} · asked for {p.mode === 'mentor' ? 'mentorship' : 'advice'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Side rail */}
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{
                  background:'#fff', border:'1px solid #ebebe5', borderRadius:12,
                  padding:'16px 18px',
                }}>
                  <div style={{
                    fontSize:10.5, fontWeight:700, letterSpacing:'0.10em',
                    color:'#4d4d4a', textTransform:'uppercase', marginBottom:12,
                  }}>How AI ranks for you</div>
                  <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:9, fontSize:13, color:'#0c0c0b' }}>
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
                  <div style={{
                    marginTop:14, paddingTop:12, borderTop:'1px solid #ebebe5',
                    fontSize:12, color:'#2563eb', cursor:'pointer', fontWeight:600,
                  }}>
                    Tune what AI sends you →
                  </div>
                </div>

                <div style={{
                  background:'#fff', border:'1px solid #ebebe5', borderRadius:12,
                  padding:'16px 18px',
                }}>
                  <div style={{
                    fontSize:10.5, fontWeight:700, letterSpacing:'0.10em',
                    color:'#4d4d4a', textTransform:'uppercase', marginBottom:10,
                  }}>Today's queue</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                    <span style={{
                      fontFamily:"'Inter Tight', sans-serif", fontSize:30, fontWeight:600,
                    }}>6</span>
                    <span style={{ fontSize:12.5, color:'#4d4d4a' }}>matched · across {MY_SUBJECTS.length} subjects</span>
                  </div>
                  <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:6 }}>
                    {MY_SUBJECTS.map(s => {
                      const n = AI_PICKS.filter(p => p.subjectId === s.id).length;
                      return (
                        <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10, fontSize:12.5 }}>
                          <span style={{ width:7, height:7, borderRadius:'50%', background:s.color }} />
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
            /* USER-SUBJECT FEED */
            <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 320px', gap:24 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{
                  display:'flex', alignItems:'baseline', justifyContent:'space-between',
                  marginBottom:2,
                }}>
                  <div style={{ fontSize:14, color:'#4d4d4a' }}>
                    <strong style={{ color:'#0c0c0b' }}>{list.length} people</strong> asked about{' '}
                    <em style={{ color:activeSub.color, fontStyle:'normal', fontWeight:600 }}>
                      {activeSub.label}
                    </em> recently
                  </div>
                  <span style={{ fontSize:12, color:'#4d4d4a' }}>Sorted by AI fit</span>
                </div>
                {list.map(p => (
                  <div key={p.id} style={{
                    display:'flex', gap:16, alignItems:'flex-start',
                    background:'#fff', border:'1px solid #ebebe5', borderRadius:12,
                    padding:'16px 18px',
                  }}>
                    <HPAvatar name={p.name} color={p.color} size={46} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <span style={{ fontWeight:600, fontSize:14 }}>{p.name}</span>
                        <span className="bc-mono" style={{ fontSize:11, color:'#4d4d4a' }}>{p.cohort}</span>
                        <span style={{ fontSize:12, color:'#4d4d4a' }}>{p.role}</span>
                        <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono', monospace",
                          fontSize:11, color:'#4d4d4a' }}>{p.posted}</span>
                      </div>
                      <p style={{ fontSize:13.5, color:'#0c0c0b', marginTop:8, lineHeight:1.5 }}>
                        "{p.need}"
                      </p>
                      <div style={{
                        marginTop:10, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap',
                      }}>
                        <span style={{
                          display:'inline-flex', alignItems:'center', gap:5,
                          fontSize:11.5, color:'#2563eb', fontStyle:'italic',
                        }}>
                          <IconSparkle size={11} stroke="#2563eb" />
                          {p.why[0]}
                        </span>
                        <span style={{ fontSize:11.5, color:'#4d4d4a' }}>· {p.fit}% fit · {p.estReply}</span>
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
                  padding:'16px 18px',
                }}>
                  <div style={{
                    fontSize:10.5, fontWeight:700, letterSpacing:'0.10em',
                    color:'#4d4d4a', textTransform:'uppercase', marginBottom:10,
                  }}>
                    Your record · {activeSub.label}
                  </div>
                  <div style={{
                    fontFamily:"'Inter Tight', sans-serif", fontSize:32, fontWeight:600,
                    color: activeSub.color,
                  }}>{activeSub.helped}</div>
                  <div style={{ fontSize:12.5, color:'#4d4d4a' }}>people helped this year</div>
                  <div style={{
                    marginTop:16, display:'grid',
                    gridTemplateColumns:'repeat(12, 1fr)', gap:3, alignItems:'end',
                    height:40,
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
                    fontSize:10.5, color:'#4d4d4a', display:'flex', justifyContent:'space-between',
                  }}>
                    <span>Jun</span><span>May</span>
                  </div>
                </div>

                <div style={{
                  background:'#fff', border:'1px solid #ebebe5', borderRadius:12,
                  padding:'16px 18px',
                }}>
                  <div style={{
                    fontSize:10.5, fontWeight:700, letterSpacing:'0.10em',
                    color:'#4d4d4a', textTransform:'uppercase', marginBottom:10,
                  }}>Tune this channel</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:9, fontSize:13 }}>
                    <label style={{ display:'flex', justifyContent:'space-between', cursor:'pointer' }}>
                      <span>Email me new matches</span>
                      <span style={{
                        width:30, height:17, background:'#3b6e51', borderRadius:999,
                        position:'relative',
                      }}>
                        <span style={{
                          position:'absolute', top:2, right:2,
                          width:13, height:13, background:'#fff', borderRadius:'50%',
                        }} />
                      </span>
                    </label>
                    <label style={{ display:'flex', justifyContent:'space-between', cursor:'pointer' }}>
                      <span>Show low-fit (&lt;70%)</span>
                      <span style={{
                        width:30, height:17, background:'#dcdcd6', borderRadius:999,
                        position:'relative',
                      }}>
                        <span style={{
                          position:'absolute', top:2, left:2,
                          width:13, height:13, background:'#fff', borderRadius:'50%',
                        }} />
                      </span>
                    </label>
                  </div>
                  <button style={{
                    marginTop:14, width:'100%', background:'transparent',
                    border:'1px solid #dcdcd6', borderRadius:8, padding:'8px 10px',
                    fontSize:12.5, fontWeight:600, cursor:'pointer', color:'#0c0c0b',
                  }}>Pause this subject</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { HelpPageFinal });
