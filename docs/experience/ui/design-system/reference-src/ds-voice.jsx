/* eslint-disable */
// Atrium Design System — Voice & Microcopy (Section 33)
// Voice register, do/don't pairs, microcopy by surface, format rules, lexicon.

function VoiceSection() {
  return (
    <DSSection id="voice" eyebrow="Components · 33" title="Voice & Microcopy">

      <DSSub title="Voice — five rules">
        <VoiceRules />
      </DSSub>

      <DSSub title="Do / Don't — say it like this, not like that">
        <DoDontPairs />
      </DSSub>

      <DSSub title="Microcopy by surface — errors, empties, success, loading">
        <MicrocopyBySurface />
      </DSSub>

      <DSSub title="Format & punctuation rules">
        <FormatRules />
      </DSSub>

      <DSSub title="The Hartwood lexicon — say these, not the generic ones">
        <Lexicon />
      </DSSub>

    </DSSection>
  );
}

// ─── 1. VOICE RULES ────────────────────────────────────────────────────────

function VoiceRules() {
  const rules = [
    {
      title: 'Warm, not friendly',
      body: "Friendly tries too hard. Warm assumes the reader is already in the room. Sentence-case where you can. Em-dashes are welcome. Never use 'Hi there' or '👋'.",
      example: { good: 'Welcome back, Maren — Iris asked after you.', bad: 'Hi there! Welcome back! 👋' },
    },
    {
      title: 'Second person — always',
      body: "Speak to the reader directly. 'You haven't replied to Iris.' Not 'The user has 3 pending replies.' If we slip into third person, we sound like a tax form.",
      example: { good: "3 replies you owe", bad: 'You have 3 pending user-actions awaiting your response.' },
    },
    {
      title: 'Plain words, plenty of nouns',
      body: 'Hartwood is for people, not for product managers. "Send an intro." "Open the supper." "Invite a friend." Verbs that mean what they mean. Skip "leverage", "engagement", "platform".',
      example: { good: 'Open the supper', bad: 'Engage with the event experience' },
    },
    {
      title: 'Never bossy, never breathless',
      body: 'Avoid imperatives without context. "Click here" is bossy and bare. "Open inbox — 3 waiting" is the same length and tells the reader why. Also: no exclamation marks except for genuine celebrations.',
      example: { good: 'Open inbox · 3 waiting', bad: 'CLICK NOW! 3 messages waiting!!' },
    },
    {
      title: 'A tiny piece of the world',
      body: "Sprinkle a name, a place, a time. 'Iris is hosting.' 'Brooklyn.' 'Tuesday 7:30.' Specificity beats abstraction every time — it tells the reader they're in a real place, not a service.",
      example: { good: 'Iris is hosting Spring Supper · Brooklyn · Tue 7:30', bad: 'Upcoming event scheduled for this week' },
    },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
      {rules.map((r, i) => (
        <div key={i} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '18px 22px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, alignItems: 'flex-start' }}>
            <span style={{ width: 32, height: 32, borderRadius: 999, background: dshex(DSC.accent, 0.14), color: DSC.accent, display: 'grid', placeItems: 'center', fontFamily: DSF.display, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: DSF.display, fontSize: 17, fontWeight: 600, color: DSC.ink, letterSpacing: '-0.015em' }}>{r.title}</div>
              <p style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink2, lineHeight: 1.6, margin: '6px 0 12px', maxWidth: 720 }}>{r.body}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <ExampleLine kind="good" text={r.example.good} />
                <ExampleLine kind="bad"  text={r.example.bad} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ExampleLine({ kind, text }) {
  const isGood = kind === 'good';
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 12px', background: isGood ? dshex(DSC.ok, 0.07) : dshex(DSC.bad, 0.06), border: `1px solid ${isGood ? dshex(DSC.ok, 0.22) : dshex(DSC.bad, 0.22)}`, borderRadius: 8 }}>
      <span style={{ width: 16, height: 16, borderRadius: 999, background: isGood ? DSC.ok : DSC.bad, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
        <Icon name={isGood ? 'check' : 'close'} size={9} color="currentColor" strokeWidth={3.2} />
      </span>
      <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2, lineHeight: 1.45, fontStyle: isGood ? 'normal' : 'italic' }}>{text}</span>
    </div>
  );
}

// ─── 2. DO / DON'T ─────────────────────────────────────────────────────────

function DoDontPairs() {
  const pairs = [
    { good: 'Send intro',           bad: 'Submit',             note: 'Submit is bureaucratic. Send is human.' },
    { good: 'Reply',                bad: 'Reply Now',          note: 'No urgency on a friend\u2019s message.' },
    { good: 'Open inbox · 3',        bad: 'You have 3 messages', note: 'Lead with the action verb, end with the count.' },
    { good: 'On your desk',         bad: 'Pending Tasks',      note: 'Title-case "Pending Tasks" feels like project software. "On your desk" is a room.' },
    { good: 'Open to mentor',       bad: 'Available · MENTORING', note: 'Lowercase, prepositional. Not a stat.' },
    { good: 'Quiet for 90 days',    bad: 'Re-engagement opportunity', note: 'Name the actual thing.' },
    { good: 'All caught up',        bad: 'Inbox 0',            note: '"Inbox 0" is a brag. "All caught up" is a sigh of relief.' },
    { good: 'We\u2019re tending the circle', bad: 'Server maintenance in progress', note: 'Even the error tells you who you are.' },
    { good: "Iris asked after you", bad: 'You have new activity', note: 'Mention someone real if you can.' },
    { good: 'Invite a friend',     bad: 'Endorse · Recommend · Refer', note: 'One word with a feeling. Not three with the same meaning.' },
  ];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', padding: '10px 18px', background: DSC.panel, fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, fontWeight: 700 }}>
        <span style={{ color: DSC.ok }}>Do say</span>
        <span style={{ color: DSC.bad }}>Don't say</span>
        <span>Why</span>
      </div>
      {pairs.map((p, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', padding: '12px 18px', borderTop: `1px solid ${DSC.ruleSoft}`, gap: 12, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 14, height: 14, borderRadius: 999, background: DSC.ok, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name="check" size={9} color="currentColor" strokeWidth={3.2} />
            </span>
            <span style={{ fontFamily: DSF.body, fontSize: 13, color: DSC.ink, fontWeight: 600 }}>{p.good}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 14, height: 14, borderRadius: 999, background: DSC.bad, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name="close" size={9} color="currentColor" strokeWidth={3.2} />
            </span>
            <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.muted, fontStyle: 'italic', textDecoration: 'line-through', textDecorationColor: dshex(DSC.bad, 0.40) }}>{p.bad}</span>
          </div>
          <div style={{ fontFamily: DSF.body, fontSize: 12, color: DSC.muted, lineHeight: 1.5 }}>{p.note}</div>
        </div>
      ))}
    </div>
  );
}

// ─── 3. MICROCOPY BY SURFACE ───────────────────────────────────────────────

function MicrocopyBySurface() {
  const surfaces = [
    {
      heading: 'Error',  tone: DSC.bad,
      lines: [
        "Couldn't send that intro · check your connection",
        "That email doesn't look right — try again?",
        "Iris isn't accepting new requests this week",
        "Upload failed · the file is over 4 MB",
      ],
      anti: ['Error 500.', 'Please contact support.', 'An unexpected issue occurred.'],
    },
    {
      heading: 'Empty',  tone: DSC.muted,
      lines: [
        'All caught up · check back after the supper',
        "No matches in your circle for 'climate underwriting in Lagos'",
        'Quiet here — Iris hasn\u2019t opened a thread this week',
        'You haven\u2019t saved anyone yet',
      ],
      anti: ['No data available.', 'No results found.', 'Empty list.'],
    },
    {
      heading: 'Success', tone: DSC.ok,
      lines: [
        'Intro sent · Iris will get it tonight',
        'Saved to your desk',
        "RSVP\u2019d · we'll save you a seat",
        'Welcome to Hartwood — verified by the Society, invited by Iris and Dev',
      ],
      anti: ['Success!', 'Action completed.', 'Form submitted successfully.'],
    },
    {
      heading: 'Loading', tone: DSC.accent,
      lines: [
        'Reading your query…',
        'Looking through the directory…',
        'Folding the supper notes…',
        'Welcoming you to the circle…',
      ],
      anti: ['Loading…', 'Please wait.', 'Processing your request.'],
    },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      {surfaces.map((s, i) => (
        <div key={i} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ width: 9, height: 9, borderRadius: 999, background: s.tone }} />
            <span style={{ fontFamily: DSF.body, fontSize: 11.5, fontWeight: 700, color: s.tone, letterSpacing: '0.10em', textTransform: 'uppercase' }}>{s.heading}</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {s.lines.map((l, j) => (
              <li key={j} style={{ display: 'flex', gap: 8, fontFamily: DSF.body, fontSize: 13, color: DSC.ink2, lineHeight: 1.5, padding: '6px 10px', background: dshex(s.tone, 0.06), borderLeft: `2px solid ${s.tone}`, borderRadius: '0 6px 6px 0' }}>
                {l}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${DSC.ruleSoft}` }}>
            <div style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.muted, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>Avoid</div>
            <div style={{ fontFamily: DSF.body, fontSize: 11.5, color: DSC.muted, lineHeight: 1.5, fontStyle: 'italic' }}>
              {s.anti.join(' · ')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 4. FORMAT & PUNCTUATION ───────────────────────────────────────────────

function FormatRules() {
  const rules = [
    { rule: 'Em-dash, not hyphen',         use: 'Spring Supper — Brooklyn',     no: 'Spring Supper - Brooklyn' },
    { rule: 'Middle-dot for compounds',    use: "Class of '11 · Brooklyn",     no: "Class of '11 | Brooklyn" },
    { rule: "Curly apostrophes",            use: "Iris's notes",                no: "Iris's notes" },
    { rule: 'Sentence case for titles',    use: 'Find a mentor',               no: 'Find A Mentor' },
    { rule: 'Numerals in UI, words in prose', use: '3 replies · two-week trip', no: 'Three replies · 2-week trip' },
    { rule: 'No "Click" verbs',             use: 'Open inbox',                  no: 'Click here to open inbox' },
    { rule: 'Contractions OK',              use: "We're tending the circle",   no: 'We are tending the circle' },
    { rule: 'Ampersand only in names',      use: 'Dev & Sam are coming',        no: 'Mentor & Mentee program' },
    { rule: 'Times use 24h in tables, 12h in prose', use: '14:00 · 2 pm Tue', no: '14:00 in body text' },
    { rule: 'T-minus countdown',            use: 'T−7d · Spring Supper',        no: 'In 7 days · Spring Supper' },
  ];
  return (
    <div style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '10px 18px', background: DSC.panel, fontFamily: DSF.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: DSC.muted, fontWeight: 700 }}>
        <span>Rule</span><span style={{ color: DSC.ok }}>Use</span><span style={{ color: DSC.bad }}>Not</span>
      </div>
      {rules.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '11px 18px', borderTop: `1px solid ${DSC.ruleSoft}`, gap: 12 }}>
          <span style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2, fontWeight: 600 }}>{r.rule}</span>
          <span style={{ fontFamily: DSF.mono, fontSize: 12, color: DSC.ok, letterSpacing: '0.02em' }}>{r.use}</span>
          <span style={{ fontFamily: DSF.mono, fontSize: 12, color: DSC.muted, letterSpacing: '0.02em', fontStyle: 'italic', textDecoration: 'line-through', textDecorationColor: dshex(DSC.bad, 0.40) }}>{r.no}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 5. LEXICON ────────────────────────────────────────────────────────────

function Lexicon() {
  const words = [
    { word: 'Society', meaning: 'The Hartwood Society itself — the org that admits and verifies members.', avoid: 'Org · institution · admin' },
    { word: 'Invited', meaning: 'An existing member opens the door for a new one.', avoid: 'Sponsored · referred · endorsed' },
    { word: 'Cohort',  meaning: 'The class-of-year someone joined Hartwood.', avoid: 'Batch · year · class' },
    { word: 'Circle',  meaning: "Hartwood itself — never 'network', 'community', or 'platform'.", avoid: 'Network · platform · community' },
    { word: 'Supper',  meaning: 'A small, hosted dinner (~12 people, by invitation).', avoid: 'Event · meetup · dinner' },
    { word: 'On Deck', meaning: 'The featured member of the week.', avoid: 'Spotlight · featured · MVP' },
    { word: 'Desk',    meaning: 'Your private workspace — replies you owe, drafts, bookmarks.', avoid: 'Dashboard · workspace · queue' },
    { word: 'Wire',    meaning: 'The activity feed — passive updates from the circle.', avoid: 'Feed · timeline · stream' },
    { word: 'Intro',   meaning: 'A short message to begin a conversation.', avoid: 'DM · ping · ask · request' },
    { word: 'Helper mode', meaning: 'A toggle indicating you\u2019re accepting mentor requests right now.', avoid: 'Availability · status · busy/free' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
      {words.map((w, i) => (
        <div key={i} style={{ background: DSC.card, border: `1px solid ${DSC.rule}`, borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,34,26,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: DSF.display, fontSize: 18, fontWeight: 600, color: DSC.accent, letterSpacing: '-0.015em' }}>{w.word}</span>
            <span style={{ fontFamily: DSF.mono, fontSize: 9.5, color: DSC.mute2, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>noun</span>
          </div>
          <p style={{ fontFamily: DSF.body, fontSize: 12.5, color: DSC.ink2, lineHeight: 1.5, margin: 0 }}>{w.meaning}</p>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${DSC.ruleSoft}`, fontFamily: DSF.body, fontSize: 11, color: DSC.muted, lineHeight: 1.5 }}>
            <strong style={{ color: DSC.bad, fontWeight: 700 }}>Not</strong> · <span style={{ fontStyle: 'italic' }}>{w.avoid}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

window.VoiceSection = VoiceSection;
