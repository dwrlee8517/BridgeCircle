// Profile-card variations for BridgeCircle alumni directory.
// V2 + V3 are favorites. V3+ and V5+ add the V2-style italic bio.
// V2 editorial, V3 dense, V3+ dense+bio, V5 warm minimal, V5+ warm minimal+bio.

const SAMPLE = {
  name: "Priya Iyer",
  role: "Senior Product Designer",
  company: "Figma",
  year: "19",
  initials: "PI",
  color: "#dbe1ff",
  location: "San Francisco",
  bio: "Designing tools for people who design tools. Previously at Linear and Notion.",
  skills: ["Product Design", "Systems", "Mentoring"],
  mentorSlots: 2,
  available: true,
};

const dotGrid = (
  <div style={{
    position: "absolute", inset: 0,
    backgroundImage: "radial-gradient(rgba(255,255,255,.12) 1px,transparent 1px)",
    backgroundSize: "10px 10px", opacity: 0.5,
  }} />
);

// Italic Fraunces pull-quote bio used by V2, V3+, V5+
const BioQuote = ({ children, size = 13 }) => (
  <div style={{
    borderLeft: "3px solid var(--bc-secondary,#0051d5)",
    paddingLeft: 12,
    fontFamily: "Fraunces, serif", fontStyle: "italic",
    fontSize: size, color: "#191c1e", lineHeight: 1.5,
    fontVariationSettings: '"opsz" 22, "SOFT" 50',
  }}>
    "{children}"
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// V2 — EDITORIAL PORTRAIT (kept)
// ─────────────────────────────────────────────────────────────────────────────
const V2Editorial = ({ d = SAMPLE }) => (
  <div style={{ width: 320, background: "#fff", border: "1px solid #c6c6cd", borderRadius: 12, padding: 28, fontFamily: "var(--bc-font-sans)" }}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
      <Avatar initials={d.initials} size={56} color={d.color} textColor="#00174b" />
      <div style={{ flex: 1 }}>
        <Eyebrow>'{d.year} · {d.location}</Eyebrow>
        <h3 className="bc-fraunces" style={{ margin: "4px 0 0", fontSize: 26, color: "#0b1220", letterSpacing: "-.02em", lineHeight: 1.05 }}>{d.name}</h3>
      </div>
    </div>
    <p style={{ margin: "0 0 14px", fontSize: 13, color: "#45464d", lineHeight: 1.5, fontWeight: 500 }}>
      {d.role} at <span style={{ color: "#0b1220", fontWeight: 600 }}>{d.company}</span>
    </p>
    <div style={{ marginBottom: 14 }}><BioQuote size={14}>{d.bio}</BioQuote></div>
    <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
      {d.available ? <StatusPill tone="open">{d.mentorSlots} mentor slots</StatusPill> : null}
      {d.skills.map(s => <Chip key={s}>{s}</Chip>)}
    </div>
    <div style={{ display: "flex", gap: 8, paddingTop: 16, borderTop: "1px solid #eceef0" }}>
      <Button size="sm" variant="primary" iconLeft="handshake" style={{ flex: 1 }}>Connect</Button>
      <Button size="sm" variant="ghost" iconLeft="bookmark_border">Save</Button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// V3 — DENSE (kept, photo placeholder + mentor status, no stats)
// ─────────────────────────────────────────────────────────────────────────────
const V3Dense = ({ d = SAMPLE }) => (
  <div style={{ width: 320, background: "#fff", border: "1px solid #c6c6cd", borderRadius: 12, padding: 20, fontFamily: "var(--bc-font-sans)" }}>
    <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
      <div style={{
        width: 72, height: 72, borderRadius: 10, flexShrink: 0,
        background: "linear-gradient(135deg,#1e293b 0%,#3f465c 100%)",
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em",
      }}>
        {dotGrid}
        <span style={{ position: "relative" }}>{d.initials}</span>
        {d.available ? <span style={{ position: "absolute", bottom: 6, right: 6, width: 12, height: 12, borderRadius: "50%", background: "#10b981", border: "2px solid #fff" }} /> : null}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <h3 className="bc-fraunces" style={{ margin: 0, fontSize: 18, color: "#0b1220", letterSpacing: "-.01em" }}>{d.name}</h3>
          <Icon name="verified" size={15} fill={1} style={{ color: "var(--bc-secondary,#0051d5)", flexShrink: 0 }} />
        </div>
        <p style={{ margin: "0 0 6px", fontSize: 13, color: "#191c1e", fontWeight: 500 }}>
          {d.role} at <span style={{ fontWeight: 600 }}>{d.company}</span>
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <StatusPill tone="year" dot={false}>'{d.year}</StatusPill>
          {d.available ? <StatusPill tone="open">{d.mentorSlots} slots open</StatusPill> : null}
        </div>
      </div>
    </div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
      {d.skills.map(s => <Chip key={s}>{s}</Chip>)}
    </div>
    <div style={{ display: "flex", gap: 8 }}>
      <Button size="sm" variant="primary" iconLeft="handshake" style={{ flex: 1 }}>Connect</Button>
      <Button size="sm" variant="outline" iconLeft="mail">Message</Button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// V3+ — DENSE WITH BIO (V3 + italic Fraunces pull-quote)
// ─────────────────────────────────────────────────────────────────────────────
const V3Plus = ({ d = SAMPLE }) => (
  <div style={{ width: 320, background: "#fff", border: "1px solid #c6c6cd", borderRadius: 12, padding: 20, fontFamily: "var(--bc-font-sans)" }}>
    <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
      <div style={{
        width: 72, height: 72, borderRadius: 10, flexShrink: 0,
        background: "linear-gradient(135deg,#1e293b 0%,#3f465c 100%)",
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em",
      }}>
        {dotGrid}
        <span style={{ position: "relative" }}>{d.initials}</span>
        {d.available ? <span style={{ position: "absolute", bottom: 6, right: 6, width: 12, height: 12, borderRadius: "50%", background: "#10b981", border: "2px solid #fff" }} /> : null}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <h3 className="bc-fraunces" style={{ margin: 0, fontSize: 18, color: "#0b1220", letterSpacing: "-.01em" }}>{d.name}</h3>
          <Icon name="verified" size={15} fill={1} style={{ color: "var(--bc-secondary,#0051d5)", flexShrink: 0 }} />
        </div>
        <p style={{ margin: "0 0 6px", fontSize: 13, color: "#191c1e", fontWeight: 500 }}>
          {d.role} at <span style={{ fontWeight: 600 }}>{d.company}</span>
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <StatusPill tone="year" dot={false}>'{d.year}</StatusPill>
          {d.available ? <StatusPill tone="open">{d.mentorSlots} slots open</StatusPill> : null}
        </div>
      </div>
    </div>
    <div style={{ marginBottom: 12 }}><BioQuote>{d.bio}</BioQuote></div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
      {d.skills.map(s => <Chip key={s}>{s}</Chip>)}
    </div>
    <div style={{ display: "flex", gap: 8 }}>
      <Button size="sm" variant="primary" iconLeft="handshake" style={{ flex: 1 }}>Connect</Button>
      <Button size="sm" variant="outline" iconLeft="mail">Message</Button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// V5 — WARM MINIMAL (kept, no photo)
// ─────────────────────────────────────────────────────────────────────────────
const V5MentorFirst = ({ d = SAMPLE }) => (
  <div style={{ width: 300, background: "#fafbfd", border: "1px solid #eceef0", borderRadius: 12, padding: "22px 22px 18px", fontFamily: "var(--bc-font-sans)" }}>
    <div style={{ marginBottom: 14 }}>
      {d.available
        ? <StatusPill tone="open" dot>{d.mentorSlots} mentor slots open</StatusPill>
        : <StatusPill tone="muted">Not mentoring</StatusPill>}
    </div>
    <h3 className="bc-fraunces" style={{ margin: "0 0 4px", fontSize: 24, color: "#0b1220", letterSpacing: "-.02em", lineHeight: 1.1 }}>{d.name}</h3>
    <p style={{ margin: "0 0 10px", fontSize: 13, color: "#45464d", fontWeight: 500, lineHeight: 1.4 }}>
      {d.role} at <span style={{ color: "#0b1220", fontWeight: 600 }}>{d.company}</span>
    </p>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, fontSize: 12, color: "#76777d" }}>
      <span className="bc-fraunces" style={{ fontSize: 15, color: "var(--bc-secondary,#0051d5)", fontWeight: 600 }}>'{d.year}</span>
      <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#c6c6cd" }} />
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <Icon name="location_on" size={13} />{d.location}
      </span>
    </div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
      {d.skills.map(s => <Chip key={s}>{s}</Chip>)}
    </div>
    <div style={{ display: "flex", gap: 8 }}>
      <Button size="sm" variant="primary" iconLeft="handshake" style={{ flex: 1 }}>Connect</Button>
      <Button size="sm" variant="ghost" iconLeft="mail">Message</Button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// V5+ — WARM MINIMAL WITH BIO
// ─────────────────────────────────────────────────────────────────────────────
const V5Plus = ({ d = SAMPLE }) => (
  <div style={{ width: 300, background: "#fafbfd", border: "1px solid #eceef0", borderRadius: 12, padding: "22px 22px 18px", fontFamily: "var(--bc-font-sans)" }}>
    <div style={{ marginBottom: 14 }}>
      {d.available
        ? <StatusPill tone="open" dot>{d.mentorSlots} mentor slots open</StatusPill>
        : <StatusPill tone="muted">Not mentoring</StatusPill>}
    </div>
    <h3 className="bc-fraunces" style={{ margin: "0 0 4px", fontSize: 24, color: "#0b1220", letterSpacing: "-.02em", lineHeight: 1.1 }}>{d.name}</h3>
    <p style={{ margin: "0 0 12px", fontSize: 13, color: "#45464d", fontWeight: 500, lineHeight: 1.4 }}>
      {d.role} at <span style={{ color: "#0b1220", fontWeight: 600 }}>{d.company}</span>
    </p>
    <div style={{ marginBottom: 12 }}><BioQuote>{d.bio}</BioQuote></div>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, fontSize: 12, color: "#76777d" }}>
      <span className="bc-fraunces" style={{ fontSize: 15, color: "var(--bc-secondary,#0051d5)", fontWeight: 600 }}>'{d.year}</span>
      <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#c6c6cd" }} />
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <Icon name="location_on" size={13} />{d.location}
      </span>
    </div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
      {d.skills.map(s => <Chip key={s}>{s}</Chip>)}
    </div>
    <div style={{ display: "flex", gap: 8 }}>
      <Button size="sm" variant="primary" iconLeft="handshake" style={{ flex: 1 }}>Connect</Button>
      <Button size="sm" variant="ghost" iconLeft="mail">Message</Button>
    </div>
  </div>
);

Object.assign(window, {
  V2Editorial, V3Dense, V3Plus, V5MentorFirst, V5Plus, SAMPLE,
  // legacy aliases so older index.html mappings don't break
  V1Current: V3Plus, V4Horizontal: V3Plus,
});
