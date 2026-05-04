// Mentorship hub — accept/decline requests, ongoing relationships, finder.
const Mentorship = () => {
  const [tab, setTab] = React.useState("requests");
  return (
    <div style={{ background: "#fafbfd", minHeight: "100vh" }}>
      <section
        style={{
          background:
            "linear-gradient(135deg,#0b1220 0%,#131b2e 60%,#003ea8 100%)",
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
              "radial-gradient(rgba(180,197,255,.08) 1.5px, transparent 1.5px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "48px 32px 32px",
            position: "relative",
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr",
            gap: 48,
            alignItems: "end",
          }}
        >
          <div>
            <Eyebrow style={{ color: "#b4c5ff" }}>Mentorship</Eyebrow>
            <h1 className="bc-fraunces"
              style={{
                fontSize: 44,
                fontWeight: 700,
                letterSpacing: "-.025em",
                margin: "8px 0 12px",
              }}
            >
              Bridge the years.<br />
              <span style={{ color: "#b4c5ff" }}>Lift the next class up.</span>
            </h1>
            <p style={{ fontSize: 16, color: "#cbd5e1", maxWidth: 540, margin: 0 }}>
              You've mentored 7 alumni since 2022. Three more are waiting on your
              acceptance — short, focused conversations make the biggest difference.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            <StatBlock label="Active mentees" value="3" />
            <StatBlock label="Hours given" value="42" />
            <StatBlock label="Pending requests" value="3" tone="#fef3c7" />
            <StatBlock label="Mentor rating" value="4.9" sub="★ from 18 reviews" />
          </div>
        </div>
        {/* Tab bar */}
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 32px",
            position: "relative",
            display: "flex",
            gap: 4,
          }}
        >
          {[
            { id: "requests", label: "Pending requests", count: 3 },
            { id: "active", label: "Active mentorships", count: 3 },
            { id: "find", label: "Find a mentor" },
            { id: "history", label: "History" },
          ].map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  border: 0,
                  background: "transparent",
                  color: isActive ? "#fff" : "#94a3b8",
                  fontFamily: "inherit",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  padding: "14px 18px",
                  cursor: "pointer",
                  borderBottom: `2px solid ${isActive ? "#316bf3" : "transparent"}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {t.label}
                {t.count ? (
                  <span
                    style={{
                      background: isActive ? "#316bf3" : "#1e293b",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 9999,
                    }}
                  >
                    {t.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px" }}>
        {tab === "requests" ? <RequestsList /> : null}
        {tab === "active" ? <ActiveMentorships /> : null}
        {tab === "find" ? <FindMentor /> : null}
        {tab === "history" ? <HistoryEmpty /> : null}
      </div>
    </div>
  );
};

const StatBlock = ({ label, value, sub, tone = "#fff" }) => (
  <div
    style={{
      background: "rgba(255,255,255,.06)",
      border: "1px solid rgba(180,197,255,.18)",
      borderRadius: 12,
      padding: "18px 20px",
    }}
  >
    <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{label}</div>
    <div className="bc-fraunces"
      style={{
        fontSize: 32,
        fontWeight: 700,
        letterSpacing: "-.02em",
        color: tone,
        marginTop: 4,
      }}
    >
      {value}
      {sub ? (
        <span style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8", marginLeft: 6 }}>
          {sub}
        </span>
      ) : null}
    </div>
  </div>
);

const RequestsList = () => (
  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32 }}>
    <div>
      <SectionHeader eyebrow="Awaiting your reply" title="3 pending requests" />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {sampleMentees.map((m) => (
          <DetailedRequestCard key={m.name} {...m} />
        ))}
      </div>
    </div>
    <aside>
      <Card style={{ background: "#fff" }}>
        <Eyebrow>Tips for new mentors</Eyebrow>
        <h3
          style={{
            fontSize: 20,
            fontWeight: 700,
            margin: "8px 0 12px",
            color: "#0b1220",
          }}
        >
          Start with one good question.
        </h3>
        <p style={{ fontSize: 14, color: "#45464d", lineHeight: 1.55, margin: 0 }}>
          Most mentees don't know what they're asking for. A clarifying question
          ("What does success look like in 6 months?") often does more than an hour
          of advice.
        </p>
        <a style={{ ...linkStyle, marginTop: 12, display: "inline-block" }}>
          Read the mentor handbook →
        </a>
      </Card>
      <div style={{ height: 16 }} />
      <Card style={{ background: "#0b1220", color: "#fff", borderColor: "#1e293b" }}>
        <Eyebrow style={{ color: "#b4c5ff" }}>Office hours</Eyebrow>
        <p style={{ fontSize: 14, lineHeight: 1.55, margin: "8px 0 16px", color: "#cbd5e1" }}>
          Open a 30-minute window each Friday and let three mentees self-book.
          Faster than a back-and-forth.
        </p>
        <Button variant="primary-on-dark" size="sm" iconLeft="schedule">
          Set office hours
        </Button>
      </Card>
    </aside>
  </div>
);

const DetailedRequestCard = ({ name, year, initials, color, ask }) => {
  const [state, setState] = React.useState("pending"); // pending, accepted, declined
  return (
    <Card
      hover
      style={{
        padding: 24,
        opacity: state === "declined" ? 0.5 : 1,
        background: state === "accepted" ? "rgba(16,185,129,.04)" : "#fff",
        borderColor: state === "accepted" ? "#10b981" : undefined,
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <Avatar initials={initials} size={56} color={color} textColor="#00174b" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 6,
              flexWrap: "wrap",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#0b1220" }}>
              {name}
            </h3>
            <StatusPill tone="year" dot={false}>Class of {year}</StatusPill>
            {state === "accepted" ? <StatusPill tone="open">Accepted</StatusPill> : null}
            {state === "declined" ? <StatusPill tone="muted">Declined</StatusPill> : null}
            {state === "pending" ? <StatusPill tone="warn">3 days waiting</StatusPill> : null}
          </div>
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 15,
              color: "#191c1e",
              lineHeight: 1.55,
              fontStyle: "italic",
            }}
          >
            "{ask}"
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              fontSize: 12,
              color: "#76777d",
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon name="work" size={14} />
              Software Engineer · early career
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon name="schedule" size={14} />
              Asks for 1 session
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon name="connect_without_contact" size={14} />
              2 mutual connections
            </span>
          </div>
          {state === "pending" ? (
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="primary" iconLeft="check" onClick={() => setState("accepted")}>
                Accept & schedule
              </Button>
              <Button variant="outline">View profile</Button>
              <Button variant="ghost" style={{ color: "#76777d" }} onClick={() => setState("declined")}>
                Decline politely
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setState("pending")}>
              Undo
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

const ActiveMentorships = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
    {[
      { name: "Wei Lin", initials: "WL", color: "#dbe1ff", year: "23", next: "Tomorrow, 2pm", topic: "First PM offer review" },
      { name: "Tomás Reyes", initials: "TR", color: "#fef3c7", year: "22", next: "Fri May 9, 10am", topic: "Founder hiring playbook" },
      { name: "Esha Patel", initials: "EP", color: "#d1fae5", year: "24", next: "Scheduling…", topic: "Grad school vs industry" },
    ].map((m) => (
      <Card key={m.name} hover padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
            <Avatar initials={m.initials} size={44} color={m.color} textColor="#00174b" />
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0b1220" }}>
                {m.name}
              </h3>
              <span style={{ fontSize: 12, color: "#76777d" }}>Class of '{m.year}</span>
            </div>
          </div>
          <Eyebrow>Current focus</Eyebrow>
          <p style={{ fontSize: 14, color: "#191c1e", margin: "4px 0 14px" }}>{m.topic}</p>
          <div
            style={{
              padding: "10px 12px",
              background: "rgba(0,81,213,.06)",
              borderRadius: 8,
              fontSize: 13,
              color: "#0051d5",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Icon name="event" size={16} />
            Next session: {m.next}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button size="sm" variant="outline" iconLeft="chat">Message</Button>
            <Button size="sm" variant="ghost" iconLeft="schedule">Reschedule</Button>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

const FindMentor = () => (
  <div style={{ textAlign: "center", padding: "64px 32px" }}>
    <Icon name="travel_explore" size={48} style={{ color: "#0051d5" }} />
    <h2
      style={{
        fontSize: 28,
        fontWeight: 700,
        margin: "16px 0 8px",
        color: "#0b1220",
      }}
    >
      Find your mentor
    </h2>
    <p style={{ fontSize: 15, color: "#45464d", maxWidth: 440, margin: "0 auto 24px" }}>
      Tell us what you're working through. We'll match you with three alumni
      whose paths overlap your goal.
    </p>
    <Button variant="primary" size="lg" iconLeft="auto_awesome">
      Start matching
    </Button>
  </div>
);

const HistoryEmpty = () => (
  <div style={{ textAlign: "center", padding: "64px 32px", color: "#76777d" }}>
    <Icon name="history" size={48} />
    <p style={{ marginTop: 12, fontSize: 14 }}>Your mentorship history will appear here.</p>
  </div>
);

Object.assign(window, { Mentorship });
