/* eslint-disable */
// V1 — PICK A PATH (task launcher)
// Rationale: BridgeCircle is a need-based product. People show up a handful
// of times a year, with an intent in mind: find a mentor, reach my cohort,
// see who's around, RSVP to a thing. The old "Today List" framed the home
// as a daily inbox — wrong shape for this product. This variant treats the
// home as a launcher: a wide field of intent cards, the user picks one,
// the app routes them.
//
// No "today" anywhere. The only time-anchored items are scoped to specific
// objects (a single event you're hosting, a single waiting thread).

function V1TodayList() {
  const P = CIVIC;
  const D = HOME_DATA;

  // Six intents. Counts are object-scoped facts (not "today"-facts).
  const paths = [
    {
      idx: '01',
      verb: 'Find a mentor',
      sub: 'Filter the directory by craft, cohort, city, or what you’re working through. Send an intro when you find a fit.',
      count: D.stats.openMentors, countLabel: 'open to mentor',
      foot: 'Avg. reply within 4 days · 78% accept rate',
      tone: P.ink, primary: true,
    },
    {
      idx: '02',
      verb: 'Browse the network',
      sub: 'Everyone in the Hartwood circle — by cohort, by city, by what they’re building. No agenda, just look around.',
      count: '1,284', countLabel: 'members',
      foot: '53 cities · 17 cohorts · class of ’03–’24',
      tone: P.ink,
    },
    {
      idx: '03',
      verb: 'Look at upcoming gatherings',
      sub: 'Suppers, walks, office hours, and the occasional working session. RSVP when one catches your eye.',
      count: D.stats.openMentors >= 0 ? 14 : 0, countLabel: 'on the calendar',
      foot: 'Next: Spring Supper · Brooklyn · in 6 days',
      tone: P.ink,
    },
    {
      idx: '04',
      verb: 'Reply to waiting threads',
      sub: 'People who reached out and haven’t heard back. Nothing here is on fire — answer when you have the bandwidth.',
      count: D.pending.length, countLabel: 'waiting on you',
      foot: `Oldest: Lena Park · ${D.pending[0].days} days`,
      tone: P.accent, accent: true,
    },
    {
      idx: '05',
      verb: 'See who’s new',
      sub: `${D.stats.newThisWeek} people joined since you were last here — folks who might be worth a hello.`,
      count: D.stats.newThisWeek, countLabel: 'since your last visit',
      foot: `Last visit · ${D.viewer.lastVisit} · ${D.viewer.daysAway} days ago`,
      tone: P.ok,
    },
    {
      idx: '06',
      verb: 'Update your profile',
      sub: 'Mentor preferences, what you’re working on, whether you’re open to intros. The directory uses this to match you.',
      count: '64%', countLabel: 'complete',
      foot: 'Missing: current focus, two photos, mentor capacity',
      tone: P.muted,
    },
  ];

  return (
    <div style={{
      width: '100%', height: '100%', background: P.paper, color: P.ink,
      fontFamily: P.font.body, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <V2Header />

      <V2Greeting
        headline={<>Welcome back, Maren. <span style={{ color: P.muted }}>What brings you in?</span></>}
        sub={`Pick a path below. The Hartwood circle has grown by ${D.stats.newThisWeek} since your last visit on ${D.viewer.lastVisit}.`}
      />

      <div style={{
        padding: '28px 32px 32px',
        maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box', flex: 1,
      }}>
        <V2Section
          index="01"
          title="Where would you like to go?"
          count={`${paths.length} ways in`}
          action={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <V2Button variant="ghost" size="sm">⌘K · Search anything</V2Button>
              <V2Button variant="ghost" size="sm">Get a suggestion</V2Button>
            </div>
          }
        />

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
          borderTop: `1px solid ${P.ink}`, borderLeft: `1px solid ${P.ruleSoft}`,
        }}>
          {paths.map((p, i) => <V1PathCard key={p.idx} path={p} index={i} />)}
        </div>

        {/* Quiet "anything urgent?" footer — keeps the page honest without
            pretending the user has a daily inbox to clear. */}
        <div style={{
          marginTop: 22, padding: '14px 18px',
          border: `1px solid ${P.ruleSoft}`, background: P.panel,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
        }}>
          <div style={{ fontSize: 13, color: P.muted, lineHeight: 1.55, maxWidth: 720 }}>
            Nothing on BridgeCircle is time-sensitive by default. If something is — a near-term RSVP, a thread sitting more than two weeks — we’ll surface it here.{' '}
            <strong style={{ color: P.ink, fontWeight: 600 }}>One item is sitting that long right now</strong> · Lena Park, 4 days.
          </div>
          <V2Button variant="ghost" size="sm">See it →</V2Button>
        </div>
      </div>
    </div>
  );
}

function V1PathCard({ path: p, index }) {
  const P = CIVIC;
  const colInRow = index % 3;
  const rowIndex = Math.floor(index / 3);
  return (
    <div style={{
      borderRight: `1px solid ${P.ruleSoft}`,
      borderBottom: `1px solid ${P.ruleSoft}`,
      background: p.primary ? P.panel : P.card,
      padding: '24px 22px 22px',
      display: 'flex', flexDirection: 'column', gap: 14,
      minHeight: 260, cursor: 'pointer',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <span style={{
          fontFamily: P.font.mono, fontSize: 10.5, letterSpacing: '0.18em',
          color: P.mute2, textTransform: 'uppercase',
        }}>§ {p.idx}</span>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: P.font.display, fontSize: 28, fontWeight: 600,
            color: p.tone, letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          }}>{p.count}</div>
          <div style={{
            fontFamily: P.font.mono, fontSize: 9.5, letterSpacing: '0.14em',
            color: P.mute2, textTransform: 'uppercase', marginTop: 4,
          }}>{p.countLabel}</div>
        </div>
      </div>

      <div>
        <div style={{
          fontFamily: P.font.display, fontSize: 22, fontWeight: 600,
          letterSpacing: '-0.02em', color: P.ink, lineHeight: 1.15,
        }}>{p.verb} →</div>
        <div style={{
          fontSize: 13, color: P.muted, marginTop: 8, lineHeight: 1.55,
          textWrap: 'pretty',
        }}>{p.sub}</div>
      </div>

      <div style={{
        marginTop: 'auto', paddingTop: 12,
        borderTop: `1px solid ${P.ruleSoft}`,
        fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.14em',
        color: p.accent ? p.tone : P.mute2, textTransform: 'uppercase',
      }}>
        {p.accent ? '● ' : ''}{p.foot}
      </div>
    </div>
  );
}

window.V1TodayList = V1TodayList;
