/* eslint-disable */
// Atrium Design System — Dark / Lamplight Mode (Section 29)
// Same warmth, late-night surfaces. Designed for evening reading, not pure inversion.

const LAMPLIGHT = {
  paper:    '#1a1612',
  panel:    '#221c16',
  card:     '#2a221a',
  cardAlt:  '#322a20',
  rule:     '#3d3328',
  ruleSoft: '#2d2620',
  ink:      '#f0e5d0',
  ink2:     '#d8c9ad',
  muted:    '#998a72',
  mute2:    '#6e6353',
};

const WARM = {
  paper: '#efe7d8', panel: '#e6dcc8', card: '#f8f1e2', cardAlt: '#fbf6ea',
  rule: '#d8ccb6', ruleSoft: '#e4dcca',
  ink: '#2a221a', ink2: '#3d3328', muted: '#7a6e5e', mute2: '#9a8e7d',
};

function LamplightSection() {
  return (
    <DSSection id="lamplight" eyebrow="Components · 29" title="Dark / Lamplight Mode">

      <DSSub title="Same composition, day vs night">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <ModeScene palette={WARM}      label="Warm · day"       sub="Default mode. 11:42 am."           accent={false} />
          <ModeScene palette={LAMPLIGHT} label="Lamplight · night" sub="Evening read. 11:42 pm."          accent={true} />
        </div>
        <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.6, marginTop: 16, maxWidth: 720 }}>
          Lamplight is not inverted. It's a <em>different room</em> with the same furniture. Deep warm bark replaces oat paper. Cards stay slightly above paper (warmer brown). Text is warm cream — never pure white. Accents stay the same hex; the warm dark surface lets them sit naturally.
        </p>
      </DSSub>

      <DSSub title="Token shifts — paper, card, rule, ink invert direction">
        <TokenShiftTable />
      </DSSub>

      <DSSub title="Accents in Lamplight — three need a quiet +10% boost">
        <AccentAtNight />
      </DSSub>

      <DSSub title="What changes in Lamplight">
        <BehaviorRules />
      </DSSub>

    </DSSection>
  );
}

// ─── COMPOSITION SCENE ─────────────────────────────────────────────────────

function ModeScene({ palette: p, label, sub, accent }) {
  const accentHex = '#c75a3a';
  const okHex = '#62753a';
  return (
    <div style={{ borderRadius: 18, overflow: 'hidden', border: `1px solid ${DSC.rule}`, boxShadow: '0 4px 14px rgba(42,34,26,0.08)' }}>
      {/* Top strip — uses DS chrome so the label stays consistent */}
      <div style={{ padding: '12px 18px', background: DSC.cardAlt, borderBottom: `1px solid ${DSC.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {accent && <span style={{ width: 6, height: 6, borderRadius: 999, background: DSC.accent }} />}
          <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: accent ? DSC.accent : DSC.ink, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>{label}</span>
        </div>
        <span style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted }}>{sub}</span>
      </div>

      {/* The scene */}
      <div style={{ background: p.paper, padding: '22px 22px 20px', color: p.ink }}>
        {/* Greeting */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: DSF.body, fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: accentHex, marginBottom: 8 }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: accentHex }} />
          Good evening, Maren
        </div>
        <div style={{ fontFamily: DSF.display, fontSize: 22, fontWeight: 600, color: p.ink, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 16 }}>
          Lead the way. <span style={{ color: p.muted }}>What brings you in?</span>
        </div>

        {/* Member card */}
        <div style={{ background: p.card, border: `1px solid ${p.rule}`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset' }}>
          <div style={{ width: 36, height: 36, borderRadius: 999, background: `linear-gradient(135deg, ${accentHex}, ${okHex})`, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: DSF.display, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>IO</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: p.ink, letterSpacing: '-0.005em' }}>Iris Okonkwo</div>
            <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: p.muted, marginTop: 2 }}>VP Investments · Common Capital</div>
          </div>
          <span style={{ background: `${accentHex}24`, color: accentHex, fontFamily: DSF.body, fontSize: 10.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>MENTOR</span>
        </div>

        {/* Stat row */}
        <div style={{ background: p.cardAlt, border: `1px solid ${p.ruleSoft}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: DSF.body, fontSize: 12, color: p.muted, lineHeight: 1.4 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: okHex }} />
            <strong style={{ color: p.ink, fontWeight: 700 }}>Active now</strong> · replying to threads
          </div>
          <button style={{ background: accentHex, color: '#fff', border: 'none', borderRadius: 999, padding: '6px 12px', fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Say hi</button>
        </div>
      </div>
    </div>
  );
}

// ─── TOKEN SHIFT TABLE ─────────────────────────────────────────────────────

function TokenShiftTable() {
  const rows = [
    { token: 'paper',     warm: WARM.paper,    lamp: LAMPLIGHT.paper,    note: 'Page background — deep warm bark, never pure black' },
    { token: 'card',      warm: WARM.card,     lamp: LAMPLIGHT.card,     note: 'Card LIFTS toward warmer brown (counter-intuitive but correct)' },
    { token: 'cardAlt',   warm: WARM.cardAlt,  lamp: LAMPLIGHT.cardAlt,  note: 'Even lighter — for nested elements' },
    { token: 'rule',      warm: WARM.rule,     lamp: LAMPLIGHT.rule,     note: 'Stronger than in light mode to stay visible' },
    { token: 'ink',       warm: WARM.ink,      lamp: LAMPLIGHT.ink,      note: 'Warm cream — never pure white (reduces strain)' },
    { token: 'ink2',      warm: WARM.ink2,     lamp: LAMPLIGHT.ink2,     note: 'Secondary text — slightly dimmer cream' },
    { token: 'muted',     warm: WARM.muted,    lamp: LAMPLIGHT.muted,    note: 'Labels, timestamps — earthy mid-tone' },
    { token: 'mute2',     warm: WARM.mute2,    lamp: LAMPLIGHT.mute2,    note: 'Fine print — barely-there cream' },
  ];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 1.6fr', padding: '10px 16px', background: DSC.panel, fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.07em', color: DSC.muted, textTransform: 'uppercase', fontWeight: 700 }}>
        <span>Token</span><span>Warm (day)</span><span>Lamplight (night)</span><span>Behaviour</span>
      </div>
      {rows.map((r, i) => (
        <div key={r.token} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 1.6fr', padding: '10px 16px', borderTop: `1px solid ${DSC.ruleSoft}`, alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: DSF.mono, fontSize: 11.5, color: DSC.accent, fontWeight: 700 }}>{r.token}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 22, height: 22, borderRadius: 5, background: r.warm, border: `1px solid ${DSC.rule}`, flexShrink: 0 }} />
            <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, letterSpacing: '0.04em' }}>{r.warm.toUpperCase()}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 22, height: 22, borderRadius: 5, background: r.lamp, border: `1px solid ${DSC.rule}`, flexShrink: 0 }} />
            <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, letterSpacing: '0.04em' }}>{r.lamp.toUpperCase()}</span>
          </span>
          <span style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.ink2, lineHeight: 1.45 }}>{r.note}</span>
        </div>
      ))}
    </div>
  );
}

// ─── ACCENTS AT NIGHT ──────────────────────────────────────────────────────

function AccentAtNight() {
  const accents = [
    { name: 'Terracotta', hex: '#c75a3a', boost: '#d96f4d', needs: false },
    { name: 'Saffron',    hex: '#b88033', boost: '#c9913f', needs: false },
    { name: 'Olive',      hex: '#5f7038', boost: '#7a8e4a', needs: true  },
    { name: 'Lake',       hex: '#2f6e6c', boost: '#4a8d8a', needs: true  },
    { name: 'Indigo',     hex: '#3f5680', boost: '#6378a3', needs: true  },
    { name: 'Plum',       hex: '#7a3a5e', boost: '#9a557b', needs: false },
    { name: 'Heather',    hex: '#8a5e7a', boost: '#a577a0', needs: false },
  ];

  return (
    <div style={{ background: LAMPLIGHT.paper, padding: '20px 22px', borderRadius: 18, border: `1px solid ${LAMPLIGHT.rule}` }}>
      <div style={{ fontFamily: DSF.mono, fontSize: 10, color: '#d96f4d', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>
        Reading on Lamplight paper
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {accents.map(a => (
          <div key={a.name} style={{ background: LAMPLIGHT.card, border: `1px solid ${LAMPLIGHT.rule}`, borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontFamily: DSF.body, fontSize: 12, fontWeight: 700, color: LAMPLIGHT.ink, letterSpacing: '0.04em' }}>{a.name}</span>
              {a.needs && (
                <span style={{ fontFamily: DSF.mono, fontSize: 8.5, fontWeight: 700, color: '#d96f4d', background: 'rgba(217,111,77,0.15)', padding: '2px 7px', borderRadius: 999, letterSpacing: '0.10em' }}>BOOST</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <div style={{ flex: 1, background: a.hex, color: '#fff', borderRadius: 6, padding: '6px 8px', fontFamily: DSF.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'center' }}>{a.hex.toUpperCase()}</div>
              {a.needs && (
                <>
                  <span style={{ display: 'grid', placeItems: 'center', color: LAMPLIGHT.muted, fontFamily: DSF.mono, fontSize: 12 }}>→</span>
                  <div style={{ flex: 1, background: a.boost, color: '#fff', borderRadius: 6, padding: '6px 8px', fontFamily: DSF.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'center' }}>{a.boost.toUpperCase()}</div>
                </>
              )}
            </div>
            {/* Sample button + tag */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ background: a.needs ? a.boost : a.hex, color: '#fff', borderRadius: 999, padding: '4px 11px', fontFamily: DSF.body, fontSize: 10.5, fontWeight: 600 }}>Button</span>
              <span style={{ background: `${a.needs ? a.boost : a.hex}28`, color: a.needs ? a.boost : a.hex, fontFamily: DSF.body, fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 999, filter: 'brightness(1.15)' }}>Tag</span>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: DSF.body, fontSize: 12, color: LAMPLIGHT.muted, lineHeight: 1.55, marginTop: 16, maxWidth: 600 }}>
        Warm accents (terracotta, saffron, plum, heather) sit naturally on dark paper. Cooler / earthier accents (olive, lake, indigo) want a +10–14% lightness boost to read at the same volume. The boost only applies in <code style={{ fontFamily: DSF.mono, fontSize: 11, background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>tone === 'lamplight'</code>.
      </p>
    </div>
  );
}

// ─── BEHAVIOR RULES ────────────────────────────────────────────────────────

function BehaviorRules() {
  const rules = [
    {
      heading: 'Lift through brightness, not shadow',
      body: "Drop shadows are nearly invisible on dark paper. Cards lift by being a warmer/lighter brown than the page, with a 1px white-at-6% inset highlight on top.",
      code: "boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset'",
    },
    {
      heading: 'Text is cream, not white',
      body: 'Pure white (#ffffff) at full opacity is brutal at night. Use a warm cream (#f0e5d0) for body, dimming to #d8c9ad for secondary. Never #ffffff.',
      code: "color: '#f0e5d0' // not '#ffffff'",
    },
    {
      heading: 'Rules need 2× the visibility',
      body: 'On warm paper, a #d8ccb6 rule is gentle and works. On lamplight, you need a #3d3328 rule — the SAME relative contrast, but in the opposite direction.',
      code: "border: '1px solid #3d3328' // not #aaa or #444",
    },
    {
      heading: 'Accents stay the same — mostly',
      body: 'Terracotta, saffron, plum, heather are warm enough to read fine. Olive, lake, indigo want a +10–14% lightness boost in lamplight. Build a tiny tone-aware accent helper.',
      code: "const accent = tone === 'lamplight' ? LAMP_BOOSTED[k] : ACCENTS[k];",
    },
    {
      heading: 'Focus rings get warmer, not louder',
      body: "Bright cyan focus rings look like alarms at night. Use the accent at 40% opacity for outline rings — same color, more atmosphere.",
      code: "outline: '2px solid rgba(199,90,58,0.4)'",
    },
    {
      heading: 'When to use it',
      body: 'Lamplight is an opt-in setting — never auto-switched via prefers-color-scheme. People come to Hartwood after dinner; the choice should be theirs. Surface it in account settings, not at the system level.',
      code: null,
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
      {rules.map((r, i) => (
        <div key={i} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 22, height: 22, borderRadius: 999, background: dshex(DSC.accent, 0.14), color: DSC.accent, display: 'grid', placeItems: 'center', fontFamily: DSF.mono, fontSize: 10, fontWeight: 700 }}>{i + 1}</span>
            <div style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.005em' }}>{r.heading}</div>
          </div>
          <p style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2, lineHeight: 1.55, margin: '10px 0 0' }}>{r.body}</p>
          {r.code && (
            <div style={{ fontFamily: DSF.mono, fontSize: 11, color: DSC.muted, background: dshex(DSC.ink, 0.05), padding: '6px 10px', borderRadius: 6, marginTop: 10, lineHeight: 1.4, overflow: 'auto' }}>{r.code}</div>
          )}
        </div>
      ))}
    </div>
  );
}

window.LamplightSection = LamplightSection;
