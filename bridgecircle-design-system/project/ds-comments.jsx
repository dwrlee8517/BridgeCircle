/* eslint-disable */
// Atrium Design System — Comments & Threaded Discussion (Section 46)

function CommentsSection() {
  return (
    <DSSection id="comments" eyebrow="Components · 46" title="Comments & Threaded Discussion">

      <DSSub title="Supper notes — a full threaded discussion">
        <CommentThread />
      </DSSub>

      <DSSub title="Comment atoms — variants by author, state, and depth">
        <CommentAtoms />
      </DSSub>

      <DSSub title="Reactions strip — the warm-verb set, count-aggregated">
        <ReactionsStripShowcase />
      </DSSub>

      <DSSub title="Inline reply composer — anchored to a parent comment">
        <InlineComposerShowcase />
      </DSSub>

    </DSSection>
  );
}

function CommentThread() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [replying, setReplying] = React.useState(null);

  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 16, padding: '22px 24px' }}>
      {/* Thread header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10, paddingBottom: 14, marginBottom: 18, borderBottom: `1px solid ${DSC.ruleSoft}` }}>
        <div>
          <DSEyebrow accent>Supper notes · Tue 27 May</DSEyebrow>
          <h2 style={{ fontFamily: DSF.display, fontSize: 22, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.02em', margin: '6px 0 0' }}>What we talked about over the pork shoulder</h2>
          <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, marginTop: 4 }}>Hosted by Iris · 12 attended · 8 comments</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>Sort</span>
          <div style={{ display: 'inline-flex', gap: 2, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 999, padding: 2 }}>
            {['Oldest', 'Newest'].map((s, i) => (
              <button key={s} style={{ padding: '4px 12px', background: i === 0 ? DSC.ink : 'transparent', color: i === 0 ? DSC.paper : DSC.muted, border: 'none', borderRadius: 999, fontFamily: DSF.body, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Comment 1 — top-level */}
      <Comment author={{ name: 'Iris Okonkwo', init: 'IO', cohort: "'11", role: 'host', verified: true }} when="Yesterday · 10:14 pm" body={(
        <>
          <p style={{ margin: 0 }}>One thread I want to keep going from Sam's question on climate underwriting — the actuarial table he passed around is from 2021 and ignores wildfire reinsurance. <strong style={{ color: DSC.ink, fontWeight: 700 }}>Anyone have a more recent one?</strong></p>
          <p style={{ margin: '10px 0 0' }}>If we can pin it here, I'll bring it to the next supper.</p>
        </>
      )} reactions={[{ kind: 'wave', count: 3 }, { kind: 'mutual', count: 2 }]} pinned onReply={() => setReplying('1')} replying={replying === '1'} >
        {/* Reply 1.1 */}
        <Comment author={{ name: 'Sam Aldridge', init: 'SA', cohort: "'11" }} when="14h ago" body="Posting from Lagos — Rosa just sent me the 2025 IPCC underwriting annex. Will PDF it tomorrow." reactions={[{ kind: 'thanks', count: 4 }]} onReply={() => setReplying('1.1')} replying={replying === '1.1'} />
        {/* Reply 1.2 */}
        <Comment author={{ name: 'Dev Patel', init: 'DP', cohort: "'11" }} when="12h ago" body="We rebuilt our model in March using the 2024 Lloyd's data. Happy to share if helpful — there's a methods doc too." reactions={[{ kind: 'mutual', count: 5 }, { kind: 'wave', count: 1 }]} onReply={() => setReplying('1.2')} replying={replying === '1.2'}>
          {/* Nested reply */}
          <Comment author={{ name: 'Iris Okonkwo', init: 'IO', cohort: "'11", role: 'host', verified: true }} when="11h ago" body="Dev — please. Pin the methods doc." reactions={[]} onReply={() => setReplying('1.2.1')} replying={replying === '1.2.1'} />
        </Comment>

        {/* Collapsed sibling indicator */}
        {!collapsed ? (
          <button onClick={() => setCollapsed(true)} style={{ background: 'none', border: 'none', color: DSC.accent, fontFamily: DSF.body, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 0 4px 28px', marginLeft: 20 }}>Show 2 more replies</button>
        ) : (
          <>
            <Comment author={{ name: 'Rosa Ferrara', init: 'RF', cohort: "'17" }} when="9h ago" body="Climate-skewed underwriting tables are a bigger conversation. Want me to host the next supper on it?" reactions={[{ kind: 'mutual', count: 6 }]} />
            <Comment author={{ name: 'Theo Harrington', init: 'TH', cohort: "'20" }} when="6h ago" body="Reading this thread is half the reason I joined. Saving everything." reactions={[{ kind: 'wave', count: 2 }, { kind: 'thanks', count: 1 }]} />
            <button onClick={() => setCollapsed(false)} style={{ background: 'none', border: 'none', color: DSC.muted, fontFamily: DSF.body, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 0 4px 28px', marginLeft: 20 }}>Hide 2 replies</button>
          </>
        )}
      </Comment>

      {/* Comment 2 — top-level */}
      <Comment author={{ name: 'Maren Holt', init: 'MH', cohort: "'14" }} when="8h ago" body="Quieter note — does anyone have a recipe for the fennel pickle Sam made? It was the second-best thing on the table." reactions={[{ kind: 'thanks', count: 7 }]} onReply={() => setReplying('2')} replying={replying === '2'} />

      {/* Top-level composer */}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${DSC.ruleSoft}` }}>
        <ThreadComposer />
      </div>
    </div>
  );
}

function Comment({ author, when, body, reactions = [], pinned, onReply, replying, children }) {
  const isHost = author.role === 'host';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr', gap: 12, marginBottom: 18 }}>
      {/* Avatar + thread line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <DSAvatar name={author.name} initials={author.init} size={36} />
        {children && <div style={{ flex: 1, width: 2, background: DSC.ruleSoft, borderRadius: 999 }} />}
      </div>
      {/* Body */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: DSF.body, fontSize: 13, fontWeight: 700, color: DSC.ink }}>{author.name}</span>
          <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.accent, letterSpacing: '0.10em', fontWeight: 700 }}>{author.cohort}</span>
          {author.verified && (
            <span style={{ width: 14, height: 14, borderRadius: 999, background: DSC.ok, color: '#fff', display: 'grid', placeItems: 'center' }} title="Verified">
              <Icon name="check" size={9} color="currentColor" strokeWidth={3.4} />
            </span>
          )}
          {isHost && <span style={{ background: dshex(DSC.accent, 0.13), color: DSC.accent, fontFamily: DSF.body, fontSize: 9.5, fontWeight: 700, padding: '1px 7px', borderRadius: 999, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Host</span>}
          {pinned && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: DSC.muted, fontFamily: DSF.mono, fontSize: 9.5, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase' }}>
            <Icon name="bookmark" size={10} color="currentColor" /> Pinned
          </span>}
          <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.mute2, letterSpacing: '0.04em', marginLeft: 'auto' }}>{when}</span>
        </div>
        <div style={{ fontFamily: DSF.body, fontSize: 14, color: DSC.ink2, lineHeight: 1.6, marginTop: 6 }}>{body}</div>

        {/* Reactions + actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
          {reactions.map(r => <CountedReaction key={r.kind} kind={r.kind} count={r.count} />)}
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: DSC.muted, fontFamily: DSF.body, fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon name="sparkle" size={11} color="currentColor" /> React
          </button>
          {onReply && (
            <button onClick={onReply} style={{ background: 'none', border: 'none', cursor: 'pointer', color: replying ? DSC.accent : DSC.muted, fontFamily: DSF.body, fontSize: 11.5, fontWeight: 700, padding: '4px 8px' }}>
              {replying ? 'Replying…' : 'Reply'}
            </button>
          )}
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: DSC.muted, fontFamily: DSF.body, fontSize: 11.5, fontWeight: 500, padding: '4px 8px' }}>···</button>
        </div>

        {/* Inline composer */}
        {replying && (
          <div style={{ marginTop: 10, padding: 10, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 10 }}>
            <textarea placeholder={`Reply to ${author.name.split(' ')[0]}…`} rows="2" style={{ width: '100%', boxSizing: 'border-box', background: DSC.card, color: DSC.ink, border: `1px solid ${DSC.rule}`, borderRadius: 8, padding: '8px 12px', fontFamily: DSF.body, fontSize: 13, outline: 'none', resize: 'vertical' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.06em' }}>⌘↵ to send · Esc to cancel</span>
              <DSButton size="sm">Reply →</DSButton>
            </div>
          </div>
        )}

        {/* Children */}
        {children && <div style={{ marginTop: 14 }}>{children}</div>}
      </div>
    </div>
  );
}

function CountedReaction({ kind, count }) {
  const icons = {
    wave:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12V7a2 2 0 1 1 4 0v4M9 11V5a2 2 0 1 1 4 0v6M13 12V6a2 2 0 1 1 4 0v8M17 12V9a2 2 0 1 1 4 0v6a7 7 0 0 1-14 0" /></svg>,
    mutual: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11l3-3 5 5 4-4" /><path d="M14 8h5v5" /></svg>,
    thanks: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.5l8.8-9.1a5.5 5.5 0 0 0 0-7.8z" /></svg>,
    read:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></svg>,
    later:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>,
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: dshex(DSC.accent, 0.10), border: `1px solid ${dshex(DSC.accent, 0.24)}`, color: DSC.accent, fontFamily: DSF.body, fontSize: 11, fontWeight: 700 }}>
      {icons[kind]} {count}
    </span>
  );
}

function ThreadComposer() {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr', gap: 12 }}>
      <DSAvatar name="Maren Holt" initials="MH" size={36} />
      <div style={{ background: DSC.cardAlt, border: `1.5px solid ${focused ? DSC.accent : DSC.rule}`, borderRadius: 12, padding: 12, transition: 'border-color 140ms ease' }}>
        <textarea onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="Add to the conversation…" rows="2" style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', color: DSC.ink, border: 'none', outline: 'none', fontFamily: DSF.body, fontSize: 14, lineHeight: 1.55, resize: 'vertical', minHeight: 40 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button title="Attach file" style={{ width: 28, height: 28, borderRadius: 999, background: 'transparent', border: 'none', cursor: 'pointer', color: DSC.muted, display: 'grid', placeItems: 'center' }}>
              <Icon name="attach" size={14} color="currentColor" />
            </button>
            <button title="Mention" style={{ width: 28, height: 28, borderRadius: 999, background: 'transparent', border: 'none', cursor: 'pointer', color: DSC.muted, display: 'grid', placeItems: 'center', fontFamily: DSF.body, fontWeight: 700, fontSize: 14 }}>@</button>
            <button title="Image" style={{ width: 28, height: 28, borderRadius: 999, background: 'transparent', border: 'none', cursor: 'pointer', color: DSC.muted, display: 'grid', placeItems: 'center' }}>
              <Icon name="image" size={14} color="currentColor" />
            </button>
          </div>
          <DSButton size="sm" leadIcon={<Icon name="send" size={12} color="currentColor" />}>Post</DSButton>
        </div>
      </div>
    </div>
  );
}

function CommentAtoms() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      <VariantCard label="Host comment · pinned" note="Host badge + verified pip + pinned marker. Body has subtle accent.">
        <Comment author={{ name: 'Iris Okonkwo', init: 'IO', cohort: "'11", role: 'host', verified: true }} when="1h" body="One thread to pin — share the 2025 IPCC underwriting annex if you have it." reactions={[{ kind: 'mutual', count: 4 }]} pinned />
      </VariantCard>
      <VariantCard label="Standard reply" note="Plain author chip · 1px thread line connects to parent.">
        <Comment author={{ name: 'Sam Aldridge', init: 'SA', cohort: "'11" }} when="40m" body="Will PDF it tomorrow — posting from Lagos." reactions={[{ kind: 'thanks', count: 2 }]} />
      </VariantCard>
      <VariantCard label="New member reply" note="Lower-cohort styling. No badge.">
        <Comment author={{ name: 'Theo Harrington', init: 'TH', cohort: "'20" }} when="20m" body="Reading this thread is half the reason I joined." reactions={[{ kind: 'wave', count: 3 }]} />
      </VariantCard>
      <VariantCard label="Deleted comment" note="Body replaced with placeholder; metadata preserved.">
        <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 999, background: DSC.cardAlt, border: `1.5px dashed ${DSC.muted}` }} />
          <div>
            <div style={{ fontFamily: DSF.mono, fontSize: 11, color: DSC.muted, letterSpacing: '0.04em' }}>Deleted by author · 2h ago</div>
            <div style={{ fontFamily: DSF.body, fontStyle: 'italic', fontSize: 13.5, color: DSC.mute2, marginTop: 5 }}>This comment was removed.</div>
          </div>
        </div>
      </VariantCard>
    </div>
  );
}

function ReactionsStripShowcase() {
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 14 }}>Picker · five warm verbs</div>
      <div style={{ display: 'flex', gap: 8, padding: 4, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 999, width: 'fit-content' }}>
        {[
          { k: 'wave', label: 'Wave back' },
          { k: 'read', label: 'Mark read' },
          { k: 'mutual', label: 'Mutual' },
          { k: 'thanks', label: 'Appreciate' },
          { k: 'later', label: 'Bookmark' },
        ].map(r => (
          <SimpleTip key={r.k} text={r.label}>
            <button style={{ width: 32, height: 32, borderRadius: 999, background: 'transparent', border: 'none', cursor: 'pointer', color: DSC.muted, display: 'grid', placeItems: 'center' }}>
              <CountedReactionGlyph kind={r.k} />
            </button>
          </SimpleTip>
        ))}
      </div>

      <div style={{ marginTop: 22, fontFamily: DSF.mono, fontSize: 10, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 14 }}>Counted · how reactions live alongside a comment</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <CountedReaction kind="mutual" count={6} />
        <CountedReaction kind="thanks" count={4} />
        <CountedReaction kind="wave" count={2} />
      </div>
    </div>
  );
}

function CountedReactionGlyph({ kind }) {
  const map = {
    wave:   <Icon name="wave" size={13} color="currentColor" />,
    read:   <Icon name="eye" size={13} color="currentColor" />,
    mutual: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11l3-3 5 5 4-4" /><path d="M14 8h5v5" /></svg>,
    thanks: <Icon name="heart" size={13} color="currentColor" />,
    later:  <Icon name="bookmark" size={13} color="currentColor" />,
  };
  return map[kind];
}

function InlineComposerShowcase() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <VariantCard label="Top-level composer" note="Always-visible at the bottom of a thread. Toolbar inline.">
        <ThreadComposer />
      </VariantCard>
      <VariantCard label="Inline reply composer" note="Appears under the comment being replied-to. Anchored visually.">
        <div style={{ padding: 12, background: DSC.cardAlt, border: `1px solid ${DSC.rule}`, borderRadius: 10 }}>
          <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>Replying to Iris</div>
          <textarea placeholder="Reply to Iris…" rows="2" style={{ width: '100%', boxSizing: 'border-box', background: DSC.card, color: DSC.ink, border: `1px solid ${DSC.rule}`, borderRadius: 8, padding: '8px 12px', fontFamily: DSF.body, fontSize: 13, outline: 'none', resize: 'vertical' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.06em' }}>⌘↵ to send · Esc to cancel</span>
            <DSButton size="sm">Reply →</DSButton>
          </div>
        </div>
      </VariantCard>
    </div>
  );
}

window.CommentsSection = CommentsSection;
