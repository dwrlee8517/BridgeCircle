/* eslint-disable */
// V2 — SINCE YOU WERE LAST HERE (catch-up digest)
// Rationale: This is not an app people open daily — they show up after weeks
// or months. The honest greeting is a catch-up, not a today-list. The hero
// is a digest of what changed since the user's last visit, organized by
// the things they care about (their cohort, their craft, their city), not
// by what's "due."
//
// No "today's priority" framing. The waiting threads are still listed, but
// in the "still waiting" sense, not the "today" sense.

function V2TheBrief() {
  const P = CIVIC;
  const D = HOME_DATA;
  const ev = D.event;

  return (
    <div style={{
      width: '100%', height: '100%', background: P.paper, color: P.ink,
      fontFamily: P.font.body, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <V2Header />

      <V2Greeting
        headline={<>It’s been {D.viewer.daysAway} days. <span style={{ color: P.muted }}>Here’s what changed in the circle.</span></>}
        sub={`Last visit ${D.viewer.lastVisit}. A short digest of what’s new in the corners of Hartwood you tend to care about — your cohort, design leadership, and Brooklyn.`}
      />

      <div style={{
        flex: 1, padding: '28px 32px 32px',
        maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box',
        display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'flex-start',
      }}>
        {/* === HERO — the digest === */}
        <div>
          <V2DigestHero />

          {/* Still-waiting list — quietly framed. NOT "today." */}
          <div style={{ marginTop: 36 }}>
            <V2Section
              index="02"
              title="Still waiting on you"
              count={`${D.pending.length} threads`}
              action={<V2Button variant="ghost" size="sm">Open inbox →</V2Button>}
            />
            <div style={{
              padding: '12px 16px', background: P.panel, border: `1px solid ${P.ruleSoft}`,
              fontSize: 12.5, color: P.muted, marginBottom: 12, lineHeight: 1.55,
            }}>
              These have been here since before your last visit. None are urgent — answer when you have time, or send a polite decline.
            </div>
            <div style={{ borderTop: `1px solid ${P.ink}` }}>
              {D.pending.map((r, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 14,
                  padding: '14px 0', borderBottom: `1px solid ${P.ruleSoft}`,
                  alignItems: 'center',
                }}>
                  <MockAvatar name={r.name} initials={r.initials} size={36} palette={P} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: P.ink }}>{r.name}</span>
                      <span style={{
                        fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.14em',
                        color: P.muted, textTransform: 'uppercase',
                      }}>{r.cohort} · {r.title}</span>
                      <span style={{
                        fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.14em',
                        color: P.mute2, textTransform: 'uppercase', marginLeft: 'auto',
                      }}>● sitting {r.days}d</span>
                    </div>
                    <div style={{
                      fontSize: 12.5, color: P.muted, marginTop: 3, lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>“{r.body}”</div>
                  </div>
                  <V2Button variant="ghost" size="sm">Open →</V2Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === SIDEBAR — Welcome back + one event + new in your cohort === */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Welcome-back card — frames the visit cadence honestly */}
          <div style={{ border: `1px solid ${P.ink}`, background: P.ink, color: P.paper, padding: 20 }}>
            <div style={{
              fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.18em',
              color: P.accent, textTransform: 'uppercase', marginBottom: 14,
            }}>● Welcome back</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontFamily: P.font.display, fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, color: P.paper }}>
                  {D.viewer.daysAway}d
                </div>
                <div style={{ fontFamily: P.font.mono, fontSize: 9.5, letterSpacing: '0.14em', color: 'rgba(250,250,247,0.6)', textTransform: 'uppercase', marginTop: 4 }}>
                  since last visit
                </div>
              </div>
              <div>
                <div style={{ fontFamily: P.font.display, fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, color: P.paper }}>
                  {D.viewer.visitsThisYear}
                </div>
                <div style={{ fontFamily: P.font.mono, fontSize: 9.5, letterSpacing: '0.14em', color: 'rgba(250,250,247,0.6)', textTransform: 'uppercase', marginTop: 4 }}>
                  visits this year
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: 'rgba(250,250,247,0.75)', marginTop: 14, lineHeight: 1.55 }}>
              Most people drop in every month or two. We hold things until you’re ready.
            </div>
          </div>

          {/* One coming event — the only date-anchored item, kept event-scoped */}
          <div style={{ border: `1px solid ${P.rule}`, background: P.card }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${P.ruleSoft}`, background: P.panel }}>
              <V2Eyebrow color={P.muted}>§ 03 · One gathering on the books</V2Eyebrow>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{
                fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.14em',
                color: P.accent, textTransform: 'uppercase',
              }}>● You’re hosting</div>
              <div style={{
                fontFamily: P.font.display, fontSize: 20, fontWeight: 600,
                lineHeight: 1.15, margin: '6px 0 4px', letterSpacing: '-0.01em',
              }}>{ev.title}</div>
              <div style={{ fontSize: 12.5, color: P.muted }}>{ev.when}</div>
              <div style={{ fontSize: 12.5, color: P.muted, marginTop: 2 }}>{ev.where}</div>
              <div style={{ marginTop: 14, padding: '10px 0', borderTop: `1px solid ${P.ruleSoft}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.14em', color: P.muted, textTransform: 'uppercase' }}>
                    {ev.going}/{ev.capacity} confirmed
                  </span>
                  <span style={{ fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.14em', color: P.muted, textTransform: 'uppercase' }}>
                    {Math.round(ev.going / ev.capacity * 100)}% full
                  </span>
                </div>
                <div style={{ background: P.panel, height: 4 }}>
                  <div style={{ background: P.accent, height: '100%', width: `${Math.round(ev.going / ev.capacity * 100)}%` }} />
                </div>
              </div>
              <V2Button variant="primary" size="sm" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}>Open event →</V2Button>
            </div>
          </div>

          {/* New in your cohort */}
          <div style={{ border: `1px solid ${P.rule}`, background: P.card }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${P.ruleSoft}`, background: P.panel }}>
              <V2Eyebrow color={P.muted}>§ 04 · New since you were here</V2Eyebrow>
            </div>
            {D.newJoiners.map((m, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 10,
                padding: '12px 16px', borderBottom: i === D.newJoiners.length - 1 ? 'none' : `1px solid ${P.ruleSoft}`,
                alignItems: 'center',
              }}>
                <MockAvatar name={m.name} initials={m.initials} size={28} palette={P} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: P.ink }}>{m.name}</div>
                  <div style={{ fontSize: 11.5, color: P.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.cohort} · {m.city}
                  </div>
                </div>
                <span style={{
                  fontFamily: P.font.mono, fontSize: 9.5, letterSpacing: '0.14em',
                  color: P.muted, textTransform: 'uppercase',
                }}>{m.joined}</span>
              </div>
            ))}
            <div style={{ padding: '10px 16px', background: P.panel, display: 'flex', justifyContent: 'flex-end' }}>
              <V2Button variant="ghost" size="xs">All 12 new →</V2Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// The digest hero — a single big card with four "since you were last here"
// sections. The whole thing is a recap, not a to-do.
function V2DigestHero() {
  const P = CIVIC;
  const D = HOME_DATA;

  const buckets = [
    {
      idx: '01',
      title: 'In your cohort (’14)',
      count: '4',
      summary: 'Four classmates posted updates worth catching up on.',
      items: [
        { who: 'Cassie Wen',  did: 'moved from Stripe to launch a payroll startup', when: '11d' },
        { who: 'Owen Ito',    did: 'is hiring a founding designer in Lisbon',       when: '8d'  },
        { who: 'Lila Roth',   did: 'published a piece on dual-class governance',    when: '5d'  },
      ],
    },
    {
      idx: '02',
      title: 'In your craft (design leadership)',
      count: '2',
      summary: 'Two threads in the design-leads channel you usually read.',
      items: [
        { who: 'Priya Sastry',     did: 'asked how others structure crit at 8-person teams', when: '6d' },
        { who: 'Dev Ramachandran', did: 'shared his director hiring-loop template',         when: '6d' },
      ],
    },
    {
      idx: '03',
      title: 'In your city (Brooklyn)',
      count: '6',
      summary: 'Six newly Brooklyn-based members and one gathering nearby.',
      items: [
        { who: 'Iris Okonkwo', did: 'joined · Founder, The Long Take Co.', when: '3d' },
        { who: 'Two others',   did: 'relocated to Brooklyn this month',    when: '—'  },
        { who: 'Spring Supper', did: 'is at the Hartwood House next Tuesday', when: 'T−6d' },
      ],
    },
    {
      idx: '04',
      title: 'In the wider circle',
      count: `+${D.stats.newThisWeek}`,
      summary: `${D.stats.newThisWeek} new members across 7 cities. Worth a scan.`,
      items: [
        { who: 'New members', did: '12 joined · most in NYC, SF, London', when: D.viewer.daysAway + 'd' },
        { who: 'Open mentors', did: `${D.stats.openMentors} accepting requests right now`, when: '—' },
        { who: 'Events',  did: '14 on the calendar over the next 90 days', when: '—' },
      ],
    },
  ];

  return (
    <div style={{ border: `2px solid ${P.ink}`, background: P.card }}>
      {/* Header strip */}
      <div style={{
        padding: '14px 24px', background: P.ink, color: P.paper,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{
          fontFamily: P.font.mono, fontSize: 10.5, letterSpacing: '0.18em',
          textTransform: 'uppercase', fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: P.accent }} />
          § 01 · The catch-up · {D.viewer.lastVisit} → today
        </div>
        <div style={{
          fontFamily: P.font.mono, fontSize: 10.5, letterSpacing: '0.14em',
          color: 'rgba(250,250,247,0.7)', textTransform: 'uppercase',
        }}>
          Curated · not a feed
        </div>
      </div>

      {/* Big top-line summary */}
      <div style={{ padding: '24px 28px 18px', borderBottom: `1px solid ${P.ruleSoft}` }}>
        <div style={{
          fontFamily: P.font.display, fontSize: 26, fontWeight: 500,
          letterSpacing: '-0.02em', color: P.ink, lineHeight: 1.25,
          maxWidth: 760, textWrap: 'pretty',
        }}>
          Since you were last here, <strong style={{ fontWeight: 700 }}>{D.stats.newThisWeek} people</strong> joined,{' '}
          <strong style={{ fontWeight: 700 }}>4 classmates</strong> from ’14 posted, and{' '}
          <strong style={{ fontWeight: 700 }}>one gathering</strong> in Brooklyn opened up that you might want.
        </div>
      </div>

      {/* Four buckets, two-by-two */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
      }}>
        {buckets.map((b, i) => (
          <div key={b.idx} style={{
            padding: '20px 24px',
            borderRight: i % 2 === 0 ? `1px solid ${P.ruleSoft}` : 'none',
            borderBottom: i < 2 ? `1px solid ${P.ruleSoft}` : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <V2Eyebrow color={P.muted}>§ {b.idx} · {b.title}</V2Eyebrow>
              <span style={{
                fontFamily: P.font.display, fontSize: 22, fontWeight: 600,
                color: P.ink, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
              }}>{b.count}</span>
            </div>
            <div style={{ fontSize: 13, color: P.ink2, marginBottom: 12, lineHeight: 1.5 }}>{b.summary}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderTop: `1px solid ${P.ruleSoft}` }}>
              {b.items.map((it, j) => (
                <li key={j} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 10,
                  padding: '8px 0', borderBottom: j === b.items.length - 1 ? 'none' : `1px solid ${P.ruleSoft}`,
                  fontSize: 12.5, lineHeight: 1.45,
                }}>
                  <span><strong style={{ fontWeight: 600, color: P.ink }}>{it.who}</strong> <span style={{ color: P.muted }}>{it.did}</span></span>
                  <span style={{ fontFamily: P.font.mono, fontSize: 9.5, letterSpacing: '0.14em', color: P.mute2, textTransform: 'uppercase' }}>{it.when}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Action row */}
      <div style={{
        padding: '16px 24px', borderTop: `1px solid ${P.ruleSoft}`, background: P.panel,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 12.5, color: P.muted, lineHeight: 1.5 }}>
          The digest assembles every time you visit. Nothing here is on a clock.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <V2Button variant="outline" size="md">Tune what I see</V2Button>
          <V2Button variant="primary" size="md">Browse the directory →</V2Button>
        </div>
      </div>
    </div>
  );
}

window.V2TheBrief = V2TheBrief;
