/* eslint-disable */
// Atrium Design System — Editorial & Hero Visibility
// Section 17: Spotlight hero, Big number trio, Pull quote

function EditorialSection() {
  return (
    <DSSection id="editorial" eyebrow="Components · 17" title="Editorial & Hero Visibility">

      <DSSub title="Spotlight hero — magazine-style featured member">
        <SpotlightHero />
        <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.6, marginTop: 14, maxWidth: 640 }}>
          A single featured member or moment, weekly. Sits at the top of the home feed and on the People page. The portrait slot uses a hatched placeholder until the member uploads — never an AI face.
        </p>
      </DSSub>

      <DSSub title="Big-number trio — magazine-cover statistics">
        <BigNumberRow />
        <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.6, marginTop: 14, maxWidth: 640 }}>
          Use sparingly — once per page, never in a sidebar. The number reaches 96px so it competes with the page title; pair with mono context labels so the design stays editorial, not dashboard.
        </p>
      </DSSub>

      <DSSub title="Pull quote — set a member's voice as a chapter break">
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
          <PullQuote
            quote="The career pivots that won't age — in five years of climate underwriting, I've seen this circle make every one of them safer."
            attribution={{ name: 'Iris Okonkwo', meta: "Class of '11 · Common Capital", initials: 'IO' }}
            kind="editorial"
          />
          <PullQuote
            quote="Hartwood is the only network where 'how are you' means it."
            attribution={{ name: 'Maren Holt', meta: "Class of '14 · Product", initials: 'MH' }}
            kind="testimonial"
          />
        </div>
      </DSSub>

    </DSSection>
  );
}

function SpotlightHero() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 22, overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 8px 28px rgba(42,34,26,0.08)' }}>
      {/* Top eyebrow strip */}
      <div style={{ background: DSC.cardAlt, borderBottom: `1px solid ${DSC.ruleSoft}`, padding: '14px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontFamily: DSF.body, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: DSC.accent, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: DSC.accent }} />
          On Deck · Week of May 19
        </div>
        <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase' }}>Issue №142 · The Saffron Edit</div>
      </div>

      {/* Hero body */}
      <div style={{ display: 'grid', gridTemplateColumns: '0.85fr 1.15fr', gap: 32, padding: '32px 30px 34px', alignItems: 'stretch' }}>

        {/* Portrait placeholder */}
        <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', minHeight: 320, background: DSC.panel }}>
          {/* Hatched fill */}
          <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(135deg, ${DSC.panel} 0px, ${DSC.panel} 9px, ${dshex(DSC.muted, 0.18)} 9px, ${dshex(DSC.muted, 0.18)} 10px)` }} />
          {/* Decorative accent corner block */}
          <div style={{ position: 'absolute', left: 0, top: 0, padding: '12px 14px', background: DSC.accent, color: '#fff', fontFamily: DSF.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
            Portrait
          </div>
          {/* Centered placeholder label */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', background: DSC.card, border: `1px solid ${DSC.rule}`, padding: '8px 14px', borderRadius: 8, fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            IRIS OKONKWO · '11
          </div>
          {/* Bottom signature */}
          <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', fontFamily: DSF.mono, fontSize: 9.5, color: DSC.mute2, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
            <span>Hartwood Society</span>
            <span>2026</span>
          </div>
        </div>

        {/* Text column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 6 }}>This week's voice</div>
            <h2 style={{ fontFamily: DSF.display, fontSize: 44, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1, color: DSC.ink, margin: 0 }}>Iris Okonkwo</h2>
            <div style={{ fontFamily: DSF.body, fontSize: 14, color: DSC.muted, marginTop: 8, lineHeight: 1.55 }}>
              VP Investments, Common Capital · Climate vertical · Brooklyn, joined <strong style={{ color: DSC.ink2, fontWeight: 600 }}>'11</strong>
            </div>
          </div>

          {/* Quote */}
          <div style={{ position: 'relative', padding: '4px 0 4px 28px', borderLeft: `3px solid ${DSC.accent}` }}>
            <span style={{ position: 'absolute', left: 10, top: -16, fontFamily: DSF.display, fontSize: 54, color: DSC.accent, fontWeight: 600, lineHeight: 1, fontStyle: 'italic' }}>"</span>
            <p style={{ fontFamily: DSF.display, fontSize: 22, fontWeight: 500, color: DSC.ink2, letterSpacing: '-0.012em', lineHeight: 1.35, margin: 0, fontStyle: 'italic' }}>
              The career pivots that won't age — in five years of climate underwriting, I've seen this circle make every one of them safer.
            </p>
          </div>

          {/* Earned pins row */}
          <div style={{ paddingTop: 6 }}>
            <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 8 }}>Earned</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <PinMiniChip name="Anchor"    color={DSC.accent} />
              <PinMiniChip name="Mentor ×3" color={DSC.ok} />
              <PinMiniChip name="Connector" color="#2f6e6c" />
              <PinMiniChip name="Old Guard" color="#7a3a5e" />
            </div>
          </div>

          {/* CTA row */}
          <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
            <DSButton>Read full profile →</DSButton>
            <DSButton variant="outline">Send intro</DSButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function PinMiniChip({ name, color }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 5px', background: dshex(color, 0.10), border: `1px solid ${dshex(color, 0.28)}`, borderRadius: 999 }}>
      <span style={{ width: 16, height: 16, borderRadius: 999, background: `radial-gradient(circle at 30% 30%, ${dshex('#ffffff', 0.5)}, ${color} 70%)`, boxShadow: `inset 0 0 0 1px ${dshex('#000000', 0.10)}`, flexShrink: 0 }} />
      <span style={{ fontFamily: DSF.body, fontSize: 11, fontWeight: 600, color: color }}>{name}</span>
    </span>
  );
}

function BigNumberRow() {
  const stats = [
    { value: '1,284', label: 'Members in the circle', sub: '+8% this quarter',                trend: 'up',  color: DSC.accent },
    { value: '4,712', label: 'Mentor hours given',    sub: 'Avg 4 h per active mentor',        trend: 'flat',color: DSC.ok     },
    { value: '53',    label: 'Cities reached',         sub: 'New this month · Lagos · Mexico CDMX', trend: 'up',  color: '#3f5680'  },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
      {stats.map((s, i) => <BigNumberCard key={i} {...s} />)}
    </div>
  );
}

function BigNumberCard({ value, label, sub, trend, color }) {
  const digits = value.replace(/[^0-9]/g, '');
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: '24px 24px 22px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', position: 'relative', overflow: 'hidden', minHeight: 200 }}>
      {/* Massive ghost numeral */}
      <div aria-hidden="true" style={{ position: 'absolute', right: -28, bottom: -34, fontFamily: DSF.display, fontSize: 220, color: dshex(color, 0.07), lineHeight: 1, fontWeight: 600, letterSpacing: '-0.04em', pointerEvents: 'none', userSelect: 'none' }}>
        {digits.slice(-2)}
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontFamily: DSF.display, fontSize: 92, fontWeight: 600, color: color, letterSpacing: '-0.04em', lineHeight: 1, marginTop: 12, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
          {trend === 'up' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: dshex(DSC.ok, 0.13), color: DSC.ok, borderRadius: 999, fontFamily: DSF.body, fontSize: 11, fontWeight: 700 }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 8L6 4L10 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              UP
            </span>
          )}
          {trend === 'flat' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: dshex(DSC.muted, 0.13), color: DSC.muted, borderRadius: 999, fontFamily: DSF.body, fontSize: 11, fontWeight: 700 }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6L10 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              STEADY
            </span>
          )}
          <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, lineHeight: 1.4 }}>{sub}</span>
        </div>
      </div>
    </div>
  );
}

function PullQuote({ quote, attribution, kind = 'editorial' }) {
  const isTestimonial = kind === 'testimonial';
  return (
    <div style={{ background: isTestimonial ? dshex(DSC.accent, 0.07) : DSC.card, border: `1px solid ${isTestimonial ? dshex(DSC.accent, 0.20) : DSC.rule}`, borderRadius: 18, padding: '24px 26px 22px', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      {/* Massive opening quote mark */}
      <span style={{ position: 'absolute', left: 14, top: -14, fontFamily: DSF.display, fontSize: 96, color: isTestimonial ? dshex(DSC.accent, 0.18) : dshex(DSC.muted, 0.22), fontWeight: 600, lineHeight: 1, fontStyle: 'italic', pointerEvents: 'none', userSelect: 'none' }}>"</span>

      <div style={{ position: 'relative', paddingTop: 24 }}>
        <p style={{ fontFamily: DSF.display, fontSize: 19, fontWeight: 500, color: DSC.ink, letterSpacing: '-0.01em', lineHeight: 1.4, margin: 0 }}>{quote}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, paddingTop: 14, borderTop: `1px solid ${isTestimonial ? dshex(DSC.accent, 0.18) : DSC.ruleSoft}` }}>
          <span style={{ fontFamily: DSF.display, fontSize: 18, color: DSC.muted, fontWeight: 500 }}>—</span>
          <DSAvatar name={attribution.name} initials={attribution.initials} size={32} />
          <div>
            <div style={{ fontFamily: DSF.body, fontSize: 13, fontWeight: 600, color: DSC.ink }}>{attribution.name}</div>
            <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 1 }}>{attribution.meta}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.EditorialSection = EditorialSection;
window.PinMiniChip      = PinMiniChip;
