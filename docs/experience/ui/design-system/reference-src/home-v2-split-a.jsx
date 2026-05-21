/* eslint-disable */
// V4 — THE NETWORK (directory-first home)
// Rationale: For a need-based app, the home should be the network itself —
// not a calendar. When Maren opens BridgeCircle she's almost always trying
// to find a person: someone in her cohort, someone in a city she's
// visiting, someone who's done the thing she's about to do. So the home
// page is the directory, surfaced and faceted up front, with one
// event-scoped sidebar block and one waiting-threads block.
//
// No "today/this week" anywhere — the spine is "who's in the circle," not
// "what's on the clock."

function V4TodayWeek() {
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
        headline={<>1,284 members in the circle. <span style={{ color: P.muted }}>Who are you looking for?</span></>}
        sub="The directory is the home page. Filter by craft, cohort, city, or what someone is open to — then send an intro."
      />

      <V4SearchBar />

      <div style={{
        flex: 1, padding: '24px 32px 32px',
        maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box',
        display: 'grid', gridTemplateColumns: '220px 1fr 280px', gap: 28, alignItems: 'flex-start',
      }}>
        <V4Facets />
        <V4DirectoryGrid />
        <V4Sidebar event={ev} />
      </div>
    </div>
  );
}

// === Search bar — sits under the greeting, full-width ===
function V4SearchBar() {
  const P = CIVIC;
  const D = HOME_DATA;
  return (
    <div style={{
      borderBottom: `1px solid ${P.rule}`, background: P.card,
      padding: '14px 32px', maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        border: `1px solid ${P.ink}`, padding: '10px 14px', background: P.paper,
      }}>
        <span style={{
          fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.18em',
          color: P.mute2, textTransform: 'uppercase',
        }}>FIND</span>
        <input
          defaultValue="design leadership, Brooklyn, open to mentor"
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: P.font.body, fontSize: 14, color: P.ink, padding: 0,
          }}
        />
        <span style={{
          fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.14em',
          color: P.muted, textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>● {D.stats.openMentors} match · 23 in Brooklyn</span>
        <V2Button variant="primary" size="sm">Search →</V2Button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <V2Button variant="ghost" size="sm">Saved searches</V2Button>
        <V2Button variant="ghost" size="sm">⌘K</V2Button>
      </div>
    </div>
  );
}

// === LEFT — facet column ===
function V4Facets() {
  const P = CIVIC;
  const groups = [
    {
      label: 'Open to',
      items: [
        { name: 'Mentor a younger member', count: 148, on: true },
        { name: 'Be mentored',             count: 73,  on: false },
        { name: 'Coffee in person',        count: 312, on: false },
        { name: 'Intro emails',            count: 521, on: false },
        { name: 'Hire / be hired',         count: 96,  on: false },
      ],
    },
    {
      label: 'Cohort',
      items: [
        { name: '’03 – ’09', count: 184, on: false },
        { name: '’10 – ’14', count: 296, on: true  },
        { name: '’15 – ’19', count: 421, on: false },
        { name: '’20 – ’24', count: 383, on: false },
      ],
    },
    {
      label: 'City',
      items: [
        { name: 'New York / Brooklyn', count: 312, on: true },
        { name: 'San Francisco Bay',   count: 264, on: false },
        { name: 'London',              count: 138, on: false },
        { name: 'Los Angeles',         count: 97,  on: false },
        { name: 'Berlin',              count: 54,  on: false },
        { name: '+ 48 more cities',    count: 419, on: false, muted: true },
      ],
    },
    {
      label: 'Craft',
      items: [
        { name: 'Design',           count: 184, on: true },
        { name: 'Engineering',      count: 312, on: false },
        { name: 'Product',          count: 261, on: false },
        { name: 'Investing',        count: 118, on: false },
        { name: 'Policy / nonprofit', count: 86,  on: false },
        { name: 'Writing / film',   count: 73,  on: false },
      ],
    },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, fontSize: 12.5 }}>
      <div style={{
        fontFamily: P.font.mono, fontSize: 10.5, letterSpacing: '0.18em',
        color: P.muted, textTransform: 'uppercase', borderBottom: `1px solid ${P.ink}`,
        paddingBottom: 8, display: 'flex', justifyContent: 'space-between',
      }}>
        <span>§ 01 · Filter</span>
        <span style={{ color: P.accent }}>3 on</span>
      </div>

      {groups.map((g, gi) => (
        <div key={gi}>
          <div style={{
            fontFamily: P.font.mono, fontSize: 9.5, letterSpacing: '0.16em',
            color: P.mute2, textTransform: 'uppercase', marginBottom: 8,
          }}>{g.label}</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {g.items.map((it, i) => (
              <li key={i} style={{
                display: 'grid', gridTemplateColumns: '14px 1fr auto', gap: 8,
                padding: '5px 0', alignItems: 'center',
                color: it.muted ? P.mute2 : (it.on ? P.ink : P.ink2),
                fontWeight: it.on ? 600 : 400,
              }}>
                <span style={{
                  width: 12, height: 12, border: `1px solid ${it.on ? P.accent : P.rule}`,
                  background: it.on ? P.accent : 'transparent', display: 'inline-block',
                }} />
                <span>{it.name}</span>
                <span style={{
                  fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.12em',
                  color: P.mute2,
                }}>{it.count}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <V2Button variant="ghost" size="sm" style={{ alignSelf: 'flex-start' }}>Clear all filters</V2Button>
    </div>
  );
}

// === MIDDLE — the directory grid ===
function V4DirectoryGrid() {
  const P = CIVIC;
  const people = [
    {
      name: 'Iris Okonkwo', initials: 'IO', cohort: '’19', city: 'Brooklyn',
      title: 'Founder · The Long Take Co.',
      open: ['Mentee', 'Coffee'], note: 'Raising a seed round. Working on the deck this month.',
      tone: P.accent, joined: '3d', isNew: true,
    },
    {
      name: 'Dev Ramachandran', initials: 'DR', cohort: '’09', city: 'Oakland',
      title: 'Director of Engineering · Brevity',
      open: ['Mentor', 'Hire'], note: 'Open to mentoring eng leaders moving from IC to director.',
      tone: P.ok, joined: '5d', isNew: true,
    },
    {
      name: 'Priya Sastry', initials: 'PS', cohort: '’16', city: 'London',
      title: 'Senior Designer · Field & Co.',
      open: ['Mentor', 'Crit'], note: 'Happy to crit work for early- and mid-career designers.',
      tone: P.ink, joined: '1w', isNew: true,
    },
    {
      name: 'Sam Aldridge', initials: 'SA', cohort: '’11', city: 'Brooklyn',
      title: 'Editor at large · Common Place',
      open: ['Coffee', 'Intros'], note: 'Co-hosts the Hartwood House gatherings; deep Brooklyn rolodex.',
      tone: P.ink,
    },
    {
      name: 'Lena Park', initials: 'LP', cohort: '’18', city: 'Brooklyn',
      title: 'PM · Currents',
      open: ['Mentee'], note: 'Considering a jump from product to AI policy. Waiting on a reply.',
      tone: P.accent, waiting: '4d',
    },
    {
      name: 'Matty Osei', initials: 'MO', cohort: '’07', city: 'Brooklyn',
      title: 'Investor · Common Capital',
      open: ['Office hours'], note: 'Holds open hours Thursdays — climate and infra seed.',
      tone: P.ok,
    },
    {
      name: 'Cassie Wen', initials: 'CW', cohort: '’14', city: 'San Francisco',
      title: 'Founder · Payroll for nurses',
      open: ['Hire', 'Intros'], note: 'Just left Stripe; hiring a founding designer.',
      tone: P.ink, classmate: true,
    },
    {
      name: 'Owen Ito', initials: 'OI', cohort: '’14', city: 'Lisbon',
      title: 'Founder, in stealth',
      open: ['Hire', 'Mentor'], note: 'Hiring eng + design in Lisbon. Looking for someone senior.',
      tone: P.ink, classmate: true,
    },
    {
      name: 'Lila Roth', initials: 'LR', cohort: '’14', city: 'Brooklyn',
      title: 'Counsel · Hartwood Legal Aid',
      open: ['Coffee'], note: 'Writes on governance; runs the Brooklyn supper rotation.',
      tone: P.muted, classmate: true,
    },
  ];
  return (
    <div>
      <V2Section
        index="02"
        title="Matches"
        count={`${people.length} of ${HOME_DATA.stats.openMentors} shown`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <V2Button variant="ghost" size="sm">Sort: relevance ▾</V2Button>
            <V2Button variant="ghost" size="sm">View: cards ▾</V2Button>
          </div>
        }
      />
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14,
        borderTop: `1px solid ${P.ink}`, paddingTop: 14,
      }}>
        {people.map((p, i) => <V4PersonCard key={i} p={p} />)}
      </div>
      <div style={{
        marginTop: 16, padding: '12px 16px', background: P.panel, border: `1px solid ${P.ruleSoft}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontSize: 12.5, color: P.muted }}>
          Showing {people.length} of {HOME_DATA.stats.openMentors} matches. Tighten filters to narrow, or save this search.
        </div>
        <V2Button variant="ghost" size="sm">Load 30 more →</V2Button>
      </div>
    </div>
  );
}

function V4PersonCard({ p }) {
  const P = CIVIC;
  return (
    <div style={{
      border: `1px solid ${P.rule}`, background: P.card,
      padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
      position: 'relative',
    }}>
      {p.isNew ? (
        <div style={{
          position: 'absolute', top: -1, right: -1,
          fontFamily: P.font.mono, fontSize: 9, letterSpacing: '0.16em',
          color: P.ok, textTransform: 'uppercase',
          border: `1px solid ${P.ok}`, padding: '2px 6px', background: P.paper,
        }}>● new · {p.joined}</div>
      ) : null}
      {p.classmate ? (
        <div style={{
          position: 'absolute', top: -1, right: -1,
          fontFamily: P.font.mono, fontSize: 9, letterSpacing: '0.16em',
          color: P.accent, textTransform: 'uppercase',
          border: `1px solid ${P.accent}`, padding: '2px 6px', background: P.paper,
        }}>● classmate</div>
      ) : null}
      {p.waiting ? (
        <div style={{
          position: 'absolute', top: -1, right: -1,
          fontFamily: P.font.mono, fontSize: 9, letterSpacing: '0.16em',
          color: P.warn, textTransform: 'uppercase',
          border: `1px solid ${P.warn}`, padding: '2px 6px', background: P.paper,
        }}>● waiting {p.waiting}</div>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <MockAvatar name={p.name} initials={p.initials} size={44} palette={P} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: P.font.display, fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.15 }}>{p.name}</div>
          <div style={{
            fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.14em',
            color: P.muted, textTransform: 'uppercase', marginTop: 4,
          }}>{p.cohort} · {p.city}</div>
        </div>
      </div>

      <div style={{ fontSize: 12.5, color: P.ink2, lineHeight: 1.4 }}>
        <strong style={{ fontWeight: 600 }}>{p.title}.</strong>{' '}
        <span style={{ color: P.muted }}>{p.note}</span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {p.open.map((tag, i) => (
          <span key={i} style={{
            fontFamily: P.font.mono, fontSize: 9.5, letterSpacing: '0.14em',
            color: P.ink, textTransform: 'uppercase',
            border: `1px solid ${P.rule}`, padding: '3px 7px', background: P.panel,
          }}>● {tag}</span>
        ))}
      </div>

      <div style={{
        marginTop: 'auto', paddingTop: 10, borderTop: `1px solid ${P.ruleSoft}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
      }}>
        <V2Button variant="ghost" size="xs">Profile →</V2Button>
        <V2Button variant="primary" size="sm">Send intro</V2Button>
      </div>
    </div>
  );
}

// === RIGHT — sidebar with one event + one waiting-threads box ===
function V4Sidebar({ event: ev }) {
  const P = CIVIC;
  const D = HOME_DATA;
  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'sticky', top: 24 }}>
      {/* One coming event */}
      <div style={{ border: `1px solid ${P.ink}`, background: P.card }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${P.ruleSoft}`, background: P.panel }}>
          <V2Eyebrow color={P.muted}>§ 03 · You’re hosting one</V2Eyebrow>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{
            fontFamily: P.font.display, fontSize: 18, fontWeight: 600,
            lineHeight: 1.15, margin: '0 0 4px', letterSpacing: '-0.01em',
          }}>{ev.title}</div>
          <div style={{ fontSize: 12.5, color: P.muted }}>{ev.when}</div>
          <div style={{ fontSize: 12.5, color: P.muted, marginTop: 2 }}>{ev.where}</div>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
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

      {/* Waiting threads — quietly framed */}
      <div style={{ border: `1px solid ${P.rule}`, background: P.card }}>
        <div style={{
          padding: '12px 16px', borderBottom: `1px solid ${P.ruleSoft}`, background: P.panel,
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        }}>
          <V2Eyebrow color={P.muted}>§ 04 · Waiting on you</V2Eyebrow>
          <span style={{ fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.14em', color: P.mute2, textTransform: 'uppercase' }}>
            {D.pending.length} threads
          </span>
        </div>
        {D.pending.map((r, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '28px 1fr', gap: 10,
            padding: '12px 16px', borderBottom: i === D.pending.length - 1 ? 'none' : `1px solid ${P.ruleSoft}`,
            alignItems: 'flex-start',
          }}>
            <MockAvatar name={r.name} initials={r.initials} size={26} palette={P} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: P.ink }}>{r.name}</span>
                <span style={{ fontFamily: P.font.mono, fontSize: 9.5, letterSpacing: '0.14em', color: P.mute2, textTransform: 'uppercase' }}>{r.days}d</span>
              </div>
              <div style={{
                fontSize: 11.5, color: P.muted, marginTop: 3, lineHeight: 1.4,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>{r.body}</div>
            </div>
          </div>
        ))}
        <div style={{ padding: '10px 16px', background: P.panel, display: 'flex', justifyContent: 'flex-end' }}>
          <V2Button variant="ghost" size="xs">Open inbox →</V2Button>
        </div>
      </div>

      {/* Why I'm seeing this */}
      <div style={{
        padding: 14, border: `1px solid ${P.ruleSoft}`, background: P.panel,
        fontSize: 11.5, color: P.muted, lineHeight: 1.5,
      }}>
        <V2Eyebrow color={P.mute2}>§ 05 · Why these matches</V2Eyebrow>
        <div style={{ marginTop: 6 }}>
          Drawn from your saved interests — design leadership, Brooklyn, open to mentor. Tune at any time; we won’t push notifications between visits.
        </div>
      </div>
    </aside>
  );
}

window.V4TodayWeek = V4TodayWeek;
