/* eslint-disable */
// Atrium Design System — Loading Pages (Section 50)

function LoadingPagesSection() {
  return (
    <DSSection id="loading" eyebrow="Components · 50" title="Loading Pages">

      <DSSub title="Splash · first load only">
        <SplashLoader />
      </DSSub>

      <DSSub title="Route-level skeleton — matches the destination's layout">
        <RouteSkeleton />
      </DSSub>

      <DSSub title="Long task progress · for genuinely-multi-second waits">
        <LongTaskProgress />
      </DSSub>

      <DSSub title="Loading rules">
        <LoadingRules />
      </DSSub>

    </DSSection>
  );
}

function SplashLoader() {
  return (
    <div style={{ background: '#1a1612', borderRadius: 18, padding: '60px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes splash-pulse { 0%,100% { opacity: 0.85; transform: scale(1) } 50% { opacity: 1; transform: scale(1.06) } }
        @keyframes splash-fill  { from { stroke-dashoffset: 180 } to { stroke-dashoffset: 0 } }
      `}</style>
      <svg aria-hidden="true" width="120" height="90" viewBox="0 0 32 24" style={{ animation: 'splash-pulse 2.2s ease-in-out infinite' }}>
        <circle cx="11" cy="12" r="9" fill="none" stroke="#b84e2c" strokeOpacity="0.30" strokeWidth="1" />
        <circle cx="11" cy="12" r="9" fill="#b84e2c" fillOpacity="0.85" pathLength="60" strokeDasharray="60" strokeDashoffset="60" style={{ animation: 'splash-fill 1.4s ease-out 0s both' }} />
        <circle cx="21" cy="12" r="9" fill="none" stroke="#62753a" strokeOpacity="0.30" strokeWidth="1" />
        <circle cx="21" cy="12" r="9" fill="#62753a" fillOpacity="0.85" pathLength="60" strokeDasharray="60" strokeDashoffset="60" style={{ animation: 'splash-fill 1.4s ease-out 0.2s both' }} />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: DSF.display, fontSize: 22, fontWeight: 600, color: '#f0e5d0', letterSpacing: '-0.02em' }}>BridgeCircle</div>
        <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: 'rgba(240,229,208,0.55)', marginTop: 6 }}>Opening the circle…</div>
      </div>
    </div>
  );
}

function RouteSkeleton() {
  const [route, setRoute] = React.useState('directory');
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { id: 'directory', label: 'People · directory' },
          { id: 'profile',   label: 'Member · profile' },
          { id: 'inbox',     label: 'Inbox · threads' },
        ].map(r => (
          <button key={r.id} onClick={() => setRoute(r.id)} style={{ background: route === r.id ? DSC.ink : DSC.cardAlt, color: route === r.id ? DSC.paper : DSC.ink, border: `1px solid ${route === r.id ? DSC.ink : DSC.rule}`, padding: '5px 12px', borderRadius: 999, fontFamily: DSF.body, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{r.label}</button>
        ))}
      </div>
      <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: 18, minHeight: 320 }}>
        {route === 'directory' && <DirectorySkeleton />}
        {route === 'profile' && <ProfileSkeleton />}
        {route === 'inbox' && <InboxSkeleton />}
      </div>
    </div>
  );
}

function Bone({ w = '100%', h = 12, r = 4, delay = 0, style = {} }) {
  return (
    <div style={{ width: w, height: h, borderRadius: r, background: `linear-gradient(90deg, ${dshex(DSC.rule, 0.55)} 0%, ${dshex(DSC.ruleSoft, 0.85)} 50%, ${dshex(DSC.rule, 0.55)} 100%)`, backgroundSize: '200% 100%', animation: 'ds-shimmer 1.6s ease-in-out infinite', animationDelay: `${delay}ms`, ...style }} />
  );
}

function DirectorySkeleton() {
  return (
    <div>
      {/* Header */}
      <Bone w="180px" h={14} delay={0} />
      <Bone w="320px" h={26} r={6} delay={60} style={{ marginTop: 10 }} />
      {/* Search bar */}
      <Bone w="100%" h={36} r={999} delay={120} style={{ marginTop: 16 }} />
      {/* Grid of 4 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ background: DSC.card, border: `1px solid ${DSC.ruleSoft}`, borderRadius: 10, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Bone w="48px" h={10} delay={180 + i * 80} />
              <Bone w="50px" h={14} r={999} delay={200 + i * 80} />
            </div>
            <Bone w="44px" h={44} r={999} delay={220 + i * 80} style={{ marginTop: 10 }} />
            <Bone w="80%" h={12} delay={260 + i * 80} style={{ marginTop: 10 }} />
            <Bone w="55%" h={9} delay={280 + i * 80} style={{ marginTop: 6 }} />
            <Bone w="100%" h={8} delay={300 + i * 80} style={{ marginTop: 12 }} />
            <Bone w="78%" h={8} delay={320 + i * 80} style={{ marginTop: 6 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div>
      {/* Hero */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        <Bone w="80px" h={80} r={999} />
        <div style={{ flex: 1 }}>
          <Bone w="120px" h={11} delay={60} />
          <Bone w="60%" h={28} r={6} delay={120} style={{ marginTop: 8 }} />
          <Bone w="40%" h={11} delay={180} style={{ marginTop: 8 }} />
        </div>
        <Bone w="100px" h={32} r={999} delay={240} />
      </div>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 18 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ background: DSC.cardAlt, borderRadius: 8, padding: 12 }}>
            <Bone w="60px" h={9} delay={300 + i * 60} />
            <Bone w="40px" h={20} r={5} delay={340 + i * 60} style={{ marginTop: 8 }} />
          </div>
        ))}
      </div>
      {/* Body */}
      <div style={{ marginTop: 18 }}>
        <Bone w="120px" h={11} delay={520} />
        {[0, 1, 2, 3].map(i => (
          <Bone key={i} w={`${100 - i * 8}%`} h={10} delay={560 + i * 60} style={{ marginTop: 7 }} />
        ))}
      </div>
    </div>
  );
}

function InboxSkeleton() {
  return (
    <div>
      <Bone w="100px" h={12} delay={0} />
      <Bone w="60%" h={24} r={6} delay={60} style={{ marginTop: 10 }} />
      <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
        {[60, 80, 90].map((w, i) => <Bone key={i} w={`${w}px`} h={26} r={999} delay={120 + i * 60} />)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ background: DSC.card, border: `1px solid ${DSC.ruleSoft}`, borderRadius: 10, padding: 12, display: 'grid', gridTemplateColumns: '36px 1fr 50px', gap: 12, alignItems: 'center' }}>
            <Bone w="36px" h={36} r={999} delay={260 + i * 80} />
            <div>
              <Bone w="40%" h={11} delay={280 + i * 80} />
              <Bone w="90%" h={9} delay={320 + i * 80} style={{ marginTop: 6 }} />
            </div>
            <Bone w="34px" h={10} delay={300 + i * 80} />
          </div>
        ))}
      </div>
    </div>
  );
}

function LongTaskProgress() {
  const stages = ['Reading your CV…', 'Matching to cohorts…', "Finding overlaps in '11…", 'Surfacing 12 matches'];
  const [stage, setStage] = React.useState(0);
  const [seed, setSeed] = React.useState(0);

  React.useEffect(() => {
    setStage(0);
    const t1 = setTimeout(() => setStage(1), 900);
    const t2 = setTimeout(() => setStage(2), 1900);
    const t3 = setTimeout(() => setStage(3), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [seed]);

  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '24px 26px', maxWidth: 560 }}>
      <DSEyebrow accent>Importing your CV · Step 2 of 3</DSEyebrow>
      <div style={{ fontFamily: DSF.display, fontSize: 19, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em', marginTop: 6 }}>Finding members you might already know</div>
      <div style={{ marginTop: 18 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stages.map((s, i) => {
            const done    = i < stage;
            const current = i === stage;
            const pending = i > stage;
            return (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 18, height: 18, borderRadius: 999, background: done ? DSC.ok : (current ? 'transparent' : DSC.cardAlt), border: `1.5px solid ${done ? DSC.ok : (current ? DSC.accent : DSC.rule)}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  {done && <Icon name="check" size={10} color="#fff" strokeWidth={3.4} />}
                  {current && <Spinner color={DSC.accent} size={10} />}
                </span>
                <span style={{ fontFamily: DSF.body, fontSize: 13, color: done ? DSC.muted : (current ? DSC.ink : DSC.mute2), fontWeight: current ? 600 : 500, textDecoration: done ? 'line-through' : 'none' }}>{s}</span>
                {current && <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginLeft: 'auto' }}>Working…</span>}
                {done && <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.ok, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginLeft: 'auto' }}>Done</span>}
              </li>
            );
          })}
        </ul>
      </div>
      <div style={{ marginTop: 18, padding: '10px 12px', background: DSC.cardAlt, borderRadius: 8, fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, lineHeight: 1.5 }}>
        <strong style={{ color: DSC.ink, fontWeight: 700 }}>This takes about 8 seconds.</strong> You can close the tab — we'll email you when it's ready.
      </div>
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
        <DSButton size="sm" variant="outline" onClick={() => setSeed(s => s + 1)}>Replay</DSButton>
      </div>
    </div>
  );
}

function LoadingRules() {
  const rules = [
    { ok: true,  text: 'Skeleton matches the destination shape — avatar circle, line widths, padding all real.' },
    { ok: true,  text: '0–300ms · show nothing (don\u2019t flash a skeleton for a fast response).' },
    { ok: true,  text: '300ms–1s · skeleton.' },
    { ok: true,  text: '1s+ · skeleton with a heading and "what we\u2019re doing" hint in voice.' },
    { ok: true,  text: '4s+ · stage list (see Long task pattern).' },
    { ok: false, text: 'Never use "Loading…" — say what we\u2019re actually doing ("Folding the supper notes…").' },
    { ok: false, text: 'Never block the entire screen for a single tile loading.' },
    { ok: false, text: 'Don\u2019t auto-poll without an event reason — animation budget is precious.' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
      {rules.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 14px', background: r.ok ? dshex(DSC.ok, 0.06) : dshex(DSC.bad, 0.05), border: `1px solid ${r.ok ? dshex(DSC.ok, 0.22) : dshex(DSC.bad, 0.22)}`, borderRadius: 10 }}>
          <span style={{ width: 18, height: 18, borderRadius: 999, background: r.ok ? DSC.ok : DSC.bad, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
            <Icon name={r.ok ? 'check' : 'close'} size={10} color="currentColor" strokeWidth={3.2} />
          </span>
          <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2, lineHeight: 1.5 }}>{r.text}</span>
        </div>
      ))}
    </div>
  );
}

window.LoadingPagesSection = LoadingPagesSection;
