/* eslint-disable */
// Thread screen — the working space after a mentorship request is accepted.
// Adapted from the Atrium thread screen; uses Civic primitives throughout.

function CivicAskThread() {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  const { activeThread, setActiveThread, goto } = useRoute();
  const { THREADS, MEMBERS, VIEWER } = window.BC_DATA;
  const thread  = THREADS.find(x => x.id === activeThread) || THREADS[0];
  const other   = MEMBERS.find(mm => mm.id === thread.withMember);

  const [draft, setDraft] = React.useState('');
  const [localMessages, setLocalMessages] = React.useState([]);
  const allMessages = [...thread.messages, ...localMessages];

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setLocalMessages(prev => [...prev, { from: VIEWER.id, at: 'Just now', body: text }]);
    setDraft('');
  };

  return (
    <section style={{ padding: m ? '18px 14px 40px' : '24px 32px 56px', maxWidth: 1280, margin: '0 auto' }}>

      {/* Breadcrumb + switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <button onClick={() => goto('inbox')} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: t.palette.muted, fontFamily: t.font.mono, fontSize: 10.5,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          padding: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          ← Back to Inbox
        </button>
        <CivicThreadSwitcher threads={THREADS} activeId={thread.id} onPick={(id) => setActiveThread(id)} />
      </div>

      {/* Thread header card */}
      <div style={t.cardSurface({ padding: m ? '16px 16px' : '22px 28px', display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr auto', gap: m ? 12 : 18, alignItems: 'center', marginBottom: 20 })}>
        <div style={{ display: 'flex', alignItems: 'center', gap: m ? 12 : 18, minWidth: 0 }}>
          <CivicAvatarPair viewer={VIEWER} other={other} />
          <div style={{ minWidth: 0 }}>
            <Eyebrow color={t.palette.muted}>Mentorship thread · started {thread.startedAt}</Eyebrow>
            <h1 style={{ ...t.display, fontSize: m ? 20 : 28, margin: '6px 0 4px', fontWeight: 600 }}>{thread.title}</h1>
            <div style={{ fontSize: 13.5, color: t.palette.muted }}>
              You and{' '}
              <button onClick={() => goto('profile')} style={{
                background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                color: t.palette.ink2, fontWeight: 600, fontFamily: t.font.body, fontSize: 13.5,
              }}>{other.name}</button>
              {' '}· {other.title} at {other.employer}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          <CivicButton size="sm" variant="outline" style={{ flex: m ? 1 : 'initial', justifyContent: 'center' }}>Schedule a call</CivicButton>
          <CivicButton size="sm" variant="ghost" style={{ flex: m ? 1 : 'initial', justifyContent: 'center' }}>Settings</CivicButton>
        </div>
      </div>

      {/* Body — messages + sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 308px', gap: m ? 14 : 20 }}>

        {/* Message pane */}
        <div style={t.cardSurface({ padding: 0, display: 'flex', flexDirection: 'column', minHeight: m ? 480 : 560 })}>
          <div style={{ flex: 1, padding: m ? '18px 16px' : '22px 24px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
            <CivicDayStamp label="May 18, 2026 · Monday" />
            {allMessages.map((msg, i) => {
              const mine   = msg.from === VIEWER.id;
              const sender = mine ? VIEWER : (MEMBERS.find(mm => mm.id === msg.from) || other);
              return <CivicBubble key={i} msg={msg} mine={mine} sender={sender} />;
            })}
          </div>

          {/* Composer */}
          <div style={{
            borderTop: `1px solid ${t.palette.rule}`,
            padding: m ? '12px 14px 14px' : '14px 18px 18px',
            background: t.palette.panel,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <textarea
              value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
              placeholder={`Write back to ${other.name.split(' ')[0]}… (⌘↵ to send)`}
              rows={3}
              style={{
                resize: 'vertical', width: '100%', boxSizing: 'border-box',
                border: `1px solid ${t.palette.rule}`, borderRadius: 2,
                padding: '12px 14px', background: t.palette.card,
                fontFamily: t.font.body, fontSize: 14, color: t.palette.ink,
                lineHeight: 1.55, outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div className="civic-hscroll" style={{ display: 'flex', gap: 6 }}>
                <CivicComposerChip label="Attach" />
                <CivicComposerChip label="Insert calendar" />
                <CivicComposerChip label="Share contact" />
              </div>
              <CivicButton onClick={send} size="md">Send</CivicButton>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <CivicNextMeetingCard next={thread.next} other={other} />
          <CivicThreadSummaryCard thread={thread} />
          {!m && <CivicSharedFilesCard messages={allMessages} />}
          {!m && <CivicOtherMemberCard other={other} onOpen={() => goto('profile')} />}
        </aside>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Thread switcher — dropdown to flip between active threads
// ---------------------------------------------------------------------------

function CivicThreadSwitcher({ threads, activeId, onPick }) {
  const t = React.useContext(ThemeCtx);
  const [open, setOpen] = React.useState(false);
  const active = threads.find(th => th.id === activeId) || threads[0];
  const other  = window.BC_DATA.MEMBERS.find(m => m.id === active.withMember);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: t.palette.card, border: `1px solid ${t.palette.rule}`,
        borderRadius: 2, padding: '7px 12px',
        fontFamily: t.font.body, fontSize: 12.5, color: t.palette.ink, fontWeight: 500,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.mute2, letterSpacing: '0.14em' }}>THREAD</span>
        <span>{other.name.split(' ')[0]} · {active.title}</span>
        <span style={{ color: t.palette.mute2 }}>▾</span>
      </button>
      {open ? (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 10,
          background: t.palette.card, border: `1px solid ${t.palette.rule}`,
          borderRadius: 2, padding: 4, minWidth: 280,
          boxShadow: '0 12px 32px rgba(14,14,13,0.10)',
        }}>
          {threads.map(th => {
            const o = window.BC_DATA.MEMBERS.find(m => m.id === th.withMember);
            const isActive = th.id === activeId;
            return (
              <button key={th.id} onClick={() => { onPick(th.id); setOpen(false); }}
                style={{
                  width: '100%', textAlign: 'left',
                  background: isActive ? t.palette.panel : 'transparent',
                  border: 'none', cursor: 'pointer', padding: '8px 10px',
                  borderRadius: 2, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2,
                }}>
                <CivicAvatar name={o.name} initials={o.initials} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.palette.ink }}>{o.name}</div>
                  <div style={{ fontSize: 11.5, color: t.palette.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{th.title}</div>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CivicAvatarPair({ viewer, other }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div style={{ position: 'relative', width: 66, height: 52, flexShrink: 0 }}>
      <div style={{ position: 'absolute', left: 0, top: 4 }}>
        <CivicAvatar name={other.name} initials={other.initials} size={44} />
      </div>
      <div style={{ position: 'absolute', right: 0, bottom: 0, boxShadow: `0 0 0 2px ${t.palette.card}`, borderRadius: 2 }}>
        <CivicAvatar name={viewer.name} initials={viewer.initials} size={28} />
      </div>
    </div>
  );
}

function CivicDayStamp({ label }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 0' }}>
      <span style={{ flex: 1, height: 1, background: t.palette.ruleSoft }} />
      <span style={{ fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.16em', color: t.palette.mute2 }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: t.palette.ruleSoft }} />
    </div>
  );
}

function CivicBubble({ msg, mine, sender }) {
  const t = React.useContext(ThemeCtx);
  const m = useCivicIsMobile();
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexDirection: mine ? 'row-reverse' : 'row' }}>
      <CivicAvatar name={sender.name} initials={sender.initials} size={26} />
      <div style={{ maxWidth: m ? '82%' : '72%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: mine ? 'flex-end' : 'flex-start' }}>
        {msg.kind === 'file' ? (
          <div style={{
            background: t.palette.panel, border: `1px solid ${t.palette.rule}`,
            borderRadius: 2, padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: t.palette.ink,
          }}>
            <span style={{
              width: 26, height: 30, background: t.palette.card, border: `1px solid ${t.palette.rule}`, borderRadius: 2,
              display: 'grid', placeItems: 'center',
              fontFamily: t.font.mono, fontSize: 8, color: t.palette.muted, fontWeight: 700, letterSpacing: 0.5,
            }}>PDF</span>
            <span style={{ fontWeight: 500 }}>{msg.body.replace(/^Attached:\s*/, '')}</span>
          </div>
        ) : (
          <div style={{
            background: mine ? t.palette.accent : t.palette.panel,
            color: mine ? '#fff' : t.palette.ink,
            border: mine ? 'none' : `1px solid ${t.palette.rule}`,
            borderRadius: 2, padding: '10px 14px',
            fontSize: 14, lineHeight: 1.55,
          }}>
            {msg.body}
          </div>
        )}
        <div style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.mute2, letterSpacing: '0.14em' }}>
          {msg.at}
        </div>
      </div>
    </div>
  );
}

function CivicComposerChip({ label }) {
  const t = React.useContext(ThemeCtx);
  return (
    <button style={{
      background: 'transparent', border: `1px solid ${t.palette.rule}`,
      borderRadius: 2, padding: '6px 12px',
      fontFamily: t.font.body, fontSize: 12, color: t.palette.muted, fontWeight: 500,
      cursor: 'pointer', whiteSpace: 'nowrap',
    }}>{label}</button>
  );
}

function CivicNextMeetingCard({ next, other }) {
  const t = React.useContext(ThemeCtx);
  if (!next) {
    return (
      <div style={t.cardSurface({ padding: 18 })}>
        <Eyebrow color={t.palette.muted}>Next meeting</Eyebrow>
        <p style={{ fontSize: 13.5, color: t.palette.muted, margin: '10px 0 12px', lineHeight: 1.5 }}>
          Nothing scheduled yet.
        </p>
        <CivicButton size="sm" variant="outline" style={{ width: '100%' }}>Suggest a time</CivicButton>
      </div>
    );
  }
  return (
    <div style={t.cardSurface({ padding: 18 })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Eyebrow color={t.palette.accent}>Next meeting</Eyebrow>
        <CivicChip tone="muted">HELD</CivicChip>
      </div>
      <h3 style={{ ...t.display, fontSize: 17, margin: '8px 0 4px', fontWeight: 600 }}>{next.when}</h3>
      <div style={{ fontSize: 12.5, color: t.palette.muted }}>{next.kind} · with {other.name.split(' ')[0]}</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <CivicButton size="sm" style={{ flex: 1 }}>Join</CivicButton>
        <CivicButton size="sm" variant="outline">Reschedule</CivicButton>
      </div>
    </div>
  );
}

function CivicThreadSummaryCard({ thread }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div style={t.cardSurface({ padding: 18 })}>
      <Eyebrow color={t.palette.muted}>Where we are</Eyebrow>
      <p style={{ fontSize: 13.5, color: t.palette.ink2, margin: '10px 0 0', lineHeight: 1.55 }}>
        {thread.summary}
      </p>
      <button style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: t.palette.accent, fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600,
        padding: '10px 0 0', textAlign: 'left',
      }}>Edit summary →</button>
    </div>
  );
}

function CivicSharedFilesCard({ messages }) {
  const t = React.useContext(ThemeCtx);
  const files = messages.filter(m => m.kind === 'file');
  return (
    <div style={t.cardSurface({ padding: 18 })}>
      <Eyebrow color={t.palette.muted}>Shared files</Eyebrow>
      {files.length === 0 ? (
        <p style={{ fontSize: 13, color: t.palette.muted, margin: '10px 0 0' }}>None yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {files.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: t.palette.ink2 }}>
              <span style={{
                width: 22, height: 26, background: t.palette.panel, border: `1px solid ${t.palette.rule}`, borderRadius: 2,
                display: 'grid', placeItems: 'center',
                fontFamily: t.font.mono, fontSize: 8, color: t.palette.muted, fontWeight: 700, flexShrink: 0,
              }}>PDF</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {f.body.replace(/^Attached:\s*/, '')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CivicOtherMemberCard({ other, onOpen }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div style={t.cardSurface({ padding: 18 })}>
      <Eyebrow color={t.palette.muted}>About {other.name.split(' ')[0]}</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        <CivicAvatar name={other.name} initials={other.initials} size={38} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: t.palette.ink }}>{other.name}</div>
          <div style={{ fontSize: 12, color: t.palette.muted }}>&apos;{String(other.year).slice(-2)} · {other.title}</div>
        </div>
      </div>
      <button onClick={onOpen} style={{
        marginTop: 12, background: 'transparent', border: 'none', cursor: 'pointer',
        color: t.palette.accent, fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600, padding: 0,
      }}>Open full profile →</button>
    </div>
  );
}

window.CivicAskThread = CivicAskThread;
