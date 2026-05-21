// Dashboard ("Home") — welcomes the alum, shows upcoming events, mentor matches, notifications.
const Dashboard = ({ onOpenMentor, onOpenDirectory, onOpenEvents }) => {
  return (
    <div style={{ background: "#fafbfd", minHeight: "100vh" }}>
      {/* Hero — soft midnight wash with editorial wordmark */}
      <section
        style={{
          background:
            "linear-gradient(135deg,#0b1220 0%,#131b2e 50%,#1e293b 100%)",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(rgba(180,197,255,.10) 1.5px, transparent 1.5px)",
            backgroundSize: "24px 24px",
            opacity: 0.6,
          }}
        />
        {/* Decorative two-circle motif */}
        <svg
          width="520"
          height="380"
          viewBox="0 0 520 380"
          style={{ position: "absolute", right: -60, top: -40, opacity: 0.18 }}
        >
          <circle cx="200" cy="190" r="140" fill="none" stroke="#b4c5ff" strokeWidth="1.5" />
          <circle cx="320" cy="190" r="140" fill="none" stroke="#316bf3" strokeWidth="1.5" />
        </svg>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "64px 32px 56px",
            position: "relative",
          }}
        >
          <Eyebrow style={{ color: "#b4c5ff" }}>Class of 2018 · Welcome back</Eyebrow>
          <h1 className="bc-fraunces"
            style={{
              fontWeight: 700,
              fontSize: 56,
              lineHeight: 1.05,
              letterSpacing: "-.025em",
              margin: "12px 0 16px",
              maxWidth: 720,
            }}
          >
            Good morning, Sarah.
            <br />
            <span style={{ color: "#b4c5ff" }}>Your circle is active today.</span>
          </h1>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.55,
              color: "#cbd5e1",
              maxWidth: 560,
              margin: "0 0 28px",
            }}
          >
            Three mentees from the Class of '24 requested guidance, and the
            Spring Reunion is two weeks out.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Button variant="primary-on-dark" size="lg" iconLeft="handshake" onClick={onOpenMentor}>
              Review mentor requests
            </Button>
            <Button variant="ghost-light" size="lg" iconLeft="event" onClick={onOpenEvents}>
              Upcoming events
            </Button>
          </div>

          {/* Stat strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 0,
              marginTop: 56,
              borderTop: "1px solid rgba(180,197,255,.18)",
              paddingTop: 28,
            }}
          >
            {[
              { n: "12,840", l: "Alumni in network" },
              { n: "184", l: "Active mentorships" },
              { n: "27", l: "Events this season" },
              { n: "Class '18", l: "Your cohort" },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  borderLeft: i === 0 ? "none" : "1px solid rgba(180,197,255,.18)",
                  padding: "0 24px",
                }}
              >
                <div className="bc-fraunces"
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    letterSpacing: "-.02em",
                  }}
                >
                  {s.n}
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Body grid */}
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "48px 32px",
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 32,
        }}
      >
        {/* LEFT: Mentor matches */}
        <div>
          <SectionHeader
            eyebrow="Mentorship"
            title="Mentees waiting on you"
            action={<a onClick={onOpenMentor} style={linkStyle}>View all 3 →</a>}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {sampleMentees.map((m) => (
              <MenteeRequestCard key={m.name} {...m} onOpen={onOpenMentor} />
            ))}
          </div>

          <div style={{ height: 48 }} />
          <SectionHeader
            eyebrow="Network"
            title="New alumni in your area"
            action={<a onClick={onOpenDirectory} style={linkStyle}>Open directory →</a>}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 16,
            }}
          >
            {sampleAlumni.slice(0, 3).map((a) => (
              <ProfileTile key={a.name} {...a} onOpen={onOpenDirectory} />
            ))}
          </div>
        </div>

        {/* RIGHT: Activity / upcoming */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <UpcomingEventCard onOpenEvents={onOpenEvents} />
          <NotificationFeed />
        </div>
      </div>
    </div>
  );
};

const linkStyle = {
  fontFamily: "var(--bc-font-sans)",
  fontSize: 13,
  fontWeight: 600,
  color: "#0051d5",
  cursor: "pointer",
};

const SectionHeader = ({ eyebrow, title, action }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 20,
    }}
  >
    <div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="bc-fraunces"
        style={{
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-.02em",
          margin: "6px 0 0",
          color: "#0b1220",
        }}
      >
        {title}
      </h2>
    </div>
    {action}
  </div>
);

const MenteeRequestCard = ({ name, year, initials, color, ask, onOpen }) => (
  <Card hover style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: 20 }}>
    <Avatar initials={initials} size={48} color={color} textColor="#00174b" />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0b1220" }}>
          {name}
        </h3>
        <StatusPill tone="year" dot={false}>Class of {year}</StatusPill>
        <StatusPill tone="warn">Pending response</StatusPill>
      </div>
      <p style={{ margin: 0, fontSize: 14, color: "#45464d", lineHeight: 1.5 }}>
        "{ask}"
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <Button size="sm" variant="primary" onClick={onOpen}>Accept & schedule</Button>
        <Button size="sm" variant="ghost">View profile</Button>
        <Button size="sm" variant="ghost" style={{ color: "#76777d" }}>Decline</Button>
      </div>
    </div>
  </Card>
);

const ProfileTile = ({ name, role, year, initials, color, location, onOpen }) => {
  const company = role.split("·")[1]?.trim() || "";
  const title = role.split("·")[0]?.trim() || role;
  const bio = "Open to mentoring junior alumni in the network.";
  const d = { name, role: title, company, year, initials, color, location, bio, skills: [], mentorSlots: 1, available: true };
  return (
    <div onClick={onOpen} style={{ cursor: "pointer" }}>
      <V3Plus d={d} />
    </div>
  );
};

const UpcomingEventCard = ({ onOpenEvents }) => (
  <Card padding={0} style={{ overflow: "hidden" }}>
    <div
      style={{
        background: "linear-gradient(135deg,#0b1220 0%,#0051d5 100%)",
        height: 110,
        position: "relative",
        padding: 20,
        color: "#fff",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,.10) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      <Eyebrow style={{ color: "#b4c5ff", position: "relative" }}>Featured Event</Eyebrow>
      <div
        style={{
          position: "relative",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-.015em",
          marginTop: 8,
        }}
      >
        Spring Alumni Reunion
      </div>
    </div>
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <Icon name="calendar_month" size={18} style={{ color: "#0051d5" }} />
        <span style={{ fontSize: 14, color: "#191c1e", fontWeight: 600 }}>
          May 18, 2026 · 6:00 PM
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <Icon name="location_on" size={18} style={{ color: "#0051d5" }} />
        <span style={{ fontSize: 14, color: "#45464d" }}>
          Alumni Hall, San Francisco
        </span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          paddingBottom: 16,
          borderBottom: "1px solid #eceef0",
        }}
      >
        <div style={{ display: "flex" }}>
          {[
            { i: "JR", c: "#dbe1ff" },
            { i: "MK", c: "#fef3c7" },
            { i: "AT", c: "#d1fae5" },
            { i: "LP", c: "#ffdad6" },
          ].map((a, idx) => (
            <Avatar
              key={idx}
              initials={a.i}
              size={28}
              color={a.c}
              textColor="#00174b"
              style={{ marginLeft: idx === 0 ? 0 : -8, border: "2px solid #fff" }}
            />
          ))}
        </div>
        <span style={{ fontSize: 13, color: "#45464d", alignSelf: "center" }}>
          247 alumni attending
        </span>
      </div>
      <Button variant="primary" style={{ width: "100%" }} onClick={onOpenEvents}>
        RSVP now
      </Button>
    </div>
  </Card>
);

const NotificationFeed = () => (
  <Card padding={0}>
    <div
      style={{
        padding: "16px 20px",
        borderBottom: "1px solid #eceef0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0b1220" }}>
        Recent activity
      </h3>
      <span style={{ fontSize: 12, color: "#0051d5", fontWeight: 600, cursor: "pointer" }}>
        Mark all read
      </span>
    </div>
    {[
      {
        icon: "handshake",
        tone: "#0051d5",
        title: "Jordan Reyes accepted your mentor invite",
        time: "12m ago",
        unread: true,
      },
      {
        icon: "event",
        tone: "#10b981",
        title: "Maya Khan added you to 'Coffee with C/O '24'",
        time: "2h ago",
        unread: true,
      },
      {
        icon: "campaign",
        tone: "#f59e0b",
        title: "Reunion venue confirmed — RSVPs close Friday",
        time: "Yesterday",
      },
      {
        icon: "thumb_up",
        tone: "#0051d5",
        title: "Your post received 18 reactions in #engineering",
        time: "2d ago",
      },
    ].map((n, i) => (
      <div
        key={i}
        style={{
          padding: "14px 20px",
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          borderBottom: i === 3 ? "none" : "1px solid #eceef0",
          background: n.unread ? "rgba(0,81,213,.03)" : "#fff",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: `${n.tone}15`,
            color: n.tone,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon name={n.icon} size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "#191c1e",
              lineHeight: 1.45,
              fontWeight: n.unread ? 600 : 500,
            }}
          >
            {n.title}
          </p>
          <span style={{ fontSize: 11, color: "#76777d" }}>{n.time}</span>
        </div>
        {n.unread ? (
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#0051d5",
              flexShrink: 0,
              marginTop: 6,
            }}
          />
        ) : null}
      </div>
    ))}
  </Card>
);

// Sample data
const sampleMentees = [
  {
    name: "Jordan Reyes",
    year: "2024",
    initials: "JR",
    color: "#dbe1ff",
    ask: "Looking for guidance on transitioning from research to industry — I see you made that jump in 2020.",
  },
  {
    name: "Maya Khan",
    year: "2024",
    initials: "MK",
    color: "#fef3c7",
    ask: "Hoping to chat about negotiating my first PM offer. Your blog post on this was incredibly helpful.",
  },
  {
    name: "Alex Tanaka",
    year: "2023",
    initials: "AT",
    color: "#d1fae5",
    ask: "Would love your perspective on starting a fund out of school. I have a deck I'd love your eyes on.",
  },
];

const sampleAlumni = [
  {
    name: "Priya Iyer",
    role: "Senior Designer · Figma",
    year: "19",
    initials: "PI",
    color: "#dbe1ff",
    location: "San Francisco",
  },
  {
    name: "Marcus Chen",
    role: "Founder · Beacon Labs",
    year: "16",
    initials: "MC",
    color: "#fef3c7",
    location: "Brooklyn, NY",
  },
  {
    name: "Lena Park",
    role: "Director of Eng · Stripe",
    year: "14",
    initials: "LP",
    color: "#ffdad6",
    location: "Seattle",
  },
];

Object.assign(window, {
  Dashboard,
  SectionHeader,
  MenteeRequestCard,
  ProfileTile,
  UpcomingEventCard,
  NotificationFeed,
  sampleMentees,
  sampleAlumni,
  linkStyle,
});
