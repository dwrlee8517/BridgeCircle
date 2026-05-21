/* eslint-disable */
// Home + People screens for the Civic prototype.

// --- Home: Three Buckets ------------------------------------------------
// The home is split into three sections by *kind of work*, not by stat.
//   01 — On your desk      replies you owe
//   02 — On your calendar  RSVPs and hosting prep
//   03 — On the wire       passive scan; no action required
// Each bucket has a count, a tone color, and one primary action.

function CivicGreetingStrip({ headline, sub }) {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  const { VIEWER } = window.BC_DATA;
  return (
    <div style={{
      maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      padding: m ? '20px 14px 16px' : '28px 32px 22px',
    }}>
      <div style={{
        borderTop: `2px solid ${t.palette.ink}`,
        borderBottom: `1px solid ${t.palette.ink}`,
        padding: m ? '12px 0 14px' : '14px 0 18px',
        display: 'flex', flexDirection: m ? 'column' : 'row',
        alignItems: m ? 'flex-start' : 'flex-end',
        justifyContent: 'space-between', gap: m ? 10 : 16,
      }}>
        <div style={{ minWidth: 0 }}>
          <Eyebrow color={t.palette.muted}>
            {m
              ? `${VIEWER.firstName} · '${VIEWER.cohortShort}`
              : `Good afternoon, ${VIEWER.firstName} · Class of ${VIEWER.cohortShort} · The Hartwood Society`}
          </Eyebrow>
          <h1 style={{
            ...t.display, fontSize: m ? 26 : 40, margin: m ? '8px 0 0' : '10px 0 0',
            maxWidth: 960, lineHeight: 1.08,
          }}>{headline}</h1>
          {sub ? (
            <div style={{
              fontSize: m ? 13 : 14, color: t.palette.muted, marginTop: 8,
              maxWidth: 720, lineHeight: 1.55,
            }}>{sub}</div>
          ) : null}
        </div>
        <div style={{
          fontFamily: t.font.mono, fontSize: m ? 9.5 : 10.5, letterSpacing: '0.16em',
          color: t.palette.mute2, whiteSpace: 'nowrap',
          textAlign: m ? 'left' : 'right', textTransform: 'uppercase',
        }}>
          THU 15 MAY 2026{!m && <br />}{m ? ' · ' : ''}
          <span style={{ color: t.palette.accent }}>●</span> Edition 142
        </div>
      </div>
    </div>
  );
}

// KPI strip — 4 stats with mono labels, hairline dividers, baseline-aligned numerals.
function CivicKPIStrip({ items }) {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  return (
    <div style={{
      maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      borderBottom: `1px solid ${t.palette.rule}`,
      padding: m ? '14px 14px' : '14px 32px',
      display: 'grid',
      gridTemplateColumns: m ? '1fr 1fr' : 'repeat(4, 1fr)',
      gap: m ? '14px 0' : 0,
    }}>
      {items.map((it, i) => (
        <div key={i} style={{
          paddingLeft: i === 0 || (m && i === 2) ? 0 : (m ? 14 : 24),
          paddingRight: i === items.length - 1 ? 0 : (m ? 14 : 24),
          borderRight: (m
            ? (i === 0 || i === 2 ? `1px solid ${t.palette.ruleSoft}` : 'none')
            : (i === items.length - 1 ? 'none' : `1px solid ${t.palette.ruleSoft}`)),
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          <div style={{ ...t.eyebrow, color: t.palette.muted }}>{it.label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{
              ...t.display, fontSize: m ? 24 : 28, fontWeight: 600,
              color: it.color || t.palette.ink, letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums', lineHeight: 1,
            }}>{it.value}</span>
            <span style={{ fontSize: 12, color: t.palette.muted }}>{it.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Bucket section wrapper — masthead-style header bar with index, title, count chip, primary action.
function CivicBucketSection({ index, title, count, tone, subtitle, primary, children }) {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  return (
    <section>
      <div style={{
        display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr auto', gap: m ? 12 : 16,
        alignItems: m ? 'flex-start' : 'flex-end',
        borderTop: `2px solid ${t.palette.ink}`, paddingTop: 14, marginBottom: 16,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
            <h2 style={{
              ...t.display, fontSize: m ? 22 : 26, fontWeight: 600,
              margin: 0, letterSpacing: '-0.025em', color: t.palette.ink,
            }}>{title}</h2>
            <span style={{
              fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.14em',
              color: tone, textTransform: 'uppercase',
              padding: '3px 7px', border: `1px solid ${tone}`, borderRadius: 2,
            }}>● {count}</span>
          </div>
          {subtitle ? (
            <div style={{
              fontSize: 13.5, color: t.palette.muted, marginTop: 6,
              maxWidth: 720, lineHeight: 1.55,
            }}>{subtitle}</div>
          ) : null}
        </div>
        {primary ? <div style={{ alignSelf: m ? 'stretch' : 'auto' }}>{primary}</div> : null}
      </div>
      {children}
    </section>
  );
}

// Pending-request card (Bucket 01)
function CivicDeskCard({ req }) {
  const t = React.useContext(ThemeCtx);
  const { goto } = useRoute();
  const days = parseInt(req.sentAt) || 0;
  const warn = days >= 4;
  return (
    <div style={t.cardSurface({
      padding: 12, display: 'flex', flexDirection: 'column', gap: 7,
    })}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <CivicAvatar name={req.from.name} initials={req.from.initials} size={30} />
        <span style={{
          fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.14em',
          color: warn ? t.palette.warn : t.palette.muted, textTransform: 'uppercase',
          border: `1px solid ${warn ? t.palette.warn : t.palette.rule}`,
          padding: '2px 6px', borderRadius: 2, whiteSpace: 'nowrap',
        }}>● {req.sentAt}</span>
      </div>
      <div>
        <div style={{ ...t.display, fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
          {req.from.name}
        </div>
        <div style={{
          fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.14em',
          color: t.palette.muted, textTransform: 'uppercase', marginTop: 3,
        }}>
          ’{String(req.from.year).slice(-2)} · {req.from.title}
        </div>
      </div>
      <p style={{
        fontSize: 13, color: t.palette.ink2, margin: 0, lineHeight: 1.5,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>“{req.body}”</p>
      <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 6 }}>
        <CivicButton variant="primary" size="sm" onClick={() => goto('inbox')}
          style={{ flex: 1, justifyContent: 'center' }}>Reply</CivicButton>
        <CivicButton variant="ghost" size="sm">Skip</CivicButton>
      </div>
    </div>
  );
}

// Hero event card (Bucket 02) — dark band header with progress + open questions.
function CivicEventHero({ event }) {
  const t = React.useContext(ThemeCtx);
  const { goto, setActiveEvent } = useRoute();
  const pct = Math.round(event.going / event.capacity * 100);
  return (
    <div style={{
      border: `1px solid ${t.palette.ink}`, background: t.palette.card,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{
        background: t.palette.ink, color: t.palette.paper, padding: '10px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12,
      }}>
        <div style={{ minWidth: 0 }}>
          <Eyebrow color="rgba(250,250,247,.7)">Spring Supper · You're hosting</Eyebrow>
          <div style={{
            ...t.display, fontSize: 20, fontWeight: 600,
            margin: '4px 0 0', color: t.palette.paper, letterSpacing: '-0.01em',
          }}>{event.when}</div>
        </div>
        <div style={{
          ...t.display, fontSize: 32, fontWeight: 600,
          color: t.palette.accent, letterSpacing: '-0.03em', lineHeight: 1, whiteSpace: 'nowrap',
        }}>T−{event.days}d</div>
      </div>
      <div style={{ padding: '10px 14px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.14em', color: t.palette.muted, textTransform: 'uppercase' }}>
            {event.going}/{event.capacity} going
          </span>
          <span style={{ fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.14em', color: t.palette.muted, textTransform: 'uppercase' }}>
            {pct}% full
          </span>
        </div>
        <div style={{ background: t.palette.panel, height: 4, marginBottom: 14 }}>
          <div style={{ background: t.palette.accent, height: '100%', width: `${pct}%` }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 12.5, color: t.palette.ink2, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ color: t.palette.muted }}>Open question</span>
            <span style={{ fontWeight: 500 }}>Confirm Iris's plus-one</span>
          </div>
          <div style={{ fontSize: 12.5, color: t.palette.ink2, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ color: t.palette.muted }}>Co-host</span>
            <span style={{ fontWeight: 500 }}>Sam Aldridge · ’11</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <CivicButton size="sm" variant="primary" style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => { setActiveEvent && setActiveEvent(event.id); goto('event-detail'); }}>
            Open event
          </CivicButton>
        </div>
      </div>
    </div>
  );
}

// Smaller event card (Bucket 02 right-hand companions)
function CivicEventMini({ event }) {
  const t = React.useContext(ThemeCtx);
  const { goto, setActiveEvent } = useRoute();
  return (
    <div style={t.cardSurface({ padding: 12, display: 'flex', flexDirection: 'column' })}>
      <Eyebrow color={t.palette.muted}>T−{event.days}d · Upcoming</Eyebrow>
      <div style={{ ...t.display, fontSize: 16, fontWeight: 600, margin: '8px 0 4px', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
        {event.title}
      </div>
      <div style={{ fontSize: 12, color: t.palette.muted, marginBottom: 4 }}>{event.when}</div>
      <div style={{ fontSize: 11.5, color: t.palette.muted }}>Host · {event.host}</div>
      <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.14em', color: t.palette.muted, textTransform: 'uppercase' }}>
          {event.going}/{event.capacity} going
        </span>
        <CivicButton size="sm" variant="ghost"
          onClick={() => { setActiveEvent && setActiveEvent(event.id); goto('event-detail'); }}>
          RSVP
        </CivicButton>
      </div>
    </div>
  );
}

// New joiner mini card (Bucket 03)
function CivicJoinerCard({ member }) {
  const t = React.useContext(ThemeCtx);
  const { goto, setActiveProfile } = useRoute();
  return (
    <button onClick={() => { setActiveProfile(member.id); goto('profile'); }} style={{
      background: 'transparent', cursor: 'pointer', textAlign: 'left',
      display: 'flex', flexDirection: 'column', gap: 8,
      padding: 8, border: `1px solid ${t.palette.ruleSoft}`, borderRadius: 2,
      transition: 'border-color 120ms ease',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.palette.ink; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.palette.ruleSoft; }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <CivicAvatar name={member.name} initials={member.initials} size={32} />
        <span style={{ fontFamily: t.font.mono, fontSize: 9.5, letterSpacing: '0.14em', color: t.palette.ok, textTransform: 'uppercase' }}>
          ● joined {member.joined}
        </span>
      </div>
      <div>
        <div style={{ ...t.display, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          {member.name}
        </div>
        <div style={{ fontFamily: t.font.mono, fontSize: 9.5, letterSpacing: '0.12em', color: t.palette.muted, textTransform: 'uppercase', marginTop: 3 }}>
          ’{String(member.year).slice(-2)} · {member.city.split(',')[0]}
        </div>
      </div>
      <div style={{ fontSize: 12, color: t.palette.ink2, lineHeight: 1.4 }}>
        {member.title} · <span style={{ color: t.palette.muted }}>{member.employer}</span>
      </div>
    </button>
  );
}

// Activity feed list (Bucket 03)
function CivicWireFeed({ items }) {
  const t = React.useContext(ThemeCtx);
  const typeMark = {
    ask:    { mark: 'A', tone: t.palette.accent },
    friend: { mark: 'F', tone: t.palette.ok },
    intro:  { mark: 'I', tone: t.palette.ink },
    post:   { mark: 'P', tone: t.palette.muted },
    event:  { mark: 'E', tone: t.palette.warn },
    msg:    { mark: 'M', tone: t.palette.muted },
  };
  return (
    <div style={t.cardSurface({ padding: 12 })}>
      <Eyebrow color={t.palette.muted}>Recent activity · 7 days</Eyebrow>
      <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', borderTop: `1px solid ${t.palette.ink}` }}>
        {items.slice(0, 6).map((a, i) => {
          const m = typeMark[a.type] || typeMark.post;
          return (
            <li key={i} style={{
              display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: 10,
              padding: '7px 0', borderBottom: `1px solid ${t.palette.ruleSoft}`, alignItems: 'center',
            }}>
              <span style={{
                fontFamily: t.font.mono, fontSize: 9.5, color: m.tone,
                border: `1px solid ${m.tone}`,
                width: 18, height: 18, display: 'grid', placeItems: 'center', fontWeight: 600,
              }}>{m.mark}</span>
              <span style={{ fontSize: 12.5, color: t.palette.ink }}>
                <strong style={{ fontWeight: 600 }}>{a.who}</strong>{' '}
                <span style={{ color: t.palette.muted }}>{a.what}</span>
              </span>
              <span style={{ fontFamily: t.font.mono, fontSize: 9.5, letterSpacing: '0.14em', color: t.palette.mute2, textTransform: 'uppercase' }}>
                {a.when}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// --- Pick a path -------------------------------------------------------

function CivicPathCard({ path: p }) {
  const t = React.useContext(ThemeCtx);
  return (
    <button onClick={p.onClick} style={{
      background: p.primary ? t.palette.panel : t.palette.card,
      border: 'none',
      borderRight: `1px solid ${t.palette.ruleSoft}`,
      borderBottom: `1px solid ${t.palette.ruleSoft}`,
      padding: '20px 20px 18px',
      display: 'flex', flexDirection: 'column', gap: 12,
      minHeight: 220, cursor: 'pointer', textAlign: 'left',
      transition: 'background 120ms ease',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = t.palette.panel; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = p.primary ? t.palette.panel : t.palette.card; }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ ...t.eyebrow, color: t.palette.mute2 }}>§ {p.idx}</span>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            ...t.display, fontSize: 26, fontWeight: 600,
            color: p.tone, letterSpacing: '-0.02em', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>{p.count}</div>
          <div style={{ ...t.eyebrow, color: t.palette.mute2, marginTop: 3 }}>{p.countLabel}</div>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ ...t.display, fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: t.palette.ink, lineHeight: 1.15 }}>
          {p.verb} →
        </div>
        <div style={{ fontSize: 13, color: t.palette.muted, marginTop: 7, lineHeight: 1.55, textWrap: 'pretty' }}>{p.sub}</div>
      </div>
      <div style={{
        paddingTop: 10, borderTop: `1px solid ${t.palette.ruleSoft}`,
        fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.14em',
        color: p.accent ? p.tone : t.palette.mute2, textTransform: 'uppercase',
      }}>
        {p.accent ? '● ' : ''}{p.foot}
      </div>
    </button>
  );
}

function CivicPickAPath() {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  const { goto } = useRoute();
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
      foot: '53 cities · 17 cohorts · class of \'03–\'24',
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
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <h2 style={{ ...t.display, fontSize: m ? 20 : 24, fontWeight: 600, margin: 0, letterSpacing: '-0.025em' }}>
            Where would you like to go?
          </h2>
          <span style={{
            fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.14em',
            color: t.palette.muted, textTransform: 'uppercase',
            padding: '3px 7px', border: `1px solid ${t.palette.rule}`, borderRadius: 2,
          }}>{paths.length} ways in</span>
        </div>
        {!m && (
          <div style={{ display: 'flex', gap: 8 }}>
            <CivicButton variant="ghost" size="sm">⌘K · Search anything</CivicButton>
          </div>
        )}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: m ? '1fr' : 'repeat(3, 1fr)',
        gap: 0,
        borderTop: `1px solid ${t.palette.ink}`,
        borderLeft: `1px solid ${t.palette.ruleSoft}`,
        marginTop: 14,
      }}>
        {paths.map((p) => <CivicPathCard key={p.idx} path={p} />)}
      </div>

    </section>
  );
}

// --- HomeScreen ----------------------------------------------------------

function HomeScreen() {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  const { goto } = useRoute();
  const { STATS, EVENTS, MEMBERS, PENDING_REQUESTS, ACTIVITY } = window.BC_DATA;
  const featured = EVENTS[0];
  const otherEvents = EVENTS.slice(1, 3);
  const newJoiners = MEMBERS.slice(0, 3);

  return (
    <div>
      <CivicGreetingStrip
        headline={<>Welcome back, Maren. <span style={{ color: t.palette.muted }}>What brings you in?</span></>}
        sub={`Pick a path below. The Hartwood circle has grown by ${STATS.newThisWeek} since your last visit.`}
      />

      <div style={{
        padding: m ? '24px 14px 32px' : '32px 32px 40px',
        maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: m ? 24 : 32,
      }}>

        <CivicPickAPath />

        {/* === BUCKET 01 — On your desk === */}
        <CivicBucketSection
          index="01" title="On your desk"
          count={`${PENDING_REQUESTS.length} replies you owe`}
          tone={t.palette.accent}
          subtitle="People who have asked for your time. Sorted by how long they've been waiting."
          primary={<CivicButton variant="primary" size="md" onClick={() => goto('inbox')}>Open inbox →</CivicButton>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
            {PENDING_REQUESTS.slice(0, 3).map((req) => <CivicDeskCard key={req.id} req={req} />)}
          </div>
        </CivicBucketSection>

        {/* === BUCKET 02 — On your calendar === */}
        <CivicBucketSection
          index="02" title="On your calendar"
          count={`1 event needs you · ${featured.days} days away`}
          tone={t.palette.ink}
          subtitle={`You're hosting ${featured.title} next Tuesday. Two confirmations and a seating note are open.`}
          primary={<CivicButton variant="primary" size="md" onClick={() => goto('events')}>All gatherings →</CivicButton>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '2fr 1fr 1fr', gap: 14 }}>
            <CivicEventHero event={featured} />
            {otherEvents.map((e) => <CivicEventMini key={e.id} event={e} />)}
          </div>
        </CivicBucketSection>

        {/* === BUCKET 03 — On the wire === */}
        <CivicBucketSection
          index="03" title="On the wire"
          count={`+${STATS.newThisWeek} new this week · no action needed`}
          tone={t.palette.ok}
          subtitle="A scan column. Nothing here demands a reply — but a name might catch your eye."
          primary={<CivicButton variant="ghost" size="md" onClick={() => goto('people')}>Browse the directory →</CivicButton>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '2fr 1fr', gap: 14, alignItems: 'stretch' }}>
            <div style={t.cardSurface({ padding: 12 })}>
              <Eyebrow color={t.palette.muted}>Recently joined · last 14 days</Eyebrow>
              <div style={{
                marginTop: 12,
                display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(2, 1fr)', gap: 12,
              }}>
                {newJoiners.map((mm) => <CivicJoinerCard key={mm.id} member={mm} />)}
              </div>
            </div>
            <CivicWireFeed items={ACTIVITY} />
          </div>
        </CivicBucketSection>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// People (directory)
// ---------------------------------------------------------------------------

// Civic refine bar — quick boolean toggles, a More-filters expansion, and
// an active-chip row. Replaces the original 4-chip strip with the full
// filter facet set from search-form.tsx (city, employer, topic, year, +
// mentor / near / people-I-know toggles).
function CivicRefineBar({ df, sort, setSort }) {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ marginTop: m ? 20 : 28, borderTop: `2px solid ${t.palette.ink}`, borderBottom: `1px solid ${t.palette.rule}` }}>
      {/* Row 1 — quick toggles + More / Sort */}
      <div style={{ display: 'flex', alignItems: m ? 'flex-start' : 'center', gap: m ? 10 : 16, justifyContent: 'space-between', padding: m ? '12px 0 14px' : '14px 0', flexWrap: 'wrap', flexDirection: m ? 'column' : 'row' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {!m && <span style={{ ...t.eyebrow, color: t.palette.muted, marginRight: 4 }}>Refine</span>}
          <CivicTogglePill active={df.filters.mentor} onClick={() => df.toggle('mentor')}>Open to mentor</CivicTogglePill>
          <CivicTogglePill active={df.filters.nearMe} onClick={() => df.toggle('nearMe')}>Near me</CivicTogglePill>
          <CivicTogglePill active={df.filters.peopleIKnow} onClick={() => df.toggle('peopleIKnow')}>People I know</CivicTogglePill>
          <button onClick={() => setOpen((o) => !o)} style={{
            background: 'transparent', color: t.palette.ink,
            border: `1px solid ${t.palette.ink}`,
            padding: '7px 12px', fontFamily: t.font.body, fontSize: 12.5, fontWeight: 500,
            cursor: 'pointer', borderRadius: 2,
            display: 'inline-flex', alignItems: 'center', gap: 6
          }}>
            {open ? '− Hide filters' : `+ More filters${df.activeCount ? ` (${df.activeCount})` : ''}`}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: m ? 'stretch' : 'auto' }}>
          <Eyebrow>Sort</Eyebrow>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
          style={{ border: `1px solid ${t.palette.rule}`, padding: '7px 8px', fontFamily: t.font.body, fontSize: 12.5, borderRadius: 2, background: t.palette.card, color: t.palette.ink, flex: m ? 1 : 'initial' }}>
            <option value="newest">Newest</option>
            <option value="cohort">Cohort</option>
            <option value="city">City</option>
          </select>
        </div>
      </div>

      {/* Row 2 — expanded grid of text filters */}
      {open ?
      <div style={{ borderTop: `1px solid ${t.palette.ruleSoft}`, padding: m ? '14px 0 14px' : '20px 0 18px', display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(4, 1fr)', gap: m ? 12 : 18 }}>
          <CivicField label="City" value={df.filters.city} onChange={(v) => df.setFilter('city', v)} placeholder="Brooklyn" />
          <CivicField label="Employer" value={df.filters.employer} onChange={(v) => df.setFilter('employer', v)} placeholder="Common Capital" />
          <CivicField label="Mentor topic" value={df.filters.topic} onChange={(v) => df.setFilter('topic', v)} placeholder="Fundraising" />
          <div>
            <label style={{ ...t.eyebrow, color: t.palette.muted, display: 'block', marginBottom: 6 }}>Class of</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
              value={df.filters.yearMin} onChange={(e) => df.setFilter('yearMin', e.target.value)}
              placeholder="2010" inputMode="numeric"
              style={{ width: '100%', border: `1px solid ${t.palette.rule}`, padding: '8px 10px', fontFamily: t.font.body, fontSize: 13, background: t.palette.card, borderRadius: 2, color: t.palette.ink }} />
              <span style={{ color: t.palette.muted, fontSize: 13 }}>–</span>
              <input
              value={df.filters.yearMax} onChange={(e) => df.setFilter('yearMax', e.target.value)}
              placeholder="2020" inputMode="numeric"
              style={{ width: '100%', border: `1px solid ${t.palette.rule}`, padding: '8px 10px', fontFamily: t.font.body, fontSize: 13, background: t.palette.card, borderRadius: 2, color: t.palette.ink }} />
            </div>
          </div>
        </div> :
      null}

      {/* Row 3 — active chips */}
      {df.activeCount > 0 ?
      <div style={{ borderTop: `1px solid ${t.palette.ruleSoft}`, padding: '12px 0', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ ...t.eyebrow, color: t.palette.mute2, marginRight: 6 }}>Active</span>
          {df.activeChips.map((chip) =>
        <button key={chip.key} onClick={() => df.clearOne(chip.key)} style={{
          fontFamily: t.font.mono, fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: t.palette.ink, background: t.palette.panel,
          border: `1px solid ${t.palette.ink}`, padding: '5px 10px', borderRadius: 2,
          cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 7
        }}>
              {chip.label}
              <span style={{ color: t.palette.muted, fontSize: 13, lineHeight: 1, marginLeft: 1 }}>×</span>
            </button>
        )}
          <button onClick={df.clearAll} style={{
          background: 'transparent', border: 'none', color: t.palette.accent,
          fontFamily: t.font.mono, fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase',
          cursor: 'pointer', padding: '5px 6px', marginLeft: 4, whiteSpace: 'nowrap'
        }}>Clear all</button>
        </div> :
      null}
    </div>);

}

function CivicTogglePill({ active, onClick, children }) {
  const t = React.useContext(ThemeCtx);
  return (
    <button onClick={onClick} style={{
      background: active ? t.palette.ink : 'transparent',
      color: active ? t.palette.paper : t.palette.ink,
      border: `1px solid ${active ? t.palette.ink : t.palette.rule}`,
      padding: '7px 12px',
      fontFamily: t.font.body, fontSize: 12.5, fontWeight: 500,
      cursor: 'pointer', borderRadius: 2, whiteSpace: 'nowrap',
      display: 'inline-flex', alignItems: 'center', gap: 6
    }}>
      <span style={{
        width: 6, height: 6, display: 'inline-block',
        background: active ? t.palette.accent : 'transparent',
        border: active ? 'none' : `1px solid ${t.palette.mute2}`
      }} />
      {children}
    </button>);

}

function CivicField({ label, value, onChange, placeholder }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div>
      <label style={{ ...t.eyebrow, color: t.palette.muted, display: 'block', marginBottom: 6 }}>{label}</label>
      <input
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: `1px solid ${t.palette.rule}`,
          padding: '8px 10px', fontFamily: t.font.body, fontSize: 13,
          background: t.palette.card, borderRadius: 2, color: t.palette.ink
        }} />
    </div>);

}

function PeopleScreen() {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  const { MEMBERS, VIEWER } = window.BC_DATA;
  const [sort, setSort] = React.useState('newest');
  const ai = useAISearch(MEMBERS);
  const df = useDirectoryFilters(VIEWER);

  // Filters operate on whatever set is currently visible — either the AI's
  // ranked matches or the full directory.
  const baseSet = ai.results ? ai.results.map((r) => MEMBERS.find((mm) => mm.id === r.id)).filter(Boolean) : MEMBERS;
  const filtered = React.useMemo(() => df.apply(baseSet), [df.filters, baseSet]);

  // rationale lookup so we can pass it into MemberCard
  const rationaleById = React.useMemo(() => {
    const map = new Map();
    if (ai.results) for (const r of ai.results) map.set(r.id, r.rationale);
    return map;
  }, [ai.results]);

  return (
    <section style={{ padding: m ? '28px 14px' : '56px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <div>
          <Eyebrow color={t.palette.muted}>The Directory</Eyebrow>
          <h1 style={{ ...t.display, fontSize: m ? 28 : 48, margin: m ? '8px 0 0' : '12px 0 0' }}>
            Who you know, <span style={{ color: t.palette.muted }}>and who can help.</span>
          </h1>
        </div>

      <CivicAISearch ai={ai} />

      <CivicRefineBar df={df} sort={sort} setSort={setSort} />

      <div style={{ fontFamily: t.font.mono, fontSize: 11, color: t.palette.mute2, letterSpacing: '0.14em', marginTop: 18, marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span>
          {ai.results ?
          `${String(filtered.length).padStart(2, '0')} AI matches for “${ai.query}”${df.activeCount > 0 ? ` · ${df.activeCount} refinement${df.activeCount === 1 ? '' : 's'}` : ''}` :
          `Showing ${String(filtered.length).padStart(3, '0')} of ${String(MEMBERS.length).padStart(3, '0')}${df.activeCount > 0 ? ` · ${df.activeCount} refinement${df.activeCount === 1 ? '' : 's'}` : ''}`}
        </span>
        {ai.results ?
        <button onClick={ai.clear} style={{ fontFamily: t.font.mono, fontSize: 11, letterSpacing: '0.14em', color: t.palette.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>× Clear AI search</button> :
        null}
      </div>

      {ai.stage === 'empty' && filtered.length === 0 ?
      <div style={{ padding: '40px 0', borderTop: `1px solid ${t.palette.rule}`, borderBottom: `1px solid ${t.palette.rule}`, textAlign: 'center', color: t.palette.muted, fontSize: 14 }}>
          No matches in your circle for “{ai.query}.” Try broader wording, or browse the directory.
        </div> :

      <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
          {filtered.map((mm) => <MemberCard key={mm.id} m={mm} rationale={rationaleById.get(mm.id)} />)}
        </div>
      }
    </section>);

}

// Civic AI search block — large bordered input under the hero. Three slots:
// the input itself (with submit button), a hairline-separated help line +
// suggestion chips when idle, or a staged status banner while reasoning.
function CivicAISearch({ ai }) {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  const [draft, setDraft] = React.useState(ai.query);
  React.useEffect(() => setDraft(ai.query), [ai.query]);

  const busy = ai.stage === 'reading' || ai.stage === 'looking' || ai.stage === 'reasoning';
  const stageCopy = AI_STAGE_COPY[ai.stage];

  const onSubmit = (e) => {e.preventDefault();ai.run(draft);};

  return (
    <div style={{
      marginTop: m ? 24 : 36,
      borderTop: `2px solid ${t.palette.ink}`,
      borderBottom: `1px solid ${t.palette.rule}`,
      padding: m ? '14px 0 16px' : '20px 0 22px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: m ? 10 : 14, gap: 8 }}>
        <span style={{ ...t.eyebrow, color: t.palette.ink, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 6, height: 6, background: t.palette.accent, display: 'inline-block' }} />
          AI Search
        </span>
        {!m && <span style={{ ...t.eyebrow, color: t.palette.mute2 }}>Reads career, schools, skills</span>}
      </div>

      <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr auto', gap: 10 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What kind of alum are you looking for?"
          disabled={busy}
          style={{
            border: `1px solid ${t.palette.ink}`,
            padding: m ? '12px 14px' : '14px 16px',
            fontFamily: t.font.body, fontSize: 16,
            background: t.palette.card, color: t.palette.ink,
            borderRadius: 2, outline: 'none', width: '100%', boxSizing: 'border-box'
          }} />
        
        <CivicButton type="submit" variant="accent" size={m ? 'md' : 'lg'} disabled={busy || !draft.trim()}
        style={{ justifyContent: 'center' }}>
          {busy ? 'Searching…' : 'Search →'}
        </CivicButton>
      </form>

      {/* Idle: suggestion chips. Busy: staged status banner. */}
      {busy ?
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: t.palette.panel, border: `1px solid ${t.palette.rule}`, borderRadius: 2 }}>
          <span style={{ width: 8, height: 8, background: t.palette.accent, display: 'inline-block', animation: 'civic-ai-pulse 1.2s ease-in-out infinite' }} />
          <span style={{ fontFamily: t.font.mono, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.palette.ink2 }}>{stageCopy}</span>
        </div> :
      ai.results ?
      <div style={{ marginTop: 12, fontSize: 13, color: t.palette.muted, lineHeight: 1.55 }}>
          {ai.extracted && ai.extracted.theme ?
        <span>Looking for <em style={{ color: t.palette.ink, fontStyle: 'normal', fontWeight: 600 }}>{ai.extracted.theme}</em>. Tap a card for the full profile.</span> :
        <span>Tap a card for the full profile, or scroll down for the “why this match?” rationale.</span>}
        </div> :

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ ...t.eyebrow, color: t.palette.mute2 }}>Try</span>
          {AI_EXAMPLES.slice(0, 3).map((ex) =>
        <button key={ex} onClick={() => {setDraft(ex);ai.run(ex);}} style={{
          fontFamily: t.font.body, fontSize: 12.5, color: t.palette.ink2,
          background: 'transparent', border: `1px solid ${t.palette.rule}`,
          padding: '5px 10px', borderRadius: 2, cursor: 'pointer',
          fontStyle: 'italic'
        }}>“{ex}”</button>
        )}
        </div>
      }
    </div>);

}

function MemberCard({ m, compact, rationale }) {
  const t = React.useContext(ThemeCtx);
  const { goto, setActiveProfile } = useRoute();
  const openTone = m.open === 'mentor' ? 'accent' : m.open === 'advice' ? 'ok' : 'muted';
  const openLabel = m.open === 'mentor' ? '● Open to mentor' : m.open === 'advice' ? '● Open to advice' : '● Asker';
  const openColor = openTone === 'accent' ? t.palette.accent : openTone === 'ok' ? t.palette.ok : t.palette.muted;
  return (
    <button onClick={() => {setActiveProfile(m.id);goto('profile');}} style={{
      ...t.cardSurface({ padding: 0, textAlign: 'left', cursor: 'pointer' }),
      transition: 'border-color 120ms ease',
      display: 'flex', flexDirection: 'column'
    }}
    onMouseEnter={(e) => {e.currentTarget.style.borderColor = t.palette.ink;}}
    onMouseLeave={(e) => {e.currentTarget.style.borderColor = t.palette.rule;}}>
      <div style={{ padding: compact ? 18 : 22 }}>
        {/* Cohort / city + open-status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
          <div style={{ fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.palette.muted }}>
            ’{String(m.year).slice(-2)} · {m.city}
          </div>
          <span style={{ fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: openColor, whiteSpace: 'nowrap' }}>
            {openLabel}
          </span>
        </div>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 10 : 12, marginBottom: 4 }}>
          <CivicAvatar name={m.name} initials={m.initials} size={compact ? 32 : 40} />
          <h3 style={{ ...t.display, fontSize: compact ? 22 : 26, margin: 0 }}>{m.name}</h3>
        </div>
        <div style={{ fontSize: 13, color: t.palette.ink2, marginBottom: compact ? 10 : 14 }}>
          {m.title} <span style={{ color: t.palette.muted }}>at</span> <strong style={{ fontWeight: 600 }}>{m.employer}</strong>
        </div>
        {!compact &&
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: t.palette.muted, margin: '0 0 14px' }}>
            {m.bio}
          </p>
        }
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {m.tags.slice(0, compact ? 2 : 3).map((tag) =>
          <span key={tag} style={{
            fontFamily: t.font.mono, fontSize: 10, color: t.palette.muted,
            border: `1px solid ${t.palette.rule}`, padding: '3px 7px', borderRadius: 2,
            letterSpacing: '0.14em', textTransform: 'uppercase'
          }}>{tag}</span>
          )}
        </div>
      </div>

      {/* Rationale block — only when AI search returned a reason for this match. */}
      {rationale ?
      <div style={{
        marginTop: 'auto',
        borderTop: `1px solid ${t.palette.ink}`,
        padding: '12px 22px 16px',
        background: t.palette.panel
      }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 5, height: 5, background: t.palette.accent, display: 'inline-block' }} />
            <span style={{ ...t.eyebrow, color: t.palette.muted }}>Why this match?</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.5, color: t.palette.ink2, margin: 0, fontStyle: 'italic' }}>
            “{rationale}”
          </p>
        </div> :
      null}
    </button>);

}
window.HomeScreen = HomeScreen;
window.PeopleScreen = PeopleScreen;
window.MemberCard = MemberCard;

// HeadlineCopy: reads `theme.tweaks.headline` and renders it as two clauses
// split on the last comma. Second clause gets the muted color so the
// typographic rhythm survives even when the user rewrites the headline.
function HeadlineCopy({ fallback, mutedColor }) {
  const t = React.useContext(ThemeCtx);
  const raw = t.tweaks && t.tweaks.headline || fallback;
  const trimmed = (raw || '').trim();
  // Find the last comma; if none, just render the whole line.
  const lastComma = trimmed.lastIndexOf(',');
  if (lastComma < 0 || lastComma === trimmed.length - 1) {
    return <span>{trimmed}</span>;
  }
  const head = trimmed.slice(0, lastComma + 1);
  const tail = trimmed.slice(lastComma + 1).trim();
  return (
    <>
      <span>{head} </span>
      <span style={{ color: mutedColor }}>{tail}</span>
    </>);

}

window.HeadlineCopy = HeadlineCopy;