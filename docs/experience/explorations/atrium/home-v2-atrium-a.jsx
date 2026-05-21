/* eslint-disable */
// Atrium V1 — PICK A PATH
// Same intent-launcher idea as the Civic version, in Atrium's vocabulary:
// soft warm cards, terracotta accent, pill buttons, gradient avatars. The
// grid is 2×3 with bigger cards (Atrium runs at a more roomy density).

function A1PickPath() {
  const P = ATRIUM;
  const D = HOME_DATA;

  const paths = [
    {
      idx: '01',
      verb: 'Find a mentor',
      sub: 'Filter the directory by craft, cohort, city, or what you’re working through. Send an intro when you find a fit.',
      count: D.stats.openMentors, countLabel: 'open to mentor',
      foot: 'Avg. reply within 4 days · 78% accept',
      tone: P.accent, lead: true,
    },
    {
      idx: '02',
      verb: 'Browse the network',
      sub: 'Everyone in the Hartwood circle — by cohort, by city, by what they’re building. No agenda, just look around.',
      count: '1,284', countLabel: 'members',
      foot: '53 cities · 17 cohorts · ’03–’24',
      tone: P.ink,
    },
    {
      idx: '03',
      verb: 'Look at gatherings',
      sub: 'Suppers, walks, office hours, and the occasional working session. RSVP when one catches your eye.',
      count: '14', countLabel: 'on the calendar',
      foot: 'Next: Spring Supper · Brooklyn',
      tone: P.ok,
    },
    {
      idx: '04',
      verb: 'Reply to waiting threads',
      sub: 'People who reached out and haven’t heard back. Nothing here is on fire — answer when you have the bandwidth.',
      count: D.pending.length, countLabel: 'waiting on you',
      foot: `Oldest: Lena Park · ${D.pending[0].days} days`,
      tone: P.accent, attention: true,
    },
    {
      idx: '05',
      verb: 'See who’s new',
      sub: `${D.stats.newThisWeek} people joined since you were last here — folks who might be worth a hello.`,
      count: D.stats.newThisWeek, countLabel: 'since your last visit',
      foot: `${D.viewer.daysAway} days ago · ${D.viewer.lastVisit}`,
      tone: P.ok,
    },
    {
      idx: '06',
      verb: 'Update your profile',
      sub: 'Mentor preferences, what you’re working on, whether you’re open to intros. The directory uses this to match you.',
      count: '64%', countLabel: 'complete',
      foot: 'Missing: focus, two photos, capacity',
      tone: P.muted,
    },
  ];

  return (
    <div style={{
      width: '100%', height: '100%', background: P.paper, color: P.ink,
      fontFamily: P.font.body, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <ATR_Header />

      <ATR_Greeting
        eyebrow={`Welcome back, ${D.viewer.firstName} · Class of ${D.viewer.cohort}`}
        headline={<>What brings you back to the circle?</>}
        sub={`Pick a path below. ${D.stats.newThisWeek} new members have joined since your last visit on ${D.viewer.lastVisit}.`}
        kicker={
          <div>
            <ATR_Eyebrow color={P.mute2}>Visit cadence</ATR_Eyebrow>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <div>
                <div style={{ fontFamily: P.font.display, fontSize: 26, fontWeight: 600, color: P.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>{D.viewer.daysAway}d</div>
                <div style={{ fontSize: 11, color: P.mute2, marginTop: 2 }}>since last visit</div>
              </div>
              <div style={{ height: 28, width: 1, background: P.rule }} />
              <div>
                <div style={{ fontFamily: P.font.display, fontSize: 26, fontWeight: 600, color: P.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>{D.viewer.visitsThisYear}</div>
                <div style={{ fontSize: 11, color: P.mute2, marginTop: 2 }}>visits this year</div>
              </div>
            </div>
          </div>
        }
      />

      <div style={{
        padding: '6px 32px 32px',
        maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box', flex: 1,
      }}>
        <ATR_Section
          eyebrow="§ 01 · Six ways in"
          title="Where would you like to go?"
          action={
            <div style={{ display: 'flex', gap: 8 }}>
              <ATR_Button variant="outline" size="sm">Get a suggestion</ATR_Button>
              <ATR_Button variant="ghost" size="sm">⌘K · Search anything</ATR_Button>
            </div>
          }
        />

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18,
        }}>
          {paths.map(p => <A1PathCard key={p.idx} path={p} />)}
        </div>

        {/* Quiet reassurance footer */}
        <div style={{
          marginTop: 24, padding: '16px 22px',
          background: P.cardAlt, border: `1px solid ${P.rule}`, borderRadius: 16,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
        }}>
          <div style={{ fontSize: 13.5, color: P.muted, lineHeight: 1.55, maxWidth: 760 }}>
            Nothing on Hartwood is time-sensitive by default. We hold your threads until you’re ready, and we don’t send between-visit nudges.{' '}
            <strong style={{ color: P.ink, fontWeight: 600 }}>One item has been sitting longer than two weeks</strong> — Lena Park, 4 days.
          </div>
          <ATR_Button variant="outline" size="sm">See it →</ATR_Button>
        </div>
      </div>
    </div>
  );
}

function A1PathCard({ path: p }) {
  const P = ATRIUM;
  return (
    <div style={{
      background: p.lead ? P.card : P.cardAlt,
      border: `1px solid ${p.lead ? P.ink : P.rule}`,
      borderRadius: 20,
      padding: '24px 22px 22px',
      display: 'flex', flexDirection: 'column', gap: 14,
      minHeight: 280, cursor: 'pointer',
      boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Soft accent corner glyph for the lead card */}
      {p.lead ? (
        <div aria-hidden style={{
          position: 'absolute', right: -40, top: -40,
          width: 140, height: 140, borderRadius: 999,
          background: hexAlpha(P.accent, 0.10),
        }} />
      ) : null}

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, position: 'relative' }}>
        <ATR_Eyebrow color={P.mute2}>§ {p.idx}</ATR_Eyebrow>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: P.font.display, fontSize: 34, fontWeight: 600,
            color: p.tone, letterSpacing: '-0.025em', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          }}>{p.count}</div>
          <div style={{
            fontFamily: P.font.body, fontSize: 11, letterSpacing: '0.08em',
            color: P.mute2, textTransform: 'uppercase', marginTop: 4, fontWeight: 600,
          }}>{p.countLabel}</div>
        </div>
      </div>

      <div>
        <div style={{
          fontFamily: P.font.display, fontSize: 24, fontWeight: 500,
          letterSpacing: '-0.025em', color: P.ink, lineHeight: 1.1,
        }}>{p.verb}</div>
        <div style={{
          fontSize: 13.5, color: P.muted, marginTop: 10, lineHeight: 1.55,
          textWrap: 'pretty',
        }}>{p.sub}</div>
      </div>

      <div style={{
        marginTop: 'auto', paddingTop: 14,
        borderTop: `1px solid ${P.ruleSoft}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          fontFamily: P.font.body, fontSize: 11.5, letterSpacing: '0.04em',
          color: p.attention ? p.tone : P.mute2, fontWeight: p.attention ? 600 : 500,
        }}>
          {p.attention ? '● ' : ''}{p.foot}
        </span>
        <ATR_Button variant={p.lead ? 'primary' : 'ghost'} size="sm">Open →</ATR_Button>
      </div>
    </div>
  );
}

window.A1PickPath = A1PickPath;
