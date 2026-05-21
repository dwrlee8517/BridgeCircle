/* eslint-disable */
// Three design directions for BridgeCircle v2.
// Each direction renders the SAME three artifacts so they're directly comparable:
//   - SystemCard (palette + type pairing + voice notes)
//   - HeroCard   (home dashboard hero, miniature)
//   - MemberCard (single profile tile)
//
// Color tokens live in a single object per direction so the user can see
// the system at a glance. No external assets — fonts come from Google Fonts.

// ---------------------------------------------------------------------------
// Shared atoms
// ---------------------------------------------------------------------------

const Stripe = ({ w = 260, h = 160, ink = '#111', bg = '#eee', label = 'photograph' }) => (
  <div style={{
    width: w, height: h, background: bg, color: ink,
    backgroundImage: `repeating-linear-gradient(135deg, ${ink}0d 0 6px, transparent 6px 14px)`,
    display: 'flex', alignItems: 'flex-end', padding: 10,
    fontFamily: 'ui-monospace, "JetBrains Mono", monospace', fontSize: 10,
    letterSpacing: 0.4, textTransform: 'uppercase', opacity: 0.85,
  }}>
    {label}
  </div>
);

const Swatch = ({ value, name, hex, ink = '#fff' }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{
      height: 64, background: value, borderRadius: 6, marginBottom: 8,
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.06)',
    }} />
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.2, color: ink }}>{name}</div>
    <div style={{ fontSize: 10, opacity: 0.55, fontFamily: 'ui-monospace, monospace', color: ink }}>{hex}</div>
  </div>
);

// ---------------------------------------------------------------------------
// Direction palettes (single source of truth)
// ---------------------------------------------------------------------------

const DIRECTIONS = {
  threadlight: {
    name: 'Threadlight',
    tagline: 'Editorial members-club',
    description: 'Warm ivory paper, deep ink, single rust accent. Display serif sets the voice; everything else is quiet. The product reads like a quarterly journal you actually want to keep — handcrafted, considered, member-owned.',
    voice: ['Editorial · first-person plural ("our circle")', 'Mentions over metrics', 'Numbered, hand-set lists'],
    type: { display: '"Source Serif 4", "Iowan Old Style", Georgia, serif', body: '"Söhne", "Inter Tight", system-ui, sans-serif', mono: '"JetBrains Mono", ui-monospace, monospace' },
    palette: {
      paper:   '#f4eee2',  // ivory paper
      ink:     '#1a1714',  // deep ink
      muted:   '#6e6557',  // warm gray
      rule:    '#d8cebb',  // hairline
      accent:  '#b94a2d',  // burnt rust
      card:    '#fbf6ea',  // raised paper
      ok:      '#5a6b3a',  // olive
    },
  },
  civic: {
    name: 'Civic',
    tagline: 'Quiet Swiss confidence',
    description: 'Near-white, graphite, one signal amber. Ruled lines, all-caps eyebrows, numbered structure, generous air. Reads like an institution that respects your time — calm, precise, no decoration that isn’t earning its place.',
    voice: ['Reserved · third-person', 'Numbers carry the weight', 'Hairlines instead of cards'],
    type: { display: '"Neue Haas Grotesk", "Inter", system-ui, sans-serif', body: '"Inter", system-ui, sans-serif', mono: '"JetBrains Mono", ui-monospace, monospace' },
    palette: {
      paper:   '#fafaf7',  // bone
      ink:     '#0e0e0d',  // graphite
      muted:   '#6a6a66',  // mid gray
      rule:    '#dcdcd6',  // hairline
      accent:  '#c8761a',  // signal amber
      card:    '#ffffff',
      ok:      '#1f6b3a',
    },
  },
  atrium: {
    name: 'Atrium',
    tagline: 'Warm community',
    description: 'Oat background, terracotta + olive accents, friendly geometric grotesk. Soft shadows, generous radii, more human warmth. Reads like a welcoming third place — your neighborhood, your people — instead of a CRM.',
    voice: ['Warm · second-person ("you")', 'People-first, place-first', 'Plain language, no jargon'],
    type: { display: '"Fraunces", "Söhne Breit", Georgia, serif', body: '"Mona Sans", "Inter", system-ui, sans-serif', mono: '"JetBrains Mono", ui-monospace, monospace' },
    palette: {
      paper:   '#efe7d8',  // oat
      ink:     '#2a221a',  // warm bark
      muted:   '#7a6e5e',  // sand mud
      rule:    '#d8ccb6',  // soft rule
      accent:  '#c75a3a',  // terracotta
      card:    '#f8f1e2',
      ok:      '#62753a',  // olive
    },
  },
};

// ---------------------------------------------------------------------------
// System card — palette + type + voice
// ---------------------------------------------------------------------------

function SystemCard({ d }) {
  const p = d.palette;
  return (
    <div style={{
      width: 760, padding: 36, background: p.paper, color: p.ink,
      fontFamily: d.type.body, lineHeight: 1.5,
    }}>
      {/* Top row: name + tagline */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: p.muted, fontFamily: d.type.mono }}>
            Direction · {d.name === 'Threadlight' ? '01' : d.name === 'Civic' ? '02' : '03'}
          </div>
          <h2 style={{ fontFamily: d.type.display, fontSize: 44, lineHeight: 1.05, margin: '6px 0 0', letterSpacing: '-0.02em', fontWeight: 500 }}>
            {d.name}
          </h2>
          <div style={{ fontSize: 14, color: p.muted, marginTop: 4 }}>{d.tagline}</div>
        </div>
        <div style={{
          fontFamily: d.type.mono, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase',
          color: p.accent, border: `1px solid ${p.accent}`, padding: '4px 8px', borderRadius: 2,
        }}>
          BridgeCircle v2
        </div>
      </div>

      <p style={{ fontSize: 15, lineHeight: 1.6, maxWidth: 620, marginBottom: 28, color: p.ink }}>{d.description}</p>

      {/* Palette */}
      <div style={{ fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: p.muted, fontFamily: d.type.mono, marginBottom: 10 }}>
        Palette
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Swatch value={p.paper}  name="Paper"  hex={p.paper.toUpperCase()}  ink={p.ink} />
        <Swatch value={p.card}   name="Card"   hex={p.card.toUpperCase()}   ink={p.ink} />
        <Swatch value={p.ink}    name="Ink"    hex={p.ink.toUpperCase()}    ink={p.ink} />
        <Swatch value={p.muted}  name="Muted"  hex={p.muted.toUpperCase()}  ink={p.ink} />
        <Swatch value={p.rule}   name="Rule"   hex={p.rule.toUpperCase()}   ink={p.ink} />
        <Swatch value={p.accent} name="Accent" hex={p.accent.toUpperCase()} ink={p.ink} />
        <Swatch value={p.ok}     name="OK"     hex={p.ok.toUpperCase()}     ink={p.ink} />
      </div>

      {/* Type + voice, two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28, borderTop: `1px solid ${p.rule}`, paddingTop: 22 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: p.muted, fontFamily: d.type.mono, marginBottom: 10 }}>
            Type
          </div>
          <div style={{ fontFamily: d.type.display, fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.02em', fontWeight: 500 }}>
            Display — set the voice.
          </div>
          <div style={{ fontFamily: d.type.body, fontSize: 14, lineHeight: 1.55, marginTop: 8, color: p.ink }}>
            Body — set in {d.type.body.split(',')[0].replace(/"/g, '')}. Quiet, readable, never decorative. Reserved for paragraphs and forms.
          </div>
          <div style={{ fontFamily: d.type.mono, fontSize: 11, color: p.muted, marginTop: 8, letterSpacing: 0.4 }}>
            mono · timestamps · IDs · tag codes
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: p.muted, fontFamily: d.type.mono, marginBottom: 10 }}>
            Voice
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: p.ink, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.voice.map((v, i) => (
              <li key={i} style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontFamily: d.type.mono, color: p.accent, minWidth: 18 }}>0{i + 1}</span>
                <span>{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero card — home dashboard hero rendered in each direction
// ---------------------------------------------------------------------------

function HeroCard({ d }) {
  const p = d.palette;
  // Each direction renders the hero with a different layout philosophy
  if (d.name === 'Threadlight') return <ThreadlightHero d={d} />;
  if (d.name === 'Civic')        return <CivicHero d={d} />;
  return <AtriumHero d={d} />;
}

function ThreadlightHero({ d }) {
  const p = d.palette;
  return (
    <div style={{
      width: 1040, background: p.paper, color: p.ink, fontFamily: d.type.body,
      padding: '52px 60px 48px',
    }}>
      {/* Masthead-style top rule */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: `1.5px solid ${p.ink}`, borderBottom: `1px solid ${p.rule}`, padding: '10px 0 12px', fontFamily: d.type.mono, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase' }}>
        <span>Vol. XII · No. 03</span>
        <span>BridgeCircle</span>
        <span>Tuesday · May 14, 2026</span>
      </div>

      {/* Eyebrow */}
      <div style={{ fontFamily: d.type.mono, fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: p.accent, marginTop: 40 }}>
        Class of ’14 · Welcome back to <span style={{ color: p.ink }}>The Hartwood Society</span>
      </div>

      {/* Headline */}
      <h1 style={{
        fontFamily: d.type.display, fontSize: 76, lineHeight: 0.98, letterSpacing: '-0.025em',
        margin: '14px 0 0', fontWeight: 400, maxWidth: 880,
      }}>
        Good afternoon, Maren.
        <br />
        <em style={{ color: p.muted, fontStyle: 'italic', fontWeight: 400 }}>Three of your people are waiting.</em>
      </h1>

      {/* Subline */}
      <p style={{ fontSize: 16, lineHeight: 1.55, color: p.muted, maxWidth: 620, marginTop: 22 }}>
        Two mentees asked for time this week, and the spring supper at Hartwood is six days out. A good evening to write back.
      </p>

      {/* Actions — typographic, not buttony */}
      <div style={{ display: 'flex', gap: 24, marginTop: 28, alignItems: 'center' }}>
        <a style={{
          background: p.ink, color: p.paper, padding: '12px 22px', fontSize: 13, letterSpacing: 0.3,
          fontWeight: 500, textDecoration: 'none',
        }}>Review the three requests →</a>
        <a style={{
          color: p.ink, fontSize: 13, fontWeight: 500, textDecoration: 'none',
          borderBottom: `1px solid ${p.ink}`, paddingBottom: 2,
        }}>Open the calendar</a>
      </div>

      {/* Footer ledger — numbers but as a typographic table, not stat tiles */}
      <div style={{ marginTop: 56, borderTop: `1px solid ${p.rule}`, paddingTop: 18, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
        {[
          ['12', 'New this week'],
          ['148', 'Open mentors'],
          ['6', 'Upcoming gatherings'],
          ['’14', 'Your cohort'],
        ].map(([v, l], i) => (
          <div key={i} style={{
            padding: '0 22px', borderLeft: i === 0 ? 'none' : `1px solid ${p.rule}`,
          }}>
            <div style={{ fontFamily: d.type.display, fontSize: 40, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: 12, color: p.muted, marginTop: 6, letterSpacing: 0.2 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CivicHero({ d }) {
  const p = d.palette;
  return (
    <div style={{
      width: 1040, background: p.paper, color: p.ink, fontFamily: d.type.body,
      padding: '56px 64px',
    }}>
      {/* Top: filing-system index */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: d.type.mono, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: p.muted, marginBottom: 80 }}>
        <span>§ 01 · Home</span>
        <span>14 · 05 · 2026</span>
        <span style={{ color: p.accent }}>● Active</span>
      </div>

      {/* Headline — sans, tight, calm */}
      <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 32, alignItems: 'start' }}>
        <div style={{ fontFamily: d.type.mono, fontSize: 11, letterSpacing: 1.6, color: p.muted, paddingTop: 14, borderTop: `2px solid ${p.ink}` }}>
          01<br/>—<br/>05
        </div>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: p.muted, fontFamily: d.type.mono, marginBottom: 18, paddingTop: 14, borderTop: `2px solid ${p.ink}` }}>
            Good afternoon, Maren
          </div>
          <h1 style={{
            fontFamily: d.type.display, fontSize: 68, lineHeight: 1.02, letterSpacing: '-0.035em',
            margin: 0, fontWeight: 500, maxWidth: 860,
          }}>
            Three mentees, one supper, <span style={{ color: p.muted }}>and a quiet inbox.</span>
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: p.muted, maxWidth: 560, marginTop: 22 }}>
            Two replies due. One event approaching. Twelve new members joined the network this week.
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 30 }}>
            <a style={{
              background: p.ink, color: p.paper, padding: '13px 20px', fontSize: 13, fontWeight: 500,
              borderRadius: 2, textDecoration: 'none',
            }}>Review requests</a>
            <a style={{
              background: 'transparent', color: p.ink, padding: '13px 20px', fontSize: 13, fontWeight: 500,
              border: `1px solid ${p.ink}`, borderRadius: 2, textDecoration: 'none',
            }}>Open calendar</a>
          </div>
        </div>
      </div>

      {/* Ledger: hairline table, not cards */}
      <div style={{ marginTop: 64, borderTop: `2px solid ${p.ink}`, paddingTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            ['01', '12', 'New members · 7d'],
            ['02', '148', 'Open mentors'],
            ['03', '6', 'Upcoming events'],
            ['04', '’14', 'Your cohort'],
          ].map(([n, v, l], i) => (
            <div key={i} style={{
              padding: '4px 20px 0 0', borderRight: i === 3 ? 'none' : `1px solid ${p.rule}`,
              marginRight: i === 3 ? 0 : 20,
            }}>
              <div style={{ fontFamily: d.type.mono, fontSize: 10, color: p.muted, letterSpacing: 1.4 }}>{n}</div>
              <div style={{ fontFamily: d.type.display, fontSize: 48, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 6 }}>{v}</div>
              <div style={{ fontSize: 12, color: p.muted, marginTop: 8, letterSpacing: 0.1 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AtriumHero({ d }) {
  const p = d.palette;
  return (
    <div style={{
      width: 1040, background: p.paper, color: p.ink, fontFamily: d.type.body,
      padding: '48px 56px 52px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Soft circle motif — "circles" of trust */}
      <svg aria-hidden="true" width="520" height="380" viewBox="0 0 520 380"
           style={{ position: 'absolute', right: -80, top: -40, opacity: 0.55 }}>
        <circle cx="200" cy="190" r="150" fill="none" stroke={p.accent} strokeOpacity="0.32" strokeWidth="1.4" />
        <circle cx="320" cy="190" r="150" fill="none" stroke={p.ok}     strokeOpacity="0.32" strokeWidth="1.4" />
      </svg>

      {/* Eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: p.accent }} />
        <span style={{ fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', color: p.muted, fontWeight: 600 }}>
          Class of ’14 · The Hartwood Society
        </span>
      </div>

      {/* Headline */}
      <h1 style={{
        fontFamily: d.type.display, fontSize: 70, lineHeight: 1.02, letterSpacing: '-0.025em',
        margin: '18px 0 0', fontWeight: 500, maxWidth: 820, position: 'relative', zIndex: 1,
      }}>
        Hi Maren — <span style={{ color: p.accent, fontStyle: 'italic' }}>your circle is moving today.</span>
      </h1>

      <p style={{ fontSize: 16, lineHeight: 1.55, color: p.muted, maxWidth: 620, marginTop: 18, position: 'relative', zIndex: 1 }}>
        Three mentees are waiting on you, and the spring supper is six days out. A good moment to write back, or to add someone you’ve been meaning to thank.
      </p>

      <div style={{ display: 'flex', gap: 12, marginTop: 26, position: 'relative', zIndex: 1 }}>
        <a style={{
          background: p.accent, color: '#fff', padding: '14px 22px', fontSize: 14, fontWeight: 600,
          borderRadius: 999, textDecoration: 'none',
        }}>Review 3 mentees →</a>
        <a style={{
          background: p.card, color: p.ink, padding: '14px 22px', fontSize: 14, fontWeight: 600,
          borderRadius: 999, textDecoration: 'none', border: `1px solid ${p.rule}`,
        }}>See upcoming events</a>
      </div>

      {/* Rounded stat pills */}
      <div style={{ marginTop: 44, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, position: 'relative', zIndex: 1 }}>
        {[
          ['12', 'New this week', p.accent],
          ['148', 'Open mentors', p.ok],
          ['6', 'Upcoming events', p.accent],
          ['’14', 'Your cohort', p.ok],
        ].map(([v, l, c], i) => (
          <div key={i} style={{
            background: p.card, borderRadius: 18, padding: '18px 20px',
            border: `1px solid ${p.rule}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: c }} />
              <span style={{ fontFamily: d.type.display, fontSize: 36, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1 }}>{v}</span>
            </div>
            <div style={{ fontSize: 13, color: p.muted, marginTop: 8 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Member tile — same person, three voices
// ---------------------------------------------------------------------------

function MemberCard({ d }) {
  const p = d.palette;
  if (d.name === 'Threadlight') return <ThreadlightMember d={d} />;
  if (d.name === 'Civic')        return <CivicMember d={d} />;
  return <AtriumMember d={d} />;
}

function ThreadlightMember({ d }) {
  const p = d.palette;
  return (
    <div style={{ width: 360, background: p.card, padding: 28, color: p.ink, fontFamily: d.type.body, borderTop: `1.5px solid ${p.ink}` }}>
      <div style={{ fontFamily: d.type.mono, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: p.muted }}>
        New member · No. 048
      </div>
      <h3 style={{ fontFamily: d.type.display, fontSize: 32, lineHeight: 1.05, letterSpacing: '-0.02em', margin: '8px 0 4px', fontWeight: 500 }}>
        Iris Okonkwo
      </h3>
      <div style={{ fontSize: 13, color: p.muted }}>Class of ’19 · Lagos → Brooklyn</div>

      <blockquote style={{
        margin: '18px 0 0', paddingLeft: 12, borderLeft: `2px solid ${p.accent}`,
        fontFamily: d.type.display, fontStyle: 'italic', fontSize: 16, lineHeight: 1.45, color: p.ink,
      }}>
        “Building a small documentary studio. Looking to talk with anyone who has navigated investor pitches for art-leaning work.”
      </blockquote>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22, alignItems: 'baseline' }}>
        <div style={{ fontFamily: d.type.mono, fontSize: 11, letterSpacing: 1.4, color: p.muted }}>
          Founder · The Long Take Co.
        </div>
        <a style={{ fontSize: 13, color: p.ink, textDecoration: 'none', borderBottom: `1px solid ${p.ink}`, paddingBottom: 1 }}>
          Send a note →
        </a>
      </div>
    </div>
  );
}

function CivicMember({ d }) {
  const p = d.palette;
  return (
    <div style={{ width: 360, background: p.card, padding: 24, color: p.ink, fontFamily: d.type.body, border: `1px solid ${p.rule}`, borderRadius: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: d.type.mono, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: p.muted }}>
        <span>Member · 04 · 048</span>
        <span style={{ color: p.accent }}>● Open to mentor</span>
      </div>
      <h3 style={{ fontFamily: d.type.display, fontSize: 26, lineHeight: 1.05, letterSpacing: '-0.03em', margin: '16px 0 4px', fontWeight: 500 }}>
        Iris Okonkwo
      </h3>
      <div style={{ fontSize: 13, color: p.muted, marginBottom: 18 }}>’19 · Brooklyn, NY</div>

      <div style={{ borderTop: `1px solid ${p.rule}`, paddingTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: `1px solid ${p.rule}` }}>
          <span style={{ color: p.muted }}>Role</span><span style={{ fontWeight: 500 }}>Founder</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: `1px solid ${p.rule}` }}>
          <span style={{ color: p.muted }}>At</span><span style={{ fontWeight: 500 }}>The Long Take Co.</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0' }}>
          <span style={{ color: p.muted }}>Asking about</span><span style={{ fontWeight: 500, textAlign: 'right', maxWidth: 200 }}>Investor pitches for documentary studios</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <a style={{ flex: 1, textAlign: 'center', background: p.ink, color: p.paper, padding: '10px 14px', fontSize: 13, fontWeight: 500, textDecoration: 'none', borderRadius: 2 }}>
          Send a note
        </a>
        <a style={{ textAlign: 'center', background: 'transparent', color: p.ink, padding: '10px 14px', fontSize: 13, fontWeight: 500, border: `1px solid ${p.ink}`, textDecoration: 'none', borderRadius: 2 }}>
          View
        </a>
      </div>
    </div>
  );
}

function AtriumMember({ d }) {
  const p = d.palette;
  return (
    <div style={{ width: 360, background: p.card, padding: 24, color: p.ink, fontFamily: d.type.body, borderRadius: 20, border: `1px solid ${p.rule}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 999, background: `linear-gradient(135deg, ${p.accent}, ${p.ok})`,
          color: '#fff', display: 'grid', placeItems: 'center', fontFamily: d.type.display, fontSize: 18, fontWeight: 600,
        }}>
          IO
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: d.type.display, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.15 }}>
            Iris Okonkwo
          </div>
          <div style={{ fontSize: 12, color: p.muted }}>Class of ’19 · Brooklyn</div>
        </div>
        <span style={{ background: p.accent + '22', color: p.accent, fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 999, letterSpacing: 0.4, textTransform: 'uppercase' }}>
          New
        </span>
      </div>

      <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0, color: p.ink }}>
        Founder at <strong>The Long Take Co.</strong> — making documentaries about overlooked civic life.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
        {['Storytelling', 'Fundraising', 'Brooklyn'].map(t => (
          <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: p.paper, color: p.muted, border: `1px solid ${p.rule}` }}>
            {t}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <a style={{ flex: 1, textAlign: 'center', background: p.accent, color: '#fff', padding: '10px 14px', fontSize: 13, fontWeight: 600, textDecoration: 'none', borderRadius: 999 }}>
          Say hi
        </a>
        <a style={{ textAlign: 'center', background: 'transparent', color: p.ink, padding: '10px 14px', fontSize: 13, fontWeight: 600, border: `1px solid ${p.rule}`, textDecoration: 'none', borderRadius: 999 }}>
          Profile
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mount on the canvas
// ---------------------------------------------------------------------------

window.DIRECTIONS = DIRECTIONS;
window.SystemCard = SystemCard;
window.HeroCard = HeroCard;
window.MemberCard = MemberCard;
