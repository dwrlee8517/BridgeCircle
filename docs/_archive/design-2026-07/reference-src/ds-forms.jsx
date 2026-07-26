/* eslint-disable */
// Atrium Design System — Forms (Section 31)
// Date picker, time picker, file upload, validation states, multi-step wizard.

function FormsSection() {
  return (
    <DSSection id="forms" eyebrow="Components · 31" title="Forms — pickers, validation, wizards">

      <DSSub title="Date picker — month grid with today + selected states">
        <DatePickerDemo />
      </DSSub>

      <DSSub title="Time picker — bookable 15-minute slots">
        <TimePickerDemo />
      </DSSub>

      <DSSub title="File upload — drop a portrait, see it appear">
        <FileUploadDemo />
      </DSSub>

      <DSSub title="Validation states — field-level error / warning / success">
        <ValidationStatesDemo />
      </DSSub>

      <DSSub title="Multi-step wizard — the onboarding pattern">
        <WizardDemo />
      </DSSub>

    </DSSection>
  );
}

// ─── DATE PICKER ───────────────────────────────────────────────────────────

function DatePickerDemo() {
  const today = new Date(2026, 4, 19); // May 19, 2026 — fixed for predictable demo
  const [view, setView] = React.useState(new Date(2026, 4, 1));
  const [selected, setSelected] = React.useState(new Date(2026, 4, 27));

  const monthName = view.toLocaleString('en-US', { month: 'long' });
  const year = view.getFullYear();
  const firstDay = new Date(view.getFullYear(), view.getMonth(), 1);
  const lastDay = new Date(view.getFullYear(), view.getMonth() + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday-first
  const daysInMonth = lastDay.getDate();
  // Build 6×7 grid
  const cells = [];
  for (let i = 0; i < startOffset; i++) {
    const d = new Date(view.getFullYear(), view.getMonth(), -startOffset + i + 1);
    cells.push({ date: d, outside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(view.getFullYear(), view.getMonth(), d), outside: false });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last); next.setDate(last.getDate() + 1);
    cells.push({ date: next, outside: true });
  }

  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  const isPast  = (d) => d < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const prev = () => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1));
  const next = () => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, alignItems: 'flex-start' }}>
      <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: '18px 18px 14px', maxWidth: 360, boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button onClick={prev} aria-label="Previous month" style={{ width: 28, height: 28, borderRadius: 999, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, cursor: 'pointer', display: 'grid', placeItems: 'center', color: DSC.muted }}>
            <Icon name="chevron-left" size={13} color="currentColor" />
          </button>
          <div style={{ fontFamily: DSF.display, fontSize: 16, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em' }}>{monthName} <span style={{ color: DSC.muted, fontWeight: 500 }}>{year}</span></div>
          <button onClick={next} aria-label="Next month" style={{ width: 28, height: 28, borderRadius: 999, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, cursor: 'pointer', display: 'grid', placeItems: 'center', color: DSC.muted }}>
            <Icon name="chevron-right" size={13} color="currentColor" />
          </button>
        </div>
        {/* Day-of-week labels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontFamily: DSF.mono, fontSize: 9.5, color: DSC.mute2, letterSpacing: '0.10em', fontWeight: 700, paddingBottom: 4 }}>{d}</div>
          ))}
        </div>
        {/* Date grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {cells.map((c, i) => {
            const isToday    = sameDay(c.date, today);
            const isSelected = sameDay(c.date, selected);
            const past       = isPast(c.date);
            return (
              <button key={i} onClick={() => !past && !c.outside && setSelected(c.date)} disabled={past || c.outside} style={{
                aspectRatio: '1 / 1',
                background: isSelected ? DSC.accent : (isToday ? dshex(DSC.accent, 0.10) : 'transparent'),
                color: isSelected ? '#fff' : (past || c.outside ? DSC.mute2 : (isToday ? DSC.accent : DSC.ink)),
                border: isToday && !isSelected ? `1.5px solid ${DSC.accent}` : `1px solid transparent`,
                borderRadius: 8,
                fontFamily: DSF.body, fontSize: 12.5,
                fontWeight: isSelected || isToday ? 700 : (c.outside ? 400 : 500),
                cursor: past || c.outside ? 'default' : 'pointer',
                opacity: c.outside ? 0.35 : 1,
                fontVariantNumeric: 'tabular-nums',
                transition: 'background 100ms ease',
              }}
              onMouseEnter={e => { if (!past && !c.outside && !isSelected) e.currentTarget.style.background = DSC.cardAlt; }}
              onMouseLeave={e => { if (!past && !c.outside && !isSelected) e.currentTarget.style.background = isToday ? dshex(DSC.accent, 0.10) : 'transparent'; }}>
                {c.date.getDate()}
              </button>
            );
          })}
        </div>
        {/* Footer */}
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${DSC.ruleSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: DSF.body, fontSize: 12, color: DSC.muted }}>
          <button onClick={() => { setView(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(today); }} style={{ background: 'none', border: 'none', color: DSC.accent, fontFamily: DSF.body, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Today →</button>
          <span>{selected.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* States legend */}
      <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: '16px 18px', minWidth: 200 }}>
        <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>States</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { swatch: { background: 'transparent', color: DSC.ink },                            label: 'Available' },
            { swatch: { background: dshex(DSC.accent, 0.10), color: DSC.accent, border: `1.5px solid ${DSC.accent}` }, label: 'Today' },
            { swatch: { background: DSC.accent, color: '#fff' },                                label: 'Selected' },
            { swatch: { background: 'transparent', color: DSC.mute2 },                          label: 'Past · disabled' },
            { swatch: { background: 'transparent', color: DSC.mute2, opacity: 0.35 },           label: 'Outside month' },
          ].map((s, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 28, height: 28, borderRadius: 6, display: 'grid', placeItems: 'center', fontFamily: DSF.body, fontSize: 11, fontWeight: 600, flexShrink: 0, ...s.swatch }}>{15 + i}</span>
              <span style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.ink2 }}>{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── TIME PICKER ───────────────────────────────────────────────────────────

function TimePickerDemo() {
  const slots = [
    { time: '9:00',  taken: false }, { time: '9:15',  taken: true, by: 'Theo' },
    { time: '9:30',  taken: false }, { time: '9:45',  taken: false },
    { time: '10:00', taken: false }, { time: '10:15', taken: true, by: 'Rosa' },
    { time: '10:30', taken: false }, { time: '10:45', taken: false },
    { time: '14:00', taken: false }, { time: '14:15', taken: false },
    { time: '14:30', taken: true, by: 'Dev' },  { time: '14:45', taken: false },
    { time: '15:00', taken: false }, { time: '15:15', taken: false },
    { time: '15:30', taken: false }, { time: '15:45', taken: false },
  ];
  const [picked, setPicked] = React.useState('10:00');

  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
        <div>
          <DSEyebrow accent>Tuesday · 27 May</DSEyebrow>
          <div style={{ fontFamily: DSF.display, fontSize: 17, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em', marginTop: 4 }}>Iris's office hours</div>
        </div>
        <div style={{ fontFamily: DSF.mono, fontSize: 10.5, color: DSC.muted, letterSpacing: '0.06em' }}>15-min slots</div>
      </div>

      {/* Morning */}
      <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Morning</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 14 }}>
        {slots.slice(0, 8).map(s => <SlotButton key={s.time} slot={s} picked={picked} setPicked={setPicked} />)}
      </div>
      {/* Afternoon */}
      <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Afternoon</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {slots.slice(8).map(s => <SlotButton key={s.time} slot={s} picked={picked} setPicked={setPicked} />)}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: `1px solid ${DSC.ruleSoft}` }}>
        <div style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted }}>
          {picked ? <>Selected: <strong style={{ color: DSC.ink, fontWeight: 700 }}>{picked}–{addMinutes(picked, 15)}</strong></> : 'Pick a slot above'}
        </div>
        <DSButton size="sm" disabled={!picked} leadIcon={<Icon name="check" size={13} color="currentColor" />}>Book this slot</DSButton>
      </div>
    </div>
  );
}

function SlotButton({ slot, picked, setPicked }) {
  const isPicked = picked === slot.time;
  return (
    <button onClick={() => !slot.taken && setPicked(slot.time)} disabled={slot.taken} style={{
      padding: '9px 8px',
      background: isPicked ? DSC.ink : (slot.taken ? 'transparent' : DSC.cardAlt),
      color: isPicked ? DSC.paper : (slot.taken ? DSC.mute2 : DSC.ink),
      border: `1px solid ${isPicked ? DSC.ink : (slot.taken ? DSC.rule : DSC.rule)}`,
      borderStyle: slot.taken ? 'dashed' : 'solid',
      borderRadius: 8,
      cursor: slot.taken ? 'default' : 'pointer',
      fontFamily: DSF.mono, fontSize: 11.5, fontWeight: 700,
      letterSpacing: '0.04em',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      transition: 'all 120ms ease',
    }}>
      <span>{slot.time}</span>
      {slot.taken && <span style={{ fontFamily: DSF.body, fontSize: 9, color: DSC.mute2, letterSpacing: 0, fontWeight: 500 }}>{slot.by}</span>}
    </button>
  );
}

function addMinutes(time, mins) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// ─── FILE UPLOAD ───────────────────────────────────────────────────────────

function FileUploadDemo() {
  const [state, setState] = React.useState('idle'); // idle | hover | uploading | done
  const [progress, setProgress] = React.useState(0);

  const start = () => {
    setState('uploading'); setProgress(0);
    let p = 0;
    const id = setInterval(() => {
      p += 8 + Math.random() * 14;
      if (p >= 100) { p = 100; clearInterval(id); setState('done'); }
      setProgress(p);
    }, 120);
  };

  const reset = () => { setState('idle'); setProgress(0); };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Idle / drop zone */}
        <div onMouseEnter={() => state === 'idle' && setState('hover')} onMouseLeave={() => state === 'hover' && setState('idle')} style={{
          background: state === 'hover' ? dshex(DSC.accent, 0.06) : DSC.cardAlt,
          border: `2px dashed ${state === 'hover' ? DSC.accent : DSC.muted}`,
          borderRadius: 14,
          padding: '32px 22px',
          textAlign: 'center',
          cursor: state === 'idle' || state === 'hover' ? 'pointer' : 'default',
          transition: 'all 140ms ease',
          minHeight: 200,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
        }} onClick={() => (state === 'idle' || state === 'hover') && start()}>
          {state === 'idle' || state === 'hover' ? (
            <>
              <div style={{ width: 56, height: 56, borderRadius: 999, background: state === 'hover' ? DSC.accent : dshex(DSC.ink, 0.06), color: state === 'hover' ? '#fff' : DSC.muted, display: 'grid', placeItems: 'center', transition: 'all 140ms ease' }}>
                <Icon name="image" size={26} color="currentColor" />
              </div>
              <div style={{ fontFamily: DSF.display, fontSize: 15, fontWeight: 600, color: DSC.ink, marginTop: 4 }}>
                {state === 'hover' ? 'Release to upload' : 'Drop a portrait'}
              </div>
              <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, lineHeight: 1.45 }}>
                or <strong style={{ color: DSC.accent, fontWeight: 700 }}>click to browse</strong> · JPG, PNG, WEBP up to 4 MB
              </div>
            </>
          ) : state === 'uploading' ? (
            <UploadingState progress={progress} onCancel={reset} />
          ) : (
            <UploadedState onReplace={reset} />
          )}
        </div>

        {/* Existing portrait state */}
        <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DSEyebrow>Current portrait</DSEyebrow>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <DSAvatar name="Maren Holt" initials="MH" size={64} />
              <span style={{ position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 999, background: DSC.ok, border: `3px solid ${DSC.card}`, display: 'grid', placeItems: 'center', color: '#fff' }}>
                <Icon name="check" size={11} color="currentColor" strokeWidth={3.2} />
              </span>
            </div>
            <div>
              <div style={{ fontFamily: DSF.body, fontSize: 13, fontWeight: 600, color: DSC.ink }}>maren-portrait-2026.jpg</div>
              <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, marginTop: 2 }}>2.4 MB · uploaded 18 May 2026</div>
              <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.mute2, marginTop: 4, letterSpacing: '0.04em' }}>1024 × 1024 · 1:1</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            <DSButton size="sm" variant="outline" leadIcon={<Icon name="edit" size={12} color="currentColor" />}>Replace</DSButton>
            <DSButton size="sm" variant="ghost" style={{ color: DSC.bad }} leadIcon={<Icon name="trash" size={12} color="currentColor" />}>Remove</DSButton>
          </div>
        </div>
      </div>

      {/* Replay button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <DSButton size="sm" variant="outline" onClick={() => state === 'done' ? reset() : start()}>
          {state === 'idle' || state === 'hover' ? 'Simulate upload' : state === 'uploading' ? 'Uploading…' : 'Reset'}
        </DSButton>
      </div>
    </div>
  );
}

function UploadingState({ progress, onCancel }) {
  return (
    <div style={{ width: '100%', maxWidth: 280 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Spinner color={DSC.accent} size={16} />
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div style={{ fontFamily: DSF.body, fontSize: 13, fontWeight: 600, color: DSC.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>portrait-march-2026.jpg</div>
          <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.04em', marginTop: 2 }}>3.1 MB · {Math.round(progress)}%</div>
        </div>
        <button onClick={onCancel} aria-label="Cancel" style={{ background: 'none', border: 'none', cursor: 'pointer', color: DSC.muted, padding: 4 }}>
          <Icon name="close" size={14} color="currentColor" />
        </button>
      </div>
      <div style={{ background: DSC.rule, borderRadius: 999, height: 6, overflow: 'hidden' }}>
        <div style={{ background: DSC.accent, height: '100%', width: `${progress}%`, borderRadius: 999, transition: 'width 120ms ease' }} />
      </div>
    </div>
  );
}

function UploadedState({ onReplace }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 56, height: 56, borderRadius: 999, background: DSC.ok, color: '#fff', display: 'grid', placeItems: 'center' }}>
        <Icon name="check" size={26} color="currentColor" strokeWidth={2.8} />
      </div>
      <div style={{ fontFamily: DSF.display, fontSize: 15, fontWeight: 700, color: DSC.ink }}>Uploaded</div>
      <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted }}>portrait-march-2026.jpg · 3.1 MB</div>
      <button onClick={onReplace} style={{ background: 'none', border: 'none', color: DSC.accent, fontFamily: DSF.body, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 0', borderBottom: `1px dashed ${dshex(DSC.accent, 0.5)}`, marginTop: 4 }}>Replace</button>
    </div>
  );
}

// ─── VALIDATION STATES ─────────────────────────────────────────────────────

function ValidationStatesDemo() {
  const fields = [
    { state: 'default', label: 'Cohort year',     value: '2014',                      message: "We'll show this on your card." },
    { state: 'success', label: 'Email',           value: 'maren@hartwood.org',        message: 'Looks good · we sent a verification link.' },
    { state: 'warning', label: 'Display name',    value: 'Maren H',                   message: 'A full first + last name reads better in the directory.' },
    { state: 'error',   label: 'Mentor capacity', value: '40h',                       message: "That's a lot — we cap at 8h/month so you can keep your promises." },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      {fields.map((f, i) => <ValidatedField key={i} {...f} />)}
    </div>
  );
}

function ValidatedField({ state, label, value, message }) {
  const config = {
    default: { color: DSC.muted,  iconName: null,        borderColor: DSC.rule,                   bg: DSC.card,                       eyebrowColor: DSC.muted },
    success: { color: DSC.ok,     iconName: 'check',     borderColor: dshex(DSC.ok, 0.50),         bg: dshex(DSC.ok, 0.04),            eyebrowColor: DSC.ok },
    warning: { color: DSC.warn,   iconName: 'bell',      borderColor: dshex(DSC.warn, 0.50),       bg: dshex(DSC.warn, 0.04),          eyebrowColor: DSC.warn },
    error:   { color: DSC.bad,    iconName: 'close',     borderColor: dshex(DSC.bad, 0.50),        bg: dshex(DSC.bad, 0.04),           eyebrowColor: DSC.bad },
  };
  const c = config[state];
  const [v, setV] = React.useState(value);

  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <label style={{ fontFamily: DSF.body, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted }}>{label}</label>
        <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: c.eyebrowColor, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>{state}</span>
      </div>
      <div style={{ position: 'relative' }}>
        <input value={v} onChange={e => setV(e.target.value)} style={{
          width: '100%', boxSizing: 'border-box',
          padding: '10px 38px 10px 14px',
          background: c.bg,
          border: `1.5px solid ${c.borderColor}`,
          borderRadius: 10,
          fontFamily: DSF.body, fontSize: 13.5, color: DSC.ink,
          outline: 'none',
        }} />
        {c.iconName && (
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, borderRadius: 999, background: c.color, color: '#fff', display: 'grid', placeItems: 'center' }}>
            <Icon name={c.iconName} size={11} color="currentColor" strokeWidth={2.6} />
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 7 }}>
        {state !== 'default' && (
          <span style={{ color: c.color, display: 'inline-flex', alignItems: 'center', flexShrink: 0, marginTop: 1 }}>
            <Icon name={c.iconName} size={11} color="currentColor" strokeWidth={2.4} />
          </span>
        )}
        <div style={{ fontFamily: DSF.body, fontSize: 12, color: state === 'default' ? DSC.muted : c.color, lineHeight: 1.45 }}>{message}</div>
      </div>
    </div>
  );
}

// ─── MULTI-STEP WIZARD ─────────────────────────────────────────────────────

function WizardDemo() {
  const steps = [
    { label: 'Welcome',   sub: 'Why you joined' },
    { label: 'Cohort',    sub: 'Class & arrival' },
    { label: 'Anchors',   sub: 'Who vouches' },
    { label: 'Profile',   sub: 'Your face & focus' },
  ];
  const [step, setStep] = React.useState(1);
  const total = steps.length;

  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 18, padding: '22px 24px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
      {/* Stepper rail */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', marginBottom: 22 }}>
        <div style={{ position: 'absolute', top: 14, left: '7%', right: '7%', height: 2, background: DSC.rule }} />
        <div style={{ position: 'absolute', top: 14, left: '7%', width: `${(step / (total - 1)) * 86}%`, height: 2, background: DSC.accent, transition: 'width 280ms cubic-bezier(0.2,0.8,0.2,1)' }} />
        {steps.map((s, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <button key={i} onClick={() => setStep(i)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative', flex: 1, textAlign: 'center' }}>
              <div style={{
                width: 30, height: 30, borderRadius: 999,
                background: done ? DSC.accent : DSC.card,
                border: `2px solid ${done || current ? DSC.accent : DSC.rule}`,
                boxShadow: current ? `0 0 0 4px ${dshex(DSC.accent, 0.15)}` : 'none',
                display: 'grid', placeItems: 'center',
                color: done ? '#fff' : (current ? DSC.accent : DSC.mute2),
                fontFamily: DSF.body, fontSize: 12, fontWeight: 700,
                transition: 'all 200ms cubic-bezier(0.2,0.8,0.2,1)',
              }}>
                {done ? <Icon name="check" size={13} color="currentColor" strokeWidth={3.2} /> : (i + 1)}
              </div>
              <div>
                <div style={{ fontFamily: DSF.body, fontSize: 12.5, fontWeight: 600, color: done || current ? DSC.ink : DSC.mute2 }}>{s.label}</div>
                <div style={{ fontFamily: DSF.body, fontSize: 11, color: current ? DSC.ink2 : DSC.mute2, marginTop: 2, lineHeight: 1.35 }}>{s.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Step content placeholder */}
      <div style={{ padding: '24px 24px 20px', background: DSC.cardAlt, borderRadius: 12, border: `1px solid ${DSC.ruleSoft}`, minHeight: 200 }}>
        <DSEyebrow accent>Step {step + 1} of {total} · {steps[step].label}</DSEyebrow>
        <h3 style={{ fontFamily: DSF.display, fontSize: 22, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.025em', margin: '10px 0 6px', lineHeight: 1.1 }}>
          {[
            "Tell us why you're here.",
            "When did you join the circle?",
            "Two members must vouch for you.",
            "Add a portrait and a current focus.",
          ][step]}
        </h3>
        <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.muted, lineHeight: 1.55, margin: 0, maxWidth: 440 }}>
          {[
            "Two sentences. We share this with the people who vouch for you, not the directory.",
            "We use this to surface cohort spotlights, anniversary cards, and class-of dinners.",
            "Anchors confirm you're real. Two existing members must say 'yes' before you're in.",
            "A current focus matters more than a job title. What are you actively making sense of?",
          ][step]}
        </p>
      </div>

      {/* Footer actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} style={{ background: 'none', border: 'none', color: step === 0 ? DSC.mute2 : DSC.muted, fontFamily: DSF.body, fontSize: 13, fontWeight: 600, cursor: step === 0 ? 'default' : 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon name="chevron-left" size={13} color="currentColor" /> Back
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.06em' }}>{step + 1} / {total}</span>
          <DSButton size="sm" onClick={() => setStep(s => Math.min(total - 1, s + 1))} disabled={step === total - 1}>
            {step === total - 1 ? 'Done — welcome' : 'Continue →'}
          </DSButton>
        </div>
      </div>
    </div>
  );
}

window.FormsSection = FormsSection;
