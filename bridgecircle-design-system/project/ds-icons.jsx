/* eslint-disable */
// Atrium Design System — Iconography (Section 28)
// 40 single-style icons. 24×24 viewBox, 1.8px stroke, rounded caps/joins.
// One Icon component pulls from the ICONS registry. Use `<Icon name="home" size={20} />`.

// ─── ICON REGISTRY ─────────────────────────────────────────────────────────

const ICONS = {
  // ── Wayfinding (8) ─────────────────────────────────────────────────
  home:     { cat: 'wayfind', glyph: <><path d="M3 11l9-8 9 8" /><path d="M5 10v11h5v-7h4v7h5V10" /></> },
  people:   { cat: 'wayfind', glyph: <><circle cx="9" cy="8" r="3.5" /><circle cx="17" cy="9" r="2.8" /><path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6" /><path d="M16 19c0-2 1.5-4 5-4" /></> },
  inbox:    { cat: 'wayfind', glyph: <><path d="M3 13l3-8h12l3 8" /><path d="M3 13v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6" /><path d="M3 13h5l1 3h6l1-3h5" /></> },
  calendar: { cat: 'wayfind', glyph: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></> },
  profile:  { cat: 'wayfind', glyph: <><circle cx="12" cy="9" r="4" /><path d="M5 21c0-4 3-7 7-7s7 3 7 7" /></> },
  search:   { cat: 'wayfind', glyph: <><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></> },
  menu:     { cat: 'wayfind', glyph: <><path d="M4 7h16M4 12h16M4 17h16" /></> },
  settings: { cat: 'wayfind', glyph: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.8L4.3 7a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.4.6 1 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></> },

  // ── Communication (5) ──────────────────────────────────────────────
  message:  { cat: 'comm', glyph: <><path d="M21 12c0 5-4 9-9 9-1.5 0-3-.4-4.2-1L3 21l1-4.8C3.4 15 3 13.5 3 12c0-5 4-9 9-9s9 4 9 9z" /></> },
  reply:    { cat: 'comm', glyph: <><polyline points="9 14 4 9 9 4" /><path d="M4 9h11a5 5 0 0 1 5 5v6" /></> },
  send:     { cat: 'comm', glyph: <><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></> },
  share:    { cat: 'comm', glyph: <><circle cx="6" cy="12" r="3" /><circle cx="18" cy="5" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="10.6" x2="15.4" y2="6.4" /><line x1="8.6" y1="13.4" x2="15.4" y2="17.6" /></> },
  wave:     { cat: 'comm', glyph: <><path d="M5 12V7a2 2 0 1 1 4 0v4" /><path d="M9 11V5a2 2 0 1 1 4 0v6" /><path d="M13 12V6a2 2 0 1 1 4 0v8" /><path d="M17 12V9a2 2 0 1 1 4 0v6a7 7 0 0 1-14 0" /></> },

  // ── Trust & Identity (5) ───────────────────────────────────────────
  verified: { cat: 'trust', glyph: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></> },
  anchor:   { cat: 'trust', glyph: <><path d="M12 2l-2 3h1.5v15" /><path d="M10.5 5h3" /><path d="M5 13a7 7 0 0 0 14 0" /><path d="M3 13h4M17 13h4" /></> },
  mentor:   { cat: 'trust', glyph: <><path d="M3 6v14a1 1 0 0 0 1.4.9L12 18l7.6 2.9A1 1 0 0 0 21 20V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" /><path d="M12 7v11" /></> },
  network:  { cat: 'trust', glyph: <><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" /><line x1="8" y1="7" x2="16" y2="7" /><line x1="7" y1="8" x2="11" y2="16" /><line x1="17" y1="8" x2="13" y2="16" /></> },
  vouch:    { cat: 'trust', glyph: <><path d="M12 21s-7-4-9.5-8.5C0 8 4 4 8 6c1.5.7 3 2 4 4 1-2 2.5-3.3 4-4 4-2 8 2 5.5 6.5C19 17 12 21 12 21z" /></> },

  // ── Time (4) ───────────────────────────────────────────────────────
  clock:     { cat: 'time', glyph: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" /></> },
  event:     { cat: 'time', glyph: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /><circle cx="9" cy="14" r="1.2" fill="currentColor" stroke="none" /><circle cx="13" cy="14" r="1.2" fill="currentColor" stroke="none" /><circle cx="17" cy="14" r="1.2" fill="currentColor" stroke="none" /></> },
  recurring: { cat: 'time', glyph: <><path d="M3 12a9 9 0 0 1 14.5-7L20 3" /><path d="M21 12a9 9 0 0 1-14.5 7L4 21" /><polyline points="20 3 20 7 16 7" /><polyline points="4 21 4 17 8 17" /></> },
  schedule:  { cat: 'time', glyph: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /><path d="M16 4l4 4M8 4L4 8" /></> },

  // ── Action (7) ─────────────────────────────────────────────────────
  plus:     { cat: 'action', glyph: <><path d="M12 5v14M5 12h14" /></> },
  check:    { cat: 'action', glyph: <><polyline points="5 12 10 17 20 7" /></> },
  close:    { cat: 'action', glyph: <><path d="M6 6l12 12M18 6L6 18" /></> },
  edit:     { cat: 'action', glyph: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z" /></> },
  trash:    { cat: 'action', glyph: <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></> },
  save:     { cat: 'action', glyph: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></> },
  bookmark: { cat: 'action', glyph: <><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></> },

  // ── State (5) ──────────────────────────────────────────────────────
  heart:   { cat: 'state', glyph: <><path d="M12 21s-7-4-9.5-8.5C0 8 4 4 8 6c1.5.7 3 2 4 4 1-2 2.5-3.3 4-4 4-2 8 2 5.5 6.5C19 17 12 21 12 21z" /></> },
  star:    { cat: 'state', glyph: <><polygon points="12 2 14.7 8.5 22 9.3 16.5 14 18 21 12 17.5 6 21 7.5 14 2 9.3 9.3 8.5 12 2" /></> },
  bell:    { cat: 'state', glyph: <><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2z" /><path d="M10 20a2 2 0 0 0 4 0" /></> },
  eye:     { cat: 'state', glyph: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></> },
  lock:    { cat: 'state', glyph: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></> },

  // ── Content (4) ────────────────────────────────────────────────────
  file:    { cat: 'content', glyph: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></> },
  image:   { cat: 'content', glyph: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></> },
  attach:  { cat: 'content', glyph: <><path d="M21 11l-9 9a5 5 0 1 1-7-7l9-9a3 3 0 0 1 4 4L9 17a1 1 0 0 1-1.4-1.4L17 6" /></> },
  link:    { cat: 'content', glyph: <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></> },

  // ── Decorative (3) ─────────────────────────────────────────────────
  sparkle: { cat: 'decor', glyph: <><path d="M12 3l1.7 6L20 11l-6.3 2L12 19l-1.7-6L4 11l6.3-2z" /><path d="M19 4v3M21 5.5h-3M5 18v3M6.5 19.5h-3" /></> },
  leaf:    { cat: 'decor', glyph: <><path d="M3 21c5-10 14-12 18-12-2 8-6 16-14 16-3 0-4-2-4-4z" /><path d="M3 21l8-8" /></> },
  flame:   { cat: 'decor', glyph: <><path d="M12 21s8-4 8-11c0-3-2-5-4-5-1 0-2 1-2 2s-1-3-4-3c-3 0-5 2-5 5s3 5 3 8c0 2-2 3-2 3" /></> },

  // ── Direction (4) ──────────────────────────────────────────────────
  'chevron-up':    { cat: 'direction', glyph: <><polyline points="18 15 12 9 6 15" /></> },
  'chevron-down':  { cat: 'direction', glyph: <><polyline points="6 9 12 15 18 9" /></> },
  'chevron-left':  { cat: 'direction', glyph: <><polyline points="15 18 9 12 15 6" /></> },
  'chevron-right': { cat: 'direction', glyph: <><polyline points="9 18 15 12 9 6" /></> },
};

const CATEGORY_LABELS = {
  wayfind:   { label: 'Wayfinding',         note: 'Top-level nav & app chrome' },
  comm:      { label: 'Communication',      note: 'Messages, replies, sharing' },
  trust:     { label: 'Trust & Identity',   note: 'Verification, mentorship, network' },
  time:      { label: 'Time',               note: 'Calendar, clock, recurring' },
  action:    { label: 'Action',             note: 'Buttons & toolbar actions' },
  state:     { label: 'State',              note: 'Saved, watched, locked' },
  content:   { label: 'Content',            note: 'Files, links, attachments' },
  decor:     { label: 'Decorative',         note: 'Brand motifs — climate, hosting, sparkle' },
  direction: { label: 'Direction',          note: 'Chevrons & arrows' },
};

// ─── ICON COMPONENT ────────────────────────────────────────────────────────

function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8 }) {
  const icon = ICONS[name];
  if (!icon) return <span style={{ fontFamily: DSF.mono, fontSize: 9, color: DSC.bad }}>?{name}?</span>;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icon.glyph}
    </svg>
  );
}

// ─── SECTION ───────────────────────────────────────────────────────────────

function IconographySection() {
  const cats = Object.keys(CATEGORY_LABELS);
  const total = Object.keys(ICONS).length;

  return (
    <DSSection id="icons" eyebrow="Components · 28" title="Iconography">

      <DSSub title={`${total} icons in one unified style — 24px viewBox · 1.8px stroke · rounded caps & joins`}>
        <IconUsageHint />

        {cats.map(cat => {
          const names = Object.keys(ICONS).filter(n => ICONS[n].cat === cat);
          if (names.length === 0) return null;
          const meta = CATEGORY_LABELS[cat];
          return (
            <div key={cat} style={{ marginTop: 22 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <span style={{ fontFamily: DSF.body, fontSize: 12, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: DSC.accent, marginRight: 10 }}>{meta.label}</span>
                  <span style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted }}>{meta.note}</span>
                </div>
                <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.mute2, letterSpacing: '0.06em' }}>{names.length} icons</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(106px, 1fr))', gap: 6 }}>
                {names.map(n => <IconTile key={n} name={n} />)}
              </div>
            </div>
          );
        })}
      </DSSub>

      <DSSub title="Size scale — 16 / 20 / 24 / 28 / 32px">
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32, padding: '18px 22px', background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
          {[16, 20, 24, 28, 32].map(s => (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'grid', placeItems: 'center', width: 48, height: 48, color: DSC.ink }}>
                <Icon name="bell" size={s} />
              </div>
              <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.06em' }}>{s}px</span>
            </div>
          ))}
        </div>
      </DSSub>

      <DSSub title="In context — pair with text, drop into buttons, decorate">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <ShowCard title="Inline with text">
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontFamily: DSF.body, fontSize: 13, color: DSC.ink2 }}>
              {[
                ['home', 'Home'],
                ['inbox', 'Inbox · 3 waiting'],
                ['calendar', 'Spring Supper · Tue 27 May'],
                ['verified', "Class of '11 · Verified"],
                ['leaf', 'Climate vertical'],
                ['lock', 'Account & privacy'],
              ].map(([n, l]) => (
                <li key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, color: DSC.muted }}>
                  <Icon name={n} size={16} color={DSC.muted} />
                  <span style={{ color: DSC.ink2 }}>{l}</span>
                </li>
              ))}
            </ul>
          </ShowCard>

          <ShowCard title="In buttons">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
              <DSButton leadIcon={<Icon name="send" size={13} color="currentColor" />}>Send intro</DSButton>
              <DSButton variant="outline" leadIcon={<Icon name="reply" size={13} color="currentColor" />}>Reply</DSButton>
              <DSButton variant="ink" leadIcon={<Icon name="bookmark" size={13} color="currentColor" />}>Save for later</DSButton>
              <DSButton variant="ghost" leadIcon={<Icon name="trash" size={13} color="currentColor" />} style={{ color: DSC.bad }}>Remove</DSButton>
            </div>
          </ShowCard>

          <ShowCard title="Action toolbar — icon-only">
            <div style={{ display: 'flex', gap: 6, padding: 4, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 999, width: 'fit-content' }}>
              {['reply', 'share', 'bookmark', 'bell', 'eye', 'trash'].map(n => (
                <button key={n} aria-label={n} title={n} style={{ width: 34, height: 34, borderRadius: 999, background: 'transparent', border: 'none', color: DSC.muted, cursor: 'pointer', display: 'grid', placeItems: 'center', transition: 'background 100ms ease, color 100ms ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = DSC.card; e.currentTarget.style.color = DSC.ink; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = DSC.muted; }}>
                  <Icon name={n} size={16} color="currentColor" />
                </button>
              ))}
            </div>
          </ShowCard>

          <ShowCard title="Stat tiles — accent-tinted">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {[
                { icon: 'message', label: 'Conversations', value: '247', color: DSC.accent },
                { icon: 'event',   label: 'Events',        value: '18',  color: DSC.ok     },
                { icon: 'vouch',   label: 'Vouches',       value: '12',  color: '#3f5680'  },
                { icon: 'network', label: 'Connections',   value: '142', color: DSC.warn   },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: dshex(s.color, 0.08), border: `1px solid ${dshex(s.color, 0.22)}`, borderRadius: 10 }}>
                  <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 999, background: dshex(s.color, 0.14), color: s.color }}>
                    <Icon name={s.icon} size={16} color="currentColor" />
                  </span>
                  <div>
                    <div style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 700, color: DSC.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                    <div style={{ fontFamily: DSF.mono, fontSize: 8.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginTop: 3 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </ShowCard>
        </div>
      </DSSub>

      <DSSub title="Usage rules">
        <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '18px 22px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Render at 16, 20, 24, 28, or 32 — never between.',          true],
              ["Color inherits from text (color: 'currentColor' default).", true],
              ["Stroke is 1.8px at the default 24px viewBox — Icon scales the math automatically; don't override.", true],
              ['Pair with text labels above 16px. Icon-only OK at 20px+ with a visible tooltip/title.', true],
              ['Never tint an icon with a different hue than its host text or container.',  false],
              ['Never mix the Atrium set with other libraries (Lucide, Feather, Heroicons) on the same page.', false],
            ].map(([txt, good], i) => (
              <li key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 22, height: 22, borderRadius: 999, background: good ? dshex(DSC.ok, 0.14) : dshex(DSC.bad, 0.12), color: good ? DSC.ok : DSC.bad, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name={good ? 'check' : 'close'} size={13} color="currentColor" strokeWidth={2.4} />
                </span>
                <span style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink2, lineHeight: 1.55 }}>{txt}</span>
              </li>
            ))}
          </ul>
        </div>
      </DSSub>

    </DSSection>
  );
}

function IconUsageHint() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: dshex(DSC.accent, 0.07), border: `1px solid ${dshex(DSC.accent, 0.22)}`, borderRadius: 999, marginBottom: 22 }}>
      <Icon name="sparkle" size={16} color={DSC.accent} />
      <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2, lineHeight: 1.4 }}>
        Click any icon to copy its name. Use it like <code style={{ fontFamily: DSF.mono, fontSize: 11, background: dshex(DSC.ink, 0.07), padding: '1px 6px', borderRadius: 4 }}>{'<Icon name="home" size={20} />'}</code>
      </span>
    </div>
  );
}

function IconTile({ name }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(name).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1100);
  };
  return (
    <button onClick={copy} title={`Copy "${name}"`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 8px 10px', background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 10, cursor: 'pointer', transition: 'background 100ms ease, transform 100ms ease, border-color 100ms ease', position: 'relative' }}
      onMouseEnter={e => { e.currentTarget.style.background = DSC.cardAlt; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = dshex(DSC.accent, 0.50); }}
      onMouseLeave={e => { e.currentTarget.style.background = DSC.card; e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = DSC.rule; }}>
      <div style={{ color: DSC.ink, display: 'grid', placeItems: 'center', width: 32, height: 32 }}>
        <Icon name={name} size={22} />
      </div>
      <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.04em', textAlign: 'center', wordBreak: 'break-all', lineHeight: 1.2 }}>{name}</div>
      {copied && (
        <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: dshex(DSC.accent, 0.92), borderRadius: 10, fontFamily: DSF.mono, fontSize: 9.5, fontWeight: 700, color: '#fff', letterSpacing: '0.10em' }}>COPIED</span>
      )}
    </button>
  );
}

window.Icon                = Icon;
window.ICONS               = ICONS;
window.IconographySection  = IconographySection;
