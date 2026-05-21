/* eslint-disable */
// THE DAILY DISPATCH — Editorial newspaper front page, pushed all the way.
// One hand-curated lede above the fold, masthead, folio, three sub-stories
// below the fold that are actually live actions. The system writes you a
// front page each morning.

// Tiny KPI tile used in the masthead strip
function DispatchKPI({ label, value, accent, palette, mono = true, big = false }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: '0 18px', borderLeft: `1px solid ${palette.rule}`,
      minWidth: 0,
    }}>
      <div style={{
        fontFamily: palette.font.mono, fontSize: 9.5, letterSpacing: '0.18em',
        color: palette.muted, textTransform: 'uppercase',
      }}>{label}</div>
      <div style={{
        fontFamily: mono ? palette.font.display : palette.font.body,
        fontSize: big ? 28 : 22, fontWeight: 600,
        color: accent || palette.ink, letterSpacing: '-0.02em',
        marginTop: 4, fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
    </div>
  );
}

// Numbered story column used below the fold
function DispatchStory({ n, kind, title, dek, body, byline, action, palette, accentColor }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{
          fontFamily: palette.font.mono, fontSize: 9.5, letterSpacing: '0.18em',
          color: accentColor, textTransform: 'uppercase', fontWeight: 600,
        }}>No. {String(n).padStart(2, '0')}</span>
        <span style={{
          fontFamily: palette.font.mono, fontSize: 9.5, letterSpacing: '0.18em',
          color: palette.muted, textTransform: 'uppercase',
        }}>· {kind}</span>
      </div>
      <h3 style={{
        fontFamily: palette.font.serif,
        fontSize: 24, fontWeight: 600, margin: 0, lineHeight: 1.15,
        color: palette.ink, letterSpacing: '-0.01em',
      }}>{title}</h3>
      <div style={{
        fontFamily: palette.font.serif, fontSize: 13.5, fontStyle: 'italic',
        color: palette.muted, lineHeight: 1.4,
      }}>{dek}</div>
      <p style={{
        fontFamily: palette.font.serif, fontSize: 14, lineHeight: 1.55,
        color: palette.ink2, margin: 0,
      }}>{body}</p>
      <div style={{
        fontFamily: palette.font.mono, fontSize: 9.5, letterSpacing: '0.16em',
        color: palette.mute2, textTransform: 'uppercase', marginTop: 2,
      }}>— {byline}</div>
      <div style={{ marginTop: 4 }}>{action}</div>
    </div>
  );
}

// Common content — same lede across both themes, since the editorial voice
// IS the design idea. Only colour / type / chrome differ.
function buildLede(D) {
  const oldest = D.pending[0];
  return {
    rubric: `Edition № 142 · Vol. XII · ${new Date('2026-05-15').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
    kicker: 'Today on your desk',
    headline: `${oldest.name} has been waiting four days.`,
    dek: `She’s considering leaving Currents for an AI-policy nonprofit, and she asked for you specifically. You’ve made this jump before — yours was 2019.`,
    lede: `Three of your mentees are in queue this morning, but Lena Park (’18) is the one to write back to first. Two of the other two — Iris Okonkwo and Matty Osei — have asked questions you’ve answered before, and the canned-response file from last spring still applies. Lena’s is new. The Spring Supper is Tuesday and she lives in Brooklyn; you could close this in person if you reply today.`,
  };
}

// === CIVIC ================================================================

function DispatchCivic() {
  const P = CIVIC;
  const D = HOME_DATA;
  const L = buildLede(D);
  return (
    <div style={{
      width: '100%', height: '100%', background: P.paper, color: P.ink,
      fontFamily: P.font.body, overflow: 'hidden', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Folio strip */}
      <div style={{
        padding: '8px 40px',
        borderBottom: `1px solid ${P.ruleSoft}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.16em',
        textTransform: 'uppercase', color: P.mute2,
      }}>
        <span>The Hartwood Society · A daily dispatch for members</span>
        <span style={{ display: 'flex', gap: 18 }}>
          <span>For: Maren V., ’14</span>
          <span style={{ color: P.accent }}>● Live</span>
        </span>
      </div>

      {/* Masthead */}
      <div style={{
        padding: '20px 40px 16px',
        borderBottom: `2px solid ${P.ink}`,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <div style={{
          fontFamily: P.font.serif, fontSize: 56, fontWeight: 600,
          letterSpacing: '-0.03em', lineHeight: 0.95, color: P.ink,
        }}>
          The <span style={{ fontStyle: 'italic' }}>Hartwood</span> Dispatch
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.16em',
            color: P.mute2, textTransform: 'uppercase',
          }}>{L.rubric}</div>
          <div style={{
            fontFamily: P.font.serif, fontStyle: 'italic',
            fontSize: 13, color: P.muted, marginTop: 4,
          }}>“What’s on your desk this morning.”</div>
        </div>
      </div>

      {/* KPI strip — the data is still here, just as a quiet ribbon */}
      <div style={{
        display: 'grid', gridTemplateColumns: '180px repeat(4, 1fr)',
        borderBottom: `1px solid ${P.ink}`, padding: '14px 0',
        background: P.paper,
      }}>
        <div style={{ paddingLeft: 40, display: 'flex', alignItems: 'center' }}>
          <span style={{
            fontFamily: P.font.mono, fontSize: 9.5, letterSpacing: '0.18em',
            color: P.muted, textTransform: 'uppercase',
          }}>Today’s readings</span>
        </div>
        <DispatchKPI label="Mentees waiting" value={`0${D.stats.mentees}`} accent={P.accent} palette={P} big />
        <DispatchKPI label="Days to supper"  value={`${D.event.days}d`} palette={P} big />
        <DispatchKPI label="New this week"   value={`+${D.stats.newThisWeek}`} accent={P.ok} palette={P} big />
        <DispatchKPI label="Open mentors"    value={D.stats.openMentors} palette={P} big />
      </div>

      {/* THE LEDE — above the fold */}
      <div style={{
        padding: '28px 40px 24px',
        display: 'grid', gridTemplateColumns: '180px 1fr 320px', gap: 36,
        borderBottom: `1px solid ${P.ink}`,
      }}>
        {/* Left margin: kicker */}
        <div>
          <div style={{
            fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.18em',
            color: P.accent, textTransform: 'uppercase', fontWeight: 600,
            paddingBottom: 8, borderBottom: `2px solid ${P.accent}`,
            display: 'inline-block',
          }}>The Lede</div>
          <div style={{
            fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.16em',
            color: P.muted, textTransform: 'uppercase', marginTop: 12, lineHeight: 1.7,
          }}>
            § 01<br />Page one<br />—<br />Filed 8:14 AM
          </div>
        </div>

        {/* Centre column: headline + lede paragraph */}
        <div>
          <div style={{
            fontFamily: P.font.mono, fontSize: 10.5, letterSpacing: '0.18em',
            color: P.muted, textTransform: 'uppercase', marginBottom: 10,
          }}>{L.kicker}</div>
          <h1 style={{
            fontFamily: P.font.serif, fontSize: 52, lineHeight: 1.02,
            margin: 0, fontWeight: 600, letterSpacing: '-0.025em', color: P.ink,
          }}>
            {L.headline}
          </h1>
          <div style={{
            fontFamily: P.font.serif, fontStyle: 'italic',
            fontSize: 19, lineHeight: 1.35, color: P.muted,
            margin: '16px 0 18px', maxWidth: 560,
          }}>{L.dek}</div>
          <p style={{
            fontFamily: P.font.serif, fontSize: 15.5, lineHeight: 1.6,
            color: P.ink2, margin: 0, maxWidth: 580,
            columnCount: 1,
          }}>
            <span style={{
              fontFamily: P.font.serif, fontSize: 44, lineHeight: 0.85,
              float: 'left', padding: '6px 8px 0 0', fontWeight: 600, color: P.accent,
            }}>T</span>{L.lede.slice(1)}
          </p>

          {/* Inline action bar — work happens here, no route change */}
          <div style={{
            marginTop: 22, padding: '14px 16px',
            border: `1px solid ${P.ink}`, background: P.card,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <MockAvatar name={D.pending[0].name} initials={D.pending[0].initials} size={32} palette={P} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: P.ink }}>Reply to Lena</div>
                <div style={{ fontSize: 12, color: P.muted }}>Open the thread, or paste your supper invite straight from here.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{
                fontFamily: P.font.body, fontSize: 12, fontWeight: 500,
                padding: '8px 14px', borderRadius: 2,
                background: P.ink, color: P.paper, border: `1px solid ${P.ink}`, cursor: 'pointer',
              }}>Reply now →</button>
              <button style={{
                fontFamily: P.font.body, fontSize: 12, fontWeight: 500,
                padding: '8px 14px', borderRadius: 2,
                background: 'transparent', color: P.ink, border: `1px solid ${P.rule}`, cursor: 'pointer',
              }}>Invite to supper</button>
            </div>
          </div>
        </div>

        {/* Right column: the lede's "subject" — a portrait card */}
        <div>
          <div style={{
            fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.18em',
            color: P.muted, textTransform: 'uppercase', marginBottom: 10,
          }}>The subject</div>
          <div style={{
            background: P.card, border: `1px solid ${P.ink}`, padding: 18,
          }}>
            {/* Placeholder portrait — striped block (no SVG faces) */}
            <div style={{
              width: '100%', aspectRatio: '4 / 5',
              backgroundImage: `repeating-linear-gradient(135deg, ${P.ruleSoft} 0 6px, ${P.panel} 6px 12px)`,
              border: `1px solid ${P.rule}`,
              display: 'flex', alignItems: 'flex-end', padding: 10,
            }}>
              <span style={{
                fontFamily: P.font.mono, fontSize: 9.5, letterSpacing: '0.16em',
                color: P.muted, textTransform: 'uppercase',
                background: P.paper, padding: '3px 6px', border: `1px solid ${P.rule}`,
              }}>Portrait · LP, ’18</span>
            </div>
            <div style={{ ...{}, fontFamily: P.font.serif, fontSize: 18, fontWeight: 600, marginTop: 12, color: P.ink, letterSpacing: '-0.01em' }}>
              Lena Park
            </div>
            <div style={{ fontSize: 12, color: P.muted, marginTop: 2 }}>
              PM at Currents · Brooklyn · Class of ’18
            </div>
            <div style={{
              marginTop: 12, paddingTop: 10, borderTop: `1px solid ${P.rule}`,
              fontFamily: P.font.serif, fontStyle: 'italic', fontSize: 13,
              color: P.ink2, lineHeight: 1.5,
            }}>“I keep thinking about the conversation you had at Spring Supper last year.”</div>
          </div>
        </div>
      </div>

      {/* BELOW THE FOLD — three stories that are live actions */}
      <div style={{
        flex: 1, padding: '24px 40px 16px',
        display: 'grid', gridTemplateColumns: '180px 1fr 1fr 1fr', gap: 36,
      }}>
        <div>
          <div style={{
            fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.18em',
            color: P.muted, textTransform: 'uppercase', fontWeight: 600,
            paddingBottom: 8, borderBottom: `2px solid ${P.ink}`,
            display: 'inline-block',
          }}>Also today</div>
          <div style={{
            fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.16em',
            color: P.muted, textTransform: 'uppercase', marginTop: 12, lineHeight: 1.7,
          }}>
            § 02 — § 04<br />Inside pages<br />—<br />Cont’d p.2
          </div>
        </div>

        <DispatchStory
          n={2} kind="The Calendar"
          title="Spring Supper, six days out — 22 seats remain."
          dek="And one of your mentees lives a block from the door."
          body="The long-table supper opens to plus-ones this season. You’re hosting; Sam Aldridge (’11) is co-host. The room sits sixty; thirty-eight are in. Iris Okonkwo (’19) has already RSVPed, which means a Brooklyn-to-Brooklyn introduction is queued whether you make it or not."
          byline="Filed by The House"
          palette={P} accentColor={P.accent}
          action={<button style={{ fontFamily: P.font.body, fontSize: 12, padding: '7px 12px', background: P.ink, color: P.paper, border: 'none', borderRadius: 2, cursor: 'pointer', fontWeight: 500 }}>RSVP →</button>}
        />

        <DispatchStory
          n={3} kind="The Wire"
          title="Twelve new faces this week, three within a mile."
          dek="The strongest week of joiners since February."
          body="Iris Okonkwo, the documentary founder, is the headline arrival; she’s already in your inbox. Dev Ramachandran (’09, Oakland) and Priya Sastry (’16, London) round out a transatlantic crew. Hartwood’s seven-day intake curve is up from ten last week."
          byline="Compiled by Membership"
          palette={P} accentColor={P.ok}
          action={<button style={{ fontFamily: P.font.body, fontSize: 12, padding: '7px 12px', background: 'transparent', color: P.ink, border: `1px solid ${P.rule}`, borderRadius: 2, cursor: 'pointer', fontWeight: 500 }}>Browse new joiners →</button>}
        />

        <DispatchStory
          n={4} kind="Office Hours"
          title="Matty Osei opens his calendar Thursday."
          dek="Climate-seed-deal notes; a thirty-minute slot has your name."
          body="Two of his current portfolio companies came through the Hartwood directory. He’s asked, in writing and twice, whether you’d compare notes before his next office hours. The thread is two messages long and the ball is on your side of the net."
          byline="From the founders’ chat"
          palette={P} accentColor={P.warn}
          action={<button style={{ fontFamily: P.font.body, fontSize: 12, padding: '7px 12px', background: 'transparent', color: P.ink, border: `1px solid ${P.rule}`, borderRadius: 2, cursor: 'pointer', fontWeight: 500 }}>Reply to Matty →</button>}
        />
      </div>

      {/* Foot — folio + page numbers */}
      <div style={{
        padding: '10px 40px', borderTop: `1px solid ${P.ink}`,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: P.mute2,
      }}>
        <span>The Hartwood Dispatch · No. 142</span>
        <span>p. 1 — continued p. 2</span>
        <span>© Hartwood Society 2026</span>
      </div>
    </div>
  );
}

// === ATRIUM ===============================================================

function DispatchAtrium() {
  const P = ATRIUM;
  const D = HOME_DATA;
  const L = buildLede(D);
  return (
    <div style={{
      width: '100%', height: '100%', background: P.paper, color: P.ink,
      fontFamily: P.font.body, overflow: 'hidden', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Folio strip */}
      <div style={{
        padding: '8px 40px',
        borderBottom: `1px solid ${P.ruleSoft}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: P.font.body, fontSize: 11, fontWeight: 600,
        color: P.muted, letterSpacing: 0.2,
      }}>
        <span>Hartwood · A daily dispatch for members</span>
        <span style={{ display: 'flex', gap: 16 }}>
          <span>For Maren, ’14</span>
          <span style={{ color: P.accent, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: P.accent }} /> Live
          </span>
        </span>
      </div>

      {/* Masthead */}
      <div style={{
        padding: '22px 40px 20px',
        borderBottom: `1px solid ${P.rule}`,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: P.font.body, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: P.accent,
            marginBottom: 4,
          }}>Today, in your circle</div>
          <div style={{
            fontFamily: P.font.serif, fontSize: 52, fontWeight: 600,
            letterSpacing: '-0.025em', lineHeight: 0.98, color: P.ink,
          }}>
            The <span style={{ fontStyle: 'italic', color: P.accent }}>Hartwood</span> Dispatch
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: P.font.body, fontSize: 12, color: P.muted,
            fontWeight: 500,
          }}>Edition № 142 · Friday, May 15</div>
          <div style={{
            fontFamily: P.font.serif, fontStyle: 'italic',
            fontSize: 14, color: P.muted, marginTop: 4,
          }}>“What’s on your desk this morning.”</div>
        </div>
      </div>

      {/* KPI strip — pill-style under Atrium */}
      <div style={{
        padding: '14px 40px',
        borderBottom: `1px solid ${P.rule}`,
        background: P.card,
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <span style={{
          fontFamily: P.font.body, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.14em', color: P.muted, textTransform: 'uppercase',
          marginRight: 8,
        }}>Today</span>
        {[
          { label: 'Mentees',      value: D.stats.mentees,      color: P.accent },
          { label: 'Days to supper', value: D.event.days,       color: P.ink },
          { label: 'New this week', value: `+${D.stats.newThisWeek}`, color: P.ok },
          { label: 'Open mentors', value: D.stats.openMentors,  color: P.muted },
        ].map(k => (
          <div key={k.label} style={{
            display: 'inline-flex', alignItems: 'baseline', gap: 8,
            padding: '6px 14px', background: P.cardAlt,
            border: `1px solid ${P.rule}`, borderRadius: 999,
          }}>
            <span style={{ fontFamily: P.font.display, fontWeight: 700, fontSize: 16, color: k.color }}>{k.value}</span>
            <span style={{ fontSize: 12, color: P.muted, fontWeight: 500 }}>{k.label}</span>
          </div>
        ))}
      </div>

      {/* THE LEDE */}
      <div style={{
        padding: '28px 40px 24px',
        display: 'grid', gridTemplateColumns: '180px 1fr 320px', gap: 36,
        borderBottom: `1px solid ${P.rule}`,
      }}>
        <div>
          <div style={{
            fontFamily: P.font.body, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.18em', color: P.accent, textTransform: 'uppercase',
            paddingBottom: 10, borderBottom: `2px solid ${P.accent}`,
            display: 'inline-block',
          }}>The Lede</div>
          <div style={{
            fontFamily: P.font.body, fontSize: 11, fontWeight: 500,
            color: P.muted, marginTop: 16, lineHeight: 1.7,
          }}>
            Filed 8:14 AM<br />
            By the Hartwood desk<br />
            <span style={{ color: P.mute2 }}>· read time 1 min</span>
          </div>
        </div>

        <div>
          <div style={{
            fontFamily: P.font.body, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', color: P.muted, textTransform: 'uppercase',
            marginBottom: 10,
          }}>{L.kicker}</div>
          <h1 style={{
            fontFamily: P.font.serif, fontSize: 50, lineHeight: 1.02,
            margin: 0, fontWeight: 600, letterSpacing: '-0.022em', color: P.ink,
          }}>
            {L.headline}
          </h1>
          <div style={{
            fontFamily: P.font.serif, fontStyle: 'italic',
            fontSize: 19, lineHeight: 1.35, color: P.muted,
            margin: '16px 0 18px', maxWidth: 560,
          }}>{L.dek}</div>
          <p style={{
            fontFamily: P.font.serif, fontSize: 15.5, lineHeight: 1.6,
            color: P.ink2, margin: 0, maxWidth: 580,
          }}>
            <span style={{
              fontFamily: P.font.serif, fontSize: 44, lineHeight: 0.85,
              float: 'left', padding: '6px 10px 0 0', fontWeight: 600, color: P.accent,
            }}>T</span>{L.lede.slice(1)}
          </p>

          {/* Inline action — pill style */}
          <div style={{
            marginTop: 22, padding: '14px 18px',
            background: P.card, border: `1px solid ${P.rule}`, borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, boxShadow: '0 1px 0 rgba(255,255,255,.5) inset, 0 1px 2px rgba(42,34,26,.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <MockAvatar name={D.pending[0].name} initials={D.pending[0].initials} size={34} palette={P} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: P.ink }}>Reply to Lena</div>
                <div style={{ fontSize: 12.5, color: P.muted }}>Open the thread, or paste your supper invite straight from here.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{
                fontFamily: P.font.body, fontSize: 13, fontWeight: 600,
                padding: '9px 16px', borderRadius: 999,
                background: P.accent, color: '#fff', border: 'none', cursor: 'pointer',
              }}>Reply now →</button>
              <button style={{
                fontFamily: P.font.body, fontSize: 13, fontWeight: 600,
                padding: '9px 16px', borderRadius: 999,
                background: P.cardAlt, color: P.ink, border: `1px solid ${P.rule}`, cursor: 'pointer',
              }}>Invite to supper</button>
            </div>
          </div>
        </div>

        <div>
          <div style={{
            fontFamily: P.font.body, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', color: P.muted, textTransform: 'uppercase',
            marginBottom: 10,
          }}>The subject</div>
          <div style={{
            background: P.card, border: `1px solid ${P.rule}`, padding: 18, borderRadius: 16,
            boxShadow: '0 1px 0 rgba(255,255,255,.5) inset, 0 4px 12px rgba(42,34,26,.05)',
          }}>
            <div style={{
              width: '100%', aspectRatio: '4 / 5', borderRadius: 12, overflow: 'hidden',
              backgroundImage: `repeating-linear-gradient(135deg, ${P.ruleSoft} 0 6px, ${P.panel} 6px 12px)`,
              border: `1px solid ${P.rule}`,
              display: 'flex', alignItems: 'flex-end', padding: 10,
            }}>
              <span style={{
                fontFamily: P.font.mono, fontSize: 10, letterSpacing: '0.14em',
                color: P.muted, textTransform: 'uppercase',
                background: P.paper, padding: '3px 8px', borderRadius: 999, border: `1px solid ${P.rule}`,
              }}>Portrait · LP, ’18</span>
            </div>
            <div style={{ fontFamily: P.font.serif, fontSize: 19, fontWeight: 600, marginTop: 14, color: P.ink, letterSpacing: '-0.01em' }}>
              Lena Park
            </div>
            <div style={{ fontSize: 12.5, color: P.muted, marginTop: 2 }}>
              PM at Currents · Brooklyn · Class of ’18
            </div>
            <div style={{
              marginTop: 12, paddingTop: 12, borderTop: `1px solid ${P.ruleSoft}`,
              fontFamily: P.font.serif, fontStyle: 'italic', fontSize: 13.5,
              color: P.ink2, lineHeight: 1.5,
            }}>“I keep thinking about the conversation you had at Spring Supper last year.”</div>
          </div>
        </div>
      </div>

      {/* BELOW THE FOLD */}
      <div style={{
        flex: 1, padding: '24px 40px 16px',
        display: 'grid', gridTemplateColumns: '180px 1fr 1fr 1fr', gap: 36,
      }}>
        <div>
          <div style={{
            fontFamily: P.font.body, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.18em', color: P.muted, textTransform: 'uppercase',
            paddingBottom: 10, borderBottom: `2px solid ${P.ink}`,
            display: 'inline-block',
          }}>Also today</div>
          <div style={{
            fontFamily: P.font.body, fontSize: 11, color: P.muted, fontWeight: 500,
            marginTop: 16, lineHeight: 1.7,
          }}>
            Three short reads.<br />
            Each is a single decision.<br />
            <span style={{ color: P.mute2 }}>· skim in 90 seconds</span>
          </div>
        </div>

        <DispatchStory
          n={2} kind="The Calendar"
          title="Spring Supper, six days out — 22 seats remain."
          dek="And one of your mentees lives a block from the door."
          body="The long-table supper opens to plus-ones this season. You’re hosting; Sam Aldridge (’11) is co-host. The room sits sixty; thirty-eight are in. Iris Okonkwo (’19) has already RSVPed, which means a Brooklyn-to-Brooklyn introduction is queued whether you make it or not."
          byline="Filed by The House"
          palette={P} accentColor={P.accent}
          action={<button style={{ fontFamily: P.font.body, fontSize: 13, padding: '8px 14px', background: P.accent, color: '#fff', border: 'none', borderRadius: 999, cursor: 'pointer', fontWeight: 600 }}>RSVP →</button>}
        />

        <DispatchStory
          n={3} kind="The Wire"
          title="Twelve new faces this week, three within a mile."
          dek="The strongest week of joiners since February."
          body="Iris Okonkwo, the documentary founder, is the headline arrival; she’s already in your inbox. Dev Ramachandran (’09, Oakland) and Priya Sastry (’16, London) round out a transatlantic crew. Hartwood’s seven-day intake curve is up from ten last week."
          byline="Compiled by Membership"
          palette={P} accentColor={P.ok}
          action={<button style={{ fontFamily: P.font.body, fontSize: 13, padding: '8px 14px', background: P.cardAlt, color: P.ink, border: `1px solid ${P.rule}`, borderRadius: 999, cursor: 'pointer', fontWeight: 600 }}>Browse new joiners →</button>}
        />

        <DispatchStory
          n={4} kind="Office Hours"
          title="Matty Osei opens his calendar Thursday."
          dek="Climate-seed-deal notes; a thirty-minute slot has your name."
          body="Two of his current portfolio companies came through the Hartwood directory. He’s asked, in writing and twice, whether you’d compare notes before his next office hours. The thread is two messages long and the ball is on your side of the net."
          byline="From the founders’ chat"
          palette={P} accentColor={P.warn}
          action={<button style={{ fontFamily: P.font.body, fontSize: 13, padding: '8px 14px', background: P.cardAlt, color: P.ink, border: `1px solid ${P.rule}`, borderRadius: 999, cursor: 'pointer', fontWeight: 600 }}>Reply to Matty →</button>}
        />
      </div>

      {/* Foot */}
      <div style={{
        padding: '12px 40px', borderTop: `1px solid ${P.rule}`,
        background: P.cardAlt,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: P.font.body, fontSize: 11.5, color: P.muted, fontWeight: 500,
      }}>
        <span>Hartwood Dispatch · No. 142</span>
        <span>p. 1 — continued on Members ↗</span>
        <span>© Hartwood Society 2026</span>
      </div>
    </div>
  );
}

window.DispatchCivic = DispatchCivic;
window.DispatchAtrium = DispatchAtrium;
