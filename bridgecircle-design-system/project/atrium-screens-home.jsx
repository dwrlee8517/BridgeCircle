/* eslint-disable */
// Atrium — Home + People screens.
// Home uses the Civic information layout (greeting strip → KPI bar →
// pick-a-path → three action buckets) rendered in full Atrium theme:
// rounded cards, soft shadows, pill buttons, warm oat palette.

// ---------------------------------------------------------------------------
// Announcements — auto-rotating banner, pauses on hover
// ---------------------------------------------------------------------------
function AtriumAnnouncements() {
  const t = React.useContext(ThemeCtx);
  const { ANNOUNCEMENTS } = window.BC_DATA;
  const { goto } = useAtriumRoute();
  const m = t.isMobile;
  const count = ANNOUNCEMENTS.length;

  const [idx, setIdx] = React.useState(0);
  const [visible, setVisible] = React.useState(true);
  const [paused, setPaused] = React.useState(false);

  const goTo = React.useCallback((newIdx) => {
    setVisible(false);
    setTimeout(() => { setIdx(newIdx); setVisible(true); }, 200);
  }, []);

  React.useEffect(() => {
    if (paused || count <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx(i => (i + 1) % count); setVisible(true); }, 200);
    }, 4500);
    return () => clearInterval(timer);
  }, [paused, count]);

  const ann = ANNOUNCEMENTS[idx];
  const toneColor =
    ann.tone === 'ok'  ? t.palette.ok   :
    ann.tone === 'ink' ? t.palette.ink2 :
    t.palette.accent;

  // Full-width strip — no card chrome, bridges hero → content
  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        background: hex(toneColor, 0.07),
        borderTop:    `1px solid ${hex(toneColor, 0.15)}`,
        borderBottom: `1px solid ${hex(toneColor, 0.15)}`,
        transition: 'background 350ms ease, border-color 350ms ease',
      }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: m ? '16px 16px' : '18px 32px',
        display: 'flex', alignItems: m ? 'flex-start' : 'center',
        gap: m ? 10 : 16,
        flexDirection: m ? 'column' : 'row',
      }}>

        {/* Left: dot + text block */}
        <div style={{
          flex: 1, minWidth: 0,
          display: 'flex', alignItems: 'flex-start', gap: 12,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(3px)',
          transition: 'opacity 190ms ease, transform 190ms ease',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: 999, flexShrink: 0,
            background: toneColor, marginTop: 5,
            transition: 'background 350ms ease',
          }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: t.font.mono, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: toneColor, flexShrink: 0, transition: 'color 350ms ease',
              }}>{ann.label}</span>
              <span style={{
                fontFamily: t.font.display, fontSize: m ? 15 : 16,
                fontWeight: 600, color: t.palette.ink, letterSpacing: '-0.01em',
              }}>{ann.title}</span>
            </div>
            <div style={{
              fontFamily: t.font.body, fontSize: 13, color: t.palette.muted,
              lineHeight: 1.5, marginTop: 4,
            }}>{ann.body}</div>
          </div>
        </div>

        {/* Right: CTA + dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, paddingLeft: m ? 20 : 0 }}>
          {ann.cta && (
            <button onClick={() => ann.ctaRoute && goto(ann.ctaRoute)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontFamily: t.font.body, fontSize: 13, fontWeight: 600,
              color: toneColor, whiteSpace: 'nowrap', transition: 'color 350ms ease',
            }}>{ann.cta} →</button>
          )}
          {count > 1 && (
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              {ANNOUNCEMENTS.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} aria-label={`Announcement ${i + 1}`} style={{
                  width: i === idx ? 20 : 7, height: 7, borderRadius: 999,
                  background: i === idx ? toneColor : hex(toneColor, 0.28),
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'width 300ms ease, background 300ms ease',
                }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Greeting strip — Civic structure, Atrium warmth
// ---------------------------------------------------------------------------
function AtriumGreetingStrip({ headline, sub }) {
  const t = React.useContext(ThemeCtx);
  const m = t.isMobile;
  const { VIEWER } = window.BC_DATA;
  return (
    <div style={{
      maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      padding: m ? '20px 14px 16px' : '24px 32px 20px',
    }}>
      <div style={{
        ...t.cardSurface({ overflow: 'hidden', position: 'relative' }),
        padding: m ? '20px 22px' : '28px 36px',
      }}>
        {/* Atrium decorative circle motif */}
        <svg aria-hidden="true" width="340" height="200" viewBox="0 0 340 200"
             style={{ position: 'absolute', right: m ? -80 : -20, top: -40, opacity: 0.22, pointerEvents: 'none' }}>
          <circle cx="130" cy="110" r="80" fill="none" stroke={t.palette.accent} strokeWidth="1.4" />
          <circle cx="210" cy="110" r="80" fill="none" stroke={t.palette.ok}     strokeWidth="1.4" />
        </svg>

        <div style={{ position: 'relative', display: 'flex', flexDirection: m ? 'column' : 'row', alignItems: m ? 'flex-start' : 'flex-end', justifyContent: 'space-between', gap: m ? 12 : 16 }}>
          <div style={{ minWidth: 0 }}>
            <AtriumEyebrow>
              {m
                ? `${VIEWER.firstName} · '${VIEWER.cohortShort}`
                : `Good afternoon, ${VIEWER.firstName} · Class of ${VIEWER.cohortShort} · The Hartwood Society`}
            </AtriumEyebrow>
            <h1 style={{
              ...t.display, fontSize: m ? 26 : 40, margin: m ? '8px 0 0' : '10px 0 0',
              maxWidth: 900, lineHeight: 1.08, fontWeight: 600,
            }}>{headline}</h1>
            {sub ? (
              <div style={{ fontSize: m ? 13 : 14, color: t.palette.muted, marginTop: 8, maxWidth: 680, lineHeight: 1.55 }}>{sub}</div>
            ) : null}
          </div>
          <div style={{
            fontFamily: t.font.mono, fontSize: m ? 9.5 : 10.5, letterSpacing: '0.14em',
            color: t.palette.mute2, whiteSpace: 'nowrap', flexShrink: 0,
            textAlign: m ? 'left' : 'right', textTransform: 'uppercase',
          }}>
            THU 15 MAY 2026{!m && <br />}{m ? ' · ' : ''}
            <span style={{ color: t.palette.accent }}>●</span> Edition 142
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI strip — 4 stats in a soft card
// ---------------------------------------------------------------------------
function AtriumKPIStrip({ items, pending }) {
  const t = React.useContext(ThemeCtx);
  const m = t.isMobile;
  const { goto } = useAtriumRoute();
  return (
    <div style={{
      maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      padding: m ? '0 14px 16px' : '0 32px 20px',
    }}>
      <div style={{ ...t.cardSurface({ overflow: 'hidden' }), padding: 0 }}>
        {/* Urgent inverse block */}
        <div style={{
          background: t.palette.ink, padding: m ? '14px 18px' : '16px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontFamily: t.font.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: '.10em', color: 'rgba(240,229,208,.50)', textTransform: 'uppercase', marginBottom: 4 }}>Your desk right now</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: t.font.display, fontSize: m ? 36 : 44, fontWeight: 700, color: t.palette.accent, letterSpacing: '-.03em', lineHeight: 1 }}>{pending}</span>
              <span style={{ fontFamily: t.font.body, fontSize: m ? 13 : 15, color: 'rgba(240,229,208,.80)', fontWeight: 400 }}>people waiting on your reply</span>
            </div>
          </div>
          <AtriumButton onClick={() => goto('inbox')} style={{ background: t.palette.accent, color: '#fff', border: 'none', whiteSpace: 'nowrap' }}>Open inbox →</AtriumButton>
        </div>
        {/* Secondary narrative stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: m ? '1fr 1fr' : 'repeat(3, 1fr)',
          padding: m ? '14px 18px' : '14px 28px', gap: 0,
        }}>
          {items.map((it, i) => (
            <div key={i} style={{
              paddingLeft: (i === 0 || (m && i === 2)) ? 0 : (m ? 14 : 22),
              paddingRight: 0,
              borderRight: m
                ? (i === 0 || i === 2 ? `1px solid ${t.palette.ruleSoft}` : 'none')
                : (i === items.length - 1 ? 'none' : `1px solid ${t.palette.ruleSoft}`),
            }}>
              <span style={{ ...t.display, fontSize: m ? 26 : 30, fontWeight: 700, color: it.color || t.palette.ink, letterSpacing: '-.025em', lineHeight: 1, display: 'block' }}>{it.value}</span>
              <div style={{ fontFamily: t.font.body, fontSize: 12.5, color: t.palette.ink2, marginTop: 5, lineHeight: 1.4, fontWeight: 500 }}>{it.label}</div>
              {it.note ? <div style={{ fontFamily: t.font.body, fontSize: 11.5, color: t.palette.muted, marginTop: 2, lineHeight: 1.4 }}>{it.note}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bucket section wrapper — Civic structure, Atrium tags + buttons
// ---------------------------------------------------------------------------
function AtriumBucketSection({ title, count, toneColor, toneName, subtitle, primary, children }) {
  const t = React.useContext(ThemeCtx);
  const m = t.isMobile;
  const tc = toneColor || t.palette.accent;
  return (
    <section>
      <div style={{
        display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr auto', gap: m ? 12 : 16,
        alignItems: m ? 'flex-start' : 'flex-end',
        borderTop: `2px solid ${t.palette.ink}`, paddingTop: 14, marginBottom: 16,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{
              ...t.display, fontSize: m ? 22 : 26, fontWeight: 600,
              margin: 0, letterSpacing: '-0.025em', color: t.palette.ink,
            }}>{title}</h2>
            {/* Rounded Atrium-style count pill */}
            <span style={{
              fontFamily: t.font.body, fontSize: 12, fontWeight: 600,
              color: tc, background: hex(tc, 0.12),
              padding: '4px 12px', borderRadius: 999,
              display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor', flexShrink: 0 }} />
              {count}
            </span>
          </div>
          {subtitle ? (
            <div style={{ fontSize: 13.5, color: t.palette.muted, marginTop: 6, maxWidth: 720, lineHeight: 1.55 }}>{subtitle}</div>
          ) : null}
        </div>
        {primary ? <div style={{ alignSelf: m ? 'stretch' : 'auto' }}>{primary}</div> : null}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Bucket 01 — desk card
// ---------------------------------------------------------------------------
function AtriumDeskCard({ req }) {
  const t = React.useContext(ThemeCtx);
  const { goto } = useAtriumRoute();
  const days = parseInt(req.sentAt) || 0;
  const warn = days >= 4;
  return (
    <div style={t.cardSurface({
      padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
    })}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <AtriumAvatar name={req.from.name} initials={req.from.initials} size={32} />
        <AtriumTag tone={warn ? 'warn' : 'muted'} dot>{req.sentAt}</AtriumTag>
      </div>
      <div>
        <div style={{ ...t.display, fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>
          {req.from.name}
        </div>
        <div style={{ ...t.eyebrow, color: t.palette.muted, marginTop: 3 }}>
          '{String(req.from.year).slice(-2)} · {req.from.title}
        </div>
      </div>
      <p style={{
        fontSize: 13, color: t.palette.ink2, margin: 0, lineHeight: 1.5,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>"{req.body}"</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
        <AtriumButton size="sm" onClick={() => goto('inbox')} style={{ flex: 1, justifyContent: 'center' }}>Reply</AtriumButton>
        <AtriumButton size="sm" variant="ghost">Skip</AtriumButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bucket 02 — hero event card
// ---------------------------------------------------------------------------
function AtriumEventHero({ event }) {
  const t = React.useContext(ThemeCtx);
  const { goto, setActiveEvent } = useAtriumRoute();
  const pct = Math.round(event.going / event.capacity * 100);
  return (
    <div style={t.cardSurface({ overflow: 'hidden', display: 'flex', flexDirection: 'column' })}>
      {/* Dark gradient header — signature Atrium event style */}
      <div style={{
        background: `linear-gradient(135deg, ${t.palette.ink} 0%, ${t.palette.accent} 160%)`,
        padding: '14px 18px', position: 'relative', overflow: 'hidden',
      }}>
        <span style={{
          ...t.display, fontSize: 72, lineHeight: 1,
          color: 'rgba(255,255,255,0.09)',
          position: 'absolute', right: 10, bottom: -10,
          pointerEvents: 'none', letterSpacing: '-0.04em',
        }}>{event.days}D</span>
        <AtriumEyebrow color="rgba(255,255,255,0.65)">Spring Supper · You're hosting</AtriumEyebrow>
        <div style={{ ...t.display, fontSize: 20, fontWeight: 600, margin: '6px 0 0', color: '#fff', lineHeight: 1.15, position: 'relative' }}>
          {event.when}
        </div>
        <div style={{
          ...t.display, fontSize: 28, fontWeight: 600,
          color: t.palette.accent, letterSpacing: '-0.03em', lineHeight: 1,
          position: 'absolute', top: 14, right: 18,
          filter: 'brightness(1.6)',
        }}>T−{event.days}d</div>
      </div>
      <div style={{ padding: '14px 18px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
            <span style={{ fontWeight: 600, color: t.palette.ink2 }}>{event.going} going</span>
            <span style={{ color: t.palette.muted }}>{pct}% full</span>
          </div>
          <div style={{ background: t.palette.rule, borderRadius: 999, height: 6, overflow: 'hidden' }}>
            <div style={{ background: t.palette.accent, height: '100%', width: `${pct}%`, borderRadius: 999 }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 12.5, color: t.palette.ink2, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ color: t.palette.muted }}>Open question</span>
            <span style={{ fontWeight: 500 }}>Confirm Iris's plus-one</span>
          </div>
          <div style={{ fontSize: 12.5, color: t.palette.ink2, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ color: t.palette.muted }}>Co-host</span>
            <span style={{ fontWeight: 500 }}>Sam Aldridge · '11</span>
          </div>
        </div>
        <AtriumButton size="md" style={{ marginTop: 'auto', justifyContent: 'center', width: '100%' }}
          onClick={() => { setActiveEvent && setActiveEvent(event.id); goto('event-detail'); }}>
          Open event
        </AtriumButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bucket 02 — mini event card
// ---------------------------------------------------------------------------
function AtriumEventMiniCard({ event }) {
  const t = React.useContext(ThemeCtx);
  const { goto, setActiveEvent } = useAtriumRoute();
  return (
    <div style={t.cardSurface({ padding: 16, display: 'flex', flexDirection: 'column' })}>
      <AtriumTag tone="muted">T−{event.days}d · Upcoming</AtriumTag>
      <div style={{ ...t.display, fontSize: 16, fontWeight: 600, margin: '10px 0 4px', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
        {event.title}
      </div>
      <div style={{ fontSize: 12.5, color: t.palette.muted, marginBottom: 4 }}>{event.when}</div>
      <div style={{ fontSize: 12, color: t.palette.muted }}>Host · {event.host}</div>
      <div style={{ marginTop: 'auto', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: t.palette.muted }}>{event.going}/{event.capacity} going</span>
        <AtriumButton size="sm" variant="outline"
          onClick={() => { setActiveEvent && setActiveEvent(event.id); goto('event-detail'); }}>
          RSVP
        </AtriumButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bucket 03 — joiner card
// ---------------------------------------------------------------------------
function AtriumJoinerCard({ member }) {
  const t = React.useContext(ThemeCtx);
  const { goto, setActiveProfile } = useAtriumRoute();
  return (
    <button onClick={() => { setActiveProfile(member.id); goto('profile'); }} style={{
      ...t.cardSurface({ cursor: 'pointer', textAlign: 'left', transition: 'transform 120ms ease, box-shadow 120ms ease' }),
      padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,.6) inset, 0 8px 20px rgba(42,34,26,0.10)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)'; }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <AtriumAvatar name={member.name} initials={member.initials} size={32} />
        <AtriumTag tone="ok" dot>joined {member.joined || 'recently'}</AtriumTag>
      </div>
      <div>
        <div style={{ ...t.display, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          {member.name}
        </div>
        <div style={{ ...t.eyebrow, color: t.palette.muted, marginTop: 3 }}>
          '{String(member.year).slice(-2)} · {member.city.split(',')[0]}
        </div>
      </div>
      <div style={{ fontSize: 12, color: t.palette.ink2, lineHeight: 1.4 }}>
        {member.title} · <span style={{ color: t.palette.muted }}>{member.employer}</span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Bucket 03 — activity wire feed
// ---------------------------------------------------------------------------
function AtriumWireFeed({ items }) {
  const t = React.useContext(ThemeCtx);
  // Group Spring Supper RSVPs into a cluster; leave rest as flat items
  const eventItems = items.filter(a => a.type === 'event' || (a.what && a.what.includes('Spring Supper')));
  const flatItems  = items.filter(a => !eventItems.includes(a)).slice(0, 4);
  return (
    <div style={t.cardSurface({ padding: 16 })}>
      <AtriumEyebrow>Recent activity · 7 days</AtriumEyebrow>
      {/* Event cluster */}
      {eventItems.length > 0 && (
        <div style={{ margin: '14px -2px 0', background: hex(t.palette.accent, 0.06), border: `1px solid ${hex(t.palette.accent, 0.18)}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '9px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${hex(t.palette.accent, 0.12)}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex' }}>
                {eventItems.slice(0, 3).map((a, idx) => (
                  <div key={idx} style={{ marginLeft: idx > 0 ? -6 : 0 }}>
                    <AtriumAvatar name={a.who} initials={a.who.split(' ').map(x => x[0]).join('').slice(0,2)} size={20} />
                  </div>
                ))}
              </div>
              <span style={{ fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600, color: t.palette.ink }}>Around Spring Supper</span>
            </div>
            <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.muted, letterSpacing: '.06em' }}>{eventItems[0]?.when}</span>
          </div>
          <div style={{ padding: '8px 14px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {eventItems.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <AtriumAvatar name={a.who} initials={a.who.split(' ').map(x => x[0]).join('').slice(0,2)} size={18} />
                <span style={{ color: t.palette.ink2 }}><strong style={{ fontWeight: 600 }}>{a.who.split(' ')[0]}</strong>{' '}<span style={{ color: t.palette.muted }}>{a.what}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Flat items */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: eventItems.length > 0 ? 4 : 14 }}>
        {flatItems.map((a, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10,
            padding: '9px 0', borderTop: `1px solid ${t.palette.ruleSoft}`, alignItems: 'center',
          }}>
            <AtriumAvatar name={a.who} initials={a.who.split(' ').map(x => x[0]).join('').slice(0, 2)} size={26} />
            <span style={{ fontSize: 12.5, color: t.palette.ink, minWidth: 0 }}>
              <strong style={{ fontWeight: 600 }}>{a.who.split(' ')[0]}</strong>{' '}
              <span style={{ color: t.palette.muted }}>{a.what}</span>
            </span>
            <span style={{ fontSize: 11.5, color: t.palette.mute2, whiteSpace: 'nowrap' }}>{a.when}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pick-a-path — soft card grid (Civic layout, Atrium cards)
// ---------------------------------------------------------------------------
function AtriumPathCard({ path: p }) {
  const t = React.useContext(ThemeCtx);
  return (
    <button onClick={p.onClick} style={{
      ...t.cardSurface({
        display: 'flex', flexDirection: 'column', gap: 12,
        minHeight: 200, cursor: 'pointer', textAlign: 'left',
        transition: 'transform 120ms ease, box-shadow 120ms ease',
        padding: '20px 20px 18px',
      }),
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,.6) inset, 0 8px 24px rgba(42,34,26,0.10)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)'; }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <AtriumEyebrow>§ {p.idx}</AtriumEyebrow>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            ...t.display, fontSize: 26, fontWeight: 600,
            color: p.tone, letterSpacing: '-0.02em', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>{p.count}</div>
          <div style={{ ...t.eyebrow, color: t.palette.mute2, marginTop: 2 }}>{p.countLabel}</div>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ ...t.display, fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', color: t.palette.ink, lineHeight: 1.15 }}>
          {p.verb} →
        </div>
        <div style={{ fontSize: 13, color: t.palette.muted, marginTop: 6, lineHeight: 1.55, textWrap: 'pretty' }}>{p.sub}</div>
      </div>
      <div style={{
        paddingTop: 10, borderTop: `1px solid ${t.palette.ruleSoft}`,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {p.accent && <span style={{ width: 6, height: 6, borderRadius: 999, background: p.tone, display: 'inline-block', flexShrink: 0 }} />}
        <span style={{
          fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.12em',
          color: p.accent ? p.tone : t.palette.mute2, textTransform: 'uppercase',
        }}>{p.foot}</span>
      </div>
    </button>
  );
}

function AtriumPickAPath() {
  const t = React.useContext(ThemeCtx);
  const m = t.isMobile;
  const { goto } = useAtriumRoute();
  const { STATS, EVENTS, PENDING_REQUESTS } = window.BC_DATA;
  const featured = EVENTS[0];

  const paths = [
    {
      idx: '01', verb: 'Find a mentor',
      sub: `Filter the directory by craft, cohort, city, or what you're working through. Send an intro when you find a fit.`,
      count: STATS.openMentors, countLabel: 'open to mentor',
      foot: 'Avg. reply within 4 days · 78% accept rate',
      tone: t.palette.ink, primary: true, onClick: () => goto('people'),
    },
    {
      idx: '02', verb: 'Browse the network',
      sub: `Everyone in the Hartwood circle — by cohort, by city, by what they're building. No agenda.`,
      count: '1,284', countLabel: 'members',
      foot: `53 cities · 17 cohorts · class of '03–'24`,
      tone: t.palette.ink, onClick: () => goto('people'),
    },
    {
      idx: '03', verb: 'Look at upcoming gatherings',
      sub: 'Suppers, walks, office hours, and working sessions. RSVP when one catches your eye.',
      count: EVENTS.length, countLabel: 'on the calendar',
      foot: `Next: ${featured.title} · in ${featured.days} days`,
      tone: t.palette.ink, onClick: () => goto('events'),
    },
    {
      idx: '04', verb: 'Reply to waiting threads',
      sub: `People who reached out and haven't heard back. Nothing here is on fire — reply when you have bandwidth.`,
      count: PENDING_REQUESTS.length, countLabel: 'waiting on you',
      foot: `Oldest: ${PENDING_REQUESTS[0]?.from.name} · ${PENDING_REQUESTS[0]?.sentAt}`,
      tone: t.palette.accent, accent: true, onClick: () => goto('inbox'),
    },
    {
      idx: '05', verb: "See who's new",
      sub: `${STATS.newThisWeek} people joined recently — worth a hello or a quick browse.`,
      count: STATS.newThisWeek, countLabel: 'recently joined',
      foot: 'Last 14 days · across all cohorts',
      tone: t.palette.ok, onClick: () => goto('people'),
    },
    {
      idx: '06', verb: 'Update your profile',
      sub: `Mentor preferences, what you're working on, whether you're open to intros. The directory uses this to match you.`,
      count: '64%', countLabel: 'complete',
      foot: 'Missing: current focus, mentor capacity',
      tone: t.palette.muted, onClick: () => goto('profile'),
    },
  ];

  return (
    <section>
      <div style={{
        display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr auto',
        alignItems: 'flex-end', borderTop: `2px solid ${t.palette.ink}`,
        paddingTop: 12, marginBottom: 0, gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ ...t.display, fontSize: m ? 20 : 24, fontWeight: 600, margin: 0, letterSpacing: '-0.025em' }}>
            Where would you like to go?
          </h2>
          <span style={{
            fontFamily: t.font.body, fontSize: 12, fontWeight: 600,
            color: t.palette.muted, background: hex(t.palette.muted, 0.10),
            padding: '4px 12px', borderRadius: 999,
          }}>{paths.length} ways in</span>
        </div>
        {!m && (
          <AtriumButton variant="outline" size="sm">⌘K · Search anything</AtriumButton>
        )}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: m ? '1fr' : 'repeat(3, 1fr)',
        gap: 12, marginTop: 14,
      }}>
        {paths.map((p) => <AtriumPathCard key={p.idx} path={p} />)}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// HomeScreen
// ---------------------------------------------------------------------------
function AtriumHome() {
  const t = React.useContext(ThemeCtx);
  const m = t.isMobile;
  const { goto } = useAtriumRoute();
  const { STATS, EVENTS, MEMBERS, PENDING_REQUESTS, ACTIVITY } = window.BC_DATA;
  const featured    = EVENTS[0];
  const otherEvents = EVENTS.slice(1, 3);
  const newJoiners  = MEMBERS.slice(0, 3);

  const kpiItems = [
    { value: '1,284', label: 'members in your circle',    note: '94 in your Hartwood cohort', color: t.palette.ink  },
    { value: `+${STATS.newThisWeek}`, label: 'joined this week', note: '3 are in your industry', color: t.palette.ok },
    { value: STATS.openMentors,       label: 'open to mentor right now', note: '12 match your background', color: t.palette.ink2 },
  ];

  return (
    <div>
      <AtriumGreetingStrip
        headline={<>Welcome back, Maren. <span style={{ color: t.palette.muted }}>What brings you in?</span></>}
        sub={`Pick a path below. The Hartwood circle has grown by ${STATS.newThisWeek} since your last visit.`}
      />

      <AtriumAnnouncements />

      <AtriumKPIStrip items={kpiItems} pending={PENDING_REQUESTS.length} />

      <div style={{
        padding: m ? '24px 14px 48px' : '32px 32px 56px',
        maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: m ? 28 : 40,
      }}>

        <AtriumPickAPath />

        {/* === BUCKET 01 — On your desk === */}
        <AtriumBucketSection
          title="On your desk"
          count={`${PENDING_REQUESTS.length} replies you owe`}
          toneColor={t.palette.accent}
          subtitle="People who have asked for your time. Sorted by how long they've been waiting."
          primary={<AtriumButton onClick={() => goto('inbox')}>Open inbox →</AtriumButton>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
            {PENDING_REQUESTS.slice(0, 3).map((req) => <AtriumDeskCard key={req.id} req={req} />)}
          </div>
        </AtriumBucketSection>

        {/* === BUCKET 02 — On your calendar === */}
        <AtriumBucketSection
          title="On your calendar"
          count={`1 event needs you · ${featured.days} days away`}
          toneColor={t.palette.ink}
          subtitle={`You're hosting ${featured.title} next Tuesday. Two confirmations and a seating note are open.`}
          primary={<AtriumButton onClick={() => goto('events')}>All gatherings →</AtriumButton>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '2fr 1fr 1fr', gap: 14 }}>
            <AtriumEventHero event={featured} />
            {otherEvents.map((e) => <AtriumEventMiniCard key={e.id} event={e} />)}
          </div>
        </AtriumBucketSection>

        {/* === BUCKET 03 — On the wire === */}
        <AtriumBucketSection
          title="On the wire"
          count={`+${STATS.newThisWeek} new this week · no action needed`}
          toneColor={t.palette.ok}
          subtitle="A scan column. Nothing here demands a reply — but a name might catch your eye."
          primary={<AtriumButton variant="outline" onClick={() => goto('people')}>Browse the directory →</AtriumButton>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '2fr 1fr', gap: 14, alignItems: 'stretch' }}>
            <div style={t.cardSurface({ padding: 16 })}>
              <AtriumEyebrow>Recently joined · last 14 days</AtriumEyebrow>
              <div style={{
                marginTop: 14,
                display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(2, 1fr)', gap: 10,
              }}>
                {newJoiners.map((mm) => <AtriumJoinerCard key={mm.id} member={mm} />)}
              </div>
            </div>
            <AtriumWireFeed items={ACTIVITY} />
          </div>
        </AtriumBucketSection>

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// People (directory) — unchanged
// ---------------------------------------------------------------------------

function AtriumRefineBar({ df }) {
  const t = React.useContext(ThemeCtx);
  const m = t.isMobile;
  const [open, setOpen] = React.useState(false);
  const accentSoft = hex(t.palette.accent, 0.10);
  const accentRule = hex(t.palette.accent, 0.32);

  return (
    <div style={{ marginTop: m ? 20 : 28 }}>
      <div className="atrium-hscroll" style={{
        display: 'flex', gap: 8, alignItems: 'center', flexWrap: m ? 'nowrap' : 'wrap',
        overflowX: m ? 'auto' : 'visible',
        paddingBottom: m ? 6 : 0,
        marginLeft: m ? -16 : 0, marginRight: m ? -16 : 0,
        paddingLeft: m ? 16 : 0, paddingRight: m ? 16 : 0,
      }}>
        <span style={{ ...t.eyebrow, color: t.palette.muted, marginRight: 4 }}>Refine</span>
        <AtriumTogglePill active={df.filters.mentor}      onClick={() => df.toggle('mentor')}>Open to mentor</AtriumTogglePill>
        <AtriumTogglePill active={df.filters.nearMe}      onClick={() => df.toggle('nearMe')}>Near me</AtriumTogglePill>
        <AtriumTogglePill active={df.filters.peopleIKnow} onClick={() => df.toggle('peopleIKnow')}>People I know</AtriumTogglePill>
        <button onClick={() => setOpen(o => !o)} style={{
          background: t.palette.cardAlt, color: t.palette.ink,
          border: `1px solid ${t.palette.rule}`,
          padding: '8px 14px', borderRadius: 999,
          fontFamily: t.font.body, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          {open ? '− Hide filters' : `+ More filters${df.activeCount ? ` · ${df.activeCount}` : ''}`}
        </button>
      </div>

      {open ? (
        <div style={{
          marginTop: 12,
          background: t.palette.cardAlt, border: `1px solid ${t.palette.rule}`,
          borderRadius: t.radius + 4, padding: m ? 16 : 20,
          display: 'grid', gap: 16,
          gridTemplateColumns: m ? '1fr' : 'repeat(4, 1fr)',
        }}>
          <AtriumField label="City"         value={df.filters.city}     onChange={(v) => df.setFilter('city', v)}     placeholder="Brooklyn" />
          <AtriumField label="Employer"     value={df.filters.employer} onChange={(v) => df.setFilter('employer', v)} placeholder="Common Capital" />
          <AtriumField label="Mentor topic" value={df.filters.topic}    onChange={(v) => df.setFilter('topic', v)}    placeholder="Fundraising" />
          <div>
            <label style={{ ...t.eyebrow, color: t.palette.muted, display: 'block', marginBottom: 6 }}>Class of</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input value={df.filters.yearMin} onChange={(e) => df.setFilter('yearMin', e.target.value)} placeholder="2010" inputMode="numeric" style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${t.palette.rule}`, padding: '9px 12px', fontFamily: t.font.body, fontSize: 13, background: t.palette.card, borderRadius: 999, color: t.palette.ink, outline: 'none' }} />
              <span style={{ color: t.palette.muted, fontSize: 13 }}>–</span>
              <input value={df.filters.yearMax} onChange={(e) => df.setFilter('yearMax', e.target.value)} placeholder="2020" inputMode="numeric" style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${t.palette.rule}`, padding: '9px 12px', fontFamily: t.font.body, fontSize: 13, background: t.palette.card, borderRadius: 999, color: t.palette.ink, outline: 'none' }} />
            </div>
          </div>
        </div>
      ) : null}

      {df.activeCount > 0 ? (
        <div style={{
          marginTop: 12, padding: '10px 14px',
          background: accentSoft, border: `1px solid ${accentRule}`,
          borderRadius: 999, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <span style={{ ...t.eyebrow, color: t.palette.accent, marginRight: 4 }}>Active</span>
          {df.activeChips.map(chip => (
            <button key={chip.key} onClick={() => df.clearOne(chip.key)} style={{
              fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600,
              color: t.palette.ink, background: t.palette.card,
              border: `1px solid ${accentRule}`, padding: '5px 12px', borderRadius: 999,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              {chip.label}
              <span style={{ color: t.palette.muted, fontSize: 15, lineHeight: 1 }}>×</span>
            </button>
          ))}
          <button onClick={df.clearAll} style={{
            background: 'transparent', border: 'none', color: t.palette.accent,
            fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600,
            cursor: 'pointer', padding: '5px 6px', marginLeft: 2,
          }}>Clear all</button>
        </div>
      ) : null}
    </div>
  );
}

function AtriumTogglePill({ active, onClick, children }) {
  const t = React.useContext(ThemeCtx);
  return (
    <button onClick={onClick} style={{
      background: active ? t.palette.ink : t.palette.cardAlt,
      color:      active ? t.palette.paper : t.palette.ink,
      border:     `1px solid ${active ? t.palette.ink : t.palette.rule}`,
      padding: '8px 14px', borderRadius: 999,
      fontFamily: t.font.body, fontSize: 13, fontWeight: 600,
      cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', gap: 7,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: 999,
        background: active ? t.palette.accent : 'transparent',
        border: active ? 'none' : `1px solid ${t.palette.mute2}`,
        display: 'inline-block',
      }} />
      {children}
    </button>
  );
}

function AtriumField({ label, value, onChange, placeholder }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div>
      <label style={{ ...t.eyebrow, color: t.palette.muted, display: 'block', marginBottom: 6 }}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: `1px solid ${t.palette.rule}`, padding: '9px 14px',
          fontFamily: t.font.body, fontSize: 13, background: t.palette.card,
          borderRadius: 999, color: t.palette.ink, outline: 'none',
        }} />
    </div>
  );
}

function AtriumPeople() {
  const t = React.useContext(ThemeCtx);
  const { MEMBERS, VIEWER } = window.BC_DATA;
  const ai = useAISearch(MEMBERS);
  const df = useDirectoryFilters(VIEWER);
  const m = t.isMobile;

  const baseSet = ai.results ? ai.results.map(r => MEMBERS.find(mm => mm.id === r.id)).filter(Boolean) : MEMBERS;
  const filtered = React.useMemo(() => df.apply(baseSet), [df.filters, baseSet]);
  const rationaleById = React.useMemo(() => {
    const map = new Map();
    if (ai.results) for (const r of ai.results) map.set(r.id, r.rationale);
    return map;
  }, [ai.results]);

  return (
    <section style={{ padding: m ? '24px 16px' : '40px 24px', maxWidth: 1280, margin: '0 auto' }}>
      <div>
        <AtriumEyebrow accent>The directory · {MEMBERS.length} members</AtriumEyebrow>
        <h1 style={{ ...t.display, fontSize: m ? 36 : 56, margin: m ? '10px 0 0' : '14px 0 0' }}>Find your people.</h1>
        <p style={{ fontSize: m ? 14.5 : 16, color: t.palette.muted, marginTop: m ? 10 : 14, maxWidth: 600, lineHeight: 1.55 }}>
          Tell me what they do, where they are, or what they care about — search reads career history, schools, and skills.
        </p>
      </div>
      <AtriumAISearch ai={ai} />
      <AtriumRefineBar df={df} />
      <div style={{ fontSize: 13, color: t.palette.muted, marginTop: 22, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span>
          {ai.results
            ? <>Showing <strong style={{ color: t.palette.ink, fontWeight: 600 }}>{filtered.length}</strong> AI {filtered.length === 1 ? 'match' : 'matches'} for "{ai.query}"{df.activeCount > 0 ? ` · ${df.activeCount} refinement${df.activeCount === 1 ? '' : 's'}` : ''}</>
            : <>Showing <strong style={{ color: t.palette.ink, fontWeight: 600 }}>{filtered.length}</strong> of {MEMBERS.length} members{df.activeCount > 0 ? ` · ${df.activeCount} refinement${df.activeCount === 1 ? '' : 's'}` : ''}</>}
        </span>
        {ai.results ? <button onClick={ai.clear} style={{ fontSize: 13, color: t.palette.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>Clear AI search</button> : null}
      </div>
      {ai.stage === 'empty' && filtered.length === 0 ? (
        <div style={t.cardSurface({ padding: '28px 24px', textAlign: 'center', color: t.palette.muted })}>
          No matches in your circle for "{ai.query}." Try broader wording, or browse the directory.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : (t.mq.isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'), gap: 14 }}>
          {filtered.map(mm => <AtriumMemberCard key={mm.id} m={mm} rationale={rationaleById.get(mm.id)} />)}
        </div>
      )}
    </section>
  );
}

function AtriumAISearch({ ai }) {
  const t = React.useContext(ThemeCtx);
  const [draft, setDraft] = React.useState(ai.query);
  React.useEffect(() => setDraft(ai.query), [ai.query]);
  const m = t.isMobile;
  const busy = ai.stage === 'reading' || ai.stage === 'looking' || ai.stage === 'reasoning';
  const stageCopy = AI_STAGE_COPY[ai.stage];
  const onSubmit = (e) => { e.preventDefault(); ai.run(draft); };
  const accentSoft = hex(t.palette.accent, 0.10);
  const accentRule = hex(t.palette.accent, 0.32);

  return (
    <div style={{ marginTop: m ? 24 : 32, background: accentSoft, border: `1px solid ${accentRule}`, borderRadius: t.radius + 4, padding: m ? 16 : 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <SparkleIcon color={t.palette.accent} />
        <span style={{ fontFamily: t.font.body, fontSize: 12.5, fontWeight: 700, letterSpacing: 0.4, color: t.palette.accent, textTransform: 'uppercase' }}>Ask the directory</span>
        <span style={{ fontSize: 12.5, color: t.palette.muted, fontWeight: 500 }}>· reads career, schools, skills</span>
      </div>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 10, flexDirection: m ? 'column' : 'row' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: t.palette.card, border: `1px solid ${t.palette.rule}`, borderRadius: 999, padding: '4px 6px 4px 18px' }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="What kind of alum are you looking for?" disabled={busy}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: t.font.body, fontSize: m ? 15 : 16, color: t.palette.ink, padding: '10px 0' }} />
          {ai.query ? <button type="button" onClick={ai.clear} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: t.palette.muted, fontSize: 18, lineHeight: 1, padding: '0 6px' }} aria-label="Clear">×</button> : null}
          <AtriumButton type="submit" size="md" disabled={busy || !draft.trim()}>{busy ? 'Searching…' : 'Search'}</AtriumButton>
        </div>
      </form>
      {busy ? (
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: t.palette.accent, display: 'inline-block', animation: 'atrium-ai-pulse 1.2s ease-in-out infinite' }} />
          <span style={{ fontSize: 13.5, color: t.palette.ink2, fontWeight: 500 }}>{stageCopy}</span>
        </div>
      ) : ai.results ? (
        <div style={{ marginTop: 14, fontSize: 13.5, color: t.palette.muted, lineHeight: 1.55 }}>
          {ai.extracted && ai.extracted.theme ? <>Looking for <strong style={{ color: t.palette.ink, fontWeight: 600 }}>{ai.extracted.theme}</strong>. Each card has a "why this match?" reason at the bottom.</> : <>Each card has a "why this match?" reason at the bottom — tap to open a full profile.</>}
        </div>
      ) : (
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ ...t.eyebrow, color: t.palette.muted }}>Try</span>
          {AI_EXAMPLES.slice(0, 3).map(ex => (
            <button key={ex} onClick={() => { setDraft(ex); ai.run(ex); }} style={{ fontFamily: t.font.body, fontSize: 12.5, color: t.palette.ink2, background: t.palette.card, border: `1px solid ${t.palette.rule}`, padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontWeight: 500 }}>"{ex}"</button>
          ))}
        </div>
      )}
    </div>
  );
}

function SparkleIcon({ color, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5 L9.3 6.7 L14.5 8 L9.3 9.3 L8 14.5 L6.7 9.3 L1.5 8 L6.7 6.7 Z" fill={color} />
      <circle cx="13" cy="3" r="0.9" fill={color} opacity="0.55" />
      <circle cx="3.2" cy="13" r="0.7" fill={color} opacity="0.4" />
    </svg>
  );
}

function AtriumMemberCard({ m, compact, rationale }) {
  const t = React.useContext(ThemeCtx);
  const { goto, setActiveProfile } = useAtriumRoute();
  const openMap = { mentor: { tone: 'accent', label: 'Open to mentor' }, advice: { tone: 'ok', label: 'Open to advice' }, mentee: { tone: 'muted', label: 'Looking for advice' } };
  const om = openMap[m.open] || openMap.mentee;

  return (
    <button onClick={() => { setActiveProfile(m.id); goto('profile'); }} style={{
      ...t.cardSurface({ padding: 0, textAlign: 'left', cursor: 'pointer', transition: 'transform 120ms ease, box-shadow 120ms ease', display: 'flex', flexDirection: 'column', minHeight: compact ? 200 : 260, overflow: 'hidden' }),
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,.6) inset, 0 8px 24px rgba(42,34,26,0.10)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)'; }}>
      <div style={{ padding: compact ? 18 : 22, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.14em', color: t.palette.mute2, textTransform: 'uppercase', fontWeight: 600 }}>'{String(m.year).slice(-2)} · {m.city.split(',')[0]}</span>
          <AtriumTag tone={om.tone} dot>{compact ? om.label.replace('Open to ', '').replace('Looking for ', '') : om.label}</AtriumTag>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
          <AtriumAvatar name={m.name} initials={m.initials} size={compact ? 38 : 50} />
          <h3 style={{ ...t.display, fontSize: compact ? 18 : 22, margin: 0, fontWeight: 600, minWidth: 0, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word', lineHeight: 1.1 }}>{m.name}</h3>
        </div>
        <div style={{ fontSize: 13.5, color: t.palette.ink2, fontWeight: 500, lineHeight: 1.4 }}>{m.title} <span style={{ color: t.palette.muted, fontWeight: 400 }}>at</span> {m.employer}</div>
        {!compact ? <p style={{ fontSize: 13.5, lineHeight: 1.55, color: t.palette.muted, margin: '10px 0 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.bio}</p> : null}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto', paddingTop: compact ? 14 : 18 }}>
          {m.tags.slice(0, compact ? 2 : 3).map(tag => <AtriumTag key={tag} tone="muted">{tag}</AtriumTag>)}
        </div>
      </div>
      {/* Relationship layer — mutual members + meeting context */}
      {!compact && (
        <div style={{ borderTop: `1px solid ${t.palette.ruleSoft}`, background: t.palette.panel, padding: '10px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex' }}>
              {[0, 1].map(idx => (
                <div key={idx} style={{ marginLeft: idx > 0 ? -7 : 0, borderRadius: 999, border: `2px solid ${t.palette.panel}` }}>
                  <AtriumAvatar name={`Member ${idx}`} initials={idx === 0 ? 'RF' : 'SA'} size={22} />
                </div>
              ))}
            </div>
            <span style={{ fontFamily: t.font.body, fontSize: 12, color: t.palette.ink2, fontWeight: 500 }}>
              <strong style={{ fontWeight: 700 }}>2 mutual members</strong>
              <span style={{ color: t.palette.muted }}> · Rosa + 1</span>
            </span>
          </div>
          <span style={{ fontFamily: t.font.mono, fontSize: 9, color: t.palette.muted, letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Spring Supper</span>
        </div>
      )}
      {rationale ? (
        <div style={{ borderTop: `1px solid ${hex(t.palette.accent, 0.25)}`, background: hex(t.palette.accent, 0.08), padding: '12px 22px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <SparkleIcon color={t.palette.accent} size={12} />
            <span style={{ fontFamily: t.font.body, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: t.palette.accent, textTransform: 'uppercase' }}>Why this match?</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.5, color: t.palette.ink2, margin: 0 }}>{rationale}</p>
        </div>
      ) : null}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Personalized hero — full-bleed accent band, no card
// ---------------------------------------------------------------------------
function AtriumPersonalizedHero() {
  const t = React.useContext(ThemeCtx);
  const m = t.isMobile;
  const { VIEWER } = window.BC_DATA;
  return (
    <div style={{
      background: t.heroBgColor,
      padding: m ? '40px 20px 48px' : '60px 40px 68px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative Hartwood circles */}
      <svg aria-hidden="true" width="720" height="440" viewBox="0 0 720 440"
           style={{ position: 'absolute', right: -140, top: -80, opacity: 0.09, pointerEvents: 'none' }}>
        <circle cx="280" cy="240" r="210" fill="none" stroke="#fff" strokeWidth="1.6" />
        <circle cx="470" cy="240" r="210" fill="none" stroke="#fff" strokeWidth="1.6" />
      </svg>
      <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{
          fontFamily: t.font.mono, fontSize: m ? 10 : 11.5, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.58)', marginBottom: m ? 14 : 20,
        }}>
          {'Class of ' + VIEWER.cohortShort + ' · Welcome back to Hartwood'}
        </div>
        <h1 style={{
          fontFamily: t.font.display, fontSize: m ? 38 : 72,
          fontWeight: 600, color: '#fff',
          margin: 0, letterSpacing: '-0.03em', lineHeight: 1.02,
        }}>
          {'Good afternoon, ' + VIEWER.firstName + '.'}
        </h1>
        <p style={{
          fontFamily: t.font.display, fontSize: m ? 22 : 34,
          fontWeight: 400, fontStyle: 'italic',
          color: 'rgba(255,255,255,0.62)',
          margin: m ? '14px 0 0' : '18px 0 0',
          letterSpacing: '-0.02em', lineHeight: 1.2,
        }}>
          What brings you in?
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cohort block — industry bars + top cities
// ---------------------------------------------------------------------------
function AtriumCohortBlock() {
  const t = React.useContext(ThemeCtx);
  const { goto } = useAtriumRoute();
  const m = t.isMobile;
  const industries = [
    { label: 'Tech',       count: 62 },
    { label: 'Finance',    count: 38 },
    { label: 'Medicine',   count: 26 },
    { label: 'Consulting', count: 20 },
    { label: 'Other',      count: 38 },
  ];
  const maxInd = Math.max(...industries.map(i => i.count));
  const cities = [
    { city: 'San Francisco', count: 42 },
    { city: 'New York',      count: 31 },
    { city: 'Los Angeles',   count: 22 },
    { city: 'Seoul',         count: 14 },
    { city: 'London',        count: 9  },
  ];
  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <AtriumEyebrow>Cohort</AtriumEyebrow>
          <h2 style={{ ...t.display, fontSize: m ? 22 : 26, fontWeight: 600, margin: '6px 0 0', letterSpacing: '-0.025em' }}>
            Your class right now
          </h2>
        </div>
        <button onClick={() => goto('people')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: t.font.body, fontSize: 13.5, fontWeight: 600,
          color: t.palette.accent, padding: 0,
        }}>{"See all '17s →"}</button>
      </div>
      <div style={t.cardSurface({ padding: '20px 24px' })}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <AtriumEyebrow>{"Class of '17 · 184 in the circle"}</AtriumEyebrow>
          <AtriumTag tone="ok" dot>+4 this month</AtriumTag>
        </div>
        <h3 style={{ ...t.display, fontSize: 20, fontWeight: 600, margin: '0 0 22px', letterSpacing: '-0.02em' }}>
          A picture of where you all landed.
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: m ? 20 : 28 }}>
          {/* Industry bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {industries.map(ind => (
              <div key={ind.label} style={{ display: 'grid', gridTemplateColumns: '88px 1fr 28px', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: t.font.body, fontSize: 13, color: t.palette.ink, fontWeight: 500 }}>{ind.label}</span>
                <div style={{ background: hex(t.palette.accent, 0.15), borderRadius: 999, height: 7, overflow: 'hidden' }}>
                  <div style={{ background: t.palette.accent, height: '100%', width: ((ind.count / maxInd) * 100) + '%', borderRadius: 999 }} />
                </div>
                <span style={{ fontFamily: t.font.body, fontSize: 12.5, color: t.palette.muted, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{ind.count}</span>
              </div>
            ))}
          </div>
          {/* City list */}
          <div>
            {cities.map((c, i) => (
              <div key={c.city} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 0',
                borderBottom: i < cities.length - 1 ? ('1px solid ' + t.palette.ruleSoft) : 'none',
              }}>
                <span style={{ fontFamily: t.font.body, fontSize: 13, color: t.palette.ink, fontWeight: 500 }}>{c.city}</span>
                <span style={{ fontFamily: t.font.body, fontSize: 13, color: t.palette.muted, fontVariantNumeric: 'tabular-nums' }}>{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Movements block — career + location tabbed feed
// ---------------------------------------------------------------------------
function AtriumMovementsBlock() {
  const t = React.useContext(ThemeCtx);
  const [tab, setTab] = React.useState('career');
  const careerMoves = [
    { id: 'dk', name: 'Daniel Kim',   initials: 'DK', cohort: "'16", from: 'Stripe',  to: 'Senior PM at Anthropic',   when: '2d ago', fresh: true  },
    { id: 'jl', name: 'Jane Lee',     initials: 'JL', cohort: "'14", from: 'Goldman', to: 'VP at Bridgewater',         when: '5d ago', fresh: false },
    { id: 'at', name: 'Alex Tan',     initials: 'AT', cohort: "'19", from: null,       to: 'Started residency at UCSF', when: '1w ago', fresh: false },
  ];
  const locationMoves = [
    { id: 'rh', name: 'Rosa Hwang',   initials: 'RH', cohort: "'17", from: 'New York', to: 'San Francisco', when: '3d ago', fresh: true  },
    { id: 'tf', name: 'Theo Fischer', initials: 'TF', cohort: "'13", from: 'London',   to: 'Brooklyn',      when: '1w ago', fresh: false },
    { id: 'ms', name: 'Mei Sato',     initials: 'MS', cohort: "'20", from: 'Chicago',  to: 'Austin',        when: '2w ago', fresh: false },
  ];
  const moves = tab === 'career' ? careerMoves : locationMoves;
  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <AtriumEyebrow>Movement</AtriumEyebrow>
          <h2 style={{ ...t.display, fontSize: 26, fontWeight: 600, margin: '6px 0 0', letterSpacing: '-0.025em' }}>
            {tab === 'career' ? 'Career moves in your circle' : 'Location moves in your circle'}
          </h2>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: t.font.body, fontSize: 13.5, fontWeight: 600, color: t.palette.accent, padding: 0 }}>View all →</button>
      </div>
      {/* Tabs */}
      <div style={{ display: 'inline-flex', gap: 3, padding: 3, background: t.palette.cardAlt, border: ('1px solid ' + t.palette.rule), borderRadius: 999, marginBottom: 14 }}>
        {['career', 'location'].map(tid => (
          <button key={tid} onClick={() => setTab(tid)} style={{
            background: tab === tid ? t.palette.ink : 'transparent',
            color: tab === tid ? t.palette.paper : t.palette.muted,
            border: 'none', padding: '6px 18px', borderRadius: 999,
            fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            transition: 'background 120ms ease, color 120ms ease',
          }}>{tid === 'career' ? 'Career' : 'Location'}</button>
        ))}
      </div>
      {/* Feed rows */}
      <div style={t.cardSurface({ overflow: 'hidden', padding: 0 })}>
        {moves.map((move, i) => (
          <div key={move.id} style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr auto',
            gap: 16, padding: '16px 20px',
            borderTop: i > 0 ? ('1px solid ' + t.palette.ruleSoft) : 'none',
            alignItems: 'center',
          }}>
            <AtriumAvatar name={move.name} initials={move.initials} size={44} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ ...t.display, fontSize: 15, fontWeight: 600 }}>{move.name}</span>
                <span style={{ color: t.palette.mute2, fontSize: 12 }}>·</span>
                <span style={{ fontFamily: t.font.mono, fontSize: 10.5, color: t.palette.muted }}>{move.cohort}</span>
              </div>
              <div style={{ fontFamily: t.font.body, fontSize: 13, color: t.palette.ink2, marginTop: 3, lineHeight: 1.4 }}>
                {move.from
                  ? <span><span style={{ color: t.palette.muted }}>{move.from}</span><span style={{ color: t.palette.muted }}> → </span><strong style={{ fontWeight: 600, color: t.palette.ink }}>{move.to}</strong></span>
                  : <span style={{ fontWeight: 500, color: t.palette.ink2 }}>{move.to}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {move.fresh && <span style={{ width: 7, height: 7, borderRadius: 999, background: t.palette.ok }} />}
              <span style={{ fontFamily: t.font.body, fontSize: 12.5, color: move.fresh ? t.palette.ink2 : t.palette.muted, whiteSpace: 'nowrap' }}>{move.when}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Network block — nearby alumni 3-up
// ---------------------------------------------------------------------------
function AtriumNetworkBlock() {
  const t = React.useContext(ThemeCtx);
  const { goto, setActiveProfile } = useAtriumRoute();
  const m = t.isMobile;
  const nearby = [
    { id: 'iris-okonkwo',     name: 'Priya Shah',  initials: 'PS', cohort: "'18", title: 'Software Engineer', employer: 'Stripe',  city: 'San Francisco' },
    { id: 'dev-ramachandran', name: 'Marcus Ong',  initials: 'MO', cohort: "'16", title: 'Strategy',          employer: 'Sequoia', city: 'Menlo Park'    },
    { id: 'priya-sastry',     name: 'Hana Park',   initials: 'HP', cohort: "'20", title: 'Research',           employer: 'OpenAI',  city: 'San Francisco' },
  ];
  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <AtriumEyebrow>Network</AtriumEyebrow>
          <h2 style={{ ...t.display, fontSize: 26, fontWeight: 600, margin: '6px 0 0', letterSpacing: '-0.025em' }}>
            New alumni in your area
          </h2>
        </div>
        <button onClick={() => goto('people')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: t.font.body, fontSize: 13.5, fontWeight: 600, color: t.palette.accent, padding: 0 }}>Open people →</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
        {nearby.map(mm => (
          <button key={mm.id} onClick={() => { setActiveProfile(mm.id); goto('profile'); }} style={{
            ...t.cardSurface({ cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column' }),
            padding: '18px 20px',
            transition: 'transform 120ms ease, box-shadow 120ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(42,34,26,0.10)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
            <h3 style={{ ...t.display, fontSize: 16, fontWeight: 600, margin: '0 0 5px', lineHeight: 1.2 }}>{mm.name}</h3>
            <div style={{ fontFamily: t.font.body, fontSize: 13, color: t.palette.ink2, marginBottom: 16 }}>
              {mm.title} at <strong style={{ fontWeight: 600, color: t.palette.ink }}>{mm.employer}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
              <AtriumTag tone="muted">{mm.cohort}</AtriumTag>
              <span style={{ fontFamily: t.font.body, fontSize: 12.5, color: t.palette.muted }}>{mm.city}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sidebar — circle stats
// ---------------------------------------------------------------------------
function AtriumSidebarStats() {
  const t = React.useContext(ThemeCtx);
  const { STATS, PENDING_REQUESTS } = window.BC_DATA;
  const stats = [
    { value: '1,284',                    label: 'members in the circle', color: t.palette.ink     },
    { value: '+' + STATS.newThisWeek,   label: 'joined this week',      color: t.palette.ok      },
    { value: STATS.openMentors,          label: 'open to mentor',        color: t.palette.ink2    },
    { value: PENDING_REQUESTS.length,    label: 'waiting on you',        color: t.palette.accent  },
  ];
  return (
    <div style={t.cardSurface({ padding: '18px 20px' })}>
      <AtriumEyebrow>Circle · right now</AtriumEyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        {stats.map((s, i) => (
          <div key={i}>
            <div style={{ ...t.display, fontSize: 30, fontWeight: 700, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: t.font.body, fontSize: 12, color: t.palette.muted, marginTop: 5, lineHeight: 1.4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar — on your desk (compact)
// ---------------------------------------------------------------------------
function AtriumSidebarDesk() {
  const t = React.useContext(ThemeCtx);
  const { goto } = useAtriumRoute();
  const { PENDING_REQUESTS } = window.BC_DATA;
  return (
    <div style={t.cardSurface({ overflow: 'hidden', padding: 0 })}>
      <div style={{ padding: '14px 18px', borderBottom: ('1px solid ' + t.palette.ruleSoft), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <AtriumEyebrow>On your desk</AtriumEyebrow>
        <span style={{
          fontFamily: t.font.body, fontSize: 11.5, fontWeight: 700,
          color: t.palette.accent, background: hex(t.palette.accent, 0.10),
          padding: '3px 9px', borderRadius: 999,
        }}>{PENDING_REQUESTS.length + ' waiting'}</span>
      </div>
      {PENDING_REQUESTS.slice(0, 3).map((req, i) => (
        <div key={req.id} style={{
          display: 'grid', gridTemplateColumns: 'auto 1fr auto',
          gap: 12, padding: '12px 18px',
          borderTop: i > 0 ? ('1px solid ' + t.palette.ruleSoft) : 'none',
          alignItems: 'center',
        }}>
          <AtriumAvatar name={req.from.name} initials={req.from.initials} size={32} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: t.font.body, fontSize: 13, fontWeight: 600, color: t.palette.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.from.name}</div>
            <div style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.muted, letterSpacing: '0.06em', marginTop: 2 }}>{req.sentAt}</div>
          </div>
          <AtriumTag tone={parseInt(req.sentAt) >= 4 ? 'warn' : 'muted'} dot>{req.sentAt}</AtriumTag>
        </div>
      ))}
      <div style={{ padding: '12px 18px', borderTop: ('1px solid ' + t.palette.ruleSoft) }}>
        <AtriumButton onClick={() => goto('inbox')} style={{ width: '100%', justifyContent: 'center' }}>Open inbox →</AtriumButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar — next event
// ---------------------------------------------------------------------------
function AtriumSidebarEvent() {
  const t = React.useContext(ThemeCtx);
  const { goto, setActiveEvent } = useAtriumRoute();
  const { EVENTS } = window.BC_DATA;
  const featured = EVENTS[0];
  const pct = Math.round(featured.going / featured.capacity * 100);
  return (
    <div style={t.cardSurface({ overflow: 'hidden', padding: 0 })}>
      <div style={{
        background: ('linear-gradient(135deg, ' + t.palette.ink + ' 0%, ' + t.palette.accent + ' 160%)'),
        padding: '14px 18px', position: 'relative', overflow: 'hidden',
      }}>
        <span style={{ ...t.display, fontSize: 60, color: 'rgba(255,255,255,0.07)', position: 'absolute', right: 8, bottom: -10, lineHeight: 1, letterSpacing: '-0.04em', pointerEvents: 'none' }}>{featured.days}D</span>
        <AtriumEyebrow color="rgba(255,255,255,0.65)">Next event · You're hosting</AtriumEyebrow>
        <div style={{ ...t.display, fontSize: 15, fontWeight: 600, color: '#fff', marginTop: 5, position: 'relative', lineHeight: 1.3 }}>{featured.when}</div>
        <div style={{ ...t.display, fontSize: 20, fontWeight: 700, color: t.palette.accent, filter: 'brightness(1.7)', position: 'absolute', top: 14, right: 18 }}>{'T−' + featured.days + 'd'}</div>
      </div>
      <div style={{ padding: '12px 18px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
          <span style={{ fontWeight: 600, color: t.palette.ink2 }}>{featured.going + ' going'}</span>
          <span style={{ color: t.palette.muted }}>{pct + '% full'}</span>
        </div>
        <div style={{ background: t.palette.rule, borderRadius: 999, height: 5, overflow: 'hidden' }}>
          <div style={{ background: t.palette.accent, height: '100%', width: pct + '%', borderRadius: 999 }} />
        </div>
        <AtriumButton size="sm" onClick={() => { setActiveEvent && setActiveEvent(featured.id); goto('event-detail'); }} style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
          Open event →
        </AtriumButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar — quick paths
// ---------------------------------------------------------------------------
function AtriumSidebarQuickPaths() {
  const t = React.useContext(ThemeCtx);
  const { goto } = useAtriumRoute();
  const { STATS } = window.BC_DATA;
  const paths = [
    { label: 'Find a mentor',       note: STATS.openMentors + ' open',  onClick: () => goto('people')  },
    { label: 'Browse the network',  note: '1,284 members',               onClick: () => goto('people')  },
    { label: 'View all events',     note: 'Next: in 7 days',             onClick: () => goto('events')  },
    { label: 'Update your profile', note: '64% complete',                 onClick: () => goto('profile') },
  ];
  return (
    <div style={t.cardSurface({ padding: '16px 18px' })}>
      <AtriumEyebrow>Quick paths</AtriumEyebrow>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 12 }}>
        {paths.map((p, i) => (
          <button key={i} onClick={p.onClick} style={{
            background: t.palette.cardAlt, border: ('1px solid ' + t.palette.rule),
            borderRadius: 10, padding: '10px 14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: 'pointer', textAlign: 'left', width: '100%',
            transition: 'background 100ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = hex(t.palette.accent, 0.07); }}
          onMouseLeave={e => { e.currentTarget.style.background = t.palette.cardAlt; }}>
            <span style={{ fontFamily: t.font.body, fontSize: 13, fontWeight: 600, color: t.palette.ink }}>{p.label}</span>
            <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.muted, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{p.note}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Home screen — redesigned with personalized hero + feed blocks + sidebar
// ---------------------------------------------------------------------------
function AtriumHomeRedesigned() {
  const t = React.useContext(ThemeCtx);
  const m = t.isMobile;
  return (
    <div>
      <AtriumPersonalizedHero />
      <AtriumAnnouncements />
      <div style={{
        maxWidth: 1280, margin: '0 auto', boxSizing: 'border-box',
        padding: m ? '28px 16px 60px' : '44px 32px 72px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: m ? '1fr' : '1fr 340px',
          gap: m ? 28 : 32,
          alignItems: 'flex-start',
        }}>
          {/* Left — feed blocks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: m ? 32 : 48 }}>
            <AtriumCohortBlock />
            <AtriumMovementsBlock />
            <AtriumNetworkBlock />
          </div>
          {/* Right — contextual sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, position: m ? 'static' : 'sticky', top: 82 }}>
            <AtriumSidebarStats />
            <AtriumSidebarDesk />
            <AtriumSidebarEvent />
            <AtriumSidebarQuickPaths />
          </div>
        </div>
      </div>
    </div>
  );
}

window.AtriumHome = AtriumHomeRedesigned;
window.AtriumPeople = AtriumPeople;
window.AtriumMemberCard = AtriumMemberCard;
