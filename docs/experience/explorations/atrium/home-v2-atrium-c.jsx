/* eslint-disable */
// Atrium V3 — THREE BUCKETS
// Same three-bucket structure as the Civic version — "On your desk", "On
// your calendar", "On the wire" — rendered in Atrium's warm vocabulary.
// Cards are rounded (20px), buttons are pills, accents are terracotta, and
// avatars are gradient circles. The bucket headers swap Civic's hard rule
// for a softer divider + a tag pill.

function A3ThreeBuckets() {
  const P = ATRIUM;
  const D = HOME_DATA;
  const ev = D.event;

  return (
    <div style={{
      width: '100%', height: '100%', background: P.paper, color: P.ink,
      fontFamily: P.font.body, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <ATR_Header />

      <ATR_Greeting
        eyebrow={`Good afternoon, ${D.viewer.firstName} · Class of ${D.viewer.cohort}`}
        headline={<>Three buckets of work, sorted by what they ask of you.</>}
        sub="Top to bottom, the page asks less. Replies you owe first, then your calendar, then a quiet scan of what’s new — no urgency assumed."
      />

      <div style={{
        flex: 1, padding: '8px 32px 32px',
        maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: 36,
      }}>

        {/* === BUCKET 01 — On your desk === */}
        <A3Bucket
          index="01" title="On your desk" tone="accent"
          countLabel={`${D.pending.length} replies waiting`}
          subtitle="People who have asked for your time. Sorted by how long they’ve been waiting — none are urgent."
          primary={<ATR_Button variant="primary" size="md">Open inbox →</ATR_Button>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {D.pending.map((p, i) => (
              <div key={i} style={{
                background: P.card, border: `1px solid ${P.rule}`, borderRadius: 20,
                padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
                boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <ATR_Avatar name={p.name} initials={p.initials} size={44} />
                  <ATR_Tag tone={p.days >= 4 ? 'warn' : 'muted'}>● {p.days}d waiting</ATR_Tag>
                </div>
                <div>
                  <div style={{
                    fontFamily: P.font.display, fontSize: 19, fontWeight: 600,
                    letterSpacing: '-0.015em', color: P.ink, lineHeight: 1.2,
                  }}>{p.name}</div>
                  <div style={{
                    fontSize: 12, color: P.muted, marginTop: 3,
                  }}>{p.cohort} · {p.title}</div>
                </div>
                <p style={{
                  fontSize: 13.5, color: P.ink2, margin: 0, lineHeight: 1.55, fontStyle: 'italic',
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>“{p.body}”</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 6 }}>
                  <ATR_Button variant="primary" size="sm" style={{ flex: 1, justifyContent: 'center' }}>Reply</ATR_Button>
                  <ATR_Button variant="ghost" size="sm">Skip</ATR_Button>
                </div>
              </div>
            ))}
          </div>
        </A3Bucket>

        {/* === BUCKET 02 — On your calendar === */}
        <A3Bucket
          index="02" title="On your calendar" tone="ink"
          countLabel={`1 event needs you · ${ev.days} days out`}
          subtitle="You’re hosting Spring Supper. Two confirmations and a seating note are open — handle when you’re ready."
          primary={<ATR_Button variant="ink" size="md">Open event →</ATR_Button>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
            {/* Hero event card */}
            <div style={{
              background: P.ink, color: P.paper, borderRadius: 20,
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
              border: `1px solid ${P.ink}`,
            }}>
              <div style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontFamily: P.font.body, fontSize: 11.5, letterSpacing: '0.08em',
                    color: hexAlpha(P.accent, 1), textTransform: 'uppercase', fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: P.accent }} />
                    Spring Supper · You’re hosting
                  </div>
                  <div style={{
                    fontFamily: P.font.display, fontSize: 22, fontWeight: 600,
                    color: P.paper, letterSpacing: '-0.02em', lineHeight: 1.2,
                  }}>{ev.when}</div>
                  <div style={{ fontSize: 12.5, color: 'rgba(248,241,226,0.7)', marginTop: 4 }}>{ev.where}</div>
                </div>
                <div style={{
                  fontFamily: P.font.display, fontSize: 38, fontWeight: 600,
                  color: P.accent, letterSpacing: '-0.03em', lineHeight: 1, whiteSpace: 'nowrap',
                }}>T−{ev.days}d</div>
              </div>
              <div style={{ padding: '0 22px 18px', marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: P.font.body, fontSize: 11, letterSpacing: '0.06em', color: 'rgba(248,241,226,0.6)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {ev.going}/{ev.capacity} going
                  </span>
                  <span style={{ fontFamily: P.font.body, fontSize: 11, letterSpacing: '0.06em', color: 'rgba(248,241,226,0.6)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {Math.round(ev.going / ev.capacity * 100)}% full
                  </span>
                </div>
                <div style={{ background: 'rgba(248,241,226,0.18)', height: 5, borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ background: P.accent, height: '100%', width: `${Math.round(ev.going / ev.capacity * 100)}%` }} />
                </div>
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, color: 'rgba(248,241,226,0.85)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(248,241,226,0.55)' }}>Open question</span>
                    <span style={{ fontWeight: 600 }}>Confirm Iris’s plus-one</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(248,241,226,0.55)' }}>Co-host</span>
                    <span style={{ fontWeight: 600 }}>Sam Aldridge · ’11</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Smaller upcoming events */}
            {[
              { title: 'Mentor Office Hours · June', when: 'Thu · Jun 5 · 12:00 PM', host: 'Dev Ramachandran · ’09', going: '12/25', days: 22 },
              { title: 'London Walk · Regent’s Park', when: 'Sun · Jun 14 · 11:00 AM', host: 'Priya Sastry · ’16',   going: '7/20',  days: 31 },
            ].map((e, i) => (
              <div key={i} style={{
                background: P.card, border: `1px solid ${P.rule}`, borderRadius: 20,
                padding: 18, display: 'flex', flexDirection: 'column',
                boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)',
              }}>
                <ATR_Tag tone="muted">T−{e.days}d · Upcoming</ATR_Tag>
                <div style={{
                  fontFamily: P.font.display, fontSize: 17, fontWeight: 600,
                  margin: '12px 0 6px', letterSpacing: '-0.015em', lineHeight: 1.2, color: P.ink,
                }}>{e.title}</div>
                <div style={{ fontSize: 12.5, color: P.muted, marginBottom: 4 }}>{e.when}</div>
                <div style={{ fontSize: 12, color: P.mute2 }}>Host · {e.host}</div>
                <div style={{
                  marginTop: 'auto', paddingTop: 12,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontFamily: P.font.body, fontSize: 11, letterSpacing: '0.06em', color: P.mute2, textTransform: 'uppercase', fontWeight: 600 }}>{e.going} going</span>
                  <ATR_Button variant="outline" size="xs">RSVP</ATR_Button>
                </div>
              </div>
            ))}
          </div>
        </A3Bucket>

        {/* === BUCKET 03 — On the wire === */}
        <A3Bucket
          index="03" title="On the wire" tone="ok"
          countLabel={`+${D.stats.newThisWeek} new · no action needed`}
          subtitle="A scan column. Nothing here demands a reply — but a name might catch your eye."
          primary={<ATR_Button variant="outline" size="md">Browse the directory →</ATR_Button>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'stretch' }}>
            {/* New joiners */}
            <div style={{
              background: P.card, border: `1px solid ${P.rule}`, borderRadius: 20, padding: 20,
              boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)',
            }}>
              <ATR_Eyebrow color={P.mute2}>Recently joined · last 14 days</ATR_Eyebrow>
              <div style={{
                marginTop: 14,
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
              }}>
                {D.newJoiners.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column', gap: 10,
                    padding: 14, background: P.cardAlt, borderRadius: 14,
                    border: `1px solid ${P.ruleSoft}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <ATR_Avatar name={m.name} initials={m.initials} size={36} />
                      <ATR_Tag tone="ok">● {m.joined}</ATR_Tag>
                    </div>
                    <div>
                      <div style={{
                        fontFamily: P.font.display, fontSize: 14.5, fontWeight: 600,
                        letterSpacing: '-0.01em', lineHeight: 1.2, color: P.ink,
                      }}>{m.name}</div>
                      <div style={{ fontSize: 11.5, color: P.muted, marginTop: 3 }}>{m.cohort} · {m.city}</div>
                    </div>
                    <div style={{ fontSize: 12.5, color: P.ink2, lineHeight: 1.45 }}>{m.title}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity */}
            <div style={{
              background: P.card, border: `1px solid ${P.rule}`, borderRadius: 20, padding: 20,
              boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)',
            }}>
              <ATR_Eyebrow color={P.mute2}>Recent activity · 7 days</ATR_Eyebrow>
              <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0' }}>
                {[
                  { who: 'Iris Okonkwo',     what: 'requested mentorship',     when: '3h', tone: 'accent' },
                  { who: 'Dev Ramachandran', what: 'sent you a friend req.',   when: '1d', tone: 'ok' },
                  { who: 'Priya Sastry',     what: 'posted in #design-leads',  when: '1d', tone: 'muted' },
                  { who: 'Sam Aldridge',     what: 'accepted your intro',      when: '2d', tone: 'ink' },
                  { who: 'Spring Supper',    what: 'is six days away',         when: '2d', tone: 'warn' },
                ].map((a, i, arr) => (
                  <li key={i} style={{
                    display: 'grid', gridTemplateColumns: '1fr auto', gap: 10,
                    padding: '10px 0', borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${P.ruleSoft}`,
                    alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 12.5, lineHeight: 1.4 }}>
                      <strong style={{ fontWeight: 600, color: P.ink }}>{a.who}</strong>{' '}
                      <span style={{ color: P.muted }}>{a.what}</span>
                    </span>
                    <span style={{ fontFamily: P.font.body, fontSize: 11, color: P.mute2, fontWeight: 600 }}>{a.when}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </A3Bucket>
      </div>
    </div>
  );
}

// Bucket wrapper: soft divider, big title, tone-tinted count tag, primary
function A3Bucket({ index, title, countLabel, subtitle, tone, primary, children }) {
  const P = ATRIUM;
  const dot = ({ accent: P.accent, ink: P.ink, ok: P.ok, warn: P.warn })[tone] || P.muted;
  return (
    <section>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto', gap: 16,
        alignItems: 'flex-end', paddingBottom: 16, marginBottom: 18,
        borderBottom: `1px solid ${P.rule}`,
      }}>
        <div>
          <ATR_Eyebrow color={P.mute2}>§ {index}</ATR_Eyebrow>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
            <h2 style={{
              fontFamily: P.font.display, fontSize: 30, fontWeight: 500,
              margin: 0, letterSpacing: '-0.025em', color: P.ink, lineHeight: 1.05,
            }}>{title}</h2>
            <ATR_Tag tone={tone}>● {countLabel}</ATR_Tag>
          </div>
          {subtitle ? (
            <div style={{ fontSize: 13.5, color: P.muted, marginTop: 10, maxWidth: 760, lineHeight: 1.55, textWrap: 'pretty' }}>
              {subtitle}
            </div>
          ) : null}
        </div>
        {primary}
      </div>
      {children}
    </section>
  );
}

window.A3ThreeBuckets = A3ThreeBuckets;
