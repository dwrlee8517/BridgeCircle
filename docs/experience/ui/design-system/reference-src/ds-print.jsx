/* eslint-disable */
// Atrium Design System — Print Styles (Section 47)

function PrintStylesSection() {
  return (
    <DSSection id="print" eyebrow="Components · 47" title="Print Styles">

      <DSSub title="Paper formats — three sizes for three kinds of object">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, alignItems: 'flex-start' }}>
          <PaperInvitation />
          <PaperIndexCard />
          <PaperRecap />
        </div>
      </DSSub>

      <DSSub title="Print rules — what changes when paper meets ink">
        <PrintRules />
      </DSSub>

    </DSSection>
  );
}

function PaperFrame({ ratio, label, dims, children }) {
  return (
    <div>
      <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span><span style={{ color: DSC.accent }}>{dims}</span>
      </div>
      <div style={{ aspectRatio: ratio, background: '#fdfaf0', border: `1px solid ${DSC.rule}`, boxShadow: '0 10px 24px rgba(42,34,26,0.10), 0 1px 0 rgba(255,255,255,.5) inset', overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}

function PaperInvitation() {
  return (
    <PaperFrame ratio="148 / 210" label="Supper invitation" dims="A5 · 148×210mm">
      {/* Decorative top border */}
      <div style={{ padding: '28px 22px 0', position: 'relative' }}>
        <svg aria-hidden="true" width="100%" height="48" viewBox="0 0 200 48">
          <circle cx="84"  cy="24" r="22" fill="none" stroke="#1a1612" strokeWidth="1.2" />
          <circle cx="116" cy="24" r="22" fill="none" stroke="#1a1612" strokeWidth="1.2" />
        </svg>
      </div>
      <div style={{ padding: '14px 22px 0', textAlign: 'center' }}>
        <div style={{ fontFamily: DSF.mono, fontSize: 8, color: '#5a4830', letterSpacing: '0.20em', textTransform: 'uppercase', fontWeight: 700 }}>The Hartwood Society</div>
        <div style={{ fontFamily: DSF.mono, fontSize: 8, color: '#5a4830', letterSpacing: '0.20em', textTransform: 'uppercase', fontWeight: 600, marginTop: 4 }}>requests the pleasure of your company</div>
        <h1 style={{ fontFamily: DSF.display, fontSize: 22, fontWeight: 600, color: '#1a1612', letterSpacing: '-0.025em', lineHeight: 1.1, margin: '14px 0 0' }}>Spring Supper</h1>
        <div style={{ fontFamily: DSF.display, fontStyle: 'italic', fontSize: 11, color: '#5a4830', marginTop: 4 }}>for twelve and good wine</div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, margin: '20px 0', color: '#1a1612' }}>
          <span style={{ width: 14, height: 1, background: '#1a1612' }} />
          <Icon name="leaf" size={12} color="currentColor" />
          <span style={{ width: 14, height: 1, background: '#1a1612' }} />
        </div>

        <div style={{ fontFamily: DSF.display, fontSize: 13, color: '#1a1612', lineHeight: 1.6 }}>Tuesday, the twenty-seventh of May<br />half past seven o'clock</div>
        <div style={{ fontFamily: DSF.display, fontStyle: 'italic', fontSize: 11, color: '#5a4830', marginTop: 8 }}>14 Pineapple Street, Brooklyn</div>

        <div style={{ marginTop: 18, paddingTop: 12, borderTop: `1px dashed #5a4830`, fontFamily: DSF.mono, fontSize: 7.5, color: '#5a4830', letterSpacing: '0.12em', textTransform: 'uppercase' }}>RSVP by Friday · hartwood.org/142</div>
      </div>
    </PaperFrame>
  );
}

function PaperIndexCard() {
  const lines = 8;
  return (
    <PaperFrame ratio="5 / 3" label="Member brief · index card" dims="3×5 in · 76×127mm">
      <div style={{ position: 'absolute', inset: 0, paddingLeft: 22 }}>
        {/* Red margin */}
        <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 1.5, background: 'rgba(155,44,31,0.55)' }} />
        {/* Header */}
        <div style={{ position: 'relative', padding: '12px 16px 6px 0', borderBottom: `1px solid rgba(0,0,0,0.18)` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontFamily: DSF.mono, fontSize: 8, color: '#5a4830', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>Brief · Iris Okonkwo</div>
            <div style={{ fontFamily: DSF.mono, fontSize: 8, color: '#5a4830', letterSpacing: '0.08em' }}>'11 · 19·05·26</div>
          </div>
        </div>
        {/* Ruled lines */}
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} style={{ position: 'absolute', left: 22, right: 16, top: 38 + i * 16, height: 1, background: 'rgba(122,110,94,0.22)' }} />
        ))}
        {/* Hand-written notes */}
        <div style={{ position: 'relative', paddingRight: 16 }}>
          <div style={{ fontFamily: '"Inter Tight"', fontStyle: 'italic', fontSize: 11.5, lineHeight: '16px', color: '#1a1612', paddingTop: 10 }}>
            Climate underwriter at Common Capital.<br />
            Open to climate fintech founders.<br />
            Has the 2025 IPCC annex Sam wants.<br />
            Bring fennel pickle to Tuesday.<br />
            Seated next to Theo at the supper.
          </div>
        </div>
      </div>
    </PaperFrame>
  );
}

function PaperRecap() {
  return (
    <PaperFrame ratio="8.5 / 11" label="Supper recap · letter" dims="US Letter · 8.5×11 in">
      <div style={{ padding: '30px 26px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 14, borderBottom: '2px solid #1a1612' }}>
          <div>
            <div style={{ fontFamily: DSF.mono, fontSize: 8, color: '#5a4830', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700 }}>The Hartwood Letter · Recap</div>
            <div style={{ fontFamily: DSF.display, fontSize: 18, fontWeight: 600, color: '#1a1612', letterSpacing: '-0.02em', marginTop: 4 }}>Spring Supper · May '26</div>
          </div>
          <svg aria-hidden="true" width="40" height="26" viewBox="0 0 40 26">
            <circle cx="14" cy="13" r="11" fill="none" stroke="#1a1612" strokeWidth="1" />
            <circle cx="26" cy="13" r="11" fill="none" stroke="#1a1612" strokeWidth="1" />
          </svg>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
          {[['12', 'Attended'], ['8', 'Comments'], ['3', 'Threads pinned']].map(([v, l], i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: DSF.display, fontSize: 22, fontWeight: 600, color: '#1a1612', letterSpacing: '-0.025em', lineHeight: 1 }}>{v}</div>
              <div style={{ fontFamily: DSF.mono, fontSize: 7, color: '#5a4830', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Body */}
        <p style={{ fontFamily: DSF.body, fontSize: 9, color: '#1a1612', lineHeight: 1.55, margin: '14px 0 0' }}>
          The pork shoulder vanished by 8:42. The fennel pickle (Sam) was the conversation-starter; the underwriting annex (Iris) was the conversation. Three threads moved to the wire afterwards — one of them already has Dev's methods doc pinned.
        </p>
        <p style={{ fontFamily: DSF.body, fontSize: 9, color: '#1a1612', lineHeight: 1.55, margin: '8px 0 0' }}>
          The next supper is in Brooklyn on the seventeenth of June, hosted by Rosa. She would like to keep the climate-underwriting thread going.
        </p>

        {/* Attendees */}
        <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px dashed rgba(0,0,0,0.25)' }}>
          <div style={{ fontFamily: DSF.mono, fontSize: 7.5, color: '#5a4830', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>At the table</div>
          <div style={{ fontFamily: DSF.body, fontSize: 8, color: '#1a1612', lineHeight: 1.55 }}>Iris O. '11 (host) · Sam A. '11 · Dev P. '11 · Maren H. '14 · Theo H. '20 · Rosa F. '17 · Juno P. '18 · Lena V. '13 · Priya S. '17 · Ollie K. '18 · Jordan R. '09 · Felicia M. '14</div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontFamily: DSF.mono, fontSize: 7, color: '#5a4830', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
          <span>hartwood.org/letter/142</span><span>P. 01 / 02</span>
        </div>
      </div>
    </PaperFrame>
  );
}

function PrintRules() {
  const rules = [
    { good: 'Convert paper to #fdfaf0 (warm cream), ink to #1a1612.', bad: 'Print on pure white #fff with pure black #000.', note: 'Save toner and keep the warmth.' },
    { good: 'Hide chrome — nav, tooltips, action buttons.',           bad: 'Print the whole window.',                            note: 'A printed page is content, not interface.' },
    { good: 'Reduce display sizes by ~25% on print.',                  bad: 'Keep screen sizes as-is — they look enormous on paper.', note: 'Screen 32px ≈ print 24px.' },
    { good: 'Underline all links · add the URL in parentheses.',       bad: 'Link looks the same as body text.',                  note: '@media print { a::after { content: " (" attr(href) ")"; } }' },
    { good: 'Page breaks before sections, never inside.',              bad: 'Heading at the bottom of a page.',                  note: 'break-before: page; break-inside: avoid;' },
    { good: 'Show URL + page number in a print footer.',               bad: 'No source attribution at all.',                     note: '@page { @bottom-right { content: ...; } }' },
  ];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', padding: '10px 18px', background: DSC.panel, fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, fontWeight: 700 }}>
        <span style={{ color: DSC.ok }}>Do</span>
        <span style={{ color: DSC.bad }}>Don't</span>
        <span>How</span>
      </div>
      {rules.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', padding: '11px 18px', borderTop: `1px solid ${DSC.ruleSoft}`, gap: 12, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ width: 14, height: 14, borderRadius: 999, background: DSC.ok, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>
              <Icon name="check" size={9} color="currentColor" strokeWidth={3.2} />
            </span>
            <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink, fontWeight: 600, lineHeight: 1.45 }}>{r.good}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ width: 14, height: 14, borderRadius: 999, background: DSC.bad, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>
              <Icon name="close" size={9} color="currentColor" strokeWidth={3.2} />
            </span>
            <span style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, fontStyle: 'italic', lineHeight: 1.45 }}>{r.bad}</span>
          </div>
          <span style={{ fontFamily: r.note.startsWith('@') || r.note.startsWith('break-') ? DSF.mono : DSF.body, fontSize: r.note.startsWith('@') || r.note.startsWith('break-') ? 11 : 11.5, color: DSC.muted, lineHeight: 1.5 }}>{r.note}</span>
        </div>
      ))}
    </div>
  );
}

window.PrintStylesSection = PrintStylesSection;
