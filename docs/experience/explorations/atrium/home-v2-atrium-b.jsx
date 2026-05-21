/* eslint-disable */
// Atrium V4 — THE NETWORK (directory-first home)
// Atrium counterpart to the Civic directory-first home. Faceted filters on
// the left, a 2-up grid of person cards in the middle, one event + waiting
// threads in the sidebar. Renders in Atrium's vocabulary: rounded chips,
// pill buttons, soft cards, terracotta accent on active filters.

function A4Network() {
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
        eyebrow={`Welcome back, ${D.viewer.firstName} · Class of ${D.viewer.cohort}`}
        headline={<>1,284 people in the circle. <span style={{ color: P.muted }}>Who are you looking for?</span></>}
        sub="The directory is the home page. Filter by craft, cohort, city, or what someone is open to — then send an intro."
      />

      <A4SearchBar />

      <div style={{
        flex: 1, padding: '24px 32px 32px',
        maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box',
        display: 'grid', gridTemplateColumns: '230px 1fr 290px', gap: 28, alignItems: 'flex-start',
      }}>
        <A4Facets />
        <A4DirectoryGrid />
        <A4Sidebar event={ev} />
      </div>
    </div>
  );
}

function A4SearchBar() {
  const P = ATRIUM;
  const D = HOME_DATA;
  return (
    <div style={{
      maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      padding: '6px 32px 0',
    }}>
      <div style={{
        background: P.card, border: `1px solid ${P.rule}`, borderRadius: 999,
        padding: '8px 8px 8px 22px', display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)',
      }}>
        <span style={{
          fontFamily: P.font.body, fontSize: 11.5, letterSpacing: '0.08em',
          color: P.mute2, textTransform: 'uppercase', fontWeight: 600, whiteSpace: 'nowrap',
        }}>Find</span>
        <input
          defaultValue="design leadership · Brooklyn · open to mentor"
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: P.font.body, fontSize: 14.5, color: P.ink, padding: 0,
          }}
        />
        <ATR_Tag tone="accent">● {D.stats.openMentors} match · 23 in Brooklyn</ATR_Tag>
        <ATR_Button variant="primary" size="md">Search →</ATR_Button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontFamily: P.font.body, fontSize: 11.5, letterSpacing: '0.06em', color: P.mute2, textTransform: 'uppercase', fontWeight: 600 }}>
          Recent
        </span>
        {['Founders · NYC', 'Design crit · any', '’14 classmates', 'Climate investors'].map(s => (
          <button key={s} style={{
            background: P.cardAlt, border: `1px solid ${P.rule}`, borderRadius: 999,
            padding: '5px 12px', fontFamily: P.font.body, fontSize: 12, color: P.ink2,
            cursor: 'pointer', fontWeight: 500,
          }}>{s}</button>
        ))}
        <span style={{ flex: 1 }} />
        <button style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: P.font.body, fontSize: 12, color: P.muted, fontWeight: 500,
        }}>Saved searches →</button>
      </div>
    </div>
  );
}

function A4Facets() {
  const P = ATRIUM;
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
        { name: 'Design',             count: 184, on: true },
        { name: 'Engineering',        count: 312, on: false },
        { name: 'Product',            count: 261, on: false },
        { name: 'Investing',          count: 118, on: false },
        { name: 'Policy / nonprofit', count: 86,  on: false },
        { name: 'Writing / film',     count: 73,  on: false },
      ],
    },
  ];
  return (
    <div style={{
      background: P.card, border: `1px solid ${P.rule}`, borderRadius: 20,
      padding: 20, display: 'flex', flexDirection: 'column', gap: 22, fontSize: 13,
      boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        paddingBottom: 12, borderBottom: `1px solid ${P.ruleSoft}`,
      }}>
        <ATR_Eyebrow color={P.muted}>§ 01 · Filter</ATR_Eyebrow>
        <span style={{
          fontFamily: P.font.body, fontSize: 11.5, fontWeight: 600,
          color: P.accent, letterSpacing: 0.2,
        }}>3 on</span>
      </div>

      {groups.map((g, gi) => (
        <div key={gi}>
          <div style={{
            fontFamily: P.font.body, fontSize: 11, letterSpacing: '0.08em',
            color: P.mute2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 10,
          }}>{g.label}</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {g.items.map((it, i) => (
              <li key={i} style={{
                display: 'grid', gridTemplateColumns: '16px 1fr auto', gap: 10,
                padding: '6px 10px', alignItems: 'center', borderRadius: 999,
                background: it.on ? hexAlpha(P.accent, 0.10) : 'transparent',
                color: it.muted ? P.mute2 : (it.on ? P.ink : P.ink2),
                fontWeight: it.on ? 600 : 500,
                cursor: 'pointer',
              }}>
                <span style={{
                  width: 12, height: 12, borderRadius: 999,
                  border: `1.5px solid ${it.on ? P.accent : P.rule}`,
                  background: it.on ? P.accent : 'transparent', display: 'inline-block',
                }} />
                <span style={{ fontSize: 13 }}>{it.name}</span>
                <span style={{ fontSize: 11.5, color: P.mute2, fontVariantNumeric: 'tabular-nums' }}>{it.count}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <ATR_Button variant="ghost" size="sm" style={{ alignSelf: 'flex-start' }}>Clear all filters</ATR_Button>
    </div>
  );
}

function A4DirectoryGrid() {
  const P = ATRIUM;
  const people = [
    {
      name: 'Iris Okonkwo', initials: 'IO', cohort: '’19', city: 'Brooklyn',
      title: 'Founder · The Long Take Co.',
      open: ['Mentee', 'Coffee'], note: 'Raising a seed round. Working on the deck this month.',
      joined: '3d', isNew: true,
    },
    {
      name: 'Dev Ramachandran', initials: 'DR', cohort: '’09', city: 'Oakland',
      title: 'Director of Engineering · Brevity',
      open: ['Mentor', 'Hire'], note: 'Open to mentoring eng leaders moving from IC to director.',
      joined: '5d', isNew: true,
    },
    {
      name: 'Priya Sastry', initials: 'PS', cohort: '’16', city: 'London',
      title: 'Senior Designer · Field & Co.',
      open: ['Mentor', 'Crit'], note: 'Happy to crit work for early- and mid-career designers.',
      joined: '1w', isNew: true,
    },
    {
      name: 'Sam Aldridge', initials: 'SA', cohort: '’11', city: 'Brooklyn',
      title: 'Editor at large · Common Place',
      open: ['Coffee', 'Intros'], note: 'Co-hosts the Hartwood House gatherings; deep Brooklyn rolodex.',
    },
    {
      name: 'Lena Park', initials: 'LP', cohort: '’18', city: 'Brooklyn',
      title: 'PM · Currents',
      open: ['Mentee'], note: 'Considering a jump from product to AI policy. Waiting on a reply.',
      waiting: '4d',
    },
    {
      name: 'Matty Osei', initials: 'MO', cohort: '’07', city: 'Brooklyn',
      title: 'Investor · Common Capital',
      open: ['Office hours'], note: 'Holds open hours Thursdays — climate and infra seed.',
    },
    {
      name: 'Cassie Wen', initials: 'CW', cohort: '’14', city: 'San Francisco',
      title: 'Founder · Payroll for nurses',
      open: ['Hire', 'Intros'], note: 'Just left Stripe; hiring a founding designer.',
      classmate: true,
    },
    {
      name: 'Owen Ito', initials: 'OI', cohort: '’14', city: 'Lisbon',
      title: 'Founder, in stealth',
      open: ['Hire', 'Mentor'], note: 'Hiring eng + design in Lisbon. Looking for someone senior.',
      classmate: true,
    },
    {
      name: 'Lila Roth', initials: 'LR', cohort: '’14', city: 'Brooklyn',
      title: 'Counsel · Hartwood Legal Aid',
      open: ['Coffee'], note: 'Writes on governance; runs the Brooklyn supper rotation.',
      classmate: true,
    },
  ];
  return (
    <div>
      <ATR_Section
        eyebrow="§ 02 · Matches"
        title={`${people.length} people fit`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <ATR_Button variant="outline" size="sm">Sort: relevance ▾</ATR_Button>
            <ATR_Button variant="outline" size="sm">View: cards ▾</ATR_Button>
          </div>
        }
      />
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16,
      }}>
        {people.map((p, i) => <A4PersonCard key={i} p={p} />)}
      </div>
      <div style={{
        marginTop: 18, padding: '14px 18px',
        background: P.cardAlt, border: `1px solid ${P.rule}`, borderRadius: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontSize: 13, color: P.muted }}>
          Showing {people.length} of {HOME_DATA.stats.openMentors} matches. Tighten filters to narrow, or save this search.
        </div>
        <ATR_Button variant="ghost" size="sm">Load 30 more →</ATR_Button>
      </div>
    </div>
  );
}

function A4PersonCard({ p }) {
  const P = ATRIUM;
  return (
    <div style={{
      background: P.card, border: `1px solid ${P.rule}`, borderRadius: 20,
      padding: 18, display: 'flex', flexDirection: 'column', gap: 12,
      position: 'relative',
      boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)',
    }}>
      <div style={{ position: 'absolute', top: 14, right: 14 }}>
        {p.isNew    ? <ATR_Tag tone="ok">● new · {p.joined}</ATR_Tag> : null}
        {p.classmate ? <ATR_Tag tone="accent">● classmate</ATR_Tag>    : null}
        {p.waiting  ? <ATR_Tag tone="warn">● waiting {p.waiting}</ATR_Tag> : null}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <ATR_Avatar name={p.name} initials={p.initials} size={48} />
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: P.font.display, fontSize: 17, fontWeight: 600,
            letterSpacing: '-0.015em', lineHeight: 1.15, color: P.ink,
          }}>{p.name}</div>
          <div style={{ fontSize: 12, color: P.muted, marginTop: 3 }}>{p.cohort} · {p.city}</div>
        </div>
      </div>

      <div style={{ fontSize: 13, color: P.ink2, lineHeight: 1.5 }}>
        <strong style={{ fontWeight: 600 }}>{p.title}.</strong>{' '}
        <span style={{ color: P.muted }}>{p.note}</span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {p.open.map((tag, i) => (
          <ATR_Tag key={i} tone="ink">● {tag}</ATR_Tag>
        ))}
      </div>

      <div style={{
        marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${P.ruleSoft}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
      }}>
        <ATR_Button variant="ghost" size="xs">Profile →</ATR_Button>
        <ATR_Button variant="primary" size="sm">Send intro</ATR_Button>
      </div>
    </div>
  );
}

function A4Sidebar({ event: ev }) {
  const P = ATRIUM;
  const D = HOME_DATA;
  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'sticky', top: 24 }}>
      {/* Event */}
      <div style={{
        background: P.ink, color: P.paper, borderRadius: 20, overflow: 'hidden',
        border: `1px solid ${P.ink}`,
      }}>
        <div style={{ padding: '16px 18px' }}>
          <div style={{
            fontFamily: P.font.body, fontSize: 11, letterSpacing: '0.08em',
            color: P.accent, textTransform: 'uppercase', fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 10,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: P.accent }} />
            § 03 · You’re hosting
          </div>
          <div style={{
            fontFamily: P.font.display, fontSize: 19, fontWeight: 600,
            lineHeight: 1.2, letterSpacing: '-0.015em', color: P.paper,
          }}>{ev.title}</div>
          <div style={{ fontSize: 12.5, color: 'rgba(248,241,226,0.7)', marginTop: 6 }}>{ev.when}</div>
          <div style={{ fontSize: 12, color: 'rgba(248,241,226,0.55)', marginTop: 2 }}>{ev.where}</div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: P.font.body, fontSize: 11, color: 'rgba(248,241,226,0.6)', fontWeight: 600 }}>
                {ev.going}/{ev.capacity} confirmed
              </span>
              <span style={{ fontFamily: P.font.body, fontSize: 11, color: 'rgba(248,241,226,0.6)', fontWeight: 600 }}>
                {Math.round(ev.going / ev.capacity * 100)}% full
              </span>
            </div>
            <div style={{ background: 'rgba(248,241,226,0.18)', height: 5, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ background: P.accent, height: '100%', width: `${Math.round(ev.going / ev.capacity * 100)}%` }} />
            </div>
          </div>
          <ATR_Button variant="primary" size="sm" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}>
            Open event →
          </ATR_Button>
        </div>
      </div>

      {/* Waiting threads */}
      <div style={{
        background: P.card, border: `1px solid ${P.rule}`, borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)',
      }}>
        <div style={{
          padding: '14px 18px', borderBottom: `1px solid ${P.ruleSoft}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        }}>
          <ATR_Eyebrow color={P.muted}>§ 04 · Waiting on you</ATR_Eyebrow>
          <span style={{ fontFamily: P.font.body, fontSize: 11.5, color: P.mute2, fontWeight: 600 }}>{D.pending.length} threads</span>
        </div>
        {D.pending.map((r, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '32px 1fr', gap: 12,
            padding: '12px 18px',
            borderBottom: i === D.pending.length - 1 ? 'none' : `1px solid ${P.ruleSoft}`,
            alignItems: 'flex-start',
          }}>
            <ATR_Avatar name={r.name} initials={r.initials} size={30} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: P.ink }}>{r.name}</span>
                <span style={{ fontFamily: P.font.body, fontSize: 11, color: P.mute2, fontWeight: 600 }}>{r.days}d</span>
              </div>
              <div style={{
                fontSize: 12, color: P.muted, marginTop: 3, lineHeight: 1.45, fontStyle: 'italic',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>“{r.body}”</div>
            </div>
          </div>
        ))}
        <div style={{ padding: '12px 18px', background: P.cardAlt, display: 'flex', justifyContent: 'flex-end' }}>
          <ATR_Button variant="ghost" size="xs">Open inbox →</ATR_Button>
        </div>
      </div>

      {/* Why these matches */}
      <div style={{
        padding: 16, background: P.cardAlt, border: `1px solid ${P.ruleSoft}`,
        borderRadius: 16, fontSize: 12, color: P.muted, lineHeight: 1.55,
      }}>
        <ATR_Eyebrow color={P.mute2}>§ 05 · Why these matches</ATR_Eyebrow>
        <div style={{ marginTop: 8 }}>
          Drawn from your saved interests — design leadership, Brooklyn, open to mentor. Tune at any time; we won’t push notifications between visits.
        </div>
      </div>
    </aside>
  );
}

window.A4Network = A4Network;
