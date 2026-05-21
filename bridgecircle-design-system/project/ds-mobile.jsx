/* eslint-disable */
// Atrium Design System — Mobile-specific Patterns (Section 38)

function MobilePatternsSection() {
  return (
    <DSSection id="mobile" eyebrow="Components · 38" title="Mobile-specific Patterns">

      <DSSub title="Bottom sheet — primary modal pattern on mobile">
        <BottomSheetDemo />
      </DSSub>

      <DSSub title="Swipe actions — slide row left to reveal">
        <SwipeActionsDemo />
      </DSSub>

      <DSSub title="Pull-to-refresh — drag down the top of any feed">
        <PullToRefreshDemo />
      </DSSub>

      <DSSub title="Bottom nav · action sheet · tap-and-hold">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <BottomNavDemo />
          <ActionSheetDemo />
        </div>
      </DSSub>

    </DSSection>
  );
}

// ─── PHONE FRAME ───────────────────────────────────────────────────────────

function Phone({ children, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 280, height: 540, background: DSC.ink, borderRadius: 30, padding: 8, boxShadow: '0 18px 40px rgba(42,34,26,0.20), inset 0 0 0 1px rgba(255,255,255,0.06)', position: 'relative' }}>
        <div style={{ width: '100%', height: '100%', background: DSC.paper, borderRadius: 22, overflow: 'hidden', position: 'relative' }}>
          {/* Status bar */}
          <div style={{ height: 22, background: DSC.paper, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', fontFamily: DSF.mono, fontSize: 9, fontWeight: 700, color: DSC.ink, letterSpacing: '0.04em' }}>
            <span>9:41</span>
            <span style={{ display: 'inline-flex', gap: 4 }}>
              <span style={{ width: 10, height: 6, background: DSC.ink, borderRadius: 1 }} />
              <span style={{ width: 6, height: 6, background: DSC.ink, borderRadius: 999 }} />
            </span>
          </div>
          {children}
        </div>
      </div>
      {label && <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>{label}</span>}
    </div>
  );
}

// ─── BOTTOM SHEET ──────────────────────────────────────────────────────────

function BottomSheetDemo() {
  const [open, setOpen] = React.useState(true);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, alignItems: 'center' }}>
      <Phone label="Sheet · half-height">
        <div style={{ position: 'absolute', inset: '22px 0 0', overflow: 'hidden' }}>
          {/* Faded background context */}
          <div style={{ position: 'absolute', inset: 0, padding: '16px 14px' }}>
            <div style={{ fontFamily: DSF.display, fontSize: 22, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em' }}>Iris Okonkwo</div>
            <div style={{ fontFamily: DSF.body, fontSize: 11, color: DSC.muted, marginTop: 2 }}>VP Investments · Common Capital</div>
          </div>
          {/* Dim overlay */}
          {open && <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(42,34,26,0.32)', backdropFilter: 'blur(2px)' }} />}
          {/* Sheet */}
          {open && (
            <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8, background: DSC.card, borderRadius: 18, padding: '8px 16px 14px', boxShadow: '0 -8px 24px rgba(42,34,26,0.18)' }}>
              <div style={{ width: 36, height: 4, background: DSC.rule, borderRadius: 999, margin: '4px auto 12px' }} />
              <div style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>Send Iris an intro</div>
              <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 4, lineHeight: 1.5 }}>Pick a time that works.</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                {['Tue 9 am', 'Wed 2 pm', 'Thu 4 pm', 'Suggest'].map(s => (
                  <span key={s} style={{ padding: '5px 10px', background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 999, fontFamily: DSF.body, fontSize: 11, fontWeight: 600, color: DSC.ink }}>{s}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                <span style={{ flex: 1, padding: '10px 12px', background: DSC.accent, color: '#fff', borderRadius: 10, fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, textAlign: 'center' }}>Send</span>
                <span onClick={() => setOpen(false)} style={{ padding: '10px 14px', background: 'transparent', color: DSC.muted, borderRadius: 10, fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600 }}>Cancel</span>
              </div>
            </div>
          )}
        </div>
      </Phone>

      <div>
        <div style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink2, lineHeight: 1.6, marginBottom: 12 }}>
          Bottom sheets handle 80% of mobile modal needs. They preserve page context (still visible behind the dim), drag-to-dismiss feels native, and the drag handle invites the gesture.
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['Drag handle', '36×4px rule at top — make the gesture obvious'],
            ['Half-height by default', 'Tap top of sheet to expand to full'],
            ['Dim with backdrop blur', 'rgba(42,34,26,0.32) + blur(2px)'],
            ['Round top corners only', '18px top-left + top-right; 0 at bottom'],
            ['Action row at the bottom', 'Primary on left filling, dismiss text on right'],
          ].map(([k, v], i) => (
            <li key={i} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12, fontFamily: DSF.body, fontSize: 12, color: DSC.ink2 }}>
              <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.accent, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{k}</span>
              <span style={{ color: DSC.muted, lineHeight: 1.45 }}>{v}</span>
            </li>
          ))}
        </ul>
        <DSButton size="sm" variant="outline" style={{ marginTop: 14 }} onClick={() => setOpen(o => !o)}>{open ? 'Hide sheet' : 'Show sheet'}</DSButton>
      </div>
    </div>
  );
}

// ─── SWIPE ACTIONS ─────────────────────────────────────────────────────────

function SwipeActionsDemo() {
  const [swiped, setSwiped] = React.useState(false);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, alignItems: 'center' }}>
      <Phone label="Inbox row · swiped left">
        <div style={{ position: 'absolute', inset: '22px 0 0', padding: '14px 0' }}>
          <div style={{ padding: '0 14px 10px', fontFamily: DSF.display, fontSize: 22, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em' }}>Inbox</div>
          {/* Row 1 — swiped */}
          <div style={{ position: 'relative', overflow: 'hidden', borderTop: `1px solid ${DSC.ruleSoft}`, borderBottom: `1px solid ${DSC.ruleSoft}`, marginBottom: 6 }}>
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, display: 'flex' }}>
              <div style={{ width: 56, background: DSC.ok, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: DSF.body, fontSize: 10, fontWeight: 700, gap: 4 }}><Icon name="check" size={14} color="currentColor" strokeWidth={2.5} />Reply</div>
              <div style={{ width: 56, background: DSC.bad, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: DSF.body, fontSize: 10, fontWeight: 700, gap: 4 }}><Icon name="trash" size={14} color="currentColor" />Skip</div>
            </div>
            <div onClick={() => setSwiped(s => !s)} style={{ background: DSC.paper, padding: '12px 14px', transform: swiped ? 'translateX(-112px)' : 'translateX(0)', transition: 'transform 220ms cubic-bezier(0.2,0.8,0.2,1)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <DSAvatar name="Jordan Reyes" initials="JR" size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, color: DSC.ink }}>Jordan Reyes</div>
                <div style={{ fontFamily: DSF.body, fontSize: 11, color: DSC.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"Climate fintech intro — 30 min?"</div>
              </div>
              <span style={{ fontFamily: DSF.mono, fontSize: 9, color: DSC.mute2, letterSpacing: '0.04em' }}>6d</span>
            </div>
          </div>
          {[
            { who: 'Iris Okonkwo', init: 'IO', text: '"Tue 4 pm works for coffee."', when: '2h' },
            { who: 'Dev Patel',    init: 'DP', text: "RSVP'd to Spring Supper",      when: '4h' },
            { who: 'Sam Aldridge', init: 'SA', text: 'mentioned you in #climate-vc', when: '1d' },
          ].map((r, i) => (
            <div key={i} style={{ padding: '12px 14px', borderTop: `1px solid ${DSC.ruleSoft}`, display: 'flex', alignItems: 'center', gap: 10, background: DSC.paper }}>
              <DSAvatar name={r.who} initials={r.init} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, color: DSC.ink }}>{r.who}</div>
                <div style={{ fontFamily: DSF.body, fontSize: 11, color: DSC.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.text}</div>
              </div>
              <span style={{ fontFamily: DSF.mono, fontSize: 9, color: DSC.mute2, letterSpacing: '0.04em' }}>{r.when}</span>
            </div>
          ))}
        </div>
      </Phone>

      <div>
        <div style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink2, lineHeight: 1.6, marginBottom: 14 }}>
          Slide any inbox row left to reveal Reply (green) + Skip (red). Color codes the intent so the user never confirms a destructive action by accident.
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['Max 2 actions', "Per side. More than that and it's a menu, not a swipe."],
            ['Reveal 56px each', 'Just enough room for icon + 1-word label.'],
            ['Destructive on far right', 'Reply (constructive) then Skip (destructive).'],
            ['Spring back', '220ms cubic-bezier(0.2,0.8,0.2,1)'],
          ].map(([k, v], i) => (
            <li key={i} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12, fontFamily: DSF.body, fontSize: 12, color: DSC.ink2 }}>
              <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.accent, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{k}</span>
              <span style={{ color: DSC.muted, lineHeight: 1.45 }}>{v}</span>
            </li>
          ))}
        </ul>
        <DSButton size="sm" variant="outline" style={{ marginTop: 14 }} onClick={() => setSwiped(s => !s)}>{swiped ? 'Reset row' : 'Swipe the row'}</DSButton>
      </div>
    </div>
  );
}

// ─── PULL TO REFRESH ───────────────────────────────────────────────────────

function PullToRefreshDemo() {
  const [pulling, setPulling] = React.useState(false);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, alignItems: 'center' }}>
      <Phone label="Drag-to-refresh">
        <div style={{ position: 'absolute', inset: '22px 0 0', overflow: 'hidden' }}>
          {pulling && (
            <div style={{ height: 56, background: DSC.cardAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderBottom: `1px solid ${DSC.rule}` }}>
              <Spinner color={DSC.accent} size={14} />
              <span style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.accent, fontWeight: 600 }}>Refreshing the wire…</span>
            </div>
          )}
          <div style={{ padding: '14px 14px 10px', fontFamily: DSF.display, fontSize: 22, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em' }}>On the wire</div>
          {[
            { who: 'Dev Patel',    text: 'joined the network' },
            { who: 'Sam Aldridge', text: 'updated their profile' },
            { who: 'Iris Okonkwo', text: 'opened a mentor thread' },
            { who: 'Maren Holt',   text: "RSVP'd to Spring Supper" },
          ].map((r, i) => (
            <div key={i} style={{ padding: '10px 14px', borderTop: `1px solid ${DSC.ruleSoft}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <DSAvatar name={r.who} initials={r.who.split(' ').map(s => s[0]).join('')} size={28} />
              <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.ink2 }}>
                <strong style={{ color: DSC.ink, fontWeight: 600 }}>{r.who.split(' ')[0]}</strong>{' '}{r.text}
              </div>
            </div>
          ))}
        </div>
      </Phone>

      <div>
        <div style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink2, lineHeight: 1.6, marginBottom: 14 }}>
          Drag down the top of any feed to refresh. The pull state inherits the Hartwood voice — never "Loading…" but "Refreshing the wire…".
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['Threshold 56px', 'Past which spring-back triggers the refresh.'],
            ['Spinner + brand copy', 'Use the in-voice strings from §33.'],
            ['56px tall slot', 'Pinned at top during refresh; collapses after ~1.2s.'],
            ['Confetti on milestone', 'On 100th day of the streak, etc. Otherwise quiet.'],
          ].map(([k, v], i) => (
            <li key={i} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12, fontFamily: DSF.body, fontSize: 12, color: DSC.ink2 }}>
              <span style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.accent, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{k}</span>
              <span style={{ color: DSC.muted, lineHeight: 1.45 }}>{v}</span>
            </li>
          ))}
        </ul>
        <DSButton size="sm" variant="outline" style={{ marginTop: 14 }} onClick={() => { setPulling(true); setTimeout(() => setPulling(false), 1600); }}>Pull to refresh</DSButton>
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ────────────────────────────────────────────────────────────

function BottomNavDemo() {
  const [active, setActive] = React.useState('home');
  const items = [
    { id: 'home',   label: 'Home',   icon: 'home' },
    { id: 'people', label: 'People', icon: 'people' },
    { id: 'inbox',  label: 'Inbox',  icon: 'inbox', badge: 3 },
    { id: 'events', label: 'Events', icon: 'calendar' },
    { id: 'me',     label: 'You',    icon: 'profile' },
  ];
  return (
    <VariantCard label="Bottom nav bar" note="Replaces top nav on small screens. Active = accent fill + label visible.">
      <Phone label="5-tab nav">
        <div style={{ position: 'absolute', inset: '22px 0 0' }}>
          <div style={{ padding: 14, fontFamily: DSF.display, fontSize: 22, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em' }}>{items.find(i => i.id === active)?.label}</div>
          <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: 6, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, boxShadow: '0 4px 14px rgba(42,34,26,0.10)' }}>
            {items.map(it => {
              const on = active === it.id;
              return (
                <button key={it.id} onClick={() => setActive(it.id)} style={{ padding: '8px 4px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, position: 'relative', color: on ? DSC.accent : DSC.muted }}>
                  <span style={{ position: 'relative' }}>
                    <Icon name={it.icon} size={20} color="currentColor" />
                    {it.badge && <span style={{ position: 'absolute', top: -4, right: -7, minWidth: 14, height: 14, borderRadius: 999, background: DSC.accent, color: '#fff', fontFamily: DSF.body, fontSize: 9, fontWeight: 700, padding: '0 4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${DSC.card}` }}>{it.badge}</span>}
                  </span>
                  <span style={{ fontFamily: DSF.body, fontSize: 9, fontWeight: 700, letterSpacing: '0.02em' }}>{it.label}</span>
                  {on && <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 20, height: 2, background: DSC.accent, borderRadius: 999 }} />}
                </button>
              );
            })}
          </div>
        </div>
      </Phone>
    </VariantCard>
  );
}

function ActionSheetDemo() {
  const [open, setOpen] = React.useState(true);
  return (
    <VariantCard label="Action sheet" note="Tap-and-hold pattern. Always include a destructive action separated.">
      <Phone label="Long-press a member row">
        <div style={{ position: 'absolute', inset: '22px 0 0', overflow: 'hidden' }}>
          <div style={{ padding: '14px', fontFamily: DSF.display, fontSize: 18, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em' }}>People</div>
          <div style={{ padding: '10px 14px', borderTop: `1px solid ${DSC.ruleSoft}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <DSAvatar name="Iris Okonkwo" initials="IO" size={32} />
            <div style={{ fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, color: DSC.ink }}>Iris Okonkwo</div>
          </div>
          {open && <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(42,34,26,0.40)' }} />}
          {open && (
            <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8 }}>
              <div style={{ background: DSC.card, borderRadius: 14, overflow: 'hidden', marginBottom: 6 }}>
                {[
                  { label: 'Send intro', icon: 'send' },
                  { label: 'Save to desk', icon: 'bookmark' },
                  { label: 'View profile', icon: 'profile' },
                  { label: 'Mute this thread', icon: 'bell', destructive: false },
                ].map((a, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 10, padding: '11px 14px', borderTop: i === 0 ? 'none' : `1px solid ${DSC.ruleSoft}`, alignItems: 'center', color: DSC.ink, fontFamily: DSF.body, fontSize: 12.5, fontWeight: 500 }}>
                    <Icon name={a.icon} size={15} color={DSC.muted} />
                    <span>{a.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: DSC.card, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '11px 14px', color: DSC.bad, fontFamily: DSF.body, fontSize: 13, fontWeight: 600, textAlign: 'center' }}>Hide this member</div>
              </div>
              <div style={{ background: DSC.cardAlt, borderRadius: 14, overflow: 'hidden', marginTop: 6 }}>
                <div onClick={() => setOpen(false)} style={{ padding: '11px 14px', color: DSC.ink, fontFamily: DSF.body, fontSize: 13, fontWeight: 600, textAlign: 'center' }}>Cancel</div>
              </div>
            </div>
          )}
        </div>
      </Phone>
    </VariantCard>
  );
}

window.MobilePatternsSection = MobilePatternsSection;
