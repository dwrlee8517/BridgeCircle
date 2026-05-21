/* eslint-disable */
// Atrium Design System — Error Boundary (Section 51)

function ErrorBoundarySection() {
  return (
    <DSSection id="errors" eyebrow="Components · 51" title="Error Boundary & Recovery">

      <DSSub title="Component-level boundary — the supper-notes failed">
        <ComponentErrorBoundary />
      </DSSub>

      <DSSub title="Section-level error — directory unavailable">
        <SectionError />
      </DSSub>

      <DSSub title="Full-page error · 500 · the circle is dim">
        <PageError />
      </DSSub>

      <DSSub title="Offline state · with cached content">
        <OfflineState />
      </DSSub>

      <DSSub title="Error tone — what to say, what never to say">
        <ErrorVoice />
      </DSSub>

    </DSSection>
  );
}

function ComponentErrorBoundary() {
  const [seed, setSeed] = React.useState(0);
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: 18 }}>
      <DSEyebrow>Spring Supper · Tue 27 May</DSEyebrow>
      <div style={{ fontFamily: DSF.display, fontSize: 18, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em', marginTop: 6 }}>What we talked about over the pork shoulder</div>

      {/* Working sibling */}
      <div style={{ marginTop: 14, padding: 14, background: DSC.cardAlt, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
        <DSAvatar name="Iris Okonkwo" initials="IO" size={32} />
        <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2 }}>"Anyone have a more recent underwriting table?"</div>
      </div>

      {/* Broken sibling */}
      <div key={seed} style={{ marginTop: 10, padding: '14px 16px', background: dshex(DSC.bad, 0.05), border: `1.5px dashed ${dshex(DSC.bad, 0.35)}`, borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ width: 28, height: 28, borderRadius: 999, background: dshex(DSC.bad, 0.16), color: DSC.bad, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>
          <Icon name="close" size={13} color="currentColor" strokeWidth={2.6} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: DSF.body, fontSize: 13, fontWeight: 700, color: DSC.ink }}>This reply didn't load.</div>
          <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 3, lineHeight: 1.5 }}>The rest of the thread is fine. Refresh the comment to try again.</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <DSButton size="sm" onClick={() => setSeed(s => s + 1)} leadIcon={<Icon name="recurring" size={12} color="currentColor" />}>Try again</DSButton>
            <DSButton size="sm" variant="ghost">Skip this reply</DSButton>
          </div>
          <div style={{ marginTop: 10, padding: '7px 10px', background: dshex(DSC.bad, 0.08), border: `1px solid ${dshex(DSC.bad, 0.20)}`, borderRadius: 6, fontFamily: DSF.mono, fontSize: 10.5, color: DSC.bad, letterSpacing: '0.04em' }}>err · comment_load_failed · cid #4821</div>
        </div>
      </div>

      {/* Working sibling */}
      <div style={{ marginTop: 10, padding: 14, background: DSC.cardAlt, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
        <DSAvatar name="Dev Patel" initials="DP" size={32} />
        <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2 }}>"We rebuilt our model in March — happy to share."</div>
      </div>
    </div>
  );
}

function SectionError() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${DSC.ruleSoft}`, background: DSC.cardAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: DSF.display, fontSize: 15, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>Directory</span>
        <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.bad, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: DSC.bad }} />
          Offline temporarily
        </span>
      </div>
      <div style={{ padding: '40px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
        <svg aria-hidden="true" width="86" height="56" viewBox="0 0 200 130">
          <circle cx="75"  cy="65" r="44" fill="none" stroke={DSC.bad} strokeOpacity="0.55" strokeWidth="1.5" />
          <circle cx="125" cy="65" r="44" fill="none" stroke={DSC.muted} strokeOpacity="0.40" strokeWidth="1.5" strokeDasharray="4 4" />
        </svg>
        <div style={{ fontFamily: DSF.display, fontSize: 19, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em' }}>The directory is out of reach.</div>
        <p style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, lineHeight: 1.55, margin: 0, maxWidth: 360 }}>
          We can't talk to the member service right now. Your inbox, calendar, and profile are unaffected — try again in a minute, or open one of those.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <DSButton size="sm" leadIcon={<Icon name="recurring" size={12} color="currentColor" />}>Try again</DSButton>
          <DSButton size="sm" variant="outline" leadIcon={<Icon name="inbox" size={12} color="currentColor" />}>Open inbox instead</DSButton>
        </div>
        <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.mute2, letterSpacing: '0.10em', marginTop: 4 }}>err · directory_unreachable · since 14:42 ET</div>
      </div>
    </div>
  );
}

function PageError() {
  return (
    <div style={{ borderRadius: 18, border: `1px solid ${DSC.rule}`, overflow: 'hidden', boxShadow: '0 4px 14px rgba(42,34,26,0.08)' }}>
      <div style={{ padding: '10px 16px', background: DSC.cardAlt, borderBottom: `1px solid ${DSC.rule}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'flex', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, background: DSC.bad, opacity: 0.55 }} />
          <span style={{ width: 9, height: 9, borderRadius: 999, background: dshex(DSC.muted, 0.35) }} />
          <span style={{ width: 9, height: 9, borderRadius: 999, background: dshex(DSC.muted, 0.35) }} />
        </span>
        <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, letterSpacing: '0.06em', marginLeft: 8 }}>hartwood.org · 500</span>
      </div>
      <div style={{ background: DSC.paper, padding: '60px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden', minHeight: 360 }}>
        <svg aria-hidden="true" width="300" height="190" viewBox="0 0 320 220" style={{ position: 'absolute', left: '50%', top: '45%', transform: 'translate(-50%, -50%)', opacity: 0.10, pointerEvents: 'none' }}>
          <circle cx="120" cy="110" r="100" fill="none" stroke={DSC.bad}   strokeWidth="1.4" />
          <circle cx="200" cy="110" r="100" fill="none" stroke={DSC.muted} strokeWidth="1.4" />
        </svg>
        <div style={{ fontFamily: DSF.display, fontSize: 124, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.05em', lineHeight: 1, position: 'relative', fontVariantNumeric: 'tabular-nums' }}>
          5<span style={{ color: DSC.bad }}>0</span>0
        </div>
        <DSEyebrow>Server error · we\u2019re looking at it</DSEyebrow>
        <h2 style={{ fontFamily: DSF.display, fontSize: 28, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.025em', lineHeight: 1.1, margin: '12px 0 8px', maxWidth: 520 }}>The circle is dim for a minute.</h2>
        <p style={{ fontFamily: DSF.body, fontSize: 14, color: DSC.muted, lineHeight: 1.6, margin: 0, maxWidth: 440 }}>
          Something on our end went out. The team has been pinged. Try again in a minute — if it keeps happening, write to us.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap', justifyContent: 'center' }}>
          <DSButton leadIcon={<Icon name="recurring" size={13} color="currentColor" />}>Try again</DSButton>
          <DSButton variant="outline" leadIcon={<Icon name="send" size={13} color="currentColor" />}>Write to us</DSButton>
          <DSButton variant="outline" leadIcon={<Icon name="home" size={13} color="currentColor" />}>Home</DSButton>
        </div>
        <div style={{ marginTop: 26, fontFamily: DSF.mono, fontSize: 9.5, color: DSC.mute2, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          err · 500 · req#a8f9-2b41-c7 · 14:42:08 ET
        </div>
      </div>
    </div>
  );
}

function OfflineState() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '18px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: dshex(DSC.warn, 0.10), border: `1px solid ${dshex(DSC.warn, 0.30)}`, borderRadius: 999, marginBottom: 14 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: DSC.warn, boxShadow: `0 0 0 3px ${dshex(DSC.warn, 0.18)}` }} />
        <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.warn, fontWeight: 700 }}>You're offline — showing what we have</span>
        <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.06em', marginLeft: 'auto' }}>last synced 14:18 ET</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { who: 'Iris Okonkwo', text: 'replied to your intro · "Tue 4 pm works"',  cached: true },
          { who: 'Dev Patel',    text: "RSVP\u2019d to Spring Supper",                cached: true },
          { who: 'Sam Aldridge', text: '— new message pending sync',                    cached: false },
        ].map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 10, padding: '10px 12px', background: r.cached ? DSC.cardAlt : 'transparent', border: r.cached ? `1px solid ${DSC.rule}` : `1px dashed ${dshex(DSC.warn, 0.40)}`, borderRadius: 10, alignItems: 'center', opacity: r.cached ? 1 : 0.65 }}>
            <DSAvatar name={r.who} initials={r.who.split(' ').map(s => s[0]).join('')} size={28} />
            <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2 }}>
              <strong style={{ color: DSC.ink, fontWeight: 600 }}>{r.who.split(' ')[0]}</strong> {r.text}
            </div>
            <span style={{ fontFamily: DSF.mono, fontSize: 9, color: r.cached ? DSC.muted : DSC.warn, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>{r.cached ? 'Cached' : 'Pending'}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, lineHeight: 1.5 }}>
        Anything you write now will be queued and sent when you're back online.
      </div>
    </div>
  );
}

function ErrorVoice() {
  const pairs = [
    { good: "The circle is dim for a minute.", bad: 'Error: Internal Server Error (500)', note: 'Stay in voice. Reassure first.' },
    { good: "This reply didn\u2019t load.",      bad: 'NetworkError: Failed to fetch',     note: 'Name the affected object, not the exception class.' },
    { good: "You\u2019re offline — showing what we have.", bad: 'No internet connection.',  note: 'Tell users what they CAN still do.' },
    { good: 'Try again',                        bad: 'Retry',                              note: 'Verb that means what it means.' },
    { good: "We can't talk to the member service right now.", bad: 'Service unavailable.',  note: 'Concrete > abstract.' },
    { good: "Write to us",                       bad: 'Contact support',                    note: 'Sounds like a person, not a ticket queue.' },
  ];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', padding: '10px 18px', background: DSC.panel, fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, fontWeight: 700 }}>
        <span style={{ color: DSC.ok }}>Say</span><span style={{ color: DSC.bad }}>Don't say</span><span>Why</span>
      </div>
      {pairs.map((p, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', padding: '11px 18px', borderTop: `1px solid ${DSC.ruleSoft}`, gap: 12, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ width: 14, height: 14, borderRadius: 999, background: DSC.ok, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}><Icon name="check" size={9} color="currentColor" strokeWidth={3.2} /></span>
            <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink, fontWeight: 600, lineHeight: 1.45 }}>{p.good}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ width: 14, height: 14, borderRadius: 999, background: DSC.bad, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}><Icon name="close" size={9} color="currentColor" strokeWidth={3.2} /></span>
            <span style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, fontStyle: 'italic', lineHeight: 1.45 }}>{p.bad}</span>
          </div>
          <span style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, lineHeight: 1.5 }}>{p.note}</span>
        </div>
      ))}
    </div>
  );
}

window.ErrorBoundarySection = ErrorBoundarySection;
