/* eslint-disable */
// Event detail — Civic style.
// Pulls base event from BC_DATA.EVENTS and rich detail from BC_DATA.EVENT_DETAILS.

function CivicEventDetail() {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  const { activeEvent, setActiveEvent, goto, setActiveProfile } = useRoute();
  const { EVENTS, EVENT_DETAILS, MEMBERS, VIEWER } = window.BC_DATA;
  const e      = EVENTS.find(x => x.id === activeEvent) || EVENTS[0];
  const detail = EVENT_DETAILS[e.id] || EVENT_DETAILS['evt-01'];

  const [rsvp, setRsvp]             = React.useState('not-yet');
  const [draft, setDraft]           = React.useState('');
  const [localComments, setLocal]   = React.useState([]);
  const allComments = [...detail.comments, ...localComments];

  const submitComment = () => {
    const text = draft.trim(); if (!text) return;
    setLocal(prev => [...prev, { from: VIEWER.id, at: 'Just now', body: text }]);
    setDraft('');
  };

  return (
    <section style={{ padding: m ? '18px 14px 40px' : '24px 32px 56px', maxWidth: 1280, margin: '0 auto' }}>
      <button onClick={() => goto('events')} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: t.palette.muted, fontFamily: t.font.mono, fontSize: 10.5,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        padding: '0 0 20px', display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>← Events</button>

      <EvtHero e={e} detail={detail} rsvp={rsvp} setRsvp={setRsvp} />

      <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 336px', gap: m ? 14 : 22, marginTop: m ? 14 : 22 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: m ? 14 : 20 }}>
          <EvtAbout    about={detail.about} />
          <EvtAgenda   agenda={detail.agenda} />
          <EvtLocation location={detail.location} />
          <EvtDiscussion comments={allComments} draft={draft} setDraft={setDraft}
            onSubmit={submitComment} setActiveProfile={setActiveProfile} goto={goto} />
        </div>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: m ? 14 : 16 }}>
          <EvtPractical  practical={detail.practical} />
          <EvtAttendees  attendees={detail.attendees} total={e.going} capacity={e.capacity}
            setActiveProfile={setActiveProfile} goto={goto} />
          <EvtHosts      hosts={detail.hosts} setActiveProfile={setActiveProfile} goto={goto} />
        </aside>
      </div>

      {detail.related?.length ? (
        <EvtRelated ids={detail.related} onPick={(id) => { setActiveEvent(id); goto('event-detail'); }} />
      ) : null}
    </section>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────

function EvtHero({ e, detail, rsvp, setRsvp }) {
  const t   = React.useContext(ThemeCtx);
  const m   = useCivicIsMobile();
  const going = rsvp === 'going';
  return (
    <div style={t.cardSurface({ padding: 0, overflow: 'hidden' })}>
      {/* Dark ink band */}
      <div style={{ background: t.palette.ink, color: t.palette.paper, padding: m ? '22px 18px 22px' : '28px 32px 26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16, gap: 10 }}>
          <span style={{ fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.16em', color: 'rgba(255,255,255,.45)', textTransform: 'uppercase' }}>
            {e.where?.includes('Online') ? 'Online · ' : 'In person · '}{m ? 'Hartwood' : 'The Hartwood Society'}
          </span>
          <span style={{ fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.16em', color: t.palette.accent, whiteSpace: 'nowrap' }}>
            T-{e.days} DAYS
          </span>
        </div>
        <h1 style={{ ...t.display, fontSize: m ? 30 : 52, color: '#fff', margin: '0 0 10px', lineHeight: 1.04 }}>{e.title}</h1>
        {detail.tagline ? (
          <p style={{ fontSize: m ? 14 : 15, color: 'rgba(255,255,255,.65)', margin: 0, lineHeight: 1.55, maxWidth: 640 }}>
            {detail.tagline}
          </p>
        ) : null}
      </div>

      {/* Meta + RSVP */}
      <div style={{ padding: m ? '18px 18px 20px' : '22px 32px 26px', borderTop: `2px solid ${t.palette.accent}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr 1fr' : 'repeat(4, 1fr)', gap: m ? 14 : 24, marginBottom: 22, borderBottom: `1px solid ${t.palette.ruleSoft}`, paddingBottom: 22 }}>
          <EvtMeta label="When"      value={e.when} />
          <EvtMeta label="Where"     value={detail.location?.name || e.where}
            sub={detail.location ? `${detail.location.street}` : null} />
          <EvtMeta label="Hosted by" value={e.host} />
          <EvtMeta label="Going"     value={`${e.going} / ${e.capacity}`} sub={`${e.capacity - e.going} spots open`} />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {!going ? (
            <CivicButton size={m ? 'md' : 'lg'} style={{ flex: m ? '1 1 100%' : 'initial', justifyContent: 'center' }} onClick={() => setRsvp('going')}>RSVP — I'm going</CivicButton>
          ) : (
            <CivicButton size={m ? 'md' : 'lg'} style={{ flex: m ? '1 1 100%' : 'initial', justifyContent: 'center' }} onClick={() => setRsvp('not-yet')}>✓ You're going</CivicButton>
          )}
          <CivicButton size={m ? 'md' : 'lg'} variant="outline" style={{ flex: m ? 1 : 'initial', justifyContent: 'center' }} onClick={() => setRsvp(rsvp === 'maybe' ? 'not-yet' : 'maybe')}>
            {rsvp === 'maybe' ? '· Maybe' : 'Maybe'}
          </CivicButton>
          <CivicButton size={m ? 'md' : 'lg'} variant="ghost" style={{ flex: m ? 1 : 'initial', justifyContent: 'center' }}>{m ? 'Calendar' : 'Add to calendar'}</CivicButton>
          {!m && <CivicButton size="lg" variant="ghost">Bring a guest</CivicButton>}
        </div>
      </div>
    </div>
  );
}

function EvtMeta({ label, value, sub }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div>
      <div style={{ fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.palette.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: t.palette.ink }}>{value}</div>
      {sub ? <div style={{ fontSize: 12, color: t.palette.muted, marginTop: 2 }}>{sub}</div> : null}
    </div>
  );
}

// ── About ─────────────────────────────────────────────────────────────────

function EvtAbout({ about }) {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  if (!about?.length) return null;
  return (
    <div style={t.cardSurface({ padding: m ? 18 : 28 })}>
      <Eyebrow color={t.palette.accent}>About this evening</Eyebrow>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {about.map((p, i) => (
          <p key={i} style={{ margin: 0, fontSize: m ? 14 : 15, lineHeight: 1.65, color: t.palette.ink2 }}>{p}</p>
        ))}
      </div>
    </div>
  );
}

// ── Agenda ────────────────────────────────────────────────────────────────

function EvtAgenda({ agenda }) {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  if (!agenda?.length) return null;
  return (
    <div style={t.cardSurface({ padding: m ? 18 : 28 })}>
      <Eyebrow color={t.palette.accent}>Agenda · {agenda.length} stops</Eyebrow>
      <ol style={{ listStyle: 'none', padding: 0, margin: '20px 0 0' }}>
        {agenda.map((it, i) => {
          const last = i === agenda.length - 1;
          return (
            <li key={i} style={{ display: 'grid', gridTemplateColumns: m ? '64px 14px 1fr' : '88px 18px 1fr', gap: m ? 10 : 16, paddingBottom: last ? 0 : 24, position: 'relative' }}>
              <div style={{ fontFamily: t.font.mono, fontSize: m ? 10.5 : 11, letterSpacing: '0.12em', color: t.palette.muted, fontWeight: 600, paddingTop: 3 }}>
                {it.time}
              </div>
              <div style={{ position: 'relative', paddingTop: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: t.palette.accent, display: 'block' }} />
                {!last && <span style={{ position: 'absolute', left: 3, width: 1, top: 19, bottom: -24, background: t.palette.ruleSoft }} />}
              </div>
              <div>
                <div style={{ ...t.display, fontSize: m ? 15 : 16, fontWeight: 600, color: t.palette.ink, lineHeight: 1.25 }}>{it.title}</div>
                {it.sub && <div style={{ fontSize: 13.5, color: t.palette.muted, marginTop: 4, lineHeight: 1.55 }}>{it.sub}</div>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Location ──────────────────────────────────────────────────────────────

function EvtLocation({ location }) {
  const t = React.useContext(ThemeCtx);
  if (!location) return null;
  return (
    <div style={t.cardSurface({ padding: 0, overflow: 'hidden' })}>
      <EvtMapPlaceholder accent={t.palette.accent} bg={t.palette.panel} stroke={t.palette.rule} ink={t.palette.ink} />
      <div style={{ padding: '20px 28px 24px' }}>
        <Eyebrow color={t.palette.accent}>Location</Eyebrow>
        <h3 style={{ ...t.display, fontSize: 22, margin: '8px 0 4px', fontWeight: 600 }}>{location.name}</h3>
        <div style={{ fontSize: 14, color: t.palette.muted, lineHeight: 1.55 }}>
          {location.street}<br />{location.cityZip}
        </div>
        <div style={{
          marginTop: 14, padding: '10px 14px',
          background: t.palette.panel, border: `1px solid ${t.palette.rule}`, borderRadius: 2,
          fontSize: 13, color: t.palette.ink2, lineHeight: 1.55,
        }}>
          <strong style={{ fontWeight: 600 }}>Transit:</strong> {location.transit}
          {location.mapHint && <><br /><strong style={{ fontWeight: 600 }}>On arrival:</strong> {location.mapHint}</>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <CivicButton size="sm" variant="outline">Open in Maps</CivicButton>
          <CivicButton size="sm" variant="ghost">Copy address</CivicButton>
        </div>
      </div>
    </div>
  );
}

function EvtMapPlaceholder({ accent, bg, stroke, ink }) {
  return (
    <div style={{ height: 160, background: bg, borderBottom: `1px solid ${stroke}`, position: 'relative', overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox="0 0 800 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect x="0" y="0" width="800" height="160" fill={bg} />
        {[18, 56, 100, 140].map(y => <line key={y} x1="0" y1={y} x2="800" y2={y} stroke={stroke} strokeWidth="1" />)}
        {[100, 260, 420, 580, 740].map(x => <line key={x} x1={x} y1="0" x2={x} y2="160" stroke={stroke} strokeWidth="1" />)}
        <line x1="0" y1="50" x2="800" y2="110" stroke={stroke} strokeWidth="2.5" />
        <rect x="420" y="20" width="140" height="80" fill={accent} fillOpacity="0.09" stroke={accent} strokeOpacity="0.25" strokeWidth="1" />
        <g transform="translate(340 75)">
          <circle cx="0" cy="0" r="14" fill={accent} fillOpacity="0.18" />
          <circle cx="0" cy="0" r="7"  fill={accent} />
          <circle cx="0" cy="0" r="2"  fill="#fff" />
        </g>
      </svg>
      <div style={{ position: 'absolute', right: 12, bottom: 8, fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: ink, opacity: 0.35 }}>
        Map preview
      </div>
    </div>
  );
}

// ── Discussion ────────────────────────────────────────────────────────────

function EvtDiscussion({ comments, draft, setDraft, onSubmit, setActiveProfile, goto }) {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  const { MEMBERS, VIEWER } = window.BC_DATA;
  return (
    <div style={t.cardSurface({ padding: m ? 18 : 28 })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
        <Eyebrow color={t.palette.accent}>Discussion · {comments.length}</Eyebrow>
        <span style={{ fontSize: 12, color: t.palette.muted }}>Visible to RSVPs</span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {comments.map((c, i) => {
          const mine   = c.from === VIEWER.id;
          const sender = mine ? VIEWER : MEMBERS.find(m => m.id === c.from);
          if (!sender) return null;
          return (
            <li key={i} style={{ display: 'grid', gridTemplateColumns: '34px 1fr', gap: 12, alignItems: 'flex-start' }}>
              <CivicAvatar name={sender.name} initials={sender.initials} size={34} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
                  <button onClick={() => !mine && (setActiveProfile(sender.id), goto('profile'))}
                    style={{ background: 'transparent', border: 'none', cursor: mine ? 'default' : 'pointer', padding: 0, fontSize: 13.5, fontWeight: 600, color: t.palette.ink, fontFamily: t.font.body }}>
                    {mine ? 'You' : sender.name}
                  </button>
                  <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.mute2, letterSpacing: '0.14em' }}>{c.at}</span>
                </div>
                <p style={{ fontSize: 14, color: t.palette.ink2, margin: 0, lineHeight: 1.55 }}>{c.body}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <div style={{ marginTop: 22, borderTop: `1px solid ${t.palette.rule}`, paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <textarea value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSubmit(); }}
          placeholder="Say hello to other attendees… (⌘↵ to post)" rows={2}
          style={{
            resize: 'vertical', width: '100%', boxSizing: 'border-box',
            border: `1px solid ${t.palette.rule}`, borderRadius: 2, padding: '10px 12px',
            background: t.palette.card, fontFamily: t.font.body, fontSize: 13.5,
            color: t.palette.ink, lineHeight: 1.55, outline: 'none',
          }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <CivicButton size="sm" onClick={onSubmit} style={{ opacity: draft.trim() ? 1 : 0.5 }}>Post comment</CivicButton>
        </div>
      </div>
    </div>
  );
}

// ── Practical (sidebar) ───────────────────────────────────────────────────

function EvtPractical({ practical }) {
  const t = React.useContext(ThemeCtx);
  if (!practical?.length) return null;
  return (
    <div style={t.cardSurface({ padding: 20 })}>
      <Eyebrow color={t.palette.accent}>The practical stuff</Eyebrow>
      <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0' }}>
        {practical.map((p, i) => (
          <li key={i} style={{
            display: 'grid', gridTemplateColumns: '20px 1fr', gap: 10,
            padding: '10px 0', borderBottom: i === practical.length - 1 ? 'none' : `1px solid ${t.palette.ruleSoft}`,
          }}>
            <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.accent, letterSpacing: '0.14em', fontWeight: 700, paddingTop: 2 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                <span style={{ fontSize: 12, color: t.palette.muted }}>{p.label}</span>
                <span style={{ fontSize: 13, color: t.palette.ink, fontWeight: 600, textAlign: 'right' }}>{p.value}</span>
              </div>
              {p.sub && <div style={{ fontSize: 11.5, color: t.palette.mute2, marginTop: 3, lineHeight: 1.45 }}>{p.sub}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Attendees (sidebar) ───────────────────────────────────────────────────

function EvtAttendees({ attendees, total, capacity, setActiveProfile, goto }) {
  const t = React.useContext(ThemeCtx);
  const { MEMBERS } = window.BC_DATA;
  const seen = new Set();
  const resolved = [];
  for (const id of attendees) {
    if (seen.has(id)) continue; seen.add(id);
    const m = MEMBERS.find(mm => mm.id === id);
    if (m) resolved.push(m);
  }
  const fullPct = Math.round((total / capacity) * 100);
  return (
    <div style={t.cardSurface({ padding: 20 })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <Eyebrow color={t.palette.accent}>Who's going</Eyebrow>
        <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.muted, letterSpacing: '0.14em' }}>{total}/{capacity}</span>
      </div>
      <div style={{ height: 3, background: t.palette.ruleSoft }}>
        <div style={{ height: '100%', width: `${fullPct}%`, background: t.palette.accent }} />
      </div>
      <div style={{ fontSize: 11.5, color: t.palette.muted, marginTop: 6, marginBottom: 16 }}>
        {fullPct}% full · {capacity - total} spots open
      </div>
      {/* Avatar grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {resolved.slice(0, 8).map((m) => (
          <button key={m.id} onClick={() => { setActiveProfile(m.id); goto('profile'); }}
            title={m.name} style={{ border: 'none', padding: 0, cursor: 'pointer', background: 'transparent' }}>
            <CivicAvatar name={m.name} initials={m.initials} size={32} />
          </button>
        ))}
        {total > 8 && (
          <div style={{
            width: 32, height: 32, borderRadius: 2, background: t.palette.panel,
            border: `1px solid ${t.palette.rule}`, display: 'grid', placeItems: 'center',
            fontFamily: t.font.body, fontSize: 11, fontWeight: 700, color: t.palette.muted,
          }}>+{total - 8}</div>
        )}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' }}>
        {resolved.slice(0, 4).map((m, i) => (
          <li key={m.id} style={{ borderTop: `1px solid ${t.palette.ruleSoft}`, padding: '9px 0' }}>
            <button onClick={() => { setActiveProfile(m.id); goto('profile'); }} style={{
              width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10, padding: 0,
            }}>
              <CivicAvatar name={m.name} initials={m.initials} size={26} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.palette.ink }}>{m.name}</div>
                <div style={{ fontSize: 11.5, color: t.palette.muted }}>&apos;{String(m.year).slice(-2)} · {m.title}</div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Hosts (sidebar) ───────────────────────────────────────────────────────

function EvtHosts({ hosts, setActiveProfile, goto }) {
  const t = React.useContext(ThemeCtx);
  if (!hosts?.length) return null;
  return (
    <div style={t.cardSurface({ padding: 20 })}>
      <Eyebrow color={t.palette.accent}>Hosts</Eyebrow>
      <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {hosts.map(h => (
          <li key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CivicAvatar name={h.name} initials={h.initials} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <button onClick={() => { setActiveProfile(h.id); goto('profile'); }} style={{
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: 14, fontWeight: 600, color: t.palette.ink, fontFamily: t.font.body,
              }}>{h.name}</button>
              <div style={{ fontSize: 12, color: t.palette.muted, marginTop: 2 }}>{h.role}</div>
            </div>
            <CivicButton size="sm" variant="outline">Message</CivicButton>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Related events ────────────────────────────────────────────────────────

function EvtRelated({ ids, onPick }) {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  const { EVENTS } = window.BC_DATA;
  const events = ids.map(id => EVENTS.find(e => e.id === id)).filter(Boolean);
  if (!events.length) return null;
  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ borderTop: `2px solid ${t.palette.ink}`, paddingTop: 14, marginBottom: 20, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <Eyebrow>While you&apos;re here</Eyebrow>
        <span style={{ fontSize: 12, color: t.palette.muted }}>Other upcoming gatherings</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
        {events.map(e => (
          <button key={e.id} onClick={() => onPick(e.id)} style={{
            ...t.cardSurface({ padding: 20, textAlign: 'left', cursor: 'pointer' }),
            display: 'grid', gridTemplateColumns: '68px 1fr', gap: 16, alignItems: 'flex-start',
          }}
          onMouseEnter={ev => { ev.currentTarget.style.borderColor = t.palette.ink; }}
          onMouseLeave={ev => { ev.currentTarget.style.borderColor = t.palette.rule; }}>
            <div style={{ padding: '10px 6px', background: t.palette.panel, border: `1px solid ${t.palette.rule}`, borderRadius: 2, textAlign: 'center' }}>
              <div style={{ ...t.display, fontSize: 22, fontWeight: 600, color: t.palette.ink }}>T-{e.days}</div>
              <div style={{ fontSize: 9, color: t.palette.muted, fontFamily: t.font.mono, letterSpacing: '0.14em', marginTop: 2 }}>DAYS</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ ...t.display, fontSize: 18, margin: '0 0 6px', fontWeight: 600 }}>{e.title}</h3>
              <div style={{ fontSize: 12.5, color: t.palette.muted, lineHeight: 1.5 }}>{e.when}<br />{e.where}</div>
              <div style={{ marginTop: 8, fontSize: 12, color: t.palette.accent, fontWeight: 600 }}>{e.going} going →</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

window.CivicEventDetail = CivicEventDetail;
