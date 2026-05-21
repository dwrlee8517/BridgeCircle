/* eslint-disable */
// Atrium Design System — Component Cards · Tier 1 (Section 55)
// Render · JSX · Usage · Props · Status — for the 12 most-used atoms.

function ComponentCard({ name, status, summary, renderFn, jsx, usage, props }) {
  const [tab, setTab] = React.useState('render');
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)', marginBottom: 14 }}>
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${DSC.ruleSoft}`, background: DSC.cardAlt, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.01em' }}>{name}</span>
        {status && <StatusBadge kind={status} />}
        {summary && <span style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, lineHeight: 1.4 }}>{summary}</span>}
        <div style={{ marginLeft: 'auto', display: 'inline-flex', gap: 2, background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 999, padding: 2 }}>
          {['render', 'jsx', 'usage', ...(props ? ['props'] : [])].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '4px 11px', background: tab === t ? DSC.ink : 'transparent', color: tab === t ? DSC.paper : DSC.muted, border: 'none', borderRadius: 999, fontFamily: DSF.body, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{t === 'render' ? 'Render' : t === 'jsx' ? 'JSX' : t === 'usage' ? 'Usage' : 'Props'}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: tab === 'render' ? 22 : 14, minHeight: 110 }}>
        {tab === 'render' && renderFn()}
        {tab === 'jsx'    && <CCCode>{jsx}</CCCode>}
        {tab === 'usage'  && <CCCode>{usage}</CCCode>}
        {tab === 'props'  && <CCProps rows={props} />}
      </div>
    </div>
  );
}

function CCCode({ children, lang = 'jsx' }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => { navigator.clipboard?.writeText(children).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1200); };
  return (
    <div style={{ background: DSC.ink, color: '#f0e5d0', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: 'rgba(240,229,208,0.55)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>{lang}</span>
        <button onClick={copy} style={{ background: copied ? DSC.ok : 'rgba(255,255,255,0.08)', color: copied ? '#fff' : 'rgba(240,229,208,0.85)', border: 'none', borderRadius: 999, padding: '3px 10px', fontFamily: DSF.body, fontSize: 10.5, fontWeight: 600, cursor: 'pointer' }}>{copied ? '✓ Copied' : 'Copy'}</button>
      </div>
      <pre style={{ margin: 0, padding: '12px 14px', fontFamily: DSF.mono, fontSize: 11, lineHeight: 1.6, whiteSpace: 'pre', overflow: 'auto', maxHeight: 280 }}>{children}</pre>
    </div>
  );
}

function CCProps({ rows }) {
  return (
    <div style={{ background: DSC.cardAlt, border: `1px solid ${DSC.ruleSoft}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1.4fr 1fr 1.6fr', padding: '8px 14px', background: DSC.panel, fontFamily: DSF.mono, fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, fontWeight: 700 }}>
        <span>Prop</span><span>Type</span><span>Default</span><span>Description</span>
      </div>
      {rows.map((r, i) => (
        <div key={r.prop} style={{ display: 'grid', gridTemplateColumns: '130px 1.4fr 1fr 1.6fr', padding: '9px 14px', borderTop: i === 0 ? 'none' : `1px solid ${DSC.ruleSoft}`, alignItems: 'center', fontFamily: DSF.mono, fontSize: 11 }}>
          <span style={{ color: DSC.accent, fontWeight: 700 }}>{r.prop}{r.req && <span style={{ color: DSC.bad }}>*</span>}</span>
          <span style={{ color: DSC.ink2 }}>{r.type}</span>
          <span style={{ color: DSC.muted }}>{r.default || '—'}</span>
          <span style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, lineHeight: 1.4 }}>{r.desc}</span>
        </div>
      ))}
    </div>
  );
}

// ─── TIER 1 SECTION ───────────────────────────────────────────────────────

function ComponentCardsTier1Section() {
  return (
    <DSSection id="tier1" eyebrow="Code · 55" title="Component Reference · Tier 1">
      <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.6, maxWidth: 720, marginTop: -28, marginBottom: 28 }}>
        The 12 atoms developers reach for 50× per page. Each card carries a live render, JSX, usage examples, and a props table — ready to paste into a real codebase.
      </p>

      <ComponentCard
        name="Button" status="stable"
        summary="Primary action. 4 variants × 3 sizes."
        renderFn={() => (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <DSButton>Send intro</DSButton>
            <DSButton variant="outline">Reply</DSButton>
            <DSButton variant="ghost">Skip</DSButton>
            <DSButton variant="ink">Hold</DSButton>
            <DSButton size="sm" leadIcon={<Icon name="send" size={12} color="currentColor" />}>Small</DSButton>
            <DSButton disabled>Sent</DSButton>
          </div>
        )}
        jsx={`<Button variant="primary" size="md" leadIcon={<Icon name="send" />}>
  Send intro
</Button>`}
        usage={`// Variants
<Button variant="primary">Send intro</Button>
<Button variant="outline">Reply</Button>
<Button variant="ghost">Skip</Button>
<Button variant="ink">Hold</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Default</Button>
<Button size="lg">Large</Button>

// Disabled
<Button disabled>Sent</Button>

// As a link
<Button as="a" href="/profile/iris">Open profile</Button>

// Full-width
<Button style={{ width: '100%' }}>Open inbox →</Button>`}
        props={[
          { prop: 'variant', type: '"primary" | "outline" | "ghost" | "ink"', default: '"primary"', desc: 'Visual weight' },
          { prop: 'size',    type: '"sm" | "md" | "lg"',                       default: '"md"',       desc: 'Padding & font size' },
          { prop: 'leadIcon',type: 'ReactNode',                                 default: '—',          desc: 'Icon before label' },
          { prop: 'disabled',type: 'boolean',                                    default: 'false',      desc: 'Greys out & blocks click' },
          { prop: 'as',      type: '"button" | "a" | ElementType',              default: '"button"',   desc: 'Polymorphic render' },
          { prop: 'onClick', type: '(e) => void',                                default: '—',          desc: 'Click handler' },
        ]}
      />

      <ComponentCard
        name="Tag" status="stable"
        summary="Status / classification chip. 5 tones."
        renderFn={() => (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <DSTag tone="muted">Muted</DSTag>
            <DSTag tone="accent" dot>Open to mentor</DSTag>
            <DSTag tone="ok" dot>Active</DSTag>
            <DSTag tone="warn" dot>Waiting 6d</DSTag>
            <DSTag tone="bad" dot>Overdue</DSTag>
          </div>
        )}
        jsx={`<Tag tone="accent" dot>Open to mentor</Tag>`}
        usage={`<Tag tone="muted">'11 · Brooklyn</Tag>
<Tag tone="accent" dot>Open to mentor</Tag>
<Tag tone="ok" dot>Active thread</Tag>
<Tag tone="warn" dot>Waiting 6 days</Tag>
<Tag tone="bad" dot>Overdue</Tag>`}
        props={[
          { prop: 'tone',     type: '"muted" | "accent" | "ok" | "warn" | "bad"', default: '"muted"', desc: 'Semantic color' },
          { prop: 'dot',      type: 'boolean',                                     default: 'false',   desc: 'Show leading dot' },
          { prop: 'children', type: 'ReactNode', req: true, default: '—',                                 desc: 'Label content' },
        ]}
      />

      <ComponentCard
        name="Avatar" status="stable"
        summary="Gradient initials avatar, seeded from name."
        renderFn={() => (
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
            <DSAvatar name="Iris Okonkwo" initials="IO" size={20} />
            <DSAvatar name="Iris Okonkwo" initials="IO" size={28} />
            <DSAvatar name="Iris Okonkwo" initials="IO" size={40} />
            <DSAvatar name="Maren Holt"   initials="MH" size={56} />
            <DSAvatar name="Dev Patel"    initials="DP" size={72} />
          </div>
        )}
        jsx={`<Avatar name="Iris Okonkwo" initials="IO" size={44} />`}
        usage={`// Standard sizes
<Avatar name="Iris Okonkwo" initials="IO" size={28} /> {/* row */}
<Avatar name="Iris Okonkwo" initials="IO" size={40} /> {/* card */}
<Avatar name="Iris Okonkwo" initials="IO" size={72} /> {/* profile */}

// With status pip (see §22)
<StatusPipAvatar name="Iris" initials="IO" status="online" />

// Stacked
<AvatarStack people={[…]} size={32} total={12} />`}
        props={[
          { prop: 'name',     type: 'string', req: true, default: '—', desc: 'Used to seed the gradient' },
          { prop: 'initials', type: 'string', req: true, default: '—', desc: '1–2 letters shown' },
          { prop: 'size',     type: 'number', default: '44', desc: 'Pixel size' },
          { prop: 'accent',   type: 'string (hex)', default: 'theme.accent', desc: 'Override gradient hue' },
        ]}
      />

      <ComponentCard
        name="Icon" status="stable"
        summary="42 single-style icons. Inherits text color."
        renderFn={() => (
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', color: DSC.ink }}>
            <Icon name="home" size={20} />
            <Icon name="people" size={20} />
            <Icon name="inbox" size={20} />
            <Icon name="calendar" size={20} />
            <Icon name="message" size={20} />
            <Icon name="send" size={20} />
            <Icon name="bell" size={20} />
            <Icon name="heart" size={20} color={DSC.accent} />
            <Icon name="sparkle" size={20} color={DSC.accent} />
          </div>
        )}
        jsx={`<Icon name="home" size={20} />`}
        usage={`// Inline with text (inherits color)
<p style={{ color: muted }}>
  <Icon name="calendar" size={14} /> Tue 27 May
</p>

// In a button
<Button leadIcon={<Icon name="send" size={13} />}>Send intro</Button>

// Sized — never between 16 and 32
<Icon name="bell" size={16} />
<Icon name="bell" size={20} /> {/* default */}
<Icon name="bell" size={24} />`}
        props={[
          { prop: 'name',        type: 'string · 42 named icons', req: true, default: '—',            desc: 'See §28 Iconography' },
          { prop: 'size',        type: '16 | 20 | 24 | 28 | 32',            default: '20',           desc: 'Discrete sizes only' },
          { prop: 'color',       type: 'string',                             default: '"currentColor"', desc: 'Inherits text color' },
          { prop: 'strokeWidth', type: 'number',                             default: '1.8',          desc: 'Override only for emphasis' },
        ]}
      />

      <ComponentCard
        name="Eyebrow" status="stable"
        summary="Section label. Uppercase, mono-letterspaced."
        renderFn={() => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <DSEyebrow>Recent activity · 7 days</DSEyebrow>
            <DSEyebrow accent>On Deck · Class of '11</DSEyebrow>
          </div>
        )}
        jsx={`<Eyebrow accent>On Deck · Class of '11</Eyebrow>`}
        usage={`<Eyebrow>Recent activity · 7 days</Eyebrow>
<Eyebrow accent>On Deck · Class of '11</Eyebrow>`}
        props={[
          { prop: 'accent',   type: 'boolean',  default: 'false', desc: 'Adds accent dot prefix' },
          { prop: 'children', type: 'ReactNode', req: true, default: '—', desc: 'Label text' },
        ]}
      />

      <ComponentCard
        name="Input · Field" status="stable"
        summary="Pill or rounded-rect input with optional label, helper, and validation state."
        renderFn={() => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
            <div>
              <label style={{ fontFamily: DSF.body, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, display: 'block', marginBottom: 5 }}>City</label>
              <input defaultValue="Brooklyn" style={{ width: '100%', boxSizing: 'border-box', padding: '9px 14px', border: `1px solid ${DSC.rule}`, borderRadius: 999, fontFamily: DSF.body, fontSize: 13, background: DSC.card, outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontFamily: DSF.body, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, display: 'block', marginBottom: 5 }}>Bio</label>
              <textarea defaultValue="VP Investments · Common Capital. Climate underwriting." rows="2" style={{ width: '100%', boxSizing: 'border-box', padding: '9px 14px', border: `1.5px solid ${DSC.accent}`, borderRadius: 10, fontFamily: DSF.body, fontSize: 13, background: dshex(DSC.accent, 0.04), color: DSC.ink, outline: 'none', resize: 'vertical' }} />
              <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 5 }}>A line or two on what you're working on.</div>
            </div>
          </div>
        )}
        jsx={`<Field label="City" helper="Where you live now.">
  <Input value={city} onChange={setCity} placeholder="Brooklyn" />
</Field>`}
        usage={`// Standard
<Field label="City"><Input value={c} onChange={setC} /></Field>

// With helper
<Field label="Bio" helper="A line or two." optional>
  <Textarea rows={2} value={b} onChange={setB} />
</Field>

// Validation (see §31)
<Field label="Email" state="error" message="That email isn't right">
  <Input value={e} onChange={setE} />
</Field>`}
        props={[
          { prop: 'label',    type: 'string', default: '—', desc: 'Eyebrow-style label above input' },
          { prop: 'helper',   type: 'string', default: '—', desc: 'Body 12 below input' },
          { prop: 'optional', type: 'boolean', default: 'false', desc: 'Shows "(optional)" suffix' },
          { prop: 'state',    type: '"default" | "success" | "warning" | "error"', default: '"default"', desc: 'Field validation' },
          { prop: 'message',  type: 'string', default: '—', desc: 'Replaces helper in non-default states' },
        ]}
      />

      <ComponentCard
        name="Toggle" status="stable"
        summary="On/off switch. Animated knob with spring easing."
        renderFn={() => <ToggleLive />}
        jsx={`<Toggle checked={on} onChange={setOn} label="Helper mode" />`}
        usage={`<Toggle
  checked={helperOn}
  onChange={setHelperOn}
  label="Helper mode"
  description="Accepting mentor requests"
/>`}
        props={[
          { prop: 'checked',     type: 'boolean', req: true, default: '—', desc: 'Current state' },
          { prop: 'onChange',    type: '(next) => void', req: true, default: '—', desc: 'Fires with new value' },
          { prop: 'label',       type: 'string', default: '—', desc: 'Inline label' },
          { prop: 'description', type: 'string', default: '—', desc: 'Body 11.5 below label' },
          { prop: 'disabled',    type: 'boolean', default: 'false', desc: 'Greys out' },
        ]}
      />

      <ComponentCard
        name="Checkbox" status="stable"
        summary="Square check with check, indeterminate, and disabled states."
        renderFn={() => (
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <Checkbox checked={true}  onChange={() => {}} />
            <Checkbox checked={false} onChange={() => {}} />
            <Checkbox indeterminate    onChange={() => {}} />
            <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted }}>checked · empty · indeterminate</span>
          </div>
        )}
        jsx={`<Checkbox checked={c} onChange={setC} />`}
        usage={`// Single
<Checkbox checked={c} onChange={setC} />

// In a table header (select-all)
<Checkbox
  checked={allSelected}
  indeterminate={someSelected}
  onChange={toggleAll}
/>`}
        props={[
          { prop: 'checked',       type: 'boolean', req: true, default: '—',   desc: 'Current state' },
          { prop: 'indeterminate', type: 'boolean',           default: 'false', desc: 'Mixed state · ignores checked visually' },
          { prop: 'onChange',      type: '(next) => void', req: true, default: '—', desc: 'Fires on click' },
          { prop: 'disabled',      type: 'boolean',           default: 'false', desc: 'Greys out & blocks click' },
        ]}
      />

      <ComponentCard
        name="Tooltip" status="stable"
        summary="Text on hover/focus, with arrow tail. Auto-flips near edges."
        renderFn={() => (
          <div style={{ display: 'flex', gap: 28, alignItems: 'center', padding: '20px 0' }}>
            <SimpleTip text="Anchored top · default">
              <DSButton variant="outline">Hover me</DSButton>
            </SimpleTip>
            <SimpleTip text="Anchored right" placement="right">
              <DSButton variant="outline">→</DSButton>
            </SimpleTip>
            <SimpleTip text="Anchored bottom" placement="bottom">
              <DSButton variant="outline">↓</DSButton>
            </SimpleTip>
          </div>
        )}
        jsx={`<Tooltip text="Press ⌘K to open" placement="top">
  <IconButton><Icon name="search" /></IconButton>
</Tooltip>`}
        usage={`// Simple text
<Tooltip text="Settings"><Icon name="settings" /></Tooltip>

// Rich (with shortcut)
<Tooltip
  title="Helper mode"
  body="Accepting mentor requests"
  shortcut={['H']}
>
  <Button>Helper</Button>
</Tooltip>`}
        props={[
          { prop: 'text',      type: 'string',                              default: '—',     desc: 'Simple-tooltip body' },
          { prop: 'title',     type: 'string',                              default: '—',     desc: 'Rich-tooltip title' },
          { prop: 'body',      type: 'string',                              default: '—',     desc: 'Rich-tooltip secondary line' },
          { prop: 'shortcut',  type: 'string[]',                            default: '—',     desc: 'Renders kbd chips on right rail' },
          { prop: 'placement', type: '"top" | "bottom" | "left" | "right"', default: '"top"', desc: 'Initial anchor; auto-flips near edges' },
        ]}
      />

      <ComponentCard
        name="Tabs" status="stable"
        summary="Pill-style tab list with active fill."
        renderFn={() => <TabsLive />}
        jsx={`<Tabs value={tab} onChange={setTab}>
  <Tab id="mentor"  count={3}>Mentorship</Tab>
  <Tab id="friend"  count={1}>Friend requests</Tab>
  <Tab id="threads" count={4}>Active threads</Tab>
</Tabs>`}
        usage={`// Inbox tabs (see §11)
<Tabs value={tab} onChange={setTab}>
  <Tab id="mentor"  count={2}>Mentorship</Tab>
  <Tab id="threads" count={4}>Active threads</Tab>
</Tabs>

// Density-mode tabs
<Tabs value={d} onChange={setD} variant="dense">
  <Tab id="compact">Compact</Tab>
  <Tab id="comfortable">Comfortable</Tab>
  <Tab id="roomy">Roomy</Tab>
</Tabs>`}
        props={[
          { prop: 'value',    type: 'string', req: true, default: '—', desc: 'Active tab id' },
          { prop: 'onChange', type: '(id) => void', req: true, default: '—', desc: 'Fires on click / arrow-key' },
          { prop: 'variant',  type: '"default" | "dense"', default: '"default"', desc: 'Pill spacing' },
        ]}
      />

      <ComponentCard
        name="Modal · Sheet" status="stable"
        summary="Dialog or bottom sheet. Backdrop-blur, focus-trap, Esc to dismiss."
        renderFn={() => <ModalSheetLive />}
        jsx={`<Sheet open={open} onClose={close} title="Send intro to Iris">
  …form fields…
</Sheet>`}
        usage={`// Desktop modal
<Modal open={open} onClose={close} title="Confirm intro">
  <p>You're about to send Iris a 30-min request.</p>
  <Modal.Actions>
    <Button onClick={send}>Send</Button>
    <Button variant="ghost" onClick={close}>Cancel</Button>
  </Modal.Actions>
</Modal>

// Mobile bottom sheet (see §38)
<Sheet open={open} onClose={close} placement="bottom">
  <SheetHandle />
  …content…
</Sheet>`}
        props={[
          { prop: 'open',     type: 'boolean', req: true, default: '—', desc: 'Controls visibility' },
          { prop: 'onClose',  type: '() => void', req: true, default: '—', desc: 'Fires on backdrop click / Esc' },
          { prop: 'title',    type: 'string', default: '—', desc: 'Header label' },
          { prop: 'placement', type: '"center" | "bottom"', default: '"center"', desc: 'Mobile: prefer bottom' },
          { prop: 'size',     type: '"sm" | "md" | "lg"', default: '"md"', desc: 'Max-width preset' },
        ]}
      />

      <ComponentCard
        name="Toast" status="stable"
        summary="Bottom-anchored transient notification. Auto-dismisses after 5s."
        renderFn={() => <ToastLive />}
        jsx={`toast({ kind: 'success', message: 'Intro sent to Iris.' });`}
        usage={`// Imperative API
toast({ kind: 'success', message: 'Intro sent to Iris.' });
toast({ kind: 'info',    message: 'Iris just opened your message.' });
toast({
  kind: 'undo',
  message: 'Skipped Theo Harrington.',
  action: { label: 'Undo', onClick: undoSkip },
});

// As a component
<Toast kind="success">All caught up.</Toast>`}
        props={[
          { prop: 'kind',     type: '"success" | "info" | "undo" | "error"', default: '"info"', desc: 'Status dot color' },
          { prop: 'message',  type: 'string', req: true, default: '—', desc: 'Body line' },
          { prop: 'action',   type: '{ label, onClick }', default: '—', desc: 'Optional right-side button' },
          { prop: 'duration', type: 'number (ms)', default: '5000', desc: '0 = persist until dismissed' },
        ]}
      />

    </DSSection>
  );
}

// ─── INTERACTIVE INNER COMPONENTS ─────────────────────────────────────────

function ToggleLive() {
  const [on, setOn] = React.useState(true);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <button onClick={() => setOn(v => !v)} style={{ width: 34, height: 20, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 999, background: on ? DSC.accent : DSC.rule, position: 'relative' }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 16 : 2, width: 16, height: 16, borderRadius: 999, background: '#fff', transition: 'left 140ms cubic-bezier(.2,.8,.2,1)', boxShadow: '0 1px 2px rgba(42,34,26,0.20)' }} />
      </button>
      <div>
        <div style={{ fontFamily: DSF.body, fontSize: 13, fontWeight: 600, color: DSC.ink }}>Helper mode</div>
        <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 2 }}>{on ? 'On · accepting mentor requests' : 'Paused · no new requests'}</div>
      </div>
    </div>
  );
}

function TabsLive() {
  const [tab, setTab] = React.useState('mentor');
  const items = [{ id: 'mentor', label: 'Mentorship', n: 2 }, { id: 'friend', label: 'Friend requests', n: 1 }, { id: 'threads', label: 'Active threads', n: 4 }];
  return (
    <div style={{ display: 'flex', gap: 8, padding: 4, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 999, width: 'fit-content' }}>
      {items.map(t => {
        const on = tab === t.id;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: on ? DSC.ink : 'transparent', color: on ? DSC.paper : DSC.muted, border: 'none', padding: '7px 14px', borderRadius: 999, fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            {t.label}
            <span style={{ background: on ? dshex(DSC.paper, 0.18) : DSC.paper, color: on ? DSC.paper : DSC.muted, fontSize: 10, padding: '0 6px', minWidth: 16, height: 16, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{t.n}</span>
          </button>
        );
      })}
    </div>
  );
}

function ModalSheetLive() {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <DSButton size="sm" onClick={() => setOpen(true)}>Open sheet</DSButton>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(42,34,26,0.40)', backdropFilter: 'blur(2px)', borderRadius: 14 }} />
          <div style={{ position: 'absolute', left: 22, right: 22, bottom: 16, background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '14px 18px', boxShadow: '0 -8px 24px rgba(42,34,26,0.20)' }}>
            <div style={{ width: 36, height: 4, background: DSC.rule, borderRadius: 999, margin: '0 auto 12px' }} />
            <div style={{ fontFamily: DSF.display, fontSize: 14, fontWeight: 600, color: DSC.ink }}>Send intro to Iris</div>
            <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 4 }}>Pick a time that works.</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <DSButton size="sm" onClick={() => setOpen(false)} style={{ flex: 1 }}>Send</DSButton>
              <DSButton size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</DSButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ToastLive() {
  const [toasts, setToasts] = React.useState([]);
  const spawn = (kind) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-1), { id, kind }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };
  const cfg = {
    success: { dot: DSC.ok,     msg: 'Intro sent to Iris.' },
    info:    { dot: DSC.accent, msg: 'Iris just opened your message.' },
    undo:    { dot: DSC.warn,   msg: 'Skipped Theo Harrington.', action: 'Undo' },
  };
  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        <DSButton size="sm" onClick={() => spawn('success')}>Success</DSButton>
        <DSButton size="sm" variant="outline" onClick={() => spawn('info')}>Info</DSButton>
        <DSButton size="sm" variant="outline" onClick={() => spawn('undo')}>Undo</DSButton>
      </div>
      <div style={{ position: 'relative', minHeight: 70, marginTop: 12 }}>
        {toasts.map((t, i) => {
          const k = cfg[t.kind];
          return (
            <div key={t.id} style={{ background: DSC.ink, color: DSC.paper, padding: '10px 14px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 30px rgba(42,34,26,0.32)', position: 'absolute', left: 0, right: 0, bottom: i * 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: k.dot }} />
              <span style={{ fontFamily: DSF.body, fontSize: 12.5, flex: 1 }}>{k.msg}</span>
              {k.action && <span style={{ fontFamily: DSF.body, fontSize: 11.5, fontWeight: 700, color: DSC.accent, filter: 'brightness(1.35)' }}>{k.action}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.ComponentCard               = ComponentCard;
window.CCCode                      = CCCode;
window.CCProps                     = CCProps;
window.ComponentCardsTier1Section  = ComponentCardsTier1Section;
