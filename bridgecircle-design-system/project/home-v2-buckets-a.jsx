/* eslint-disable */
// V3 — THREE BUCKETS
// The current bento's three tiles weren't *kinds of work* — they were just
// stats. This variant keeps the bento shape but renames the buckets by
// what they ask of you: "On your desk" (replies you owe), "On your
// calendar" (RSVPs and prep), "On the wire" (no action required, but worth
// scanning). Each bucket has a count, a primary verb, and 2–3 items.
//
// Why this works for "knows what to do": every section ends in a single
// clear button. The header tells you the verb.

function V3ThreeBuckets() {
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
        headline={<>Three things wait for you, one event needs you, twelve people joined.</>}
        sub="Each row below is a category of work, with its count and a primary action. Top to bottom, the page asks less of you."
      />

      <V2KPIStrip items={[
        { label: 'On your desk',     value: D.stats.mentees,           sub: 'replies',  color: P.accent },
        { label: 'On your calendar', value: `T−${ev.days}d`,           sub: 'to supper', color: P.ink },
        { label: 'On the wire',      value: `+${D.stats.newThisWeek}`, sub: 'new',       color: P.ok },
        { label: 'Open mentors',     value: D.stats.openMentors,       sub: 'directory', color: P.muted },
      ]} />

      <div style={{
        flex: 1, padding: '28px 32px 16px',
        maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: 36,
      }}>

        {/* === BUCKET 01 — On your desk === */}
        <BucketSection
          index="01" title="On your desk" count={`${D.pending.length} replies you owe`}
          tone={P.accent}
          subtitle="People who have asked for your time. Sorted by how long they've been waiting."
          primary={<V2Button variant="primary" size="md">Open inbox →</V2Button>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {D.pending.map((p, i) => (
              <div key={i} style={{
                border: `1px solid ${P.rule}`, background: P.card,
                padding: 18, display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <MockAvatar name={p.name} initials={p.initials} size={40} palette={P} />
                  <span style={{
                    fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.14em',
                    color: p.days >= 4 ? P.warn : P.muted, textTransform: 'uppercase',
                    border: `1px solid ${p.days >= 4 ? P.warn : P.rule}`,
                    padding: '2px 6px', borderRadius: 2,
                  }}>● {p.days}d waiting</span>
                </div>
                <div>
                  <div style={{ fontFamily: P.font.display, fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>{p.name}</div>
                  <div style={{
                    fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.14em',
                    color: P.muted, textTransform: 'uppercase', marginTop: 3,
                  }}>{p.cohort} · {p.title}</div>
                </div>
                <p style={{
                  fontSize: 13, color: P.ink2, margin: 0, lineHeight: 1.5,
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>“{p.body}”</p>
                <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 6 }}>
                  <V2Button variant="primary" size="sm" style={{ flex: 1, justifyContent: 'center' }}>Reply</V2Button>
                  <V2Button variant="ghost" size="sm">Skip</V2Button>
                </div>
              </div>
            ))}
          </div>
        </BucketSection>

        {/* === BUCKET 02 — On your calendar === */}
        <BucketSection
          index="02" title="On your calendar" count={`1 event needs you · ${ev.days} days away`}
          tone={P.ink}
          subtitle="You're hosting Spring Supper next Tuesday. Two confirmations and a seating note are open."
          primary={<V2Button variant="primary" size="md">Open event →</V2Button>}
        >
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14,
          }}>
            {/* Hero: Spring Supper card */}
            <div style={{
              border: `1px solid ${P.ink}`, background: P.card, padding: 0,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
              <div style={{
                background: P.ink, color: P.paper, padding: '14px 18px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              }}>
                <div>
                  <V2Eyebrow color="rgba(250,250,247,.7)">Spring Supper · You’re hosting</V2Eyebrow>
                  <div style={{
                    fontFamily: P.font.display, fontSize: 20, fontWeight: 600,
                    margin: '4px 0 0', color: P.paper, letterSpacing: '-0.01em',
                  }}>{ev.when}</div>
                </div>
                <div style={{
                  fontFamily: P.font.display, fontSize: 32, fontWeight: 600,
                  color: P.accent, letterSpacing: '-0.03em', lineHeight: 1,
                }}>T−{ev.days}d</div>
              </div>
              <div style={{ padding: '12px 18px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.14em', color: P.muted, textTransform: 'uppercase' }}>
                    {ev.going}/{ev.capacity} going
                  </span>
                  <span style={{ fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.14em', color: P.muted, textTransform: 'uppercase' }}>
                    {Math.round(ev.going / ev.capacity * 100)}% full
                  </span>
                </div>
                <div style={{ background: P.panel, height: 4, marginBottom: 14 }}>
                  <div style={{ background: P.accent, height: '100%', width: `${Math.round(ev.going / ev.capacity * 100)}%` }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 12.5, color: P.ink2, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: P.muted }}>Open question</span>
                    <span style={{ fontWeight: 500 }}>Confirm Iris’s plus-one</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: P.ink2, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: P.muted }}>Co-host</span>
                    <span style={{ fontWeight: 500 }}>Sam Aldridge · ’11</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Smaller upcoming events */}
            {[
              { title: 'Mentor Office Hours · June', when: 'Thu · Jun 5 · 12:00 PM', host: 'Dev Ramachandran · ’09', going: '12/25', days: 22 },
              { title: 'London Walk · Regent’s Park', when: 'Sun · Jun 14 · 11:00 AM', host: 'Priya Sastry · ’16',   going: '7/20',  days: 31 },
            ].map((e, i) => (
              <div key={i} style={{ border: `1px solid ${P.rule}`, background: P.card, padding: 16, display: 'flex', flexDirection: 'column' }}>
                <V2Eyebrow color={P.muted}>T−{e.days}d · Upcoming</V2Eyebrow>
                <div style={{ fontFamily: P.font.display, fontSize: 16, fontWeight: 600, margin: '8px 0 4px', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{e.title}</div>
                <div style={{ fontSize: 12, color: P.muted, marginBottom: 4 }}>{e.when}</div>
                <div style={{ fontSize: 11.5, color: P.muted }}>Host · {e.host}</div>
                <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.14em', color: P.muted, textTransform: 'uppercase' }}>{e.going} going</span>
                  <V2Button variant="ghost" size="xs">RSVP</V2Button>
                </div>
              </div>
            ))}
          </div>
        </BucketSection>

        {/* === BUCKET 03 — On the wire === */}
        <BucketSection
          index="03" title="On the wire" count={`+${D.stats.newThisWeek} new this week · no action needed`}
          tone={P.ok}
          subtitle="A scan column. Nothing here demands a reply — but a name might catch your eye."
          primary={<V2Button variant="ghost" size="md">Browse the directory →</V2Button>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, alignItems: 'stretch' }}>
            {/* New joiners */}
            <div style={{ border: `1px solid ${P.rule}`, background: P.card, padding: 18 }}>
              <V2Eyebrow color={P.muted}>Recently joined · last 14 days</V2Eyebrow>
              <div style={{
                marginTop: 12,
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
              }}>
                {D.newJoiners.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column', gap: 8,
                    padding: 12, border: `1px solid ${P.ruleSoft}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <MockAvatar name={m.name} initials={m.initials} size={32} palette={P} />
                      <span style={{ fontFamily: P.font.mono, fontSize: 9.5, letterSpacing: '0.14em', color: P.ok, textTransform: 'uppercase' }}>● {m.joined}</span>
                    </div>
                    <div>
                      <div style={{ fontFamily: P.font.display, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{m.name}</div>
                      <div style={{ fontFamily: P.font.mono, fontSize: 9.5, letterSpacing: '0.12em', color: P.muted, textTransform: 'uppercase', marginTop: 3 }}>{m.cohort} · {m.city}</div>
                    </div>
                    <div style={{ fontSize: 12, color: P.ink2, lineHeight: 1.4 }}>{m.title}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity feed */}
            <div style={{ border: `1px solid ${P.rule}`, background: P.card, padding: 18 }}>
              <V2Eyebrow color={P.muted}>Recent activity · 7 days</V2Eyebrow>
              <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', borderTop: `1px solid ${P.ink}` }}>
                {[
                  { who: 'Iris Okonkwo',     what: 'requested mentorship',    when: '3h', mark: 'A', tone: P.accent },
                  { who: 'Dev Ramachandran', what: 'sent you a friend req.',  when: '1d', mark: 'F', tone: P.ok },
                  { who: 'Priya Sastry',     what: 'posted in #design-leads', when: '1d', mark: 'P', tone: P.muted },
                  { who: 'Sam Aldridge',     what: 'accepted your intro',     when: '2d', mark: 'I', tone: P.ink },
                  { who: 'Spring Supper',    what: 'is six days away',        when: '2d', mark: 'E', tone: P.warn },
                ].map((a, i) => (
                  <li key={i} style={{
                    display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: 10,
                    padding: '10px 0', borderBottom: `1px solid ${P.ruleSoft}`, alignItems: 'center',
                  }}>
                    <span style={{
                      fontFamily: P.font.mono, fontSize: 9.5, color: a.tone,
                      border: `1px solid ${a.tone}`,
                      width: 18, height: 18, display: 'grid', placeItems: 'center', fontWeight: 600,
                    }}>{a.mark}</span>
                    <span style={{ fontSize: 12.5 }}>
                      <strong style={{ fontWeight: 600 }}>{a.who}</strong> <span style={{ color: P.muted }}>{a.what}</span>
                    </span>
                    <span style={{ fontFamily: P.font.mono, fontSize: 9.5, letterSpacing: '0.14em', color: P.mute2, textTransform: 'uppercase' }}>{a.when}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </BucketSection>
      </div>
    </div>
  );
}

// Bucket section wrapper — header + primary CTA + child content.
function BucketSection({ index, title, count, subtitle, tone, primary, children }) {
  const P = CIVIC;
  return (
    <section>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto', gap: 16,
        alignItems: 'flex-end', borderTop: `2px solid ${P.ink}`, paddingTop: 14, marginBottom: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: P.font.mono, fontSize: 10.5, letterSpacing: '0.16em',
              color: P.muted, textTransform: 'uppercase',
            }}>{`§ ${index}`}</span>
            <h2 style={{
              fontFamily: P.font.display, fontSize: 26, fontWeight: 600,
              margin: 0, letterSpacing: '-0.025em', color: P.ink,
            }}>{title}</h2>
            <span style={{
              fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.14em',
              color: tone, textTransform: 'uppercase',
              padding: '3px 7px', border: `1px solid ${tone}`, borderRadius: 2,
            }}>● {count}</span>
          </div>
          {subtitle ? (
            <div style={{ fontSize: 13.5, color: P.muted, marginTop: 6, maxWidth: 720, lineHeight: 1.55 }}>
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

window.V3ThreeBuckets = V3ThreeBuckets;
