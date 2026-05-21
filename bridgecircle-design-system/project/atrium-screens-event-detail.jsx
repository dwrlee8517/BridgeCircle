/* eslint-disable */
// Atrium — Event Detail screen.
//
// Rich page for a single event: hero with countdown, about, agenda timeline,
// location, who's going, hosts, practical info, discussion, related events.
// Pulls base info from BC_DATA.EVENTS and rich detail from BC_DATA.EVENT_DETAILS.

function AtriumEventDetail() {
  const t = React.useContext(ThemeCtx);
  const { activeEvent, goto, setActiveProfile, setActiveEvent } = useAtriumRoute();
  const { EVENTS, EVENT_DETAILS, MEMBERS, VIEWER } = window.BC_DATA;
  const e = EVENTS.find(x => x.id === activeEvent) || EVENTS[0];
  const detail = EVENT_DETAILS[e.id] || EVENT_DETAILS['evt-01'];
  const mob = t.isMobile;

  const [rsvp, setRsvp] = React.useState('not-yet');
  const [draft, setDraft] = React.useState('');
  const [localComments, setLocalComments] = React.useState([]);
  const allComments = [...detail.comments, ...localComments];
  const isPast = e.days < 0;

  const submitComment = () => {
    const text = draft.trim();
    if (!text) return;
    setLocalComments([...localComments, { from: VIEWER.id, at: 'Just now', body: text }]);
    setDraft('');
  };

  const openProfile = (id) => { setActiveProfile(id); goto('profile'); };

  return (
    <section style={{ padding: mob ? '16px 16px 40px' : '24px 24px 56px', maxWidth: 1280, margin: '0 auto' }}>
      <button onClick={() => goto('events')} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: t.palette.muted, fontFamily: t.font.body, fontSize: 13, fontWeight: 500,
        padding: '4px 0', display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        <span>←</span> Back to Events
      </button>

      {/* Hero */}
      <EventHero e={e} detail={detail} rsvp={rsvp} setRsvp={setRsvp} isPast={isPast} />

      {/* Body — two columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: mob ? '1fr' : '1fr 360px',
        gap: mob ? 18 : 28,
        marginTop: mob ? 18 : 24,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: mob ? 16 : 22 }}>
          <AboutCard about={detail.about} />
          <AgendaCard agenda={detail.agenda} />
          <LocationCard location={detail.location} />
          <DiscussionCard comments={allComments} draft={draft} setDraft={setDraft} onSubmit={submitComment} openProfile={openProfile} />
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: mob ? 16 : 22 }}>
          <PracticalCard practical={detail.practical} />
          <AttendeesCard attendees={detail.attendees} total={e.going} capacity={e.capacity} openProfile={openProfile} />
          <HostsCard hosts={detail.hosts} openProfile={openProfile} />
        </aside>
      </div>

      {/* Related events */}
      {detail.related?.length ? (
        <RelatedEvents ids={detail.related} onPick={(id) => { setActiveEvent(id); goto('event-detail'); }} />
      ) : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function EventHero({ e, detail, rsvp, setRsvp, isPast }) {
  const t = React.useContext(ThemeCtx);
  const isGoing = rsvp === 'going';
  const mob = t.isMobile;
  return (
    <div style={{
      marginTop: 14, position: 'relative', overflow: 'hidden',
      ...t.cardSurface({ padding: 0 }),
    }}>
      {/* Top band — dark gradient for upcoming, soft archival for past */}
      <div style={{
        position: 'relative',
        background: isPast
          ? t.palette.panel
          : `linear-gradient(135deg, ${t.palette.ink} 0%, ${t.palette.accent} 160%)`,
        borderBottom: isPast ? `1px solid ${t.palette.rule}` : 'none',
        color: isPast ? t.palette.ink : '#fff',
        padding: mob ? '22px 20px' : '28px 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <AtriumEyebrow color={isPast ? t.palette.muted : 'rgba(255,255,255,0.7)'}>
            {e.where?.includes('Online') ? 'Online event' : 'In person'}
          </AtriumEyebrow>
          <span style={{ fontFamily: t.font.mono, fontSize: 11, letterSpacing: '0.18em', fontWeight: 600, color: isPast ? t.palette.muted : 'rgba(255,255,255,0.85)' }}>
            {isPast ? `${Math.abs(e.days)} DAYS AGO` : `T-${e.days} DAYS`}
          </span>
        </div>
        <h1 style={{ ...t.display, fontSize: mob ? 28 : 44, color: isPast ? t.palette.ink : '#fff', margin: '8px 0 0', fontWeight: 600, lineHeight: 1.1, maxWidth: 760 }}>
          {e.title}
        </h1>
        {detail.tagline ? (
          <p style={{ fontSize: mob ? 14 : 15, color: isPast ? t.palette.muted : 'rgba(255,255,255,0.78)', margin: '8px 0 0', maxWidth: 620, lineHeight: 1.5 }}>
            {detail.tagline}
          </p>
        ) : null}
      </div>

      {/* Past event notice strip */}
      {isPast && (
        <div style={{
          padding: '10px 32px', background: hex(t.palette.ink, 0.04),
          borderBottom: `1px solid ${t.palette.ruleSoft}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: t.palette.muted, flexShrink: 0 }} />
          <span style={{ fontFamily: t.font.body, fontSize: 13, color: t.palette.muted }}>
            This gathering has passed · {e.going} members attended · Discussion is still open
          </span>
        </div>
      )}

      {/* Meta + actions */}
      <div style={{ padding: mob ? '18px 20px 22px' : '22px 32px 26px' }}>
        <div style={{
          display: mob ? 'grid' : 'flex',
          gridTemplateColumns: mob ? 'repeat(2, 1fr)' : undefined,
          gap: mob ? 16 : 36,
          flexWrap: 'wrap', marginBottom: mob ? 18 : 22,
        }}>
          <MetaPiece label="When" primary={e.when} sub={null} />
          <MetaPiece label="Where" primary={detail.location?.name || e.where} sub={detail.location ? `${detail.location.street}, ${detail.location.cityZip}` : null} />
          <MetaPiece label="Hosted by" primary={e.host} sub={null} />
          <MetaPiece
            label={isPast ? 'Attended' : 'Going'}
            primary={isPast ? `${e.going} members` : `${e.going} / ${e.capacity}`}
            sub={isPast ? `${Math.round(e.going / e.capacity * 100)}% of capacity` : `${e.capacity - e.going} spots open`}
          />
        </div>

        <div style={{ display: 'flex', gap: mob ? 8 : 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {isPast ? (
            <>
              <AtriumButton size={mob ? 'md' : 'lg'} variant="outline">See who attended</AtriumButton>
              <AtriumButton size={mob ? 'md' : 'lg'} variant="ghost">View in archive</AtriumButton>
            </>
          ) : !isGoing ? (
            <>
              <AtriumButton size={mob ? 'md' : 'lg'} onClick={() => setRsvp('going')}>RSVP — going</AtriumButton>
              <AtriumButton size={mob ? 'md' : 'lg'} variant="outline" onClick={() => setRsvp('maybe')}>
                {rsvp === 'maybe' ? '· Maybe' : 'Maybe'}
              </AtriumButton>
              <AtriumButton size={mob ? 'md' : 'lg'} variant="ghost">Add to calendar</AtriumButton>
              {mob ? null : <AtriumButton size="lg" variant="ghost">Bring a guest</AtriumButton>}
            </>
          ) : (
            <>
              <AtriumButton size={mob ? 'md' : 'lg'} variant="ink" onClick={() => setRsvp('not-yet')}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12l4 4 10-10" />
                  </svg>
                  You're going
                </span>
              </AtriumButton>
              <AtriumButton size={mob ? 'md' : 'lg'} variant="ghost">Add to calendar</AtriumButton>
              {mob ? null : <AtriumButton size="lg" variant="ghost">Bring a guest</AtriumButton>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaPiece({ label, primary, sub }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, color: t.palette.muted, fontFamily: t.font.mono, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 14.5, fontWeight: 600, color: t.palette.ink, marginTop: 4 }}>{primary}</div>
      {sub ? <div style={{ fontSize: 12, color: t.palette.muted, marginTop: 2 }}>{sub}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------

function AboutCard({ about }) {
  const t = React.useContext(ThemeCtx);
  const m = t.isMobile;
  if (!about?.length) return null;
  return (
    <div style={t.cardSurface({ padding: m ? 20 : 28 })}>
      <AtriumEyebrow accent>About this evening</AtriumEyebrow>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {about.map((p, i) => (
          <p key={i} style={{ margin: 0, fontSize: m ? 14.5 : 15, lineHeight: 1.65, color: t.palette.ink2 }}>{p}</p>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agenda — vertical timeline, same rail/no-line-through-dot pattern
// ---------------------------------------------------------------------------

function AgendaCard({ agenda }) {
  const t = React.useContext(ThemeCtx);
  const m = t.isMobile;
  if (!agenda?.length) return null;
  return (
    <div style={t.cardSurface({ padding: m ? 20 : 28 })}>
      <AtriumEyebrow accent>Agenda · {agenda.length} stops</AtriumEyebrow>
      <ol style={{ listStyle: 'none', padding: 0, margin: '18px 0 0' }}>
        {agenda.map((it, i) => {
          const last = i === agenda.length - 1;
          return (
            <li key={i} style={{
              display: 'grid',
              gridTemplateColumns: m ? '64px 22px 1fr' : '92px 22px 1fr',
              gap: m ? 12 : 16,
              paddingBottom: last ? 0 : 22,
              position: 'relative',
            }}>
              {/* Time column */}
              <div style={{ fontFamily: t.font.mono, fontSize: m ? 10.5 : 11, letterSpacing: '0.14em', color: t.palette.muted, fontWeight: 600, paddingTop: 4 }}>
                {it.time}
              </div>
              {/* Dot + rail segment */}
              <div style={{ position: 'relative', paddingTop: 7 }}>
                <span aria-hidden style={{
                  width: 9, height: 9, borderRadius: 999,
                  background: t.palette.accent, display: 'block',
                }} />
                {!last ? (
                  <span aria-hidden style={{
                    position: 'absolute', left: 4, width: 1,
                    top: 22, bottom: -22,
                    background: t.palette.ruleSoft,
                  }} />
                ) : null}
              </div>
              {/* Body */}
              <div style={{ minWidth: 0 }}>
                <div style={{ ...t.display, fontSize: m ? 15 : 16, fontWeight: 600, color: t.palette.ink, lineHeight: 1.25 }}>
                  {it.title}
                </div>
                {it.sub ? (
                  <div style={{ fontSize: m ? 13 : 13.5, color: t.palette.muted, marginTop: 4, lineHeight: 1.55 }}>{it.sub}</div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Location — meta + map placeholder
// ---------------------------------------------------------------------------

function LocationCard({ location }) {
  const t = React.useContext(ThemeCtx);
  if (!location) return null;
  return (
    <div style={t.cardSurface({ padding: 0, overflow: 'hidden' })}>
      <MapPlaceholder accent={t.palette.accent} bg={t.palette.cardAlt} stroke={t.palette.rule} ink={t.palette.ink} />
      <div style={{ padding: '20px 24px 22px' }}>
        <AtriumEyebrow accent>Location</AtriumEyebrow>
        <h3 style={{ ...t.display, fontSize: 22, margin: '8px 0 4px', fontWeight: 600 }}>{location.name}</h3>
        <div style={{ fontSize: 14, color: t.palette.muted, lineHeight: 1.55 }}>
          {location.street}<br />
          {location.cityZip}
        </div>
        <div style={{
          marginTop: 14, padding: 12,
          background: t.palette.paper, border: `1px solid ${t.palette.rule}`, borderRadius: t.radius - 6,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ fontSize: 12.5, color: t.palette.ink2 }}>
            <strong style={{ fontWeight: 600 }}>Transit:</strong> {location.transit}
          </div>
          {location.mapHint ? (
            <div style={{ fontSize: 12.5, color: t.palette.muted }}>
              <strong style={{ fontWeight: 600, color: t.palette.ink2 }}>On arrival:</strong> {location.mapHint}
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <AtriumButton size="sm" variant="outline">Open in Maps</AtriumButton>
          <AtriumButton size="sm" variant="ghost">Copy address</AtriumButton>
        </div>
      </div>
    </div>
  );
}

// SVG map placeholder — simple street grid with an accent pin. No real data,
// just a recognizable graphic; replace with a real tile when there's an API.
function MapPlaceholder({ accent, bg, stroke, ink }) {
  return (
    <div style={{ position: 'relative', height: 180, background: bg, borderBottom: `1px solid ${stroke}`, overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox="0 0 800 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {/* Background blocks */}
        <rect x="0" y="0" width="800" height="180" fill={bg} />
        {/* "Streets" — pale horizontal & diagonal lines */}
        {[20, 60, 110, 150].map(y => (
          <line key={y} x1="0" y1={y} x2="800" y2={y} stroke={stroke} strokeWidth="1" />
        ))}
        {[120, 280, 440, 600, 760].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="180" stroke={stroke} strokeWidth="1" />
        ))}
        {/* Major diagonal "main road" */}
        <line x1="0" y1="60" x2="800" y2="120" stroke={stroke} strokeWidth="2.5" />
        {/* Park block */}
        <rect x="440" y="20" width="160" height="90" fill={accent} fillOpacity="0.10" />
        <rect x="440" y="20" width="160" height="90" fill="none" stroke={accent} strokeOpacity="0.30" strokeWidth="1" />
        {/* Pin */}
        <g transform="translate(360 80)">
          <circle cx="0" cy="0" r="14" fill={accent} fillOpacity="0.20" />
          <circle cx="0" cy="0" r="7"  fill={accent} />
          <circle cx="0" cy="0" r="2"  fill="#fff" />
        </g>
      </svg>
      <div style={{
        position: 'absolute', right: 12, bottom: 10,
        fontFamily: 'ui-monospace, "JetBrains Mono", monospace', fontSize: 9,
        letterSpacing: '0.16em', textTransform: 'uppercase',
        color: ink, opacity: 0.4,
      }}>Map preview</div>
    </div>
  );
}

window.AtriumEventDetail = AtriumEventDetail;

// ---------------------------------------------------------------------------
// Practical — sidebar numbered fields
// ---------------------------------------------------------------------------

function PracticalCard({ practical }) {
  const t = React.useContext(ThemeCtx);
  if (!practical?.length) return null;
  return (
    <div style={t.cardSurface({ padding: 22 })}>
      <AtriumEyebrow accent>The practical stuff</AtriumEyebrow>
      <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0' }}>
        {practical.map((p, i) => (
          <li key={i} style={{
            display: 'grid', gridTemplateColumns: '24px 1fr', gap: 10,
            padding: '10px 0',
            borderBottom: i === practical.length - 1 ? 'none' : `1px solid ${t.palette.ruleSoft}`,
          }}>
            <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.accent, letterSpacing: '0.14em', fontWeight: 700, paddingTop: 2 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                <span style={{ fontSize: 12.5, color: t.palette.muted, fontWeight: 500 }}>{p.label}</span>
                <span style={{ fontSize: 13, color: t.palette.ink, fontWeight: 600, textAlign: 'right' }}>{p.value}</span>
              </div>
              {p.sub ? <div style={{ fontSize: 12, color: t.palette.mute2, marginTop: 4, lineHeight: 1.45 }}>{p.sub}</div> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Attendees
// ---------------------------------------------------------------------------

function AttendeesCard({ attendees, total, capacity, openProfile }) {
  const t = React.useContext(ThemeCtx);
  const { MEMBERS } = window.BC_DATA;
  // Dedupe + resolve to member records, keep first occurrence order.
  const seen = new Set();
  const resolved = [];
  for (const id of attendees) {
    if (seen.has(id)) continue;
    seen.add(id);
    const m = MEMBERS.find(mm => mm.id === id);
    if (m) resolved.push(m);
  }
  const fullPct = Math.round((total / capacity) * 100);
  return (
    <div style={t.cardSurface({ padding: 22 })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <AtriumEyebrow accent>Who’s going</AtriumEyebrow>
        <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.muted, letterSpacing: '0.14em', fontWeight: 600 }}>
          {total}/{capacity}
        </span>
      </div>

      {/* Capacity bar */}
      <div style={{ marginTop: 12, height: 3, background: t.palette.ruleSoft, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${fullPct}%`, height: '100%', background: t.palette.accent }} />
      </div>
      <div style={{ fontSize: 11.5, color: t.palette.muted, marginTop: 6 }}>{fullPct}% full · {capacity - total} spots open</div>

      {/* Avatar stack — first 6 */}
      <div style={{ display: 'flex', marginTop: 14 }}>
        {resolved.slice(0, 6).map((m, i) => (
          <div key={m.id} style={{
            marginLeft: i === 0 ? 0 : -10, position: 'relative', zIndex: 6 - i,
            boxShadow: `0 0 0 2px ${t.palette.card}`, borderRadius: 999,
          }}>
            <AtriumAvatar name={m.name} initials={m.initials} size={32} />
          </div>
        ))}
        {total > 6 ? (
          <div style={{
            marginLeft: -10, zIndex: 0, position: 'relative',
            width: 32, height: 32, borderRadius: 999,
            background: t.palette.paper, border: `1px solid ${t.palette.rule}`,
            display: 'grid', placeItems: 'center',
            fontFamily: t.font.body, fontSize: 11, fontWeight: 700, color: t.palette.muted,
          }}>+{total - 6}</div>
        ) : null}
      </div>

      {/* Mini list */}
      <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'flex', flexDirection: 'column' }}>
        {resolved.slice(0, 5).map((m, i) => (
          <li key={m.id} style={{
            padding: '10px 0', borderTop: i === 0 ? `1px solid ${t.palette.ruleSoft}` : `1px solid ${t.palette.ruleSoft}`,
          }}>
            <button onClick={() => openProfile(m.id)} style={{
              width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10, padding: 0,
            }}>
              <AtriumAvatar name={m.name} initials={m.initials} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.palette.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                <div style={{ fontSize: 11.5, color: t.palette.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  ’{String(m.year).slice(-2)} · {m.title}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {total > 5 ? (
        <button style={{
          marginTop: 10, background: 'transparent', border: 'none', cursor: 'pointer',
          color: t.palette.accent, fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600, padding: 0,
        }}>See all {total} attendees →</button>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hosts
// ---------------------------------------------------------------------------

function HostsCard({ hosts, openProfile }) {
  const t = React.useContext(ThemeCtx);
  if (!hosts?.length) return null;
  return (
    <div style={t.cardSurface({ padding: 22 })}>
      <AtriumEyebrow accent>Hosts</AtriumEyebrow>
      <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {hosts.map(h => (
          <li key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AtriumAvatar name={h.name} initials={h.initials} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <button onClick={() => openProfile(h.id)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: 14, fontWeight: 600, color: t.palette.ink,
              }}>{h.name}</button>
              <div style={{ fontSize: 12, color: t.palette.muted, marginTop: 2 }}>{h.role}</div>
            </div>
            <AtriumButton size="sm" variant="outline">Message</AtriumButton>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Discussion thread
// ---------------------------------------------------------------------------

function DiscussionCard({ comments, draft, setDraft, onSubmit, openProfile }) {
  const t = React.useContext(ThemeCtx);
  const { MEMBERS, VIEWER } = window.BC_DATA;
  const m = t.isMobile;
  return (
    <div style={t.cardSurface({ padding: m ? 20 : 28 })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <AtriumEyebrow accent>Discussion · {comments.length}</AtriumEyebrow>
        <span style={{ fontSize: 12, color: t.palette.muted }}>Visible to RSVPs</span>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {comments.map((c, i) => {
          const mine = c.from === VIEWER.id;
          const sender = mine ? VIEWER : MEMBERS.find(m => m.id === c.from);
          if (!sender) return null;
          return (
            <li key={i} style={{ display: 'grid', gridTemplateColumns: '36px 1fr', gap: 12, alignItems: 'flex-start' }}>
              <AtriumAvatar name={sender.name} initials={sender.initials} size={36} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <button onClick={() => !mine && openProfile(sender.id)} style={{
                    background: 'transparent', border: 'none', cursor: mine ? 'default' : 'pointer', padding: 0,
                    fontSize: 13.5, fontWeight: 600, color: t.palette.ink,
                  }}>{mine ? 'You' : sender.name}</button>
                  <span style={{ fontFamily: t.font.mono, fontSize: 10.5, color: t.palette.mute2, letterSpacing: '0.14em' }}>
                    {c.at}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: t.palette.ink2, margin: '4px 0 0', lineHeight: 1.55 }}>{c.body}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Composer */}
      <div style={{
        marginTop: 22, padding: 14,
        background: t.palette.cardAlt,
        border: `1px solid ${t.palette.rule}`, borderRadius: t.radius - 4,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <textarea
          value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSubmit(); }}
          placeholder="Say hello to other attendees… (⌘↵ to post)"
          rows={2}
          style={{
            resize: 'vertical', width: '100%', boxSizing: 'border-box',
            background: t.palette.card, color: t.palette.ink,
            border: `1px solid ${t.palette.rule}`, borderRadius: t.radius - 6,
            padding: '10px 12px',
            fontFamily: t.font.body, fontSize: 13.5, lineHeight: 1.55,
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <AtriumButton size="sm" onClick={onSubmit}
            style={{ opacity: draft.trim() ? 1 : 0.5, pointerEvents: draft.trim() ? 'auto' : 'none' }}>
            Post comment
          </AtriumButton>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Related events
// ---------------------------------------------------------------------------

function RelatedEvents({ ids, onPick }) {
  const t = React.useContext(ThemeCtx);
  const { EVENTS } = window.BC_DATA;
  const events = ids.map(id => EVENTS.find(e => e.id === id)).filter(Boolean);
  if (!events.length) return null;
  return (
    <div style={{ marginTop: 36 }}>
      <div style={{ borderTop: `2px solid ${t.palette.ink}`, paddingTop: 14, marginBottom: 18, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <AtriumEyebrow accent>While you’re here</AtriumEyebrow>
        <span style={{ fontSize: 12, color: t.palette.muted }}>Other upcoming gatherings</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: t.isCompact ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
        {events.map(e => (
          <button key={e.id} onClick={() => onPick(e.id)} style={{
            ...t.cardSurface({ padding: 18, textAlign: 'left', cursor: 'pointer' }),
            display: 'grid', gridTemplateColumns: '72px 1fr', gap: 16, alignItems: 'flex-start',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.palette.ink; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.palette.rule; }}>
            <div style={{
              padding: '10px 8px', borderRadius: t.radius - 4,
              background: t.palette.cardAlt, border: `1px solid ${t.palette.rule}`,
              textAlign: 'center',
            }}>
              <div style={{ ...t.display, fontSize: 24, fontWeight: 600, color: t.palette.ink, lineHeight: 1 }}>T-{e.days}</div>
              <div style={{ fontSize: 10, color: t.palette.muted, marginTop: 2, fontFamily: t.font.mono, letterSpacing: '0.14em', fontWeight: 600 }}>DAYS</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ ...t.display, fontSize: 18, margin: 0, fontWeight: 600, lineHeight: 1.25 }}>{e.title}</h3>
              <div style={{ fontSize: 12.5, color: t.palette.muted, marginTop: 4, lineHeight: 1.5 }}>
                {e.when}<br />{e.where}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: t.palette.accent, fontWeight: 600 }}>
                {e.going} going →
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
