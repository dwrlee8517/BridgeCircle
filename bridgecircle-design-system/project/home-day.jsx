/* eslint-disable */
// THE DAY'S HAND — A literal day-timeline running down the page. A "now"
// rule slides through the day. Past entries fade; future ones invite
// action. Top-to-bottom = time. The week is shown as a thin strip up top
// so the day in focus isn't isolated.

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const NOW_HOUR = 14.23; // 2:14 PM — matches the "Thu 15 May 2:14 PM" header

function fmt(h) {
  const am = h < 12 || h === 24;
  const hh = h % 12 || 12;
  return `${hh} ${am ? 'AM' : 'PM'}`;
}

// Entry data — same for both themes. The page is the same shape; chrome
// changes. Each entry has a "lane" (who/what), a time, and an action.
function buildEntries() {
  return [
    {
      hour: 8.25, kind: 'past', lane: 'inbox',
      icon: 'M',
      title: 'Lena Park asked again',
      sub: 'Class of ’18 · 4 days waiting · longest in queue',
      body: 'Considering leaving Currents for an AI-policy nonprofit; wants 30 min on the product → policy jump.',
      action: 'Reply now',
    },
    {
      hour: 9.5, kind: 'past', lane: 'thread',
      icon: 'IO',
      title: 'Iris confirmed Thursday',
      sub: 'Thread: Seed deck gut-check · message #7',
      body: '“Confirmed. Excited.” The Thursday 4 PM call is on your calendar.',
      action: 'Open thread',
    },
    {
      hour: 11.0, kind: 'past', lane: 'event',
      icon: '○',
      title: 'Two RSVPs to Spring Supper while you slept',
      sub: 'Tara Mensah (’21), Jules Patel (’16) · 38/60 going',
      body: 'Jules is bringing a plus-one — a writer she met at a residency.',
      action: 'See attendees',
    },
    {
      hour: NOW_HOUR, kind: 'now', lane: 'now',
      icon: '●',
      title: 'You are here.',
      sub: 'Thursday · 2:14 PM · the rest of the day is yours to set',
      body: null,
      action: null,
    },
    {
      hour: 15.0, kind: 'soon', lane: 'office',
      icon: 'MO',
      title: 'Matty Osei opens office hours',
      sub: 'Thu 3:00 PM · 15-min slots · 3 of 5 booked',
      body: 'He’s asked twice for your seed-deal notes before the slot starts.',
      action: 'Book a slot',
    },
    {
      hour: 16.0, kind: 'future', lane: 'thread',
      icon: 'IO',
      title: 'Iris call — slides 7–12',
      sub: 'Thu 4:00 PM · Zoom · 30 min',
      body: 'Last week you flagged the “why now” slide. She’s rewritten it.',
      action: 'Prep notes',
    },
    {
      hour: 18.0, kind: 'future', lane: 'inbox',
      icon: 'DR',
      title: 'Dev Ramachandran — async',
      sub: 'No reply needed; he’ll send the loop template by tonight',
      body: 'Director-level hiring loops. Two-sender thread, low pressure.',
      action: 'Mark read',
    },
    {
      hour: 19.5, kind: 'future', lane: 'event',
      icon: '★',
      title: 'Tuesday 7 PM — Spring Supper, T−6 days',
      sub: 'You’re hosting · 22 seats free · Brooklyn',
      body: 'Lena lives a block away — could be an in-person reply.',
      action: 'Invite Lena',
    },
    {
      hour: 21.0, kind: 'future', lane: 'house',
      icon: '·',
      title: 'House closes 11 PM',
      sub: 'After-hours: garden + library only',
      body: null,
      action: null,
    },
  ];
}

function laneColor(lane, palette) {
  return ({
    inbox: palette.accent, thread: palette.ok, event: palette.warn,
    office: palette.ink, now: palette.bad || '#9b2c1f', house: palette.muted,
  })[lane] || palette.muted;
}

// Compute a "y" position for an entry along the rail. Visual hours start
// at HOURS[0] and end at HOURS.at(-1) — the lane track inside that range.
function yFor(hour, totalH) {
  const min = HOURS[0];
  const max = HOURS[HOURS.length - 1];
  const t = (hour - min) / (max - min);
  return Math.round(t * totalH);
}

// Week strip — Mon..Sun, today highlighted, dots for events that day
function WeekStrip({ palette: P, atrium }) {
  const days = [
    { d: 'Mon', n: 12, dots: 0 },
    { d: 'Tue', n: 13, dots: 1 }, // office hours past
    { d: 'Wed', n: 14, dots: 0 },
    { d: 'Thu', n: 15, dots: 3, today: true },
    { d: 'Fri', n: 16, dots: 0 },
    { d: 'Sat', n: 17, dots: 1 }, // intro coffee
    { d: 'Sun', n: 18, dots: 0 },
    { d: 'Mon', n: 19, dots: 0 },
    { d: 'Tue', n: 20, dots: 1, supper: true },
    { d: 'Wed', n: 21, dots: 0 },
    { d: 'Thu', n: 22, dots: 1 }, // Iris reschedule
    { d: 'Fri', n: 23, dots: 0 },
  ];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${days.length}, 1fr)`,
      gap: atrium ? 8 : 0,
      borderTop: `1px solid ${P.ink}`, borderBottom: `1px solid ${P.ink}`,
      background: atrium ? P.cardAlt : P.paper,
    }}>
      {days.map((d, i) => {
        const isToday = !!d.today;
        const isSupper = !!d.supper;
        return (
          <div key={i} style={{
            padding: '10px 8px 12px',
            borderRight: !atrium && i < days.length - 1 ? `1px solid ${P.ruleSoft}` : 'none',
            background: isToday ? P.ink : 'transparent',
            color: isToday ? P.paper : P.ink,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            borderRadius: atrium ? 10 : 0,
            position: 'relative',
          }}>
            <span style={{
              fontFamily: P.font.mono, fontSize: 9.5, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: isToday ? 'rgba(255,255,255,0.7)' : P.muted, fontWeight: 600,
            }}>{d.d}</span>
            <span style={{
              fontFamily: P.font.display, fontSize: 18, fontWeight: 600,
              color: isToday ? P.paper : P.ink, letterSpacing: '-0.01em',
            }}>{d.n}</span>
            <div style={{ display: 'flex', gap: 3, minHeight: 6 }}>
              {Array.from({ length: d.dots }).map((_, k) => (
                <span key={k} style={{
                  width: 5, height: 5, borderRadius: atrium ? 999 : 0,
                  background: isSupper ? P.accent : (isToday ? P.paper : P.muted),
                }} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// === CIVIC =============================================================

function TimelineCivic() {
  const P = CIVIC;
  const D = HOME_DATA;
  const entries = buildEntries();
  const railH = 820;
  return (
    <div style={{
      width: '100%', height: '100%', background: P.paper, color: P.ink,
      fontFamily: P.font.body, overflow: 'hidden', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top strip */}
      <div style={{
        padding: '10px 40px', borderBottom: `1px solid ${P.ruleSoft}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.16em',
        textTransform: 'uppercase', color: P.mute2,
      }}>
        <span>The Hartwood Society · Maren’s day</span>
        <span>Thu · 15 May 2026 · 2:14 PM</span>
      </div>

      {/* Header */}
      <div style={{
        padding: '24px 40px 20px', borderBottom: `2px solid ${P.ink}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      }}>
        <div>
          <div style={{
            fontFamily: P.font.mono, fontSize: 10.5, letterSpacing: '0.18em',
            color: P.muted, textTransform: 'uppercase', marginBottom: 8,
          }}>§ 01 · Today</div>
          <h1 style={{
            fontFamily: P.font.display, fontSize: 42, lineHeight: 1.0,
            margin: 0, fontWeight: 600, letterSpacing: '-0.025em',
          }}>
            Three behind, three ahead.<br />
            <span style={{ color: P.muted }}>One is happening now.</span>
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.16em',
            color: P.muted, textTransform: 'uppercase', lineHeight: 1.7,
          }}>
            08:00 — 21:00<br />
            13 hour window<br />
            <span style={{ color: P.accent }}>● Now: 2:14 PM</span>
          </div>
        </div>
      </div>

      {/* Week strip */}
      <div style={{ padding: '0 40px', background: P.paper }}>
        <WeekStrip palette={P} />
      </div>

      {/* The timeline */}
      <div style={{
        flex: 1, padding: '24px 40px 24px',
        display: 'grid', gridTemplateColumns: '88px 1fr', gap: 24,
        position: 'relative',
      }}>
        {/* Hour rail (left gutter) */}
        <div style={{ position: 'relative', height: railH }}>
          {HOURS.map((h) => {
            const y = yFor(h, railH);
            return (
              <div key={h} style={{
                position: 'absolute', top: y, left: 0, right: 0,
                display: 'flex', alignItems: 'center', gap: 8,
                transform: 'translateY(-50%)',
              }}>
                <span style={{
                  fontFamily: P.font.mono, fontSize: 10.5, letterSpacing: '0.14em',
                  color: P.muted, textTransform: 'uppercase', fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums', width: 56,
                }}>{fmt(h)}</span>
                <span style={{ flex: 1, height: 1, background: P.ruleSoft }} />
              </div>
            );
          })}
          {/* Now indicator on the rail */}
          <div style={{
            position: 'absolute', top: yFor(NOW_HOUR, railH), left: 0, right: 0,
            display: 'flex', alignItems: 'center', gap: 8,
            transform: 'translateY(-50%)',
          }}>
            <span style={{
              fontFamily: P.font.mono, fontSize: 10.5, letterSpacing: '0.14em',
              color: P.accent, textTransform: 'uppercase', fontWeight: 600,
              fontVariantNumeric: 'tabular-nums', width: 56,
            }}>NOW</span>
            <span style={{ flex: 1, height: 1.5, background: P.accent }} />
          </div>
        </div>

        {/* Entries column */}
        <div style={{ position: 'relative', height: railH, borderLeft: `1px solid ${P.rule}` }}>
          {/* Hour hairlines extended into the entries area */}
          {HOURS.map((h) => (
            <div key={h} style={{
              position: 'absolute', top: yFor(h, railH), left: 0, right: 0, height: 1,
              background: P.ruleSoft,
            }} />
          ))}
          {/* Now rule extended */}
          <div style={{
            position: 'absolute', top: yFor(NOW_HOUR, railH), left: 0, right: 0, height: 1.5,
            background: P.accent, zIndex: 2,
          }} />
          {/* Subtle "past" wash above the now line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: yFor(NOW_HOUR, railH),
            background: `linear-gradient(180deg, ${P.panel} 0%, transparent 100%)`,
            opacity: 0.6, pointerEvents: 'none',
          }} />

          {entries.map((e, i) => {
            const y = yFor(e.hour, railH);
            const color = laneColor(e.lane, P);
            const isNow = e.kind === 'now';
            const isPast = e.kind === 'past';
            // alternate cards left/right within the column for editorial rhythm
            const alignRight = i % 2 === 1;
            if (isNow) {
              return (
                <div key={i} style={{
                  position: 'absolute', top: y, left: 0, right: 0,
                  transform: 'translateY(-50%)', padding: '0 24px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: 999,
                    background: P.accent, boxShadow: `0 0 0 4px ${P.paper}, 0 0 0 5px ${P.accent}`,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: P.font.display, fontSize: 26, fontWeight: 600, color: P.ink, letterSpacing: '-0.02em' }}>
                      {e.title}
                    </div>
                    <div style={{ fontSize: 13, color: P.muted, marginTop: 2 }}>{e.sub}</div>
                  </div>
                </div>
              );
            }
            return (
              <div key={i} style={{
                position: 'absolute', top: y, left: 24, right: 24,
                transform: 'translateY(-50%)',
                display: 'flex', justifyContent: alignRight ? 'flex-end' : 'flex-start',
                opacity: isPast ? 0.62 : 1,
              }}>
                <div style={{
                  maxWidth: 520, width: '100%',
                  background: P.card, border: `1px solid ${P.rule}`,
                  padding: '12px 14px',
                  display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 12,
                  alignItems: 'center',
                  position: 'relative',
                }}>
                  {/* Tick into the rail */}
                  <span style={{
                    position: 'absolute',
                    right: alignRight ? '100%' : 'auto',
                    left:  alignRight ? 'auto'  : '100%',
                    top: '50%', transform: 'translateY(-50%)',
                    width: 24, height: 1, background: color,
                  }} />
                  <div style={{
                    width: 32, height: 32,
                    background: color, color: '#fff',
                    display: 'grid', placeItems: 'center',
                    fontFamily: P.font.display, fontSize: 12, fontWeight: 600,
                  }}>{e.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: P.ink }}>{e.title}</div>
                    <div style={{ fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.12em', color: P.muted, textTransform: 'uppercase', marginTop: 2 }}>{e.sub}</div>
                    {e.body ? <div style={{ fontSize: 12.5, color: P.ink2, marginTop: 4, lineHeight: 1.4 }}>{e.body}</div> : null}
                  </div>
                  {e.action ? (
                    <button style={{
                      fontFamily: P.font.body, fontSize: 11.5, fontWeight: 500,
                      padding: '6px 10px', whiteSpace: 'nowrap',
                      background: isPast ? 'transparent' : P.ink,
                      color: isPast ? P.ink : P.paper,
                      border: `1px solid ${P.ink}`, borderRadius: 2, cursor: 'pointer',
                    }}>{e.action} →</button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Foot summary */}
      <div style={{
        padding: '12px 40px', borderTop: `1px solid ${P.ink}`,
        background: P.panel,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.16em',
        textTransform: 'uppercase', color: P.muted,
      }}>
        <span>End of day: 4 unanswered · 2 owed replies</span>
        <span>· press <strong style={{ color: P.ink }}>J / K</strong> to step through entries</span>
        <span>Tomorrow: 2 office hours, 0 events</span>
      </div>
    </div>
  );
}

// === ATRIUM ============================================================

function TimelineAtrium() {
  const P = ATRIUM;
  const D = HOME_DATA;
  const entries = buildEntries();
  const railH = 820;
  return (
    <div style={{
      width: '100%', height: '100%', background: P.paper, color: P.ink,
      fontFamily: P.font.body, overflow: 'hidden', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top strip */}
      <div style={{
        padding: '10px 40px', borderBottom: `1px solid ${P.ruleSoft}`,
        background: P.cardAlt,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 12, color: P.muted, fontWeight: 500,
      }}>
        <span>Hartwood · Maren’s day</span>
        <span>Thursday, May 15 · 2:14 PM</span>
      </div>

      {/* Header */}
      <div style={{
        padding: '26px 40px 22px', borderBottom: `1px solid ${P.rule}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      }}>
        <div>
          <div style={{
            fontFamily: P.font.body, fontSize: 11.5, fontWeight: 700,
            letterSpacing: '0.14em', color: P.accent, textTransform: 'uppercase',
            marginBottom: 8,
          }}>Today</div>
          <h1 style={{
            fontFamily: P.font.display, fontSize: 40, lineHeight: 1.02,
            margin: 0, fontWeight: 600, letterSpacing: '-0.022em',
          }}>
            Three behind, three ahead.<br />
            <span style={{ color: P.muted, fontStyle: 'italic' }}>One is happening now.</span>
          </h1>
        </div>
        <div style={{
          textAlign: 'right',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-end',
            padding: '7px 14px', background: P.card, border: `1px solid ${P.rule}`,
            borderRadius: 999, fontSize: 12, color: P.muted, fontWeight: 500,
          }}>
            08:00 — 21:00 · 13 hour window
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-end',
            padding: '7px 14px', background: _tlHex(P.accent, 0.14), border: `1px solid ${_tlHex(P.accent, 0.32)}`,
            borderRadius: 999, fontSize: 12, color: P.accent, fontWeight: 700,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: P.accent }} />
            Now · 2:14 PM
          </div>
        </div>
      </div>

      {/* Week strip */}
      <div style={{ padding: '14px 40px 0', background: P.paper }}>
        <WeekStrip palette={P} atrium />
      </div>

      {/* The timeline */}
      <div style={{
        flex: 1, padding: '26px 40px 24px',
        display: 'grid', gridTemplateColumns: '88px 1fr', gap: 24,
        position: 'relative',
      }}>
        {/* Hour rail (left gutter) */}
        <div style={{ position: 'relative', height: railH }}>
          {HOURS.map((h) => {
            const y = yFor(h, railH);
            return (
              <div key={h} style={{
                position: 'absolute', top: y, left: 0, right: 0,
                display: 'flex', alignItems: 'center', gap: 8,
                transform: 'translateY(-50%)',
              }}>
                <span style={{
                  fontFamily: P.font.body, fontSize: 11, fontWeight: 600,
                  color: P.muted, fontVariantNumeric: 'tabular-nums', width: 56,
                }}>{fmt(h)}</span>
                <span style={{ flex: 1, height: 1, background: P.ruleSoft }} />
              </div>
            );
          })}
          {/* Now */}
          <div style={{
            position: 'absolute', top: yFor(NOW_HOUR, railH), left: 0, right: 0,
            display: 'flex', alignItems: 'center', gap: 8,
            transform: 'translateY(-50%)',
          }}>
            <span style={{
              fontFamily: P.font.body, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.1em', color: P.accent, textTransform: 'uppercase',
              width: 56,
            }}>Now</span>
            <span style={{ flex: 1, height: 1.5, background: P.accent }} />
          </div>
        </div>

        {/* Entries column */}
        <div style={{
          position: 'relative', height: railH,
          borderLeft: `2px solid ${P.rule}`,
          borderRadius: 0,
        }}>
          {HOURS.map((h) => (
            <div key={h} style={{
              position: 'absolute', top: yFor(h, railH), left: 0, right: 0, height: 1,
              background: P.ruleSoft,
            }} />
          ))}
          <div style={{
            position: 'absolute', top: yFor(NOW_HOUR, railH), left: 0, right: 0, height: 1.5,
            background: P.accent, zIndex: 2,
          }} />
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: yFor(NOW_HOUR, railH),
            background: `linear-gradient(180deg, ${P.cardAlt} 0%, transparent 100%)`,
            opacity: 0.55, pointerEvents: 'none',
          }} />

          {entries.map((e, i) => {
            const y = yFor(e.hour, railH);
            const color = laneColor(e.lane, P);
            const isNow = e.kind === 'now';
            const isPast = e.kind === 'past';
            const alignRight = i % 2 === 1;
            if (isNow) {
              return (
                <div key={i} style={{
                  position: 'absolute', top: y, left: 0, right: 0,
                  transform: 'translateY(-50%)', padding: '0 24px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 999,
                    background: P.accent,
                    boxShadow: `0 0 0 4px ${P.paper}, 0 0 0 6px ${P.accent}, 0 0 0 10px ${_tlHex(P.accent, 0.22)}`,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: P.font.display, fontSize: 28, fontWeight: 600, color: P.ink, letterSpacing: '-0.02em' }}>
                      {e.title}
                    </div>
                    <div style={{ fontSize: 13.5, color: P.muted, marginTop: 2, fontWeight: 500 }}>{e.sub}</div>
                  </div>
                </div>
              );
            }
            return (
              <div key={i} style={{
                position: 'absolute', top: y, left: 24, right: 24,
                transform: 'translateY(-50%)',
                display: 'flex', justifyContent: alignRight ? 'flex-end' : 'flex-start',
                opacity: isPast ? 0.62 : 1,
              }}>
                <div style={{
                  maxWidth: 520, width: '100%',
                  background: P.card, border: `1px solid ${P.rule}`,
                  padding: '12px 16px', borderRadius: 14,
                  display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 12,
                  alignItems: 'center',
                  position: 'relative',
                  boxShadow: '0 1px 0 rgba(255,255,255,.5) inset, 0 1px 2px rgba(42,34,26,0.05)',
                }}>
                  <span style={{
                    position: 'absolute',
                    right: alignRight ? '100%' : 'auto',
                    left:  alignRight ? 'auto'  : '100%',
                    top: '50%', transform: 'translateY(-50%)',
                    width: 24, height: 2, background: color, borderRadius: 999,
                  }} />
                  <div style={{
                    width: 34, height: 34, borderRadius: 999,
                    background: color, color: '#fff',
                    display: 'grid', placeItems: 'center',
                    fontFamily: P.font.display, fontSize: 12, fontWeight: 600,
                  }}>{e.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: P.ink }}>{e.title}</div>
                    <div style={{ fontSize: 12, color: P.muted, marginTop: 2, fontWeight: 500 }}>{e.sub}</div>
                    {e.body ? <div style={{ fontSize: 13, color: P.ink2, marginTop: 4, lineHeight: 1.4 }}>{e.body}</div> : null}
                  </div>
                  {e.action ? (
                    <button style={{
                      fontFamily: P.font.body, fontSize: 12.5, fontWeight: 600,
                      padding: '7px 14px', whiteSpace: 'nowrap',
                      background: isPast ? P.cardAlt : P.accent,
                      color: isPast ? P.ink : '#fff',
                      border: isPast ? `1px solid ${P.rule}` : 'none',
                      borderRadius: 999, cursor: 'pointer',
                    }}>{e.action} →</button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Foot */}
      <div style={{
        padding: '14px 40px', borderTop: `1px solid ${P.rule}`,
        background: P.cardAlt,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 12.5, color: P.muted, fontWeight: 500,
      }}>
        <span>End of day · 4 unanswered, 2 owed replies</span>
        <span>Press <strong style={{ color: P.ink }}>J / K</strong> to step through</span>
        <span>Tomorrow: 2 office hours, 0 events</span>
      </div>
    </div>
  );
}

// Tiny alpha-hex helper. Renamed to avoid colliding with home-plaza.jsx's
// same-named helper at the global scope.
function _tlHex(c, a) {
  if (a == null || a >= 1) return c;
  var n = Math.round(a * 255).toString(16);
  if (n.length < 2) n = '0' + n;
  return c + n;
}

window.TimelineCivic = TimelineCivic;
window.TimelineAtrium = TimelineAtrium;
