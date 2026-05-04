// Events — featured event hero, list, RSVP detail.
const Events = () => {
  const [selected, setSelected] = React.useState(0);
  const events = [
    {
      title: "Spring Alumni Reunion",
      date: "May 18, 2026",
      time: "6:00 PM – 11:00 PM",
      location: "Alumni Hall · San Francisco",
      attending: 247,
      type: "Reunion",
      description:
        "The flagship gathering of the year. Dinner, the Annual Address from the founding class, and late-night drinks at the Bridge Bar.",
      cohorts: ["'14", "'15", "'16", "'17", "'18", "'19"],
    },
    {
      title: "Founders' Lunch — NYC",
      date: "May 6, 2026",
      time: "12:30 PM",
      location: "The Wing · Soho",
      attending: 18,
      type: "Mixer",
      description:
        "Closed-door lunch for alumni currently building. RSVP by May 3.",
    },
    {
      title: "Coffee with Class of '24",
      date: "May 9, 2026",
      time: "9:00 AM",
      location: "Virtual",
      attending: 84,
      type: "Mentorship",
      description:
        "Drop-in office hours where senior alumni answer questions from this year's graduating class.",
    },
    {
      title: "Engineering Leadership Panel",
      date: "May 22, 2026",
      time: "5:30 PM",
      location: "Stripe HQ · South San Francisco",
      attending: 62,
      type: "Panel",
      description:
        "Three engineering leaders from across the network on hiring, ICs vs management, and AI's effect on team shape.",
    },
  ];
  const ev = events[selected];

  return (
    <div style={{ background: "#fafbfd", minHeight: "100vh" }}>
      {/* Hero */}
      <section
        style={{
          background: "#fff",
          borderBottom: "1px solid #eceef0",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 32px 32px" }}>
          <Eyebrow>Events · 27 this season</Eyebrow>
          <h1 className="bc-fraunces"
            style={{
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: "-.025em",
              margin: "8px 0 0",
              color: "#0b1220",
            }}
          >
            What's happening across the circle.
          </h1>
        </div>
      </section>

      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "32px",
          display: "grid",
          gridTemplateColumns: "1fr 1.4fr",
          gap: 32,
        }}
      >
        {/* List */}
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {["All", "Reunion", "Mixer", "Panel", "Mentorship"].map((f, i) => (
              <button
                key={f}
                style={{
                  ...bcButtonBase,
                  padding: "7px 14px",
                  fontSize: 13,
                  background: i === 0 ? "#0b1220" : "#fff",
                  color: i === 0 ? "#fff" : "#0b1220",
                  borderColor: i === 0 ? "#0b1220" : "#c6c6cd",
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {events.map((e, i) => (
              <EventListItem
                key={e.title}
                {...e}
                active={i === selected}
                onClick={() => setSelected(i)}
              />
            ))}
          </div>
        </div>

        {/* Detail */}
        <div>
          <Card padding={0} style={{ overflow: "hidden", position: "sticky", top: 96 }}>
            <div
              style={{
                background:
                  "linear-gradient(135deg,#0b1220 0%,#003ea8 60%,#0051d5 100%)",
                color: "#fff",
                padding: "32px 28px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "radial-gradient(rgba(255,255,255,.10) 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                  opacity: 0.6,
                }}
              />
              <svg
                width="200"
                height="200"
                viewBox="0 0 200 200"
                style={{ position: "absolute", right: -40, top: -40, opacity: 0.25 }}
              >
                <circle cx="80" cy="100" r="60" fill="none" stroke="#b4c5ff" strokeWidth="1.5" />
                <circle cx="130" cy="100" r="60" fill="none" stroke="#fff" strokeWidth="1.5" />
              </svg>
              <div style={{ position: "relative" }}>
                <StatusPill tone="info" dot={false}>{ev.type}</StatusPill>
                <h2 className="bc-fraunces"
                  style={{
                    fontSize: 36,
                    fontWeight: 700,
                    letterSpacing: "-.02em",
                    margin: "12px 0 8px",
                    lineHeight: 1.1,
                  }}
                >
                  {ev.title}
                </h2>
                <p style={{ fontSize: 14, color: "#cbd5e1", margin: 0, maxWidth: 480, lineHeight: 1.55 }}>
                  {ev.description}
                </p>
              </div>
            </div>
            <div style={{ padding: 28 }}>
              <DetailRow icon="calendar_month" label="Date" value={ev.date} />
              <DetailRow icon="schedule" label="Time" value={ev.time} />
              <DetailRow icon="location_on" label="Location" value={ev.location} />
              <DetailRow icon="groups" label="Attending" value={`${ev.attending} alumni`} last />

              {ev.cohorts ? (
                <div style={{ marginTop: 20 }}>
                  <Eyebrow>Cohorts represented</Eyebrow>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {ev.cohorts.map((c) => (
                      <Chip key={c} style={{ background: "#dbe1ff", color: "#00174b" }}>
                        Class of {c}
                      </Chip>
                    ))}
                  </div>
                </div>
              ) : null}

              <div
                style={{
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: "1px solid #eceef0",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div style={{ display: "flex" }}>
                  {["JR", "MK", "AT", "LP", "PI"].map((i, idx) => (
                    <Avatar
                      key={i}
                      initials={i}
                      size={32}
                      color={["#dbe1ff", "#fef3c7", "#d1fae5", "#ffdad6", "#dbe1ff"][idx]}
                      textColor="#00174b"
                      style={{ marginLeft: idx === 0 ? 0 : -8, border: "2px solid #fff" }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: 13, color: "#45464d" }}>
                  Jordan, Maya, and 245 others attending
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="primary" size="lg" style={{ flex: 1 }} iconLeft="check_circle">
                  RSVP yes
                </Button>
                <Button variant="outline" size="lg" iconLeft="ios_share">
                  Share
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const EventListItem = ({ title, date, time, location, attending, type, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      padding: "18px 20px",
      borderRadius: 12,
      cursor: "pointer",
      background: active ? "#fff" : "transparent",
      border: `1px solid ${active ? "#0051d5" : "transparent"}`,
      boxShadow: active ? "0 4px 20px -4px rgba(0,81,213,.15)" : "none",
      transition: "all 200ms",
    }}
    onMouseEnter={(e) => {
      if (!active) e.currentTarget.style.background = "#fff";
    }}
    onMouseLeave={(e) => {
      if (!active) e.currentTarget.style.background = "transparent";
    }}
  >
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <DateTile date={date} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <StatusPill tone={type === "Reunion" ? "info" : type === "Mixer" ? "year" : "muted"} dot={false}>
            {type}
          </StatusPill>
        </div>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600, color: "#0b1220" }}>
          {title}
        </h3>
        <div style={{ fontSize: 13, color: "#45464d", display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span>{time}</span>
          <span>·</span>
          <span>{location}</span>
        </div>
        <div style={{ fontSize: 12, color: "#76777d", marginTop: 6 }}>
          {attending} attending
        </div>
      </div>
    </div>
  </div>
);

const DateTile = ({ date }) => {
  // crude parse "May 18, 2026" -> "MAY" "18"
  const parts = date.split(" ");
  const mo = parts[0].slice(0, 3).toUpperCase();
  const day = parts[1].replace(",", "");
  return (
    <div
      style={{
        background: "#0b1220",
        color: "#fff",
        borderRadius: 8,
        padding: "8px 0",
        width: 56,
        textAlign: "center",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: ".12em",
          color: "#b4c5ff",
        }}
      >
        {mo}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: "-.02em",
          marginTop: 2,
        }}
      >
        {day}
      </div>
    </div>
  );
};

const DetailRow = ({ icon, label, value, last }) => (
  <div
    style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
      paddingBottom: last ? 0 : 12,
      marginBottom: last ? 0 : 12,
      borderBottom: last ? "none" : "1px solid #eceef0",
    }}
  >
    <Icon name={icon} size={20} style={{ color: "#0051d5", marginTop: 2 }} />
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#76777d" }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, color: "#0b1220", marginTop: 2 }}>
        {value}
      </div>
    </div>
  </div>
);

Object.assign(window, { Events, EventListItem, DateTile });
