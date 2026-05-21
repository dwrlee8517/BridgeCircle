/* eslint-disable */
// Atrium — AskThread screen.
//
// The missing surface: what happens AFTER a mentorship request is accepted.
// You and the other member now have a thread — messages, a scheduled call,
// optional shared notes / files. This is the working space where the actual
// mentorship happens.

function AtriumAskThread() {
  const t = React.useContext(ThemeCtx);
  const { activeThread, setActiveThread, goto } = useAtriumRoute();
  const { THREADS, MEMBERS, VIEWER } = window.BC_DATA;
  const thread = THREADS.find(x => x.id === activeThread) || THREADS[0];
  const other  = MEMBERS.find(m => m.id === thread.withMember);
  const m = t.isMobile;

  // Local composer state — the thread itself stays static for the prototype.
  const [draft, setDraft] = React.useState('');
  const [localMessages, setLocalMessages] = React.useState([]);

  const allMessages = [...thread.messages, ...localMessages];

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setLocalMessages([
      ...localMessages,
      { from: VIEWER.id, at: 'Just now', body: text },
    ]);
    setDraft('');
  };

  return (
    <section style={{ padding: m ? '16px 16px 40px' : '24px 24px 56px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Top: breadcrumb + thread switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <button onClick={() => goto('inbox')} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: t.palette.muted, fontFamily: t.font.body, fontSize: 13, fontWeight: 500,
          padding: '4px 0', display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <span>←</span> Back to Inbox
        </button>
        <ThreadSwitcher threads={THREADS} activeId={thread.id} onPick={(id) => setActiveThread(id)} />
      </div>

      {/* Thread header card */}
      <div style={{
        ...t.cardSurface({ padding: m ? 16 : 24 }),
        display: 'grid',
        gridTemplateColumns: m ? '1fr' : '1fr auto',
        gap: m ? 12 : 18,
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: m ? 12 : 16, minWidth: 0 }}>
          <AvatarPair viewer={VIEWER} other={other} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <AtriumEyebrow accent>Mentorship thread · started {thread.startedAt}</AtriumEyebrow>
            </div>
            <h1 style={{ ...t.display, fontSize: m ? 22 : 32, margin: '6px 0 4px', fontWeight: 600 }}>{thread.title}</h1>
            <div style={{ fontSize: 13.5, color: t.palette.muted }}>
              You and <button onClick={() => goto('profile')} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: t.palette.ink2, fontWeight: 600, fontFamily: t.font.body, fontSize: 13.5 }}>{other.name}</button> · {other.title} at {other.employer}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: m ? 'flex-start' : 'flex-end' }}>
          <AtriumButton size={m ? 'sm' : 'md'} variant="outline">Schedule a call</AtriumButton>
          <AtriumButton size={m ? 'sm' : 'md'} variant="ghost">Thread settings</AtriumButton>
        </div>
      </div>

      {/* Body — messages + sidebar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: t.isCompact ? '1fr' : '1fr 320px',
        gap: m ? 16 : 24,
        marginTop: m ? 16 : 20,
      }}>
        <div style={t.cardSurface({ padding: 0, display: 'flex', flexDirection: 'column', minHeight: m ? 420 : 540 })}>
          {/* Message scroll area */}
          <div style={{ flex: 1, padding: m ? '16px 14px' : '22px 24px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
            <DayStamp label="May 18, 2026 · Monday" />
            {allMessages.map((msg, i) => {
              const mine = msg.from === VIEWER.id;
              const sender = mine ? VIEWER : MEMBERS.find(mm => mm.id === msg.from) || other;
              return <Bubble key={i} msg={msg} mine={mine} sender={sender} />;
            })}
          </div>

          {/* Composer */}
          <div style={{
            borderTop: `1px solid ${t.palette.rule}`,
            padding: m ? '12px 14px 14px' : '14px 18px 18px',
            background: t.palette.cardAlt,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <textarea
              value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
              placeholder={`Write back to ${other.name.split(' ')[0]}… ${m ? '' : '(⌘↵ to send)'}`}
              rows={m ? 2 : 3}
              style={{
                resize: 'vertical', width: '100%', boxSizing: 'border-box',
                border: `1px solid ${t.palette.rule}`, borderRadius: t.radius - 4,
                padding: '12px 14px', background: t.palette.card,
                fontFamily: t.font.body, fontSize: 14, color: t.palette.ink,
                lineHeight: 1.55,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div className="atrium-hscroll" style={{
                display: 'flex', gap: 6,
                overflowX: m ? 'auto' : 'visible',
                maxWidth: '100%',
                flex: m ? '1 1 auto' : '0 0 auto',
              }}>
                <ComposerChip label="Attach" />
                <ComposerChip label="Insert calendar" />
                <ComposerChip label="Share contact" />
              </div>
              <AtriumButton onClick={send} size="md">Send</AtriumButton>
            </div>
          </div>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <NextMeetingCard next={thread.next} other={other} />
          <ThreadSummaryCard thread={thread} />
          <SharedFilesCard messages={allMessages} />
          <OtherMemberCard other={other} onOpen={() => { setActiveThread(thread.id); goto('profile'); }} />
        </aside>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Thread switcher — a pill dropdown to flip between active threads.
// ---------------------------------------------------------------------------

function ThreadSwitcher({ threads, activeId, onPick }) {
  const t = React.useContext(ThemeCtx);
  const [open, setOpen] = React.useState(false);
  const active = threads.find(th => th.id === activeId) || threads[0];
  const other = window.BC_DATA.MEMBERS.find(m => m.id === active.withMember);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: t.palette.cardAlt, border: `1px solid ${t.palette.rule}`,
        borderRadius: 999, padding: '7px 14px',
        fontFamily: t.font.body, fontSize: 13, color: t.palette.ink, fontWeight: 600,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontFamily: t.font.mono, fontSize: 10, color: t.palette.mute2, letterSpacing: '0.14em' }}>THREAD</span>
        <span>{other.name.split(' ')[0]} · {active.title}</span>
        <span style={{ color: t.palette.mute2 }}>▾</span>
      </button>
      {open ? (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 10,
          background: t.palette.card, border: `1px solid ${t.palette.rule}`,
          borderRadius: t.radius, padding: 6, minWidth: 280,
          boxShadow: '0 12px 32px rgba(42,34,26,0.10)',
        }}>
          {threads.map(th => {
            const o = window.BC_DATA.MEMBERS.find(m => m.id === th.withMember);
            const isActive = th.id === activeId;
            return (
              <button key={th.id} onClick={() => { onPick(th.id); setOpen(false); }}
                style={{
                  width: '100%', textAlign: 'left', background: isActive ? t.palette.paper : 'transparent',
                  border: 'none', cursor: 'pointer', padding: '8px 10px',
                  borderRadius: t.radius - 4, display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 2,
                }}>
                <AtriumAvatar name={o.name} initials={o.initials} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{o.name}</div>
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

function AvatarPair({ viewer, other }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div style={{ position: 'relative', width: 70, height: 56, flexShrink: 0 }}>
      <div style={{ position: 'absolute', left: 0, top: 4 }}>
        <AtriumAvatar name={other.name} initials={other.initials} size={48} />
      </div>
      <div style={{ position: 'absolute', right: 0, bottom: 0, boxShadow: `0 0 0 3px ${t.palette.card}`, borderRadius: 999 }}>
        <AtriumAvatar name={viewer.name} initials={viewer.initials} size={32} />
      </div>
    </div>
  );
}

function DayStamp({ label }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
      <span style={{ flex: 1, height: 1, background: t.palette.ruleSoft }} />
      <span style={{
        fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.16em',
        color: t.palette.mute2, fontWeight: 600,
      }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: t.palette.ruleSoft }} />
    </div>
  );
}

function Bubble({ msg, mine, sender }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-end',
      flexDirection: mine ? 'row-reverse' : 'row',
    }}>
      <AtriumAvatar name={sender.name} initials={sender.initials} size={28} />
      <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: mine ? 'flex-end' : 'flex-start' }}>
        {msg.kind === 'file' ? (
          <div style={{
            background: t.palette.paper, border: `1px solid ${t.palette.rule}`,
            borderRadius: t.radius - 4, padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: t.palette.ink,
          }}>
            <span style={{
              width: 28, height: 32, background: t.palette.cardAlt, border: `1px solid ${t.palette.rule}`, borderRadius: 3,
              display: 'grid', placeItems: 'center', fontFamily: t.font.mono, fontSize: 9, color: t.palette.muted, fontWeight: 700, letterSpacing: 0.5,
            }}>PDF</span>
            <span style={{ fontWeight: 500 }}>{msg.body.replace(/^Attached:\s*/, '')}</span>
          </div>
        ) : (
          <div style={{
            background: mine ? t.palette.accent : t.palette.cardAlt,
            color: mine ? '#fff' : t.palette.ink,
            border: mine ? 'none' : `1px solid ${t.palette.rule}`,
            borderRadius: t.radius,
            borderBottomRightRadius: mine ? 4 : t.radius,
            borderBottomLeftRadius: !mine ? 4 : t.radius,
            padding: '10px 14px',
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

function ComposerChip({ label }) {
  const t = React.useContext(ThemeCtx);
  return (
    <button style={{
      background: 'transparent', border: `1px solid ${t.palette.rule}`,
      borderRadius: 999, padding: '6px 12px',
      fontFamily: t.font.body, fontSize: 12, color: t.palette.muted, fontWeight: 500,
      cursor: 'pointer',
    }}>{label}</button>
  );
}

function NextMeetingCard({ next, other }) {
  const t = React.useContext(ThemeCtx);
  if (!next) {
    return (
      <div style={t.cardSurface({ padding: 18 })}>
        <AtriumEyebrow>Next meeting</AtriumEyebrow>
        <p style={{ fontSize: 13.5, color: t.palette.muted, margin: '10px 0 12px', lineHeight: 1.5 }}>
          Nothing scheduled yet. Suggest a time and we’ll send a calendar hold.
        </p>
        <AtriumButton size="sm" variant="outline" style={{ width: '100%' }}>Suggest a time</AtriumButton>
      </div>
    );
  }
  return (
    <div style={t.cardSurface({ padding: 18 })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <AtriumEyebrow accent>Next meeting</AtriumEyebrow>
        <span style={{ fontFamily: t.font.mono, fontSize: 10, letterSpacing: '0.14em', color: t.palette.mute2 }}>HELD</span>
      </div>
      <h3 style={{ ...t.display, fontSize: 18, margin: '8px 0 4px', fontWeight: 600 }}>{next.when}</h3>
      <div style={{ fontSize: 12.5, color: t.palette.muted }}>{next.kind} · with {other.name.split(' ')[0]}</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <AtriumButton size="sm" style={{ flex: 1 }}>Join</AtriumButton>
        <AtriumButton size="sm" variant="outline">Reschedule</AtriumButton>
      </div>
    </div>
  );
}

function ThreadSummaryCard({ thread }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div style={t.cardSurface({ padding: 18 })}>
      <AtriumEyebrow>Where we are</AtriumEyebrow>
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

function SharedFilesCard({ messages }) {
  const t = React.useContext(ThemeCtx);
  const files = messages.filter(m => m.kind === 'file');
  return (
    <div style={t.cardSurface({ padding: 18 })}>
      <AtriumEyebrow>Shared files</AtriumEyebrow>
      {files.length === 0 ? (
        <p style={{ fontSize: 13, color: t.palette.muted, margin: '10px 0 0' }}>None yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {files.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: t.palette.ink2 }}>
              <span style={{
                width: 22, height: 28, background: t.palette.paper, border: `1px solid ${t.palette.rule}`, borderRadius: 2,
                display: 'grid', placeItems: 'center', fontFamily: t.font.mono, fontSize: 8, color: t.palette.muted, fontWeight: 700, flexShrink: 0,
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

function OtherMemberCard({ other, onOpen }) {
  const t = React.useContext(ThemeCtx);
  return (
    <div style={t.cardSurface({ padding: 18 })}>
      <AtriumEyebrow>About {other.name.split(' ')[0]}</AtriumEyebrow>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        <AtriumAvatar name={other.name} initials={other.initials} size={40} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{other.name}</div>
          <div style={{ fontSize: 12, color: t.palette.muted }}>’{String(other.year).slice(-2)} · {other.title}</div>
        </div>
      </div>
      <button onClick={onOpen} style={{
        marginTop: 12, background: 'transparent', border: 'none', cursor: 'pointer',
        color: t.palette.accent, fontFamily: t.font.body, fontSize: 12.5, fontWeight: 600,
        padding: 0,
      }}>Open full profile →</button>
    </div>
  );
}

window.AtriumAskThread = AtriumAskThread;
