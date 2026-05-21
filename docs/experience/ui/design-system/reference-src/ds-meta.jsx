/* eslint-disable */
// Atrium Design System — System Manifesto, Status, Changelog, Roadmap (§00b)

function ManifestoSection() {
  return (
    <DSSection id="manifesto" eyebrow="The system · 00" title="What this is for">
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontFamily: DSF.display, fontSize: 22, fontWeight: 500, color: DSC.ink, letterSpacing: '-0.015em', lineHeight: 1.4, margin: 0 }}>
            <span style={{ color: DSC.accent }}>Atrium</span> is the visual and behavioural system behind BridgeCircle — a verified, member-first network for the Hartwood Society. It exists so that the people building Hartwood spend their attention on the conversation, not the chrome.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0', color: DSC.muted }}>
            <span style={{ width: 18, height: 1, background: DSC.muted }} />
            <Icon name="leaf" size={12} color="currentColor" />
            <span style={{ width: 18, height: 1, background: DSC.muted }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 16 }}>
            {[
              { n: '01', t: 'Warm, not glossy',   d: 'Oat paper, terracotta accent, real human voice. Never sterile, never bombastic.' },
              { n: '02', t: 'Member-first',       d: 'Every component starts with the person it serves. If a stat doesn’t help a member, we cut it.' },
              { n: '03', t: 'Verified, not viral', d: 'No engagement loops. No streaks shown to anyone but you. No empty notifications.' },
              { n: '04', t: 'Reciprocal',         d: 'You can ask and you can give. The system shows both halves of every relationship.' },
            ].map(p => (
              <div key={p.n}>
                <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.accent, letterSpacing: '0.14em', fontWeight: 700 }}>{p.n}</div>
                <div style={{ fontFamily: DSF.display, fontSize: 15, fontWeight: 600, color: DSC.ink, marginTop: 4, letterSpacing: '-0.01em' }}>{p.t}</div>
                <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, marginTop: 6, lineHeight: 1.55 }}>{p.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* System metrics */}
        <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
          <DSEyebrow accent>The system, by the numbers</DSEyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18, marginTop: 14 }}>
            {[
              { v: '59',  l: 'Sections' },
              { v: '290+', l: 'Components & variants' },
              { v: '7',   l: 'Accent options' },
              { v: '6',   l: 'Surface tones' },
              { v: '42',  l: 'Icons' },
              { v: 'v1.5', l: 'Current version', color: DSC.accent },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: DSF.display, fontSize: 26, fontWeight: 600, color: s.color || DSC.ink, letterSpacing: '-0.025em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
                <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DSSection>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────

function StatusBadge({ kind }) {
  const cfg = {
    stable:     { label: 'Stable',     color: DSC.ok },
    beta:       { label: 'Beta',       color: DSC.warn },
    internal:   { label: 'Internal',   color: DSC.muted },
    deprecated: { label: 'Deprecated', color: DSC.bad },
    new:        { label: 'New · v1.4', color: DSC.accent },
  }[kind] || { label: kind, color: DSC.muted };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: DSF.mono, fontSize: 9.5, fontWeight: 700, color: cfg.color, background: dshex(cfg.color, 0.12), border: `1px solid ${dshex(cfg.color, 0.28)}`, padding: '2px 8px', borderRadius: 999, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      <span style={{ width: 5, height: 5, borderRadius: 999, background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function ComponentStatusSection() {
  const rows = [
    { name: 'Color · accents',         status: 'stable',     since: 'v1.0', a11y: 'AA · 4.6:1+', kbd: 'n/a' },
    { name: 'Typography',              status: 'stable',     since: 'v1.0', a11y: 'AA',           kbd: 'n/a' },
    { name: 'Buttons',                 status: 'stable',     since: 'v1.0', a11y: 'AAA',          kbd: 'Tab · Space · Enter' },
    { name: 'Date picker',             status: 'beta',       since: 'v1.3', a11y: 'AA',           kbd: '←/→ · ↑↓ · PgUp/PgDn' },
    { name: 'Command palette · ⌘K',    status: 'stable',     since: 'v1.2', a11y: 'AAA',          kbd: '⌘K · ↑↓ · ↵ · Esc' },
    { name: 'Lamplight (dark) tone',   status: 'new',        since: 'v1.4', a11y: 'AA',           kbd: 'n/a' },
    { name: 'Pinboard',                status: 'beta',       since: 'v1.3', a11y: 'AA (limited)', kbd: 'Tap only' },
    { name: 'Heatmap',                 status: 'beta',       since: 'v1.2', a11y: 'A',            kbd: 'Hover only' },
    { name: 'Anchor / Vouch concept',  status: 'deprecated', since: 'Removed v1.4', a11y: '—',     kbd: '—' },
    { name: 'Confetti celebration',    status: 'internal',   since: 'v1.3', a11y: 'AA',           kbd: 'Click to replay' },
  ];
  return (
    <DSSection id="status" eyebrow="The system · 00c" title="Component status">
      <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 110px 1.4fr 1.4fr 110px', padding: '10px 16px', background: DSC.panel, borderBottom: `1px solid ${DSC.rule}`, fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, fontWeight: 700 }}>
          <span>Component</span><span>Status</span><span>A11y rating</span><span>Keyboard</span><span>Since</span>
        </div>
        {rows.map((r, i) => (
          <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '1.6fr 110px 1.4fr 1.4fr 110px', padding: '11px 16px', borderTop: i === 0 ? 'none' : `1px solid ${DSC.ruleSoft}`, alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink, fontWeight: 600 }}>{r.name}</span>
            <StatusBadge kind={r.status} />
            <span style={{ fontFamily: DSF.mono, fontSize: 11, color: DSC.ink2 }}>{r.a11y}</span>
            <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted }}>{r.kbd}</span>
            <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.mute2, letterSpacing: '0.04em' }}>{r.since}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center', fontFamily: DSF.body, fontSize: 12, color: DSC.muted }}>
        <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Legend</span>
        <StatusBadge kind="stable" /> <span>safe for any surface</span>
        <StatusBadge kind="beta" />   <span>shipping but expect changes</span>
        <StatusBadge kind="new" />    <span>added this release</span>
        <StatusBadge kind="internal" /> <span>admin / staff only</span>
        <StatusBadge kind="deprecated" /> <span>removed or replaced</span>
      </div>
    </DSSection>
  );
}

// ─── CHANGELOG ────────────────────────────────────────────────────────────

function ChangelogSection() {
  const releases = [
    {
      v: 'v1.5', date: '19 May 2026', name: 'Reference',
      added:   ['Manifesto + system-by-the-numbers front door', 'Component status table · stable / beta / new / internal / deprecated', 'Changelog timeline · 5 releases', 'Roadmap + contributing flow', 'Token export · CSS custom properties · tokens.json · Tailwind config', 'Code-tab pattern · Render / JSX / Usage / Props', 'Tier 1 reference cards · 12 atoms (Button, Tag, Avatar, Icon, Eyebrow, Input, Toggle, Checkbox, Tooltip, Tabs, Modal/Sheet, Toast)', 'Tier 2 reference cards · 12 composites (MemberCard, EventCard, PathCard, Banner, DataTable, NotificationRow, CommandPalette, DatePicker, TimePicker, WizardStepper, SearchResults, Comment)', '6 full screen-example templates (Home · People · Profile · Event · Onboarding · Letter)'],
      changed: ['Sidebar reorganised into 5 groups · The System · Foundation · Components · Code · Templates', 'Every Tier 1 / Tier 2 component now ships with a typed props table'],
      removed: [],
    },
    {
      v: 'v1.4', date: '19 May 2026', name: 'Lamplight',
      added:   ['Dark / Lamplight tone preset', 'Long-form Letter template', '4 new accents · Saffron · Lake · Indigo · Heather', 'Mobile sheet, swipe, pull-to-refresh patterns', 'Page transitions library'],
      changed: ['Surface contrast lifted by 8%', 'Empty-profile shell rewired to onboarding flow', 'Iconography unified at 1.8px stroke'],
      removed: ['Anchor / Vouch concept — replaced by Society-verified, member-invited'],
    },
    {
      v: 'v1.3', date: '12 Mar 2026', name: 'The Pinboard',
      added:   ['Pinboard pattern', 'Activity heatmap', 'Achievement crests · 8 lapel pins', 'Member card library · 14 variants', 'Bento layout'],
      changed: ['Spacing scale tokenized · space-0…space-20', 'AccentCard redesigned with tint scale + role'],
      removed: [],
    },
    {
      v: 'v1.2', date: '04 Feb 2026', name: 'Command',
      added:   ['Command palette · ⌘K', 'AI search · 3 drafts pattern', 'Sortable / selectable table', 'Notification preferences'],
      changed: ['Tag tones consolidated to 5 · muted · accent · ok · warn · bad'],
      removed: [],
    },
    {
      v: 'v1.1', date: '15 Jan 2026', name: 'Quiet',
      added:   ['Wax-seal anniversary card', 'Streak ribbon', 'Inline status setter', 'Email templates · 5 patterns'],
      changed: ['Card surface relationships · 8 named patterns (Lifted, Sunk, Outlined…)'],
      removed: [],
    },
    {
      v: 'v1.0', date: '01 Dec 2025', name: 'First Supper',
      added:   ['Initial release · 30 sections', 'Atrium theme · oat / terracotta', '3 accents · 4 surface tones · 3 densities'],
      changed: [],
      removed: [],
    },
  ];
  return (
    <DSSection id="changelog" eyebrow="The system · 00d" title="Changelog">
      <div style={{ position: 'relative', paddingLeft: 22 }}>
        <div style={{ position: 'absolute', left: 9, top: 4, bottom: 4, width: 2, background: `linear-gradient(to bottom, ${DSC.accent} 0%, ${dshex(DSC.muted, 0.4)} 100%)` }} />
        {releases.map((r, i) => (
          <div key={r.v} style={{ position: 'relative', paddingBottom: 22 }}>
            <span style={{ position: 'absolute', left: -19, top: 8, width: 14, height: 14, borderRadius: 999, background: i === 0 ? DSC.accent : DSC.card, border: `3px solid ${i === 0 ? DSC.accent : DSC.muted}`, boxShadow: i === 0 ? `0 0 0 4px ${dshex(DSC.accent, 0.18)}` : 'none' }} />
            <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: '14px 18px', marginLeft: 8, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <span style={{ fontFamily: DSF.display, fontSize: 18, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em' }}>{r.v}</span>
                  <span style={{ fontFamily: DSF.display, fontStyle: 'italic', fontSize: 16, color: DSC.muted, marginLeft: 10 }}>“{r.name}”</span>
                </div>
                <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em' }}>{r.date}</span>
              </div>
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: r.removed.length > 0 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 14 }}>
                {[
                  { label: 'Added',   items: r.added,   tone: DSC.ok },
                  { label: 'Changed', items: r.changed, tone: DSC.accent },
                  ...(r.removed.length > 0 ? [{ label: 'Removed', items: r.removed, tone: DSC.bad }] : []),
                ].map(g => g.items.length > 0 && (
                  <div key={g.label}>
                    <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: g.tone, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>{g.label}</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {g.items.map((it, j) => (
                        <li key={j} style={{ display: 'flex', gap: 6, fontFamily: DSF.body, fontSize: 12, color: DSC.ink2, lineHeight: 1.5 }}>
                          <span style={{ color: g.tone, fontWeight: 700, flexShrink: 0 }}>·</span>{it}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DSSection>
  );
}

// ─── ROADMAP & CONTRIBUTING ───────────────────────────────────────────────

function RoadmapSection() {
  const cols = [
    {
      label: 'Shipped this quarter', tone: DSC.ok,
      items: [
        { name: 'Lamplight dark mode',          tag: 'v1.4' },
        { name: 'Letter template',              tag: 'v1.4' },
        { name: 'Token export · JSON + CSS',     tag: 'v1.5' },
        { name: 'Tier 1 + Tier 2 reference cards', tag: 'v1.5' },
        { name: 'Screen example templates',     tag: 'v1.5' },
      ],
    },
    {
      label: 'In progress', tone: DSC.accent,
      items: [
        { name: 'Tabs + Stepper · keyboard polish',    tag: 'v1.6' },
        { name: 'Audio / video player chrome',         tag: 'v1.6' },
        { name: 'Real photography library',             tag: 'v1.6' },
      ],
    },
    {
      label: 'Later · Q3/Q4', tone: DSC.muted,
      items: [
        { name: 'i18n · RTL, long-string handling',         tag: 'v1.7' },
        { name: 'Native mobile (iOS / Android) parity kit', tag: 'v2.0' },
        { name: 'Figma source-of-truth sync',                tag: 'v2.0' },
      ],
    },
  ];
  return (
    <DSSection id="roadmap" eyebrow="The system · 00e" title="Roadmap & contributing">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {cols.map(c => (
          <div key={c.label} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: c.tone }} />
              <span style={{ fontFamily: DSF.mono, fontSize: 10, color: c.tone, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>{c.label}</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {c.items.map((it, i) => (
                <li key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', padding: '8px 10px', background: DSC.cardAlt, borderRadius: 8 }}>
                  <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink, fontWeight: 500, lineHeight: 1.4 }}>{it.name}</span>
                  <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: c.tone, fontWeight: 700, letterSpacing: '0.06em' }}>{it.tag}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, background: dshex(DSC.accent, 0.07), border: `1px solid ${dshex(DSC.accent, 0.24)}`, borderRadius: 14, padding: '18px 22px' }}>
        <DSEyebrow accent>Contributing</DSEyebrow>
        <div style={{ fontFamily: DSF.display, fontSize: 18, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em', marginTop: 6 }}>The system is co-owned.</div>
        <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink2, lineHeight: 1.6, margin: '8px 0 14px', maxWidth: 720 }}>
          Members of the team can propose new components or changes. We review weekly; a proposal usually lands in 2–3 weeks. There are three rules: it must serve a member need we've seen at least twice; it must use existing tokens; and it must come with a "what NOT to do" example.
        </p>
        <ol style={{ paddingLeft: 0, margin: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { n: '01', t: 'Open an issue', d: 'Use the proposal template — one paragraph + screenshot.' },
            { n: '02', t: 'Spike',         d: "Build a prototype in your branch. It doesn't need to be pretty." },
            { n: '03', t: 'Review',        d: 'Wednesday office hours. ~30 minutes per proposal.' },
            { n: '04', t: 'Land',          d: 'Add to §status as Beta. Promote to Stable after one quarter clean.' },
          ].map(s => (
            <li key={s.n} style={{ background: DSC.card, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.accent, letterSpacing: '0.10em', fontWeight: 700 }}>{s.n}</div>
              <div style={{ fontFamily: DSF.display, fontSize: 13, fontWeight: 600, color: DSC.ink, marginTop: 4, letterSpacing: '-0.005em' }}>{s.t}</div>
              <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 4, lineHeight: 1.5 }}>{s.d}</div>
            </li>
          ))}
        </ol>
      </div>
    </DSSection>
  );
}

window.ManifestoSection        = ManifestoSection;
window.ComponentStatusSection = ComponentStatusSection;
window.ChangelogSection        = ChangelogSection;
window.RoadmapSection          = RoadmapSection;
window.StatusBadge             = StatusBadge;
