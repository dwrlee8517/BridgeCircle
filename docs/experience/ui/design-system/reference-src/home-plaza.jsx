/* eslint-disable */
// THE PLAZA — A spatial floor plan of the Hartwood House.
// Same data, but you "walk" through your society instead of scrolling a feed.
// Rooms: Dining Room (Spring Supper), Study (Pending mentees), Porch (New
// arrivals), Mail Slot (Inbox), Bulletin Board (Activity ticker), Library
// (Threads), Director's Office (You).

// Helper: a room is a rectangle with a label tag + live content. They're
// laid out by absolute position so the floor plan reads as architecture,
// not as a grid. Sizes are tuned so the whole plan fits 1280×~800 with
// space for a header and a footer.

function Room({ palette: P, atrium, x, y, w, h, label, sub, dot, accent, children, big }) {
  const radius = atrium ? 14 : 2;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h,
      background: P.card,
      border: `1.5px solid ${P.ink}`,
      borderRadius: radius,
      boxSizing: 'border-box',
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden',
      boxShadow: atrium
        ? '0 1px 0 rgba(255,255,255,.6) inset, 0 6px 16px rgba(42,34,26,0.05)'
        : 'none',
    }}>
      {/* Label tag — sits half-outside the top edge like a room sign */}
      <div style={{
        position: 'absolute', top: -10, left: 14,
        background: P.ink, color: P.paper,
        fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.16em',
        textTransform: 'uppercase', fontWeight: 600,
        padding: '3px 8px', borderRadius: atrium ? 999 : 2,
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        {dot ? <span style={{ width: 6, height: 6, borderRadius: atrium ? 999 : 2, background: accent || P.accent }} /> : null}
        {label}
      </div>
      {sub ? (
        <div style={{
          position: 'absolute', top: -10, right: 14,
          background: P.paper, color: P.muted,
          fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.14em',
          textTransform: 'uppercase', fontWeight: 500,
          padding: '3px 8px', border: `1px solid ${P.rule}`, borderRadius: atrium ? 999 : 2,
        }}>{sub}</div>
      ) : null}
      <div style={{ marginTop: big ? 8 : 4, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

// A door between two rooms — visual connector. Tiny arrow + label.
function Door({ x, y, label, palette: P, atrium }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      fontFamily: P.font.mono, fontSize: 9.5, letterSpacing: '0.16em',
      color: P.muted, textTransform: 'uppercase', fontWeight: 500,
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: P.paper, padding: '2px 6px',
      borderRadius: atrium ? 999 : 2,
    }}>
      ↳ {label}
    </div>
  );
}

// Small key-value line for a room
function RoomLine({ label, value, accent, palette: P }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      gap: 8, fontSize: 12.5, color: P.ink2,
      padding: '5px 0', borderTop: `1px solid ${P.ruleSoft}`,
    }}>
      <span style={{ color: P.muted, fontSize: 11.5 }}>{label}</span>
      <span style={{ fontWeight: 500, color: accent || P.ink, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function buildPlazaData(D) {
  return {
    rooms: {
      directorsOffice: { x: 32,  y: 64,  w: 280, h: 200, label: 'Director’s office', sub: 'You · ’14' },
      study:           { x: 32,  y: 296, w: 280, h: 360, label: 'The study',         sub: `${D.pending.length} waiting` },
      mailSlot:        { x: 32,  y: 688, w: 280, h: 220, label: 'Mail slot',         sub: 'Inbox' },
      diningRoom:      { x: 344, y: 64,  w: 580, h: 360, label: 'Dining room',       sub: `Supper · T−${D.event.days}d` },
      bulletin:        { x: 344, y: 456, w: 580, h: 200, label: 'Bulletin board',    sub: 'Activity' },
      porch:           { x: 344, y: 688, w: 580, h: 220, label: 'The porch',         sub: `+${D.stats.newThisWeek} this week` },
      library:         { x: 956, y: 64,  w: 292, h: 600, label: 'The library',       sub: 'Threads' },
      garden:          { x: 956, y: 696, w: 292, h: 212, label: 'The garden',        sub: 'Quiet hours' },
    },
  };
}

// === CIVIC =============================================================

function PlazaCivic() {
  const P = CIVIC;
  const D = HOME_DATA;
  const R = buildPlazaData(D).rooms;
  return (
    <div style={{
      width: '100%', height: '100%', background: P.paper, color: P.ink,
      fontFamily: P.font.body, overflow: 'hidden', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 32px', borderBottom: `1px solid ${P.rule}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{
          fontFamily: P.font.mono, fontSize: 10.5, letterSpacing: '0.16em',
          color: P.mute2, textTransform: 'uppercase',
        }}>The Hartwood Society · Floor plan</div>
        <div style={{ display: 'flex', gap: 18, alignItems: 'baseline' }}>
          <span style={{
            fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.16em',
            color: P.mute2, textTransform: 'uppercase',
          }}>Thu 15 May · 2:14 PM</span>
          <span style={{
            fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.16em',
            color: P.accent, textTransform: 'uppercase',
          }}>● 12 members in the house</span>
        </div>
      </div>

      {/* Page title */}
      <div style={{ padding: '20px 32px 8px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: `2px solid ${P.ink}` }}>
        <div>
          <div style={{
            fontFamily: P.font.mono, fontSize: 10.5, letterSpacing: '0.18em',
            color: P.muted, textTransform: 'uppercase', marginBottom: 6,
          }}>§ 01 · Plan view</div>
          <h1 style={{
            fontFamily: P.font.display, fontSize: 38, lineHeight: 1.02,
            margin: 0, fontWeight: 600, letterSpacing: '-0.025em',
          }}>Walk the house, Maren.</h1>
        </div>
        <div style={{
          fontFamily: P.font.mono, fontSize: 10.5, letterSpacing: '0.14em',
          color: P.muted, textTransform: 'uppercase', textAlign: 'right',
          maxWidth: 360, lineHeight: 1.6,
        }}>
          Eight rooms · live<br />
          tap a room to enter
        </div>
      </div>

      {/* The plan */}
      <div style={{ position: 'relative', height: 940, padding: '40px 16px 16px' }}>
        {/* Outer wall — the whole property */}
        <div style={{
          position: 'absolute', left: 16, top: 28, right: 16, bottom: 16,
          border: `2px solid ${P.ink}`,
          backgroundImage: `repeating-linear-gradient(90deg, ${P.ruleSoft} 0 24px, transparent 24px 25px), repeating-linear-gradient(0deg, ${P.ruleSoft} 0 24px, transparent 24px 25px)`,
          backgroundColor: P.panel,
        }} />

        {/* Garden corridor between dining + porch */}
        <div style={{
          position: 'absolute', left: 344, top: 432, width: 580, height: 16,
          background: `repeating-linear-gradient(45deg, ${P.rule} 0 6px, transparent 6px 12px)`,
        }} />

        {/* Director's office — YOU */}
        <Room palette={P} {...R.directorsOffice}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MockAvatar name="Maren Vasilakis" initials="MV" size={48} palette={P} />
            <div>
              <div style={{ fontFamily: P.font.display, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>Maren V.</div>
              <div style={{ fontSize: 11.5, color: P.muted, fontFamily: P.font.mono, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>Class of ’14 · VP Product</div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 12.5, color: P.ink2, lineHeight: 1.5, fontStyle: 'italic', fontFamily: P.font.serif }}>
            “Three on your desk. One needs you today.”
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', gap: 6 }}>
            <button style={{ fontFamily: P.font.body, fontSize: 11, padding: '5px 9px', background: 'transparent', border: `1px solid ${P.rule}`, borderRadius: 2, cursor: 'pointer' }}>Profile</button>
            <button style={{ fontFamily: P.font.body, fontSize: 11, padding: '5px 9px', background: 'transparent', border: `1px solid ${P.rule}`, borderRadius: 2, cursor: 'pointer' }}>Settings</button>
          </div>
        </Room>

        {/* The study — pending mentees, the main 'work' room */}
        <Room palette={P} {...R.study}>
          <div style={{
            fontFamily: P.font.display, fontSize: 56, lineHeight: 0.95,
            fontWeight: 600, color: P.accent, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em',
          }}>0{D.pending.length}</div>
          <div style={{ fontSize: 12.5, color: P.muted, marginTop: -4, marginBottom: 10 }}>mentees waiting · oldest 4 days</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0 }}>
            {D.pending.slice(0, 3).map((p, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '8px 0', borderTop: `1px solid ${P.ruleSoft}`,
              }}>
                <MockAvatar name={p.name} initials={p.initials} size={28} palette={P} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: P.ink }}>{p.name} <span style={{ color: P.mute2, fontWeight: 400, fontFamily: P.font.mono, letterSpacing: '0.12em', fontSize: 9.5 }}>·{p.cohort} · {p.days}D</span></div>
                  <div style={{ fontSize: 11.5, color: P.muted, lineHeight: 1.4, marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>“{p.body.slice(0, 90)}…”</div>
                </div>
              </div>
            ))}
          </div>
          <button style={{
            fontFamily: P.font.body, fontSize: 12, fontWeight: 500,
            padding: '8px 12px', background: P.ink, color: P.paper,
            border: 'none', borderRadius: 2, cursor: 'pointer', marginTop: 6,
          }}>Open the study →</button>
        </Room>

        {/* Mail slot — inbox / messages */}
        <Room palette={P} {...R.mailSlot}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontFamily: P.font.display, fontSize: 40, fontWeight: 600, color: P.ink, letterSpacing: '-0.03em' }}>5</div>
            <div style={{ fontSize: 12, color: P.muted }}>unread · 2 threads active</div>
          </div>
          <div style={{ marginTop: 4 }}>
            <RoomLine label="Iris · Seed deck"     value="2 new"  accent={P.accent} palette={P} />
            <RoomLine label="Dev · Hiring loops"   value="1 new"  palette={P} />
            <RoomLine label="Lena · Career switch" value="pending" accent={P.warn} palette={P} />
          </div>
          <button style={{
            fontFamily: P.font.body, fontSize: 11.5, padding: '6px 10px',
            background: 'transparent', border: `1px solid ${P.rule}`, borderRadius: 2,
            marginTop: 'auto', alignSelf: 'flex-start', cursor: 'pointer',
          }}>Check the mail →</button>
        </Room>

        {/* DINING ROOM — Spring Supper, hero of the plan */}
        <Room palette={P} {...R.diningRoom} big>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: P.font.display, fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em', color: P.ink, lineHeight: 1.1 }}>
                Spring Supper at Hartwood
              </div>
              <div style={{ fontFamily: P.font.serif, fontSize: 14, fontStyle: 'italic', color: P.muted, marginTop: 6 }}>
                A long-table supper for twelve. The room is two thirds full.
              </div>
              <div style={{ display: 'flex', gap: 18, marginTop: 12, fontFamily: P.font.mono, fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: P.muted }}>
                <span>Tue · May 20 · 7:00 PM</span>
                <span>The Hartwood House · Brooklyn</span>
              </div>
            </div>
            <div style={{
              textAlign: 'right',
              borderLeft: `1px solid ${P.rule}`, paddingLeft: 16,
            }}>
              <div style={{ fontFamily: P.font.display, fontSize: 56, fontWeight: 600, color: P.accent, letterSpacing: '-0.04em', lineHeight: 0.9 }}>
                T−{D.event.days}d
              </div>
              <div style={{ fontFamily: P.font.mono, fontSize: 10.5, letterSpacing: '0.14em', color: P.muted, textTransform: 'uppercase', marginTop: 6 }}>
                {D.event.going} of {D.event.capacity}
              </div>
            </div>
          </div>

          {/* The long table — a row of seat squares, filled vs empty */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.16em', color: P.muted, textTransform: 'uppercase', marginBottom: 8 }}>
              The long table · 60 seats
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)', gap: 3,
              padding: '14px 12px', background: P.panel, border: `1px solid ${P.rule}`,
            }}>
              {Array.from({ length: 60 }).map((_, i) => {
                const filled = i < D.event.going;
                const isYou = i === 0;
                return (
                  <div key={i} style={{
                    width: '100%', aspectRatio: '1 / 1',
                    background: isYou ? P.accent : (filled ? P.ink : P.card),
                    border: `1px solid ${filled ? P.ink : P.rule}`,
                  }} />
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.14em', color: P.mute2, textTransform: 'uppercase' }}>
              <span>● You · seat 01</span>
              <span>○ {D.event.capacity - D.event.going} seats free</span>
            </div>
          </div>

          {/* Action strip */}
          <div style={{
            marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${P.rule}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex' }}>
                {D.newJoiners.slice(0, 4).map((m, i) => (
                  <div key={i} style={{ marginLeft: i === 0 ? 0 : -7, boxShadow: `0 0 0 2px ${P.card}`, position: 'relative', zIndex: 4 - i }}>
                    <MockAvatar name={m.name} initials={m.initials} size={26} palette={P} />
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12, color: P.muted }}>{D.event.going - 4} more sitting down</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ fontFamily: P.font.body, fontSize: 12, padding: '8px 14px', background: P.accent, color: '#fff', border: 'none', borderRadius: 2, cursor: 'pointer', fontWeight: 500 }}>Take a seat →</button>
              <button style={{ fontFamily: P.font.body, fontSize: 12, padding: '8px 14px', background: 'transparent', color: P.ink, border: `1px solid ${P.rule}`, borderRadius: 2, cursor: 'pointer', fontWeight: 500 }}>+ Plus one</button>
            </div>
          </div>
        </Room>

        {/* Bulletin board — recent activity */}
        <Room palette={P} {...R.bulletin}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
            {[
              { who: 'Iris Okonkwo',     what: 'requested mentorship',  when: '3h',  tone: 'accent' },
              { who: 'Dev Ramachandran', what: 'sent you a friend request', when: '1d', tone: 'ok' },
              { who: 'Priya Sastry',     what: 'posted in #design-leads', when: '1d', tone: 'muted' },
              { who: 'Sam Aldridge',     what: 'accepted your intro',    when: '2d', tone: 'ink' },
              { who: 'Spring Supper',    what: 'is six days away',       when: '2d', tone: 'warn' },
              { who: 'Lena Park',        what: 'sent a message',         when: '4d', tone: 'muted' },
            ].map((a, i) => {
              const color = { accent: P.accent, ok: P.ok, muted: P.muted, ink: P.ink, warn: P.warn }[a.tone];
              return (
                <div key={i} style={{
                  background: P.paper, border: `1px solid ${P.rule}`,
                  padding: '8px 10px', maxWidth: 240,
                  transform: `rotate(${(i % 2 ? -0.6 : 0.5)}deg)`,
                  boxShadow: '2px 2px 0 rgba(14,14,13,0.06)',
                }}>
                  <div style={{ fontSize: 12, color: P.ink, lineHeight: 1.4 }}>
                    <strong style={{ fontWeight: 600 }}>{a.who}</strong> <span style={{ color: P.muted }}>{a.what}</span>
                  </div>
                  <div style={{
                    fontFamily: P.font.mono, fontSize: 9.5, letterSpacing: '0.14em',
                    color, textTransform: 'uppercase', marginTop: 3,
                  }}>· {a.when}</div>
                </div>
              );
            })}
          </div>
        </Room>

        {/* The porch — new arrivals */}
        <Room palette={P} {...R.porch}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, flex: 1 }}>
            {D.newJoiners.map((m, i) => (
              <div key={i} style={{
                border: `1px solid ${P.rule}`, padding: 10, background: P.card,
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <MockAvatar name={m.name} initials={m.initials} size={28} palette={P} />
                  <span style={{ fontFamily: P.font.mono, fontSize: 9.5, letterSpacing: '0.14em', color: P.accent, textTransform: 'uppercase' }}>● Joined {m.joined}</span>
                </div>
                <div style={{ fontFamily: P.font.display, fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{m.name}</div>
                <div style={{ fontFamily: P.font.mono, fontSize: 9.5, letterSpacing: '0.12em', color: P.muted, textTransform: 'uppercase' }}>{m.cohort} · {m.city}</div>
                <div style={{ fontSize: 11.5, color: P.ink2, marginTop: 2, lineHeight: 1.4 }}>{m.title}</div>
              </div>
            ))}
          </div>
        </Room>

        {/* The library — active threads */}
        <Room palette={P} {...R.library}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { with: 'Iris Okonkwo',     initials: 'IO', title: 'Seed deck gut-check',         next: 'Thu · May 22 · 4:00 PM', preview: 'Confirmed. Excited.', state: 'active' },
              { with: 'Dev Ramachandran', initials: 'DR', title: 'Director-level hiring loops', next: null,                      preview: 'Sending my director-loop template…', state: 'active' },
              { with: 'Sam Aldridge',     initials: 'SA', title: 'Pro bono coordinators',       next: 'Mon · May 25',            preview: 'Saw your note — let’s catch up.', state: 'paused' },
            ].map((t, i) => (
              <div key={i} style={{ padding: 10, border: `1px solid ${P.rule}`, background: P.card }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <MockAvatar name={t.with} initials={t.initials} size={24} palette={P} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: P.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.with}</span>
                  </div>
                  <span style={{
                    fontFamily: P.font.mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: t.state === 'active' ? P.ok : P.mute2,
                  }}>● {t.state}</span>
                </div>
                <div style={{ fontFamily: P.font.serif, fontSize: 13, color: P.ink2, marginTop: 6 }}>{t.title}</div>
                <div style={{ fontSize: 11.5, color: P.muted, marginTop: 4, lineHeight: 1.4, fontStyle: 'italic' }}>“{t.preview}”</div>
                {t.next ? (
                  <div style={{ fontFamily: P.font.mono, fontSize: 9.5, color: P.accent, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 6 }}>Next · {t.next}</div>
                ) : null}
              </div>
            ))}
          </div>
        </Room>

        {/* The garden — quiet hours / a soft empty room for breathing */}
        <Room palette={P} {...R.garden}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontFamily: P.font.serif, fontSize: 18, fontStyle: 'italic', color: P.ink2, lineHeight: 1.4 }}>
              “Nothing waiting here.”
            </div>
            <div style={{ fontSize: 12, color: P.muted, marginTop: 8, lineHeight: 1.5 }}>
              The garden stays quiet until someone in the circle invites you outside. <strong style={{ color: P.ink }}>2 walks</strong> last month.
            </div>
          </div>
        </Room>

        {/* Doors / corridors — small directional labels */}
        <Door palette={P} x={310}  y={108} label="enter dining" />
        <Door palette={P} x={310}  y={430} label="to bulletin"  />
        <Door palette={P} x={310}  y={780} label="to porch"     />
        <Door palette={P} x={930}  y={300} label="to library"   />
      </div>
    </div>
  );
}

// === ATRIUM ============================================================

function PlazaAtrium() {
  const P = ATRIUM;
  const D = HOME_DATA;
  const R = buildPlazaData(D).rooms;
  return (
    <div style={{
      width: '100%', height: '100%', background: P.paper, color: P.ink,
      fontFamily: P.font.body, overflow: 'hidden', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 32px', borderBottom: `1px solid ${P.rule}`,
        background: P.cardAlt,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{
          fontFamily: P.font.body, fontSize: 12, fontWeight: 600,
          color: P.muted, letterSpacing: 0.3,
        }}>Hartwood House · A map of your circle</div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', fontSize: 12, color: P.muted }}>
          <span>Thursday afternoon · 2:14</span>
          <span style={{ color: P.accent, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: P.accent }} />
            12 members in the house
          </span>
        </div>
      </div>

      {/* Page title */}
      <div style={{ padding: '24px 32px 18px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: `1px solid ${P.rule}` }}>
        <div>
          <div style={{ fontFamily: P.font.body, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.14em', color: P.accent, textTransform: 'uppercase', marginBottom: 6 }}>
            Plan view
          </div>
          <h1 style={{
            fontFamily: P.font.display, fontSize: 40, lineHeight: 1.02,
            margin: 0, fontWeight: 600, letterSpacing: '-0.022em',
          }}>Walk the house, Maren.</h1>
        </div>
        <div style={{
          fontFamily: P.font.body, fontSize: 13, color: P.muted, fontWeight: 500,
          textAlign: 'right', maxWidth: 360, lineHeight: 1.55,
        }}>
          Eight rooms, live.<br />
          Tap a room to step inside.
        </div>
      </div>

      {/* The plan */}
      <div style={{ position: 'relative', height: 940, padding: '40px 16px 16px' }}>
        <div style={{
          position: 'absolute', left: 16, top: 28, right: 16, bottom: 16,
          border: `1.5px solid ${P.rule}`, borderRadius: 24,
          backgroundImage: `radial-gradient(circle at 20% 20%, ${hex(P.accent, 0.08)} 0%, transparent 40%), radial-gradient(circle at 80% 80%, ${hex(P.ok, 0.08)} 0%, transparent 40%)`,
          backgroundColor: P.cardAlt,
        }} />

        <div style={{
          position: 'absolute', left: 344, top: 432, width: 580, height: 16,
          background: `repeating-linear-gradient(45deg, ${P.rule} 0 6px, transparent 6px 12px)`,
          opacity: 0.5,
        }} />

        {/* Director's office */}
        <Room palette={P} atrium {...R.directorsOffice}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MockAvatar name="Maren Vasilakis" initials="MV" size={48} palette={P} />
            <div>
              <div style={{ fontFamily: P.font.display, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>Maren V.</div>
              <div style={{ fontSize: 12, color: P.muted, marginTop: 2, fontWeight: 500 }}>Class of ’14 · VP Product</div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 13.5, color: P.ink2, lineHeight: 1.5, fontStyle: 'italic', fontFamily: P.font.serif }}>
            “Three on your desk. One needs you today.”
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', gap: 6 }}>
            <button style={{ fontFamily: P.font.body, fontSize: 11.5, padding: '6px 12px', background: P.cardAlt, border: `1px solid ${P.rule}`, borderRadius: 999, cursor: 'pointer', fontWeight: 600 }}>Profile</button>
            <button style={{ fontFamily: P.font.body, fontSize: 11.5, padding: '6px 12px', background: P.cardAlt, border: `1px solid ${P.rule}`, borderRadius: 999, cursor: 'pointer', fontWeight: 600 }}>Settings</button>
          </div>
        </Room>

        {/* Study */}
        <Room palette={P} atrium {...R.study}>
          <div style={{
            fontFamily: P.font.display, fontSize: 56, lineHeight: 0.95,
            fontWeight: 600, color: P.accent, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em',
          }}>0{D.pending.length}</div>
          <div style={{ fontSize: 13, color: P.muted, marginTop: -2, marginBottom: 10, fontWeight: 500 }}>mentees waiting · oldest 4 days</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0 }}>
            {D.pending.slice(0, 3).map((p, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '8px 0', borderTop: `1px solid ${P.ruleSoft}`,
              }}>
                <MockAvatar name={p.name} initials={p.initials} size={28} palette={P} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: P.ink }}>{p.name} <span style={{ color: P.muted, fontWeight: 500, fontSize: 11 }}>· {p.cohort} · {p.days}d</span></div>
                  <div style={{ fontSize: 12, color: P.muted, lineHeight: 1.4, marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>“{p.body.slice(0, 90)}…”</div>
                </div>
              </div>
            ))}
          </div>
          <button style={{
            fontFamily: P.font.body, fontSize: 12.5, fontWeight: 600,
            padding: '9px 14px', background: P.accent, color: '#fff',
            border: 'none', borderRadius: 999, cursor: 'pointer', marginTop: 6,
            alignSelf: 'flex-start',
          }}>Open the study →</button>
        </Room>

        {/* Mail slot */}
        <Room palette={P} atrium {...R.mailSlot}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontFamily: P.font.display, fontSize: 40, fontWeight: 600, color: P.ink, letterSpacing: '-0.03em' }}>5</div>
            <div style={{ fontSize: 12.5, color: P.muted, fontWeight: 500 }}>unread · 2 threads active</div>
          </div>
          <div style={{ marginTop: 6 }}>
            <RoomLine label="Iris · Seed deck"     value="2 new"  accent={P.accent} palette={P} />
            <RoomLine label="Dev · Hiring loops"   value="1 new"  palette={P} />
            <RoomLine label="Lena · Career switch" value="pending" accent={P.warn} palette={P} />
          </div>
          <button style={{
            fontFamily: P.font.body, fontSize: 12, fontWeight: 600,
            padding: '7px 14px', background: P.cardAlt, color: P.ink,
            border: `1px solid ${P.rule}`, borderRadius: 999, cursor: 'pointer',
            marginTop: 'auto', alignSelf: 'flex-start',
          }}>Check the mail →</button>
        </Room>

        {/* Dining room — hero */}
        <Room palette={P} atrium {...R.diningRoom} big>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: P.font.display, fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em', color: P.ink, lineHeight: 1.1 }}>
                Spring Supper at Hartwood
              </div>
              <div style={{ fontFamily: P.font.serif, fontSize: 14.5, fontStyle: 'italic', color: P.muted, marginTop: 6 }}>
                A long-table supper for twelve. The room is two thirds full.
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                <span style={{ fontSize: 12.5, color: P.muted, fontWeight: 500 }}>Tue · May 20 · 7:00 PM</span>
                <span style={{ fontSize: 12.5, color: P.muted, fontWeight: 500 }}>· The Hartwood House, Brooklyn</span>
              </div>
            </div>
            <div style={{
              textAlign: 'right',
              padding: '10px 16px',
              background: P.ink, color: '#fff', borderRadius: 16,
              minWidth: 130,
            }}>
              <div style={{ fontFamily: P.font.display, fontSize: 52, fontWeight: 600, color: P.accent, letterSpacing: '-0.04em', lineHeight: 0.9 }}>
                {D.event.days}d
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 6, fontWeight: 500 }}>
                {D.event.going}/{D.event.capacity} going
              </div>
            </div>
          </div>

          {/* Long table */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, marginBottom: 8 }}>
              The long table · 60 seats
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)', gap: 3,
              padding: '14px 14px', background: P.cardAlt, border: `1px solid ${P.rule}`, borderRadius: 12,
            }}>
              {Array.from({ length: 60 }).map((_, i) => {
                const filled = i < D.event.going;
                const isYou = i === 0;
                return (
                  <div key={i} style={{
                    width: '100%', aspectRatio: '1 / 1', borderRadius: 4,
                    background: isYou ? P.accent : (filled ? P.ink : P.card),
                    border: `1px solid ${filled ? P.ink : P.rule}`,
                  }} />
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11.5, color: P.muted, fontWeight: 500 }}>
              <span style={{ color: P.accent }}>● You · seat 01</span>
              <span>○ {D.event.capacity - D.event.going} seats free</span>
            </div>
          </div>

          <div style={{
            marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${P.ruleSoft}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex' }}>
                {D.newJoiners.slice(0, 4).map((m, i) => (
                  <div key={i} style={{ marginLeft: i === 0 ? 0 : -7, boxShadow: `0 0 0 2px ${P.card}`, position: 'relative', zIndex: 4 - i, borderRadius: 999 }}>
                    <MockAvatar name={m.name} initials={m.initials} size={26} palette={P} />
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12.5, color: P.muted, fontWeight: 500 }}>{D.event.going - 4} more sitting down</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ fontFamily: P.font.body, fontSize: 13, padding: '9px 16px', background: P.accent, color: '#fff', border: 'none', borderRadius: 999, cursor: 'pointer', fontWeight: 600 }}>Take a seat →</button>
              <button style={{ fontFamily: P.font.body, fontSize: 13, padding: '9px 16px', background: P.cardAlt, color: P.ink, border: `1px solid ${P.rule}`, borderRadius: 999, cursor: 'pointer', fontWeight: 600 }}>+ Plus one</button>
            </div>
          </div>
        </Room>

        {/* Bulletin */}
        <Room palette={P} atrium {...R.bulletin}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
            {[
              { who: 'Iris Okonkwo',     what: 'requested mentorship',  when: '3h',  tone: 'accent' },
              { who: 'Dev Ramachandran', what: 'sent you a friend request', when: '1d', tone: 'ok' },
              { who: 'Priya Sastry',     what: 'posted in #design-leads', when: '1d', tone: 'muted' },
              { who: 'Sam Aldridge',     what: 'accepted your intro',    when: '2d', tone: 'ink' },
              { who: 'Spring Supper',    what: 'is six days away',       when: '2d', tone: 'warn' },
              { who: 'Lena Park',        what: 'sent a message',         when: '4d', tone: 'muted' },
            ].map((a, i) => {
              const color = { accent: P.accent, ok: P.ok, muted: P.muted, ink: P.ink, warn: P.warn }[a.tone];
              return (
                <div key={i} style={{
                  background: P.card, border: `1px solid ${P.rule}`, borderRadius: 8,
                  padding: '8px 12px', maxWidth: 240,
                  transform: `rotate(${(i % 2 ? -0.6 : 0.5)}deg)`,
                  boxShadow: '2px 3px 0 rgba(42,34,26,0.05)',
                }}>
                  <div style={{ fontSize: 12.5, color: P.ink, lineHeight: 1.4 }}>
                    <strong style={{ fontWeight: 600 }}>{a.who}</strong> <span style={{ color: P.muted }}>{a.what}</span>
                  </div>
                  <div style={{
                    fontSize: 11, color, fontWeight: 600, marginTop: 3,
                  }}>· {a.when}</div>
                </div>
              );
            })}
          </div>
        </Room>

        {/* Porch */}
        <Room palette={P} atrium {...R.porch}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, flex: 1 }}>
            {D.newJoiners.map((m, i) => (
              <div key={i} style={{
                border: `1px solid ${P.rule}`, padding: 12, background: P.card, borderRadius: 12,
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <MockAvatar name={m.name} initials={m.initials} size={30} palette={P} />
                  <span style={{ fontSize: 11, color: P.accent, fontWeight: 600 }}>● Joined {m.joined}</span>
                </div>
                <div style={{ fontFamily: P.font.display, fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{m.name}</div>
                <div style={{ fontSize: 11.5, color: P.muted, fontWeight: 500 }}>{m.cohort} · {m.city}</div>
                <div style={{ fontSize: 12, color: P.ink2, marginTop: 2, lineHeight: 1.4 }}>{m.title}</div>
              </div>
            ))}
          </div>
        </Room>

        {/* Library */}
        <Room palette={P} atrium {...R.library}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { with: 'Iris Okonkwo',     initials: 'IO', title: 'Seed deck gut-check',         next: 'Thu · May 22 · 4:00 PM', preview: 'Confirmed. Excited.', state: 'active' },
              { with: 'Dev Ramachandran', initials: 'DR', title: 'Director-level hiring loops', next: null,                      preview: 'Sending my director-loop template…', state: 'active' },
              { with: 'Sam Aldridge',     initials: 'SA', title: 'Pro bono coordinators',       next: 'Mon · May 25',            preview: 'Saw your note — let’s catch up.', state: 'paused' },
            ].map((th, i) => (
              <div key={i} style={{ padding: 12, border: `1px solid ${P.rule}`, background: P.card, borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <MockAvatar name={th.with} initials={th.initials} size={24} palette={P} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: P.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{th.with}</span>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: th.state === 'active' ? P.ok : P.mute2 }}>● {th.state}</span>
                </div>
                <div style={{ fontFamily: P.font.serif, fontSize: 13.5, color: P.ink2, marginTop: 6 }}>{th.title}</div>
                <div style={{ fontSize: 12, color: P.muted, marginTop: 4, lineHeight: 1.4, fontStyle: 'italic' }}>“{th.preview}”</div>
                {th.next ? (
                  <div style={{ fontSize: 11, color: P.accent, fontWeight: 600, marginTop: 6 }}>Next · {th.next}</div>
                ) : null}
              </div>
            ))}
          </div>
        </Room>

        {/* Garden */}
        <Room palette={P} atrium {...R.garden}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontFamily: P.font.serif, fontSize: 18, fontStyle: 'italic', color: P.ink2, lineHeight: 1.4 }}>
              “Nothing waiting here.”
            </div>
            <div style={{ fontSize: 13, color: P.muted, marginTop: 8, lineHeight: 1.55, fontWeight: 500 }}>
              The garden stays quiet until someone in the circle invites you outside. <strong style={{ color: P.ink }}>2 walks</strong> last month.
            </div>
          </div>
        </Room>

        {/* Doors */}
        <Door palette={P} atrium x={310}  y={108} label="enter dining" />
        <Door palette={P} atrium x={310}  y={430} label="to bulletin"  />
        <Door palette={P} atrium x={310}  y={780} label="to porch"     />
        <Door palette={P} atrium x={930}  y={300} label="to library"   />
      </div>
    </div>
  );
}

// Tiny hex helper for translucent palette tints
function hex(c, a = 1) {
  if (a >= 1) return c;
  const n = Math.round(a * 255).toString(16).padStart(2, '0');
  return c + n;
}

window.PlazaCivic = PlazaCivic;
window.PlazaAtrium = PlazaAtrium;
