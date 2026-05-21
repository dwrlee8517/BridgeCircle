// BridgeCircle UI — Extended Card Components
// Depends on Primitives.jsx being loaded first (Icon, Button, Avatar, Chip, StatusPill, Card, Eyebrow, Wordmark on window).

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const cardTokens = {
  white:   { bg: "#ffffff",  border: "#c6c6cd", text: "#191c1e", sub: "#45464d" },
  low:     { bg: "#f2f4f6",  border: "#eceef0", text: "#191c1e", sub: "#45464d" },
  dark:    { bg: "#131b2e",  border: "#1e293b", text: "#ffffff", sub: "#7c839b" },
  sapphire:{ bg: "#0051d5",  border: "#003ea8", text: "#ffffff", sub: "#b4c5ff" },
};

const useHover = () => {
  const [h, setH] = React.useState(false);
  return [h, { onMouseEnter: () => setH(true), onMouseLeave: () => setH(false) }];
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. EVENT CARD
// Use case: upcoming events feed, sidebar widget, RSVP list
// ─────────────────────────────────────────────────────────────────────────────
const EventCard = ({
  month = "OCT",
  day = "24",
  title = "Annual Founders Summit",
  location = "Main Hall, SF",
  time = "10:00 AM",
  attendees = 142,
  rsvp = false,
  tag = "Networking",
}) => {
  const [hover, hProps] = useHover();
  const [going, setGoing] = React.useState(rsvp);

  return (
    <div
      {...hProps}
      style={{
        background: "#fff",
        border: `1px solid ${hover ? "#0051d5" : "#c6c6cd"}`,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: hover ? "0 4px 20px -4px rgba(19,27,46,.08)" : "none",
        transition: "all 200ms cubic-bezier(0.2,0,0,1)",
        fontFamily: "var(--bc-font-sans)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Date banner */}
      <div style={{
        background: "#0b1220",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* dot texture */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(255,255,255,.08) 1px,transparent 1px)",
          backgroundSize: "10px 10px",
        }} />
        <div style={{
          position: "relative",
          background: "#0051d5",
          borderRadius: 8,
          padding: "6px 12px",
          textAlign: "center",
          minWidth: 52,
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#b4c5ff", letterSpacing: ".1em", textTransform: "uppercase" }}>{month}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#fff", lineHeight: 1, letterSpacing: "-.02em" }}>{day}</div>
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.3 }}>{title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <Chip style={{ background: "rgba(255,255,255,.10)", color: "#bec6e0", fontSize: 11 }}>{tag}</Chip>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 20px", flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#45464d" }}>
            <Icon name="schedule" size={14} style={{ color: "#76777d" }} />
            {time}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#45464d" }}>
            <Icon name="location_on" size={14} style={{ color: "#76777d" }} />
            {location}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#45464d" }}>
            <Icon name="group" size={14} style={{ color: "#76777d" }} />
            {attendees} attending
          </div>
        </div>
        <Button
          variant={going ? "outline" : "primary"}
          size="sm"
          iconLeft={going ? "check" : "event_available"}
          style={{ width: "100%" }}
          onClick={() => setGoing(g => !g)}
        >
          {going ? "Going · Cancel RSVP" : "RSVP"}
        </Button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. STAT / METRIC CARD
// Use case: dashboard overview, analytics panels, network summary
// ─────────────────────────────────────────────────────────────────────────────
const StatCard = ({
  label = "New Connections",
  value = "248",
  delta = "+12%",
  positive = true,
  sub = "vs. last 30 days",
  icon = "groups",
  dark = false,
}) => {
  const [hover, hProps] = useHover();
  const tok = dark ? cardTokens.dark : cardTokens.white;

  return (
    <div
      {...hProps}
      style={{
        background: tok.bg,
        border: `1px solid ${dark ? tok.border : hover ? "#0051d5" : tok.border}`,
        borderRadius: 12,
        padding: "20px 22px",
        boxShadow: (!dark && hover) ? "0 4px 20px -4px rgba(19,27,46,.08)" : "none",
        transition: "all 200ms cubic-bezier(0.2,0,0,1)",
        fontFamily: "var(--bc-font-sans)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <Eyebrow style={{ color: dark ? "#7c839b" : "#76777d" }}>{label}</Eyebrow>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 8,
          background: dark ? "rgba(255,255,255,.06)" : "#eceef0",
          color: dark ? "#bec6e0" : "#45464d",
          flexShrink: 0,
        }}>
          <Icon name={icon} size={16} />
        </span>
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-.02em", color: tok.text, lineHeight: 1, marginBottom: 8 }}>
        {value}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          fontSize: 12,
          fontWeight: 700,
          color: positive ? "#047857" : "#ba1a1a",
          background: positive ? "#d1fae5" : "#ffdad6",
          borderRadius: 4,
          padding: "2px 7px",
        }}>
          <Icon name={positive ? "trending_up" : "trending_up"} size={12} style={{ transform: positive ? "none" : "scaleY(-1)" }} />
          {delta}
        </span>
        <span style={{ fontSize: 12, color: dark ? "#7c839b" : "#76777d" }}>{sub}</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. NOTIFICATION CARD
// Use case: notification tray, activity feed, inbox items
// ─────────────────────────────────────────────────────────────────────────────
const NotificationCard = ({
  type = "connect",   // "connect" | "event" | "mention" | "system"
  actor = "Priya Iyer",
  actorInitials = "PI",
  actorColor = "#dbe1ff",
  message = "wants to connect with you",
  time = "2 min ago",
  unread = true,
  onDismiss,
}) => {
  const [hover, hProps] = useHover();
  const [dismissed, setDismissed] = React.useState(false);

  const typeConfig = {
    connect:  { icon: "person_add",  iconBg: "#dbe1ff",    iconFg: "#0051d5"  },
    event:    { icon: "event",       iconBg: "#d1fae5",    iconFg: "#047857"  },
    mention:  { icon: "chat",        iconBg: "#fef3c7",    iconFg: "#92400e"  },
    system:   { icon: "auto_awesome",iconBg: "#eceef0",    iconFg: "#45464d"  },
  };
  const cfg = typeConfig[type] || typeConfig.system;

  if (dismissed) return null;

  return (
    <div
      {...hProps}
      style={{
        background: unread ? "#f7f9ff" : "#fff",
        border: `1px solid ${hover ? "#0051d5" : unread ? "#b4c5ff" : "#eceef0"}`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        boxShadow: hover ? "0 4px 20px -4px rgba(19,27,46,.08)" : "none",
        transition: "all 200ms cubic-bezier(0.2,0,0,1)",
        fontFamily: "var(--bc-font-sans)",
        position: "relative",
        cursor: "default",
      }}
    >
      {/* Unread dot */}
      {unread && (
        <span style={{
          position: "absolute",
          top: 16,
          left: -5,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#0051d5",
          border: "2px solid #fff",
        }} />
      )}

      {/* Icon badge over avatar */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <Avatar initials={actorInitials} size={40} color={actorColor} textColor="#00174b" />
        <span style={{
          position: "absolute",
          bottom: -2,
          right: -2,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: cfg.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid #fff",
        }}>
          <Icon name={cfg.icon} size={10} style={{ color: cfg.iconFg }} />
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 4px", fontSize: 13, color: "#191c1e", lineHeight: 1.5 }}>
          <strong style={{ fontWeight: 600 }}>{actor}</strong>{" "}
          <span style={{ color: "#45464d" }}>{message}</span>
        </p>
        <span style={{ fontSize: 11, color: "#76777d", fontWeight: 500 }}>{time}</span>
        {type === "connect" && (
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <Button variant="primary" size="sm" iconLeft="check">Accept</Button>
            <Button variant="ghost" size="sm">Ignore</Button>
          </div>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => { setDismissed(true); onDismiss && onDismiss(); }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 4,
          borderRadius: 6,
          color: "#76777d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          opacity: hover ? 1 : 0,
          transition: "opacity 150ms",
        }}
        aria-label="Dismiss"
      >
        <Icon name="close" size={14} />
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. OPPORTUNITY CARD
// Use case: jobs board, mentorship listings, open roles feed
// ─────────────────────────────────────────────────────────────────────────────
const OpportunityCard = ({
  type = "job",       // "job" | "mentorship" | "volunteer"
  title = "Head of Product",
  company = "Loom",
  companyInitials = "LO",
  companyColor = "#fef3c7",
  location = "Remote",
  tags = ["Product", "Series B", "B2B SaaS"],
  posted = "3 days ago",
  featured = false,
}) => {
  const [hover, hProps] = useHover();
  const [saved, setSaved] = React.useState(false);

  const typeLabel = { job: "Job", mentorship: "Mentorship", volunteer: "Volunteer" }[type] || type;
  const typeTone  = { job: "info", mentorship: "open", volunteer: "warn" }[type] || "info";

  return (
    <div
      {...hProps}
      style={{
        background: featured ? "#f7f9ff" : "#fff",
        border: `1px solid ${featured ? "#b4c5ff" : hover ? "#0051d5" : "#c6c6cd"}`,
        borderRadius: 12,
        padding: "18px 20px",
        boxShadow: hover ? "0 4px 20px -4px rgba(19,27,46,.08)" : featured ? "0 2px 12px -4px rgba(0,81,213,.10)" : "none",
        transition: "all 200ms cubic-bezier(0.2,0,0,1)",
        fontFamily: "var(--bc-font-sans)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <Avatar
          initials={companyInitials}
          size={44}
          color={companyColor}
          textColor="#0b1220"
          style={{ borderRadius: 10 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
            <StatusPill tone={typeTone} dot={false}>{typeLabel}</StatusPill>
            {featured && <StatusPill tone="info" dot={false}>Featured</StatusPill>}
          </div>
          <h3 style={{ margin: "4px 0 2px", fontSize: 15, fontWeight: 600, color: "#0b1220", lineHeight: 1.3 }}>{title}</h3>
          <p style={{ margin: 0, fontSize: 13, color: "#45464d", fontWeight: 500 }}>{company}</p>
        </div>
        <button
          onClick={() => setSaved(s => !s)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: saved ? "#0051d5" : "#76777d",
            padding: 4,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          aria-label={saved ? "Unsave" : "Save"}
        >
          <Icon name={saved ? "bookmark" : "bookmark_border"} size={18} />
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 12, color: "#76777d" }}>
        <Icon name="location_on" size={13} />
        {location}
        <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#c6c6cd", flexShrink: 0 }} />
        <Icon name="schedule" size={13} />
        {posted}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {tags.map(t => <Chip key={t}>{t}</Chip>)}
      </div>

      <div style={{ display: "flex", gap: 8, paddingTop: 14, borderTop: "1px solid #eceef0" }}>
        <Button variant="primary" size="sm" style={{ flex: 1 }}>Apply Now</Button>
        <Button variant="outline" size="sm" iconRight="open_in_new">Details</Button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. ANNOUNCEMENT CARD
// Use case: featured announcements, alumni spotlights, campaign banners
// Two variants: dark premium + light editorial
// ─────────────────────────────────────────────────────────────────────────────
const AnnouncementCard = ({
  variant = "dark",   // "dark" | "light"
  eyebrow = "Alumni Spotlight",
  headline = "From Classrooms to Boardrooms",
  body = "Celebrating 10 years of BridgeCircle alumni shaping industry worldwide.",
  cta = "Read Story",
  ctaIcon = "arrow_forward",
}) => {
  const [hover, hProps] = useHover();
  const dark = variant === "dark";

  return (
    <div
      {...hProps}
      style={{
        background: dark ? "#0b1220" : "#f7f9ff",
        border: `1px solid ${dark ? "#1e293b" : "#b4c5ff"}`,
        borderRadius: 12,
        padding: "24px 24px 20px",
        overflow: "hidden",
        position: "relative",
        boxShadow: hover ? (dark ? "0 8px 32px -8px rgba(0,81,213,.20)" : "0 4px 20px -4px rgba(0,81,213,.10)") : "none",
        transition: "all 200ms cubic-bezier(0.2,0,0,1)",
        fontFamily: "var(--bc-font-sans)",
      }}
    >
      {/* Background texture */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: dark
          ? "radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px)"
          : "radial-gradient(rgba(0,81,213,.06) 1px,transparent 1px)",
        backgroundSize: "14px 14px",
        pointerEvents: "none",
      }} />

      {/* Accent glow */}
      <div style={{
        position: "absolute",
        top: -40,
        right: -40,
        width: 160,
        height: 160,
        borderRadius: "50%",
        background: dark
          ? "radial-gradient(circle, rgba(0,81,213,.25) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(0,81,213,.10) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative" }}>
        <p style={{
          fontFamily: "Fraunces, serif",
          fontStyle: "italic",
          fontSize: 11,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: ".18em",
          color: dark ? "#7c839b" : "#76777d",
          margin: "0 0 12px",
        }}>{eyebrow}</p>

        <h2
          className="bc-fraunces"
          style={{
            margin: "0 0 10px",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-.02em",
            lineHeight: 1.2,
            color: dark ? "#fff" : "#0b1220",
          }}
        >
          {headline}
        </h2>

        <p style={{
          margin: "0 0 20px",
          fontSize: 13,
          lineHeight: 1.6,
          color: dark ? "#7c839b" : "#45464d",
        }}>
          {body}
        </p>

        <Button
          variant={dark ? "primary-on-dark" : "primary"}
          size="sm"
          iconRight={ctaIcon}
        >
          {cta}
        </Button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. THREAD / DISCUSSION CARD
// Use case: community feed, group discussions, Q&A threads
// ─────────────────────────────────────────────────────────────────────────────
const AvatarStack = ({ people = [], size = 28, max = 4 }) => {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {shown.map((p, i) => (
        <div
          key={i}
          style={{
            marginLeft: i === 0 ? 0 : -8,
            border: "2px solid #fff",
            borderRadius: "50%",
            zIndex: shown.length - i,
            position: "relative",
          }}
        >
          <Avatar initials={p.initials} size={size} color={p.color} textColor="#00174b" />
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          marginLeft: -8,
          width: size,
          height: size,
          borderRadius: "50%",
          background: "#eceef0",
          border: "2px solid #fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          color: "#45464d",
          zIndex: 0,
          flexShrink: 0,
        }}>
          +{extra}
        </div>
      )}
    </div>
  );
};

const ThreadCard = ({
  topic = "Career Transitions",
  title = "How did you navigate moving from IC to manager at a startup?",
  author = "Marcus Webb",
  authorInitials = "MW",
  authorColor = "#d1fae5",
  authorRole = "Eng Manager · Stripe",
  time = "4h ago",
  replies = 18,
  likes = 34,
  participants = [
    { initials: "ER", color: "#dbe1ff" },
    { initials: "PI", color: "#fef3c7" },
    { initials: "JK", color: "#d1fae5" },
    { initials: "TL", color: "#ffdad6" },
    { initials: "AM", color: "#eceef0" },
  ],
  pinned = false,
}) => {
  const [hover, hProps] = useHover();
  const [liked, setLiked] = React.useState(false);

  return (
    <div
      {...hProps}
      style={{
        background: "#fff",
        border: `1px solid ${hover ? "#0051d5" : pinned ? "#b4c5ff" : "#c6c6cd"}`,
        borderRadius: 12,
        padding: "18px 20px",
        boxShadow: hover ? "0 4px 20px -4px rgba(19,27,46,.08)" : pinned ? "0 2px 12px -4px rgba(0,81,213,.08)" : "none",
        transition: "all 200ms cubic-bezier(0.2,0,0,1)",
        fontFamily: "var(--bc-font-sans)",
        cursor: "pointer",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Chip style={{ background: "#dbe1ff", color: "#00174b" }}>{topic}</Chip>
        {pinned && (
          <Chip style={{ background: "#fef3c7", color: "#92400e" }}>Pinned</Chip>
        )}
      </div>

      {/* Title */}
      <h3 style={{
        margin: "0 0 14px",
        fontSize: 15,
        fontWeight: 600,
        color: "#0b1220",
        lineHeight: 1.4,
        letterSpacing: "-.01em",
      }}>
        {title}
      </h3>

      {/* Author row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <Avatar initials={authorInitials} size={30} color={authorColor} textColor="#00174b" />
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#191c1e" }}>{author}</span>
          <span style={{ fontSize: 12, color: "#76777d", marginLeft: 6 }}>{authorRole}</span>
        </div>
        <span style={{ fontSize: 12, color: "#76777d", marginLeft: "auto" }}>{time}</span>
      </div>

      {/* Footer: participants + stats */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 14,
        borderTop: "1px solid #eceef0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AvatarStack people={participants} size={24} max={4} />
          <span style={{ fontSize: 12, color: "#76777d" }}>{replies} replies</span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); setLiked(l => !l); }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            color: liked ? "#0051d5" : "#76777d",
            padding: "4px 8px",
            borderRadius: 6,
            transition: "background 150ms",
          }}
          aria-label="Like"
        >
          <Icon name="thumb_up" size={14} />
          {liked ? likes + 1 : likes}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. EMPTY STATE CARD
// Use case: zero-state for any list/feed — reusable with icon + message + CTA
// ─────────────────────────────────────────────────────────────────────────────
const EmptyCard = ({
  icon = "hub",
  headline = "No connections yet",
  body = "Start by searching for alumni from your cohort.",
  cta = "Search alumni",
  ctaIcon = "search",
  onCta,
}) => (
  <div style={{
    background: "#f2f4f6",
    border: "1.5px dashed #c6c6cd",
    borderRadius: 12,
    padding: "36px 24px",
    textAlign: "center",
    fontFamily: "var(--bc-font-sans)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  }}>
    <div style={{
      width: 48,
      height: 48,
      borderRadius: 12,
      background: "#eceef0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#76777d",
      marginBottom: 4,
    }}>
      <Icon name={icon} size={22} />
    </div>
    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0b1220" }}>{headline}</h3>
    <p style={{ margin: "0 0 16px", fontSize: 13, color: "#45464d", lineHeight: 1.5, maxWidth: 260 }}>{body}</p>
    {cta && (
      <Button variant="outline" size="sm" iconLeft={ctaIcon} onClick={onCta}>{cta}</Button>
    )}
  </div>
);

// Export all to window
Object.assign(window, {
  EventCard,
  StatCard,
  NotificationCard,
  OpportunityCard,
  AnnouncementCard,
  ThreadCard,
  EmptyCard,
  AvatarStack,
});
