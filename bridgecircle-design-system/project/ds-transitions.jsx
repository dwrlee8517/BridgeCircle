/* eslint-disable */
// Atrium Design System — Page Transitions (Section 49)

function PageTransitionsSection() {
  return (
    <DSSection id="transitions" eyebrow="Components · 49" title="Page Transitions">

      <DSSub title="Route changes — five named transitions">
        <PageTransitionGallery />
      </DSSub>

      <DSSub title="When to use which transition">
        <TransitionRules />
      </DSSub>

    </DSSection>
  );
}

const ROUTES = [
  { id: 'home',   label: 'Home',   color: DSC.accent },
  { id: 'people', label: 'People', color: DSC.ok },
  { id: 'inbox',  label: 'Inbox',  color: '#3f5680' },
  { id: 'events', label: 'Events', color: DSC.warn },
];

function PageTransitionGallery() {
  const kinds = [
    { kind: 'cross-fade', name: 'Cross fade',     dur: '180ms', use: 'Default · between peer routes', desc: 'Outgoing fades to 0 while incoming fades to 1.' },
    { kind: 'slide',      name: 'Slide & fade',   dur: '260ms', use: 'Sibling routes in a fixed order',  desc: 'Outgoing slides left, incoming enters from the right.' },
    { kind: 'lift',       name: 'Lift up',         dur: '220ms', use: 'Going deeper · profile detail',    desc: 'Incoming rises 12px while fading in. Backwards mirrors.' },
    { kind: 'curtain',    name: 'Curtain reveal',  dur: '320ms', use: 'Hero \u2192 reading view',         desc: 'Ink curtain wipes across, revealing the new view.' },
    { kind: 'pop',        name: 'Pop modal',       dur: '180ms', use: 'Opening an overlay or sheet',     desc: 'Scales from 0.96 \u2192 1 while fading; spring easing.' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      {kinds.map(k => <TransitionTile key={k.kind} {...k} />)}
    </div>
  );
}

function TransitionTile({ kind, name, dur, use, desc }) {
  const [idx, setIdx] = React.useState(0);
  const [prev, setPrev] = React.useState(0);
  const [seed, setSeed] = React.useState(0);
  const trigger = (i) => { setPrev(idx); setIdx(i); setSeed(s => s + 1); };

  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '16px 18px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>{name}</span>
        <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.accent, letterSpacing: '0.06em', fontWeight: 700 }}>{dur}</span>
      </div>
      <div style={{ position: 'relative', height: 160, background: DSC.cardAlt, border: `1px solid ${DSC.ruleSoft}`, borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
        <Route key={`${seed}`} route={ROUTES[idx]} kind={kind} prevIdx={prev} idx={idx} />
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {ROUTES.map((r, i) => (
          <button key={r.id} onClick={() => trigger(i)} style={{ background: idx === i ? DSC.ink : DSC.cardAlt, color: idx === i ? DSC.paper : DSC.ink, border: `1px solid ${idx === i ? DSC.ink : DSC.rule}`, padding: '5px 12px', borderRadius: 999, fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>{r.label}</button>
        ))}
      </div>
      <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, lineHeight: 1.45 }}>
        <strong style={{ color: DSC.ink, fontWeight: 700 }}>{use}.</strong> {desc}
      </div>
    </div>
  );
}

function Route({ route, kind, prevIdx, idx }) {
  const direction = idx >= prevIdx ? 1 : -1;
  const anim = (() => {
    if (kind === 'cross-fade') return { animation: 'pt-fade 180ms cubic-bezier(0.2,0.8,0.2,1) both' };
    if (kind === 'slide')      return { animation: `pt-slide-${direction > 0 ? 'r' : 'l'} 260ms cubic-bezier(0.2,0.8,0.2,1) both` };
    if (kind === 'lift')       return { animation: 'pt-lift 220ms cubic-bezier(0.2,0.8,0.2,1) both' };
    if (kind === 'curtain')    return { animation: 'pt-curtain 320ms cubic-bezier(0.4,0,0.2,1) both' };
    if (kind === 'pop')        return { animation: 'pt-pop 180ms cubic-bezier(0.34,1.4,0.5,1) both' };
    return {};
  })();
  return (
    <>
      <style>{`
        @keyframes pt-fade   { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pt-slide-r{ from { opacity: 0; transform: translateX(40px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes pt-slide-l{ from { opacity: 0; transform: translateX(-40px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes pt-lift   { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pt-curtain{ 0% { clip-path: inset(0 100% 0 0) } 100% { clip-path: inset(0 0 0 0) } }
        @keyframes pt-pop    { from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: scale(1) } }
      `}</style>
      <div style={{ position: 'absolute', inset: 0, padding: 14, background: dshex(route.color, 0.10), ...anim }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: route.color }} />
          <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: route.color, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>{route.label}</span>
        </div>
        <div style={{ fontFamily: DSF.display, fontSize: 18, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{route.label} screen</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 7, background: dshex(DSC.ink, 0.06), borderRadius: 4, width: `${100 - i * 14}%` }} />
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 12, right: 12, padding: '4px 9px', background: route.color, color: '#fff', borderRadius: 999, fontFamily: DSF.body, fontSize: 10, fontWeight: 700 }}>Action →</div>
      </div>
    </>
  );
}

function TransitionRules() {
  const rules = [
    { name: 'Cross fade',    when: 'Peer routes (Home → People → Inbox)',         dur: '180ms ease-out' },
    { name: 'Slide & fade',  when: 'Sequential routes (Step 1 → 2 → 3)',          dur: '260ms cubic-bezier(0.2,0.8,0.2,1)' },
    { name: 'Lift up',       when: 'Drilling deeper (Member → Profile detail)',  dur: '220ms cubic-bezier(0.2,0.8,0.2,1)' },
    { name: 'Curtain reveal', when: 'Hero pages, the Letter, magazine views',      dur: '320ms cubic-bezier(0.4,0,0.2,1)' },
    { name: 'Pop modal',     when: 'Overlays, sheets, command palette',           dur: '180ms spring (1.4 overshoot)' },
  ];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 220px', padding: '10px 18px', background: DSC.panel, borderBottom: `1px solid ${DSC.rule}`, fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, fontWeight: 700 }}>
        <span>Transition</span><span>When to use</span><span>Duration & easing</span>
      </div>
      {rules.map((r, i) => (
        <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 220px', padding: '12px 18px', borderTop: i === 0 ? 'none' : `1px solid ${DSC.ruleSoft}`, alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: DSF.body, fontSize: 13, fontWeight: 700, color: DSC.ink }}>{r.name}</span>
          <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2 }}>{r.when}</span>
          <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.accent, fontWeight: 700, letterSpacing: '0.04em' }}>{r.dur}</span>
        </div>
      ))}
      <div style={{ padding: '12px 18px', borderTop: `1px solid ${DSC.rule}`, background: DSC.cardAlt, fontFamily: DSF.body, fontSize: 12, color: DSC.muted, lineHeight: 1.5 }}>
        Respect <code style={{ fontFamily: DSF.mono, fontSize: 11, background: dshex(DSC.ink, 0.06), padding: '1px 6px', borderRadius: 4 }}>prefers-reduced-motion</code>. When true, fall back to a 100ms cross-fade for every transition.
      </div>
    </div>
  );
}

window.PageTransitionsSection = PageTransitionsSection;
