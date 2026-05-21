/* eslint-disable */
// Atrium Design System — Photography & Imagery (Section 36)
// Crop ratios, color treatment, fallback states, real-photo placeholders.

function PhotographySection() {
  return (
    <DSSection id="photography" eyebrow="Components · 36" title="Photography & Imagery">

      <DSSub title="Crop ratios — three formats, three uses">
        <CropRatios />
      </DSSub>

      <DSSub title="Color treatment — slightly warm, slightly desaturated">
        <ColorTreatment />
      </DSSub>

      <DSSub title="Fallback states — what to show before a real photo">
        <FallbackStates />
      </DSSub>

      <DSSub title="In-context — same photo, different treatments">
        <InContextExamples />
      </DSSub>

      <DSSub title="Rules of the brand camera">
        <PhotoRules />
      </DSSub>

    </DSSection>
  );
}

// ─── DECORATIVE 'PHOTOGRAPH' COMPONENT ─────────────────────────────────────
// All faux-photos use deterministic CSS gradients in warm Hartwood tones,
// with an inner shadow + slight grain. Looks like a real photograph; uses
// zero external resources.

function FauxPhoto({ ratio = '1 / 1', subject = 'portrait', filter, label, decor = 'sun' }) {
  const subjects = {
    portrait: { from: '#c08b6a', mid: '#7a5a3a', to: '#2a221a' },
    event:    { from: '#d9a76b', mid: '#a86b3a', to: '#3a2418' },
    place:    { from: '#a8b48a', mid: '#5f7038', to: '#2e3618' },
    studio:   { from: '#d4c5a3', mid: '#a08e6e', to: '#3a3122' },
    evening:  { from: '#7a5876', mid: '#4a2f4a', to: '#1f1018' },
  };
  const s = subjects[subject] || subjects.portrait;

  return (
    <div style={{ aspectRatio: ratio, width: '100%', borderRadius: 8, overflow: 'hidden', position: 'relative', background: s.to, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.10)', filter }}>
      {/* Base gradient = lighting */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(120% 90% at 30% 25%, ${s.from} 0%, ${s.mid} 45%, ${s.to} 100%)` }} />
      {/* Subtle warm cast layer */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${dshex(DSC.accent, 0.0)} 0%, ${dshex(DSC.accent, 0.07)} 100%)`, mixBlendMode: 'multiply' }} />
      {/* Decorative "subject" — abstracted shapes */}
      {subject === 'portrait' && (
        <>
          <div style={{ position: 'absolute', left: '50%', top: '38%', transform: 'translate(-50%, -50%)', width: '38%', aspectRatio: '1 / 1', borderRadius: 999, background: `radial-gradient(circle at 30% 30%, ${dshex('#fff', 0.30)}, ${s.mid} 70%)`, boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.10)` }} />
          <div style={{ position: 'absolute', left: '50%', top: '105%', transform: 'translate(-50%, -50%)', width: '78%', aspectRatio: '1 / 1', borderRadius: 999, background: `radial-gradient(circle at 30% 25%, ${dshex('#fff', 0.20)}, ${s.from} 60%, ${s.mid} 100%)` }} />
        </>
      )}
      {subject === 'event' && (
        <>
          {/* Suggested table + candles */}
          <div style={{ position: 'absolute', left: '8%', right: '8%', top: '55%', bottom: '8%', borderRadius: '4px', background: `linear-gradient(180deg, ${dshex('#3a2418', 0.55)} 0%, ${dshex('#1a0e08', 0.85)} 100%)`, boxShadow: 'inset 0 6px 14px rgba(0,0,0,0.40)' }} />
          {[20, 40, 60, 80].map((x, i) => (
            <div key={i} style={{ position: 'absolute', left: `${x}%`, top: '46%', width: 4, height: 18, borderRadius: 2, background: `linear-gradient(180deg, #ffb872 0%, #ff6a2e 60%, transparent 100%)`, filter: 'blur(2px)' }} />
          ))}
        </>
      )}
      {subject === 'place' && (
        <>
          {/* Horizon line + sun */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: '60%', height: 1, background: dshex('#000', 0.30) }} />
          <div style={{ position: 'absolute', left: '70%', top: '40%', width: 60, height: 60, borderRadius: 999, background: `radial-gradient(circle, ${dshex('#fff', 0.55)} 0%, ${dshex('#ffd9a0', 0.40)} 40%, transparent 70%)`, filter: 'blur(8px)' }} />
        </>
      )}
      {subject === 'studio' && (
        <>
          {/* Soft window light */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%', background: `linear-gradient(90deg, ${dshex('#fff', 0.45)} 0%, transparent 100%)`, mixBlendMode: 'screen' }} />
        </>
      )}
      {/* Grain — faint repeating noise via SVG-encoded dataURI not used (avoiding heavy attrs); use radial */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(transparent 60%, ${dshex('#000', 0.20)} 100%)`, pointerEvents: 'none' }} />
      {/* Optional decor label (corner stamp) */}
      {label && (
        <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', background: 'rgba(0,0,0,0.50)', color: '#fff', fontFamily: DSF.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: 3 }}>
          {label}
        </div>
      )}
    </div>
  );
}

// ─── CROP RATIOS ───────────────────────────────────────────────────────────

function CropRatios() {
  const crops = [
    { ratio: '1 / 1',  name: 'Portrait',   subject: 'portrait', desc: 'Members, hosts, on-deck cards', use: 'Profile · Spotlight · Avatars', stamp: '1:1' },
    { ratio: '3 / 2',  name: 'Event',      subject: 'event',    desc: 'Suppers, gatherings, workshops', use: 'Past-event recap · Calendar', stamp: '3:2' },
    { ratio: '16 / 9', name: 'Hero',       subject: 'place',    desc: 'Landscape, place, hero banner', use: 'Page headers · Welcome',     stamp: '16:9' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
      {crops.map((c, i) => (
        <div key={i} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
          <div style={{ padding: 14, background: DSC.cardAlt }}>
            <FauxPhoto ratio={c.ratio} subject={c.subject} label={c.stamp} />
          </div>
          <div style={{ padding: '14px 16px 14px', borderTop: `1px solid ${DSC.ruleSoft}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em' }}>{c.name}</span>
              <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.accent, letterSpacing: '0.06em', fontWeight: 700 }}>{c.ratio.replace(' / ', ':')}</span>
            </div>
            <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, marginTop: 6, lineHeight: 1.5 }}>{c.desc}</div>
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${DSC.ruleSoft}`, fontFamily: DSF.mono, fontSize: 9.5, color: DSC.mute2, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>Use for</div>
            <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.ink2, marginTop: 3 }}>{c.use}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── COLOR TREATMENT ───────────────────────────────────────────────────────

function ColorTreatment() {
  const filters = [
    { name: 'Raw',         filter: 'none',                                          note: "Untreated — too saturated, too cool. We don't ship this." },
    { name: 'Hartwood',    filter: 'saturate(0.85) contrast(1.04) brightness(1.02) sepia(0.05)', note: 'Slight desaturation, +5% warmth. The default treatment.' },
    { name: 'Quiet',       filter: 'saturate(0.55) contrast(1.06) brightness(1.04) sepia(0.12)', note: 'For archival / library content — heavier desat, more warmth.' },
    { name: 'B&W warm',    filter: 'grayscale(1) contrast(1.10) brightness(1.03) sepia(0.10)',   note: 'For anniversaries, special editorial. Use sparingly.' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {filters.map((f, i) => (
        <div key={i} style={{ background: DSC.card, border: `1px solid ${f.name === 'Hartwood' ? DSC.accent : DSC.rule}`, borderWidth: f.name === 'Hartwood' ? 1.5 : 1, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
          <div style={{ padding: 12, background: DSC.cardAlt }}>
            <FauxPhoto ratio="1 / 1" subject="portrait" filter={f.filter} />
          </div>
          <div style={{ padding: '12px 14px 14px', borderTop: `1px solid ${DSC.ruleSoft}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>{f.name}</span>
              {f.name === 'Hartwood' && <span style={{ fontFamily: DSF.mono, fontSize: 8.5, fontWeight: 700, color: DSC.accent, background: dshex(DSC.accent, 0.12), padding: '2px 7px', borderRadius: 999, letterSpacing: '0.10em', textTransform: 'uppercase' }}>Default</span>}
            </div>
            <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 4, lineHeight: 1.45 }}>{f.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── FALLBACK STATES ───────────────────────────────────────────────────────

function FallbackStates() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {/* Gradient initials (default for profile) */}
      <FallbackTile name="Gradient initials" desc="Default for missing portraits. Avatar gradient + 2-letter initials.">
        <div style={{ width: '100%', aspectRatio: '1 / 1', display: 'grid', placeItems: 'center', background: DSC.cardAlt, borderRadius: 8 }}>
          <DSAvatar name="Iris Okonkwo" initials="IO" size={68} />
        </div>
      </FallbackTile>

      {/* Hatched placeholder (for editorial upload zones) */}
      <FallbackTile name="Hatched placeholder" desc="Diagonal stripe pattern. Use for upload zones and 'photo expected here'.">
        <div style={{ width: '100%', aspectRatio: '1 / 1', background: `repeating-linear-gradient(135deg, ${DSC.panel} 0 8px, ${dshex(DSC.muted, 0.18)} 8px 9px)`, border: `1px dashed ${DSC.muted}`, borderRadius: 8, display: 'grid', placeItems: 'center' }}>
            <Icon name="image" size={26} color={DSC.muted} />
        </div>
      </FallbackTile>

      {/* Solid color block with label */}
      <FallbackTile name="Tone block" desc="Solid surface tone with a tiny mono label. For missing event photos.">
        <div style={{ width: '100%', aspectRatio: '1 / 1', background: DSC.panel, borderRadius: 8, position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: 8, left: 8, fontFamily: DSF.mono, fontSize: 9, color: DSC.muted, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Photo · supper</div>
        </div>
      </FallbackTile>

      {/* Loading / shimmer */}
      <FallbackTile name="Shimmer · loading" desc="Active state while the image streams in.">
        <div style={{ width: '100%', aspectRatio: '1 / 1', background: `linear-gradient(90deg, ${dshex(DSC.rule, 0.55)} 0%, ${dshex(DSC.ruleSoft, 0.85)} 50%, ${dshex(DSC.rule, 0.55)} 100%)`, backgroundSize: '200% 100%', animation: 'ds-shimmer 1.6s ease-in-out infinite', borderRadius: 8 }} />
      </FallbackTile>
    </div>
  );
}

function FallbackTile({ name, desc, children }) {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ padding: 12 }}>{children}</div>
      <div style={{ padding: '10px 14px 12px', borderTop: `1px solid ${DSC.ruleSoft}` }}>
        <div style={{ fontFamily: DSF.display, fontSize: 13, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.005em' }}>{name}</div>
        <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 3, lineHeight: 1.45 }}>{desc}</div>
      </div>
    </div>
  );
}

// ─── IN-CONTEXT EXAMPLES ───────────────────────────────────────────────────

function InContextExamples() {
  const filter = 'saturate(0.85) contrast(1.04) brightness(1.02) sepia(0.05)';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      {/* Member portrait card */}
      <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
        <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, padding: '10px 16px', borderBottom: `1px solid ${DSC.ruleSoft}`, background: DSC.cardAlt }}>Member portrait · 1:1</div>
        <div style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 84, height: 84, flexShrink: 0 }}>
            <FauxPhoto ratio="1 / 1" subject="portrait" filter={filter} />
          </div>
          <div>
            <div style={{ fontFamily: DSF.display, fontSize: 17, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em' }}>Iris Okonkwo</div>
            <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, marginTop: 4 }}>VP Investments · Common Capital</div>
            <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginTop: 6 }}>Class of '11</div>
          </div>
        </div>
      </div>

      {/* Past event recap */}
      <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
        <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, padding: '10px 16px', borderBottom: `1px solid ${DSC.ruleSoft}`, background: DSC.cardAlt }}>Past event · 3:2</div>
        <div style={{ padding: 14 }}>
          <FauxPhoto ratio="3 / 2" subject="event" filter={filter} label="Supper · May 14" />
          <div style={{ marginTop: 12 }}>
            <div style={{ fontFamily: DSF.display, fontSize: 15, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em' }}>Spring Supper</div>
            <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 3 }}>Hosted by Iris · 12 attended · Brooklyn</div>
          </div>
        </div>
      </div>

      {/* Hero banner */}
      <div style={{ gridColumn: '1 / 3', background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
        <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, padding: '10px 16px', borderBottom: `1px solid ${DSC.ruleSoft}`, background: DSC.cardAlt }}>Page hero · 16:9</div>
        <div style={{ position: 'relative' }}>
          <FauxPhoto ratio="16 / 9" subject="place" filter={filter} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 0%, rgba(26,18,12,0.75) 100%)` }} />
          <div style={{ position: 'absolute', left: 24, right: 24, bottom: 22 }}>
            <div style={{ fontFamily: DSF.mono, fontSize: 11, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>The Hartwood Letter · Issue 142</div>
            <div style={{ fontFamily: DSF.display, fontSize: 30, fontWeight: 600, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.1, marginTop: 6 }}>What we owe the next cohort.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RULES ─────────────────────────────────────────────────────────────────

function PhotoRules() {
  const rules = [
    { good: true,  text: 'Faces above the centre line · eyes at top third.' },
    { good: true,  text: 'Available light · soft, warm, single source.' },
    { good: true,  text: 'Apply the Hartwood treatment ( -15% saturation, +5% warmth ) on import.' },
    { good: true,  text: 'Use the gradient-initials avatar as the fallback — never a stock silhouette.' },
    { good: false, text: 'No stock photography of "diverse teams smiling at laptops".' },
    { good: false, text: 'No drop-shadows on cropped photos — let the surface lift do the work.' },
    { good: false, text: 'Never mix raw + treated photos on the same page.' },
    { good: false, text: 'No AI-generated portraits in member-facing surfaces. Anywhere.' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
      {rules.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 14px', background: r.good ? dshex(DSC.ok, 0.06) : dshex(DSC.bad, 0.05), border: `1px solid ${r.good ? dshex(DSC.ok, 0.22) : dshex(DSC.bad, 0.22)}`, borderRadius: 10 }}>
          <span style={{ width: 18, height: 18, borderRadius: 999, background: r.good ? DSC.ok : DSC.bad, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
            <Icon name={r.good ? 'check' : 'close'} size={10} color="currentColor" strokeWidth={3.2} />
          </span>
          <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2, lineHeight: 1.5 }}>{r.text}</span>
        </div>
      ))}
    </div>
  );
}

window.PhotographySection = PhotographySection;
