/* eslint-disable */
// Atrium Design System — Achievements & Milestones (Section 18)

const ATRIUM_PINS = [
  { id: 'mentor',    name: 'Mentor',     desc: '10 cohorts mentored',      color: '#5f7038', glyph: 'book' },
  { id: 'connector', name: 'Connector',  desc: '25 intros completed',      color: '#2f6e6c', glyph: 'rings' },
  { id: 'host',      name: 'Host',       desc: '5 events hosted',          color: '#b88033', glyph: 'flame' },
  { id: 'curator',   name: 'Curator',    desc: 'Curated 3 spotlight weeks', color: '#3f5680', glyph: 'ribbon' },
  { id: 'oldguard',  name: 'Old Guard',  desc: '5+ years in the circle',   color: '#7a3a5e', glyph: 'tree' },
  { id: 'welcomer',  name: 'Welcomer',   desc: '12 first-week greetings',  color: '#8a5e7a', glyph: 'door' },
  { id: 'founder',   name: 'Founder',    desc: 'Founding cohort \u2019 18', color: '#c75a3a', glyph: 'star' },
  { id: 'steward',   name: 'Steward',    desc: 'Community council 2024',   color: '#2a221a', glyph: 'shield' },
];

function AchievementsSection() {
  return (
    <DSSection id="achievements" eyebrow="Components · 18" title="Achievements & Milestones">

      <DSSub title="Lapel pins — 8 earned crests, each a circular SVG">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {ATRIUM_PINS.map(p => <LapelPin key={p.id} pin={p} />)}
        </div>
        <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.6, marginTop: 16, maxWidth: 640 }}>
          Pins are <em>earned</em>, not requested. Each is a 56px circular crest with a radial-gradient enamel finish and a unique glyph. They appear on the spotlight hero, in profile headers, and as miniature chips alongside member names.
        </p>
      </DSSub>

      <DSSub title="Anniversary card — wax-seal milestone moment">
        <AnniversaryCard />
      </DSSub>

      <DSSub title="Streak ribbon — gentle habit visualization">
        <StreakRibbon />
      </DSSub>

    </DSSection>
  );
}

function LapelPin({ pin }) {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: '22px 18px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <PinCrest pin={pin} size={64} />
      <div style={{ fontFamily: DSF.display, fontSize: 15, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em', marginTop: 14 }}>{pin.name}</div>
      <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 3, lineHeight: 1.4 }}>{pin.desc}</div>
    </div>
  );
}

function PinCrest({ pin, size = 64 }) {
  const c = pin.color;
  const gradId = `pin-${pin.id}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.4" stopColor={c} stopOpacity="1" />
          <stop offset="1" stopColor={c} stopOpacity="1" />
        </radialGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="32" cy="32" r="30" fill={`url(#${gradId})`} stroke={dshex('#000000', 0.18)} strokeWidth="1" />
      {/* Inner engraved ring */}
      <circle cx="32" cy="32" r="25" fill="none" stroke={dshex('#000000', 0.22)} strokeWidth="0.6" />
      {/* Highlight */}
      <ellipse cx="22" cy="20" rx="10" ry="5" fill="rgba(255,255,255,0.22)" />
      {/* Glyph */}
      <g transform="translate(32,32)" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <PinGlyph kind={pin.glyph} />
      </g>
    </svg>
  );
}

function PinGlyph({ kind }) {
  // All glyphs draw centered around (0,0), within a ~22px box
  switch (kind) {
    case 'star':
      return <path d="M0,-11 L3.2,-3.4 L11,-3.4 L4.7,1.3 L7.2,9 L0,4.4 L-7.2,9 L-4.7,1.3 L-11,-3.4 L-3.2,-3.4 Z" fill="#fff" stroke="none" />;
    case 'book':
      return <g>
        <path d="M-9,-7 L-9,8 L0,5 L9,8 L9,-7 L0,-4 Z" />
        <line x1="0" y1="-4" x2="0" y2="5" />
      </g>;
    case 'rings':
      return <g>
        <circle cx="-4" cy="0" r="6" />
        <circle cx="4" cy="0" r="6" />
      </g>;
    case 'flame':
      return <path d="M0,-10 C-5,-5 -7,-1 -7,3 C-7,8 -3,11 0,11 C3,11 7,8 7,3 C7,0 5,-2 3,-2 C3,-5 1,-7 0,-10 Z" />;
    case 'ribbon':
      return <g>
        <path d="M-8,-8 L8,-8 L8,4 L0,9 L-8,4 Z" />
        <line x1="-3" y1="-3" x2="3" y2="-3" />
        <line x1="-3" y1="1" x2="3" y2="1" />
      </g>;
    case 'tree':
      return <g>
        <circle cx="0" cy="-2" r="9" />
        <circle cx="0" cy="-2" r="5.5" />
        <circle cx="0" cy="-2" r="2" />
        <line x1="0" y1="-2" x2="0" y2="9" />
      </g>;
    case 'door':
      return <g>
        <path d="M-7,-9 L-7,9 L7,9 L7,-9 Z" />
        <circle cx="4" cy="1" r="0.8" fill="#fff" />
      </g>;
    case 'shield':
      return <path d="M0,-10 L8,-7 L8,2 C8,7 4,10 0,10 C-4,10 -8,7 -8,2 L-8,-7 Z" />;
    default:
      return null;
  }
}

function AnniversaryCard() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 22, padding: '36px 36px 32px', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 8px 30px rgba(42,34,26,0.10)', maxWidth: 720 }}>
      {/* Decorative corner circles */}
      <svg aria-hidden="true" width="280" height="200" viewBox="0 0 280 200" style={{ position: 'absolute', right: -30, top: -20, opacity: 0.18, pointerEvents: 'none' }}>
        <circle cx="100" cy="100" r="80" fill="none" stroke={DSC.accent} strokeWidth="1.4" />
        <circle cx="180" cy="100" r="80" fill="none" stroke={DSC.ok}     strokeWidth="1.4" />
      </svg>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 32, position: 'relative', alignItems: 'center' }}>
        {/* Wax seal */}
        <WaxSeal initials="MH" />

        {/* Text */}
        <div>
          <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.accent, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>Anniversary · 19 May 2026</div>
          <h2 style={{ fontFamily: DSF.display, fontSize: 48, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1, margin: '10px 0 4px', color: DSC.ink }}>
            Five years <span style={{ color: DSC.muted, fontWeight: 500 }}>in the circle.</span>
          </h2>
          <div style={{ fontFamily: DSF.body, fontSize: 14, color: DSC.muted, lineHeight: 1.55, marginTop: 8, maxWidth: 480 }}>
            You joined Hartwood on <strong style={{ color: DSC.ink2, fontWeight: 600 }}>May 19, 2021</strong>, invited by <strong style={{ color: DSC.ink2, fontWeight: 600 }}>Dev Patel</strong> and verified by the <strong style={{ color: DSC.ink2, fontWeight: 600 }}>Hartwood Society</strong>. Here's what you've made since:
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 22, paddingTop: 18, borderTop: `1px solid ${DSC.ruleSoft}` }}>
            {[
              { value: '247', label: 'Conversations',  color: DSC.accent },
              { value: '18',  label: 'Events attended', color: DSC.ok    },
              { value: '12',  label: 'Members invited',  color: '#3f5680' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: DSF.display, fontSize: 32, fontWeight: 600, color: s.color, letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600, marginTop: 5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WaxSeal({ initials }) {
  return (
    <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <defs>
          <radialGradient id="wax-grad" cx="35%" cy="30%">
            <stop offset="0"   stopColor="#e88a6c" />
            <stop offset="0.5" stopColor="#c75a3a" />
            <stop offset="1"   stopColor="#8a3a20" />
          </radialGradient>
        </defs>
        {/* Drip/splash silhouette — a slightly-irregular blob */}
        <path d="M60,8 C82,8 102,18 108,40 C114,62 102,90 80,104 C58,118 38,112 24,96 C10,80 8,52 18,34 C28,16 42,8 60,8 Z" fill="url(#wax-grad)" />
        {/* Inner ring */}
        <circle cx="60" cy="60" r="36" fill="none" stroke="rgba(0,0,0,0.32)" strokeWidth="1.2" />
        <circle cx="60" cy="60" r="32" fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="0.8" />
        {/* Sunburst ring around initials */}
        {Array.from({ length: 16 }).map((_, i) => {
          const ang = (i / 16) * Math.PI * 2;
          const x1 = 60 + Math.cos(ang) * 22;
          const y1 = 60 + Math.sin(ang) * 22;
          const x2 = 60 + Math.cos(ang) * 28;
          const y2 = 60 + Math.sin(ang) * 28;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,0,0,0.30)" strokeWidth="1.2" strokeLinecap="round" />;
        })}
        {/* Highlight */}
        <ellipse cx="40" cy="38" rx="22" ry="10" fill="rgba(255,255,255,0.22)" />
        {/* Initials */}
        <text x="60" y="70" textAnchor="middle" fontFamily='"Inter Tight", system-ui, sans-serif' fontSize="26" fontWeight="700" fill="#fff" letterSpacing="0.04em" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.35))' }}>{initials}</text>
      </svg>
    </div>
  );
}

function StreakRibbon() {
  const weeks = 12;
  const grid = Array.from({ length: weeks }, (_, i) => i < 11); // 11 of 12 weeks active
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: '24px 26px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', maxWidth: 720 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 28, alignItems: 'center' }}>
        {/* Big counter */}
        <div>
          <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Current streak</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
            <span style={{ fontFamily: DSF.display, fontSize: 76, fontWeight: 600, color: DSC.accent, letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>11</span>
            <span style={{ fontFamily: DSF.body, fontSize: 16, color: DSC.muted, fontWeight: 500 }}>weeks</span>
          </div>
        </div>

        {/* Ribbon grid */}
        <div>
          <div style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink2, lineHeight: 1.5, marginBottom: 12 }}>
            <strong style={{ color: DSC.ink, fontWeight: 600 }}>Most active</strong> in the '14 cohort. You've replied to at least one thread every week since Mar 3.
          </div>
          {/* Ribbon visualization */}
          <div style={{ position: 'relative', height: 32, display: 'flex', alignItems: 'center' }}>
            {/* Ribbon line */}
            <div style={{ position: 'absolute', left: 10, right: 10, top: '50%', height: 3, background: `linear-gradient(to right, ${DSC.accent} 0%, ${DSC.accent} ${(11 / weeks) * 100}%, ${DSC.rule} ${(11 / weeks) * 100}%, ${DSC.rule} 100%)`, borderRadius: 999, transform: 'translateY(-50%)' }} />
            {/* Week dots */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', position: 'relative' }}>
              {grid.map((active, i) => (
                <div key={i} title={`Week ${i + 1}: ${active ? 'active' : 'no activity'}`} style={{ width: 20, height: 20, borderRadius: 999, background: active ? DSC.accent : DSC.card, border: `2px solid ${active ? DSC.accent : DSC.rule}`, boxShadow: active ? `0 0 0 3px ${dshex(DSC.accent, 0.15)}` : 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', transition: 'transform 120ms ease' }}>
                  {active && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4 4 10-10" /></svg>}
                </div>
              ))}
            </div>
          </div>
          {/* Week labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: DSF.mono, fontSize: 9, color: DSC.mute2, letterSpacing: '0.04em' }}>
            <span>12 wks ago</span>
            <span style={{ color: DSC.accent, fontWeight: 700 }}>This week</span>
          </div>
        </div>
      </div>
    </div>
  );
}

window.AchievementsSection = AchievementsSection;
window.LapelPin            = LapelPin;
window.PinCrest            = PinCrest;
