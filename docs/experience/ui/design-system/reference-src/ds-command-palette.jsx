/* eslint-disable */
// Atrium Design System — Command Palette (Section 30)
// Universal launcher: ⌘K opens, type to filter, arrow keys to navigate.

// ─── COMMAND DATA ──────────────────────────────────────────────────────────

const COMMANDS = [
  // Navigate
  { id: 'home',    cat: 'Navigate', label: 'Go to Home',          icon: 'home',     kbd: ['⌘', '1'] },
  { id: 'people',  cat: 'Navigate', label: 'Go to People',        icon: 'people',   kbd: ['⌘', '2'] },
  { id: 'inbox',   cat: 'Navigate', label: 'Go to Inbox',         icon: 'inbox',    kbd: ['⌘', '3'], badge: 3 },
  { id: 'events',  cat: 'Navigate', label: 'Go to Events',        icon: 'calendar', kbd: ['⌘', '4'] },
  { id: 'profile', cat: 'Navigate', label: 'Open your profile',   icon: 'profile',  kbd: ['⌘', '5'] },
  { id: 'settings',cat: 'Navigate', label: 'Account & privacy',   icon: 'settings', kbd: ['⌘', ','] },

  // Actions
  { id: 'compose', cat: 'Actions',  label: 'Compose new message', icon: 'message',  kbd: ['C'] },
  { id: 'intro',   cat: 'Actions',  label: 'Send an intro',       icon: 'send' },
  { id: 'office',  cat: 'Actions',  label: 'Schedule office hours', icon: 'clock' },
  { id: 'rsvp',    cat: 'Actions',  label: 'RSVP to Spring Supper', icon: 'event' },
  { id: 'mark',    cat: 'Actions',  label: 'Mark all as read',    icon: 'check' },
  { id: 'invite',  cat: 'Actions',  label: 'Invite a new member', icon: 'wave' },

  // Members
  { id: 'mIris',   cat: 'Members',  label: 'Iris Okonkwo',        sub: "VP Investments · '11",     person: 'IO' },
  { id: 'mDev',    cat: 'Members',  label: 'Dev Patel',           sub: "Partner, Greenleaf · '11", person: 'DP' },
  { id: 'mMaren',  cat: 'Members',  label: 'Maren Holt',          sub: "Product lead · '14",       person: 'MH' },
  { id: 'mRosa',   cat: 'Members',  label: 'Rosa Ferrara',        sub: "CEO, Solaris · '17",       person: 'RF' },
  { id: 'mSam',    cat: 'Members',  label: 'Sam Aldridge',        sub: "Climate engineer · '11",   person: 'SA' },
  { id: 'mTheo',   cat: 'Members',  label: 'Theo Harrington',     sub: "Product, Waymark · '20",   person: 'TH' },

  // Toggles
  { id: 'lamp',    cat: 'Toggle',   label: 'Switch to Lamplight', icon: 'settings', sub: 'Warm dark mode' },
  { id: 'acc1',    cat: 'Toggle',   label: 'Set accent: Saffron', icon: 'sparkle',  sub: 'Golden harvest tone' },
  { id: 'acc2',    cat: 'Toggle',   label: 'Set accent: Lake',    icon: 'sparkle',  sub: 'Muted teal tone' },
  { id: 'helper',  cat: 'Toggle',   label: 'Toggle Helper mode',  icon: 'wave',     sub: 'Accept mentor requests' },
  { id: 'dnd',     cat: 'Toggle',   label: 'Do not disturb · 2 h',icon: 'bell',     sub: 'Pause notifications' },
];

const RECENT = [
  { id: 'rIris',   label: "Iris Okonkwo's profile", icon: 'profile', sub: 'Viewed 2 hours ago' },
  { id: 'rSupper', label: 'Spring Supper · Tue',   icon: 'event',   sub: 'Hosted by Iris' },
  { id: 'rInbox',  label: 'Inbox · 3 waiting',     icon: 'inbox',   badge: 3, sub: 'Oldest: Jordan · 6d' },
];

const CAT_ORDER = ['Navigate', 'Actions', 'Members', 'Toggle'];

// ─── SECTION ───────────────────────────────────────────────────────────────

function CommandPaletteSection() {
  return (
    <DSSection id="cmdk" eyebrow="Components · 30" title="Command Palette · ⌘K">

      <DSSub title="The launcher — interactive, type to filter, arrow keys to navigate">
        <CommandPaletteDemo />
      </DSSub>

      <DSSub title="Triggers — where ⌘K is offered in the app chrome">
        <CmdKTriggers />
      </DSSub>

      <DSSub title="Keyboard shortcuts — what every key does">
        <KeyboardCheatSheet />
      </DSSub>

      <DSSub title="Anatomy & rules">
        <PaletteRules />
      </DSSub>

    </DSSection>
  );
}

// ─── LIVE PALETTE DEMO ─────────────────────────────────────────────────────

function CommandPaletteDemo() {
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState(0);
  const [confirmed, setConfirmed] = React.useState(null);
  const inputRef = React.useRef(null);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return COMMANDS.filter(c =>
      c.label.toLowerCase().includes(q)
      || (c.sub && c.sub.toLowerCase().includes(q))
      || c.cat.toLowerCase().includes(q)
    );
  }, [query]);

  const flatList = filtered || [
    ...RECENT.map(r => ({ ...r, cat: 'Recent' })),
    ...CAT_ORDER.flatMap(cat => COMMANDS.filter(c => c.cat === cat)),
  ];

  React.useEffect(() => { setSelected(0); }, [query]);

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, flatList.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = flatList[selected];
      if (cmd) { setConfirmed(cmd.label); setTimeout(() => setConfirmed(null), 1800); }
    }
    else if (e.key === 'Escape') { setQuery(''); }
  };

  // Group filtered by category for rendering, but track flat index for selection
  const groups = React.useMemo(() => {
    if (filtered) {
      const byCat = {};
      filtered.forEach(c => { if (!byCat[c.cat]) byCat[c.cat] = []; byCat[c.cat].push(c); });
      return Object.entries(byCat).map(([cat, items]) => ({ cat, items }));
    } else {
      return [
        { cat: 'Recent', items: RECENT.map(r => ({ ...r, cat: 'Recent' })) },
        ...CAT_ORDER.map(cat => ({ cat, items: COMMANDS.filter(c => c.cat === cat) })),
      ];
    }
  }, [filtered]);

  let flatIdx = 0;

  return (
    <div style={{ background: dshex(DSC.ink, 0.03), border: `1px dashed ${DSC.rule}`, borderRadius: 18, padding: 28, position: 'relative' }}>
      {/* Doc label */}
      <div style={{ position: 'absolute', top: 14, left: 16, fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Always-open preview ↓</div>

      <div style={{ maxWidth: 560, margin: '20px auto 0', background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 60px rgba(42,34,26,0.18), 0 1px 0 rgba(255,255,255,.6) inset' }}>
        {/* Search row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${DSC.ruleSoft}` }}>
          <Icon name="search" size={18} color={DSC.muted} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Type a command, name, or section…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: DSF.body, fontSize: 15, color: DSC.ink, padding: 0 }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: DSC.muted, fontSize: 16, lineHeight: 1, padding: '0 4px' }}>×</button>
          )}
          <KbdKey>Esc</KbdKey>
        </div>

        {/* Results list */}
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {flatList.length === 0 && (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: DSC.muted, fontFamily: DSF.body, fontSize: 13 }}>
              No matches for <strong style={{ color: DSC.ink, fontWeight: 600 }}>"{query}"</strong>. Try a broader word.
            </div>
          )}
          {groups.map(g => g.items.length === 0 ? null : (
            <div key={g.cat}>
              <div style={{ padding: '10px 16px 6px', fontFamily: DSF.mono, fontSize: 9.5, letterSpacing: '0.10em', textTransform: 'uppercase', color: DSC.mute2, fontWeight: 700 }}>{g.cat}</div>
              {g.items.map(it => {
                const idx = flatIdx++;
                const isSel = idx === selected;
                return (
                  <CommandRow key={it.id} item={it} selected={isSel} onMouseEnter={() => setSelected(idx)} onClick={() => { setConfirmed(it.label); setTimeout(() => setConfirmed(null), 1800); }} />
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: `1px solid ${DSC.ruleSoft}`, background: DSC.cardAlt, fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.04em' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><KbdKey>↑</KbdKey><KbdKey>↓</KbdKey> Navigate</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><KbdKey>↵</KbdKey> Open</span>
          </div>
          <span>{flatList.length} {flatList.length === 1 ? 'result' : 'results'}</span>
        </div>
      </div>

      {/* Confirmation toast */}
      {confirmed && (
        <div style={{ position: 'absolute', top: 20, right: 24, background: DSC.ink, color: DSC.paper, padding: '10px 14px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, fontFamily: DSF.body, fontSize: 13, fontWeight: 500, boxShadow: '0 10px 24px rgba(42,34,26,0.32)', animation: 'ds-fade-up 200ms cubic-bezier(0.2,0.8,0.2,1)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: DSC.ok }} />
          <span><strong style={{ fontWeight: 700 }}>Selected:</strong> {confirmed}</span>
        </div>
      )}
    </div>
  );
}

function CommandRow({ item, selected, onMouseEnter, onClick }) {
  return (
    <div onMouseEnter={onMouseEnter} onClick={onClick} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 12, padding: '8px 16px', alignItems: 'center', cursor: 'pointer', background: selected ? dshex(DSC.accent, 0.10) : 'transparent', position: 'relative', transition: 'background 80ms ease' }}>
      {selected && <span style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: 3, background: DSC.accent, borderRadius: 2 }} />}
      <span style={{ display: 'grid', placeItems: 'center', color: selected ? DSC.accent : DSC.muted, width: 28, height: 28 }}>
        {item.person
          ? <span style={{ width: 24, height: 24, borderRadius: 999, background: `linear-gradient(135deg, ${DSC.accent}, ${DSC.ok})`, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: DSF.display, fontSize: 9, fontWeight: 700 }}>{item.person}</span>
          : <Icon name={item.icon || 'sparkle'} size={16} color="currentColor" />
        }
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: DSF.body, fontSize: 13.5, fontWeight: 500, color: DSC.ink }}>
          {item.label}
          {item.badge != null && (
            <span style={{ background: DSC.accent, color: '#fff', fontFamily: DSF.body, fontSize: 10, fontWeight: 700, padding: '0 6px', borderRadius: 999, minWidth: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{item.badge}</span>
          )}
        </div>
        {item.sub && (
          <div style={{ fontFamily: DSF.body, fontSize: 11, color: DSC.muted, marginTop: 1 }}>{item.sub}</div>
        )}
      </div>
      {item.kbd && (
        <span style={{ display: 'inline-flex', gap: 4 }}>
          {item.kbd.map((k, i) => <KbdKey key={i}>{k}</KbdKey>)}
        </span>
      )}
    </div>
  );
}

function KbdKey({ children }) {
  return (
    <kbd style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 20, padding: '0 6px', background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 4, boxShadow: `0 1px 0 ${dshex(DSC.ink, 0.10)}`, fontFamily: DSF.mono, fontSize: 11, fontWeight: 600, color: DSC.ink2, letterSpacing: 0 }}>{children}</kbd>
  );
}

// ─── TRIGGERS ──────────────────────────────────────────────────────────────

function CmdKTriggers() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      <VariantCard label="Nav-bar inline button" note="Always visible in the desktop header.">
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 8px 7px 14px', background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 999, cursor: 'pointer' }}>
          <Icon name="search" size={14} color={DSC.muted} />
          <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, fontWeight: 500 }}>Search anything</span>
          <span style={{ display: 'inline-flex', gap: 3, marginLeft: 8 }}>
            <KbdKey>⌘</KbdKey>
            <KbdKey>K</KbdKey>
          </span>
        </button>
      </VariantCard>

      <VariantCard label="Floating FAB · mobile" note="Compact circular trigger when nav is collapsed.">
        <button aria-label="Open command palette" style={{ width: 48, height: 48, borderRadius: 999, background: DSC.ink, color: DSC.paper, border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: '0 8px 22px rgba(42,34,26,0.32)' }}>
          <Icon name="search" size={18} color="currentColor" />
        </button>
      </VariantCard>

      <VariantCard label="Inline empty-state CTA" note="Surfaced inside an empty list as a way out.">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.5 }}>
          Lost? Try the launcher —
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 999, padding: '3px 10px', cursor: 'pointer' }}>
            <KbdKey>⌘</KbdKey><KbdKey>K</KbdKey>
          </button>
        </div>
      </VariantCard>

      <VariantCard label="First-run coach mark" note="Shown once on first sign-in, then never again.">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: DSC.ink, color: DSC.paper, borderRadius: 12, boxShadow: '0 10px 24px rgba(42,34,26,0.28)' }}>
          <span style={{ width: 28, height: 28, borderRadius: 999, background: dshex(DSC.accent, 0.20), color: DSC.accent, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name="sparkle" size={14} color="currentColor" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: DSF.body, fontSize: 13, fontWeight: 600 }}>Press <KbdKey>⌘</KbdKey><KbdKey>K</KbdKey> to jump anywhere</div>
            <div style={{ fontFamily: DSF.body, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Find people, RSVP, change tone, anything.</div>
          </div>
          <button style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 4 }}>
            <Icon name="close" size={14} color="currentColor" />
          </button>
        </div>
      </VariantCard>
    </div>
  );
}

// ─── KEYBOARD CHEAT SHEET ──────────────────────────────────────────────────

function KeyboardCheatSheet() {
  const rows = [
    { keys: [['⌘', 'K']],     desc: 'Open the command palette from anywhere' },
    { keys: [['⌘', '1'], ['⌘', '2'], ['⌘', '3'], ['⌘', '4'], ['⌘', '5']], desc: 'Jump to Home · People · Inbox · Events · Profile' },
    { keys: [['↑'], ['↓']],   desc: 'Move selection up / down' },
    { keys: [['↵']],          desc: 'Open the selected command' },
    { keys: [['Esc']],        desc: 'Clear query · then close palette' },
    { keys: [['C']],          desc: 'Compose a message (when palette open & empty)' },
    { keys: [['/']],          desc: 'Focus the inline search (without opening palette)' },
    { keys: [['⌘', '.']],     desc: 'Quick-toggle Lamplight mode' },
    { keys: [['?']],          desc: 'Open keyboard help' },
  ];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, padding: '12px 18px', borderTop: i === 0 ? 'none' : `1px solid ${DSC.ruleSoft}`, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {r.keys.map((combo, j) => (
              <span key={j} style={{ display: 'inline-flex', gap: 3 }}>
                {combo.map((k, kk) => <KbdKey key={kk}>{k}</KbdKey>)}
                {j < r.keys.length - 1 && <span style={{ color: DSC.mute2, fontFamily: DSF.mono, fontSize: 10, alignSelf: 'center', margin: '0 2px' }}>·</span>}
              </span>
            ))}
          </div>
          <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2, lineHeight: 1.45 }}>{r.desc}</div>
        </div>
      ))}
    </div>
  );
}

// ─── ANATOMY RULES ─────────────────────────────────────────────────────────

function PaletteRules() {
  const rules = [
    {
      heading: 'Open instantly · no fetch on first keystroke',
      body: "All commands are local — recent items, members, actions. Don't gate them on a network round-trip. The palette must feel instant or it's worse than a menu.",
    },
    {
      heading: 'Recents at top when empty',
      body: '3 most recently visited items (profile, event, inbox). Reduces the "what was I doing?" cost. Replaces "type to search" empty-state.',
    },
    {
      heading: 'Group, but not too much',
      body: 'Five visible categories at most: Navigate · Actions · Members · Toggle · Recent. More groups → less actionable. Members are dynamic — generate from the directory.',
    },
    {
      heading: 'Always show a shortcut, never invent one',
      body: 'Each command that has a global shortcut shows the keys on the right rail. Commands without one stay clean — no fake "C" hints.',
    },
    {
      heading: 'Escape clears, then closes',
      body: 'First Esc empties the query. Second Esc closes. Lets users back out one step at a time. Matches Linear / Slack / Notion behaviour.',
    },
    {
      heading: 'No filter overrides selection',
      body: 'When the query changes, selection resets to top. When the user arrow-keys, query is preserved. Selection follows results, not the other way around.',
    },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
      {rules.map((r, i) => (
        <div key={i} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 22, height: 22, borderRadius: 999, background: dshex(DSC.accent, 0.14), color: DSC.accent, display: 'grid', placeItems: 'center', fontFamily: DSF.mono, fontSize: 10, fontWeight: 700 }}>{i + 1}</span>
            <div style={{ fontFamily: DSF.display, fontSize: 13.5, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.005em' }}>{r.heading}</div>
          </div>
          <p style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2, lineHeight: 1.55, margin: '10px 0 0' }}>{r.body}</p>
        </div>
      ))}
    </div>
  );
}

window.CommandPaletteSection = CommandPaletteSection;
window.KbdKey                = KbdKey;
