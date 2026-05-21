// Directory — searchable alumni list with filters.
// Card style switchable via the `variant` prop ("v2","v3","v3plus","v5","v5plus","v6","v7") passed by the host.
const Directory = ({ variant = "v2" } = {}) => {
  const [year, setYear] = React.useState("All years");
  const [industry, setIndustry] = React.useState("All industries");
  const [query, setQuery] = React.useState("");

  const allAlumni = [
    ...sampleAlumni,
    { name: "Diego Alvarez", role: "Lead Engineer · Anthropic", year: "20", initials: "DA", color: "#d1fae5", location: "Oakland" },
    { name: "Saanvi Rao", role: "VP Marketing · Linear", year: "12", initials: "SR", color: "#dbe1ff", location: "Austin" },
    { name: "Theo Bennett", role: "Investor · Index Ventures", year: "10", initials: "TB", color: "#fef3c7", location: "London" },
    { name: "Hana Yoshida", role: "Product · Notion", year: "21", initials: "HY", color: "#ffdad6", location: "Tokyo" },
    { name: "Omar Bashir", role: "Founder · Sift Health", year: "17", initials: "OB", color: "#dbe1ff", location: "Boston" },
    { name: "Riley Carter", role: "Head of Design · Loom", year: "18", initials: "RC", color: "#d1fae5", location: "San Francisco" },
  ];

  return (
    <div style={{ background: "#fafbfd", minHeight: "100vh" }}>
      <section
        style={{
          background: "linear-gradient(180deg,#fff 0%,#fafbfd 100%)",
          borderBottom: "1px solid #eceef0",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 32px 32px" }}>
          <Eyebrow>Network · 12,840 members</Eyebrow>
          <h1 className="bc-fraunces"
            style={{
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: "-.025em",
              margin: "8px 0 12px",
              color: "#0b1220",
            }}
          >
            Alumni Directory
          </h1>
          <p style={{ fontSize: 16, color: "#45464d", maxWidth: 640, margin: "0 0 28px" }}>
            Find mentors, classmates, and collaborators across every cohort —
            from the founding class of '08 to this year's graduates.
          </p>

          {/* Search + filter bar */}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
              background: "#fff",
              border: "1px solid #c6c6cd",
              borderRadius: 12,
              padding: 8,
              boxShadow: "0 1px 3px rgba(19,27,46,.04)",
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 280,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "0 12px",
              }}
            >
              <Icon name="search" size={20} style={{ color: "#76777d" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, company, or skill"
                style={{
                  flex: 1,
                  border: 0,
                  outline: 0,
                  fontFamily: "inherit",
                  fontSize: 14,
                  padding: "10px 0",
                  color: "#0b1220",
                  background: "transparent",
                }}
              />
            </div>
            <FilterPill label={year} options={["All years", "Class of '24", "Class of '20", "Class of '18", "Class of '14"]} onSelect={setYear} />
            <FilterPill label={industry} options={["All industries", "Software", "Finance", "Design", "Healthcare", "Education"]} onSelect={setIndustry} />
            <Button variant="primary" iconLeft="tune">Advanced</Button>
          </div>
        </div>
      </section>

      {/* Results */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <p style={{ margin: 0, fontSize: 14, color: "#45464d" }}>
            <strong style={{ color: "#0b1220" }}>{allAlumni.length}</strong> alumni match your filters
          </p>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#76777d" }}>Sort:</span>
            <Button size="sm" variant="ghost" iconRight="expand_more">Recently active</Button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 20,
          }}
        >
          {allAlumni.map((a) => {
            // Map variant -> component.
            const data = {
              ...a,
              company: a.role.split("·")[1]?.trim() || "—",
              role: a.role.split("·")[0]?.trim() || a.role,
              bio: "Open to mentoring junior alumni — happy to chat about career paths and projects.",
              skills: ["Design", "Mentoring", "Career"],
              mentorSlots: 2,
              available: true,
            };
            const Cmp =
              variant === "v2"     ? window.V2Editorial :
              variant === "v3"     ? window.V3Dense :
              variant === "v3plus" ? window.V3Plus :
              variant === "v5"     ? window.V5MentorFirst :
              variant === "v5plus" ? window.V5Plus :
              window.V2Editorial;
            return (
              <div key={a.name} style={{ display: "flex", justifyContent: "center" }}>
                <Cmp d={data} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const FilterPill = ({ label, options, onSelect }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          ...bcButtonBase,
          padding: "10px 14px",
          background: "#f2f4f6",
          color: "#0b1220",
          fontSize: 13,
          gap: 6,
        }}
      >
        {label}
        <Icon name="expand_more" size={16} />
      </button>
      {open ? (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            background: "#fff",
            border: "1px solid #c6c6cd",
            borderRadius: 8,
            boxShadow: "0 8px 24px -4px rgba(19,27,46,.10)",
            padding: 6,
            minWidth: 200,
            zIndex: 10,
          }}
        >
          {options.map((o) => (
            <div
              key={o}
              onClick={() => {
                onSelect(o);
                setOpen(false);
              }}
              style={{
                padding: "8px 12px",
                fontSize: 13,
                color: "#0b1220",
                cursor: "pointer",
                borderRadius: 6,
              }}
              onMouseEnter={(e) => (e.target.style.background = "#f2f4f6")}
              onMouseLeave={(e) => (e.target.style.background = "transparent")}
            >
              {o}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const DirectoryCard = ({ name, role, year, initials, color, location }) => (
  <Card hover padding={0} style={{ overflow: "hidden" }}>
    <ProfileBanner seed={initials.charCodeAt(0) + initials.charCodeAt(1)} />
    <div style={{ padding: "0 20px 20px", marginTop: -32 }}>
      <Avatar
        initials={initials}
        size={64}
        color={color}
        textColor="#00174b"
        style={{ border: "3px solid #fff" }}
      />
      <h3 style={{ margin: "12px 0 2px", fontSize: 17, fontWeight: 600, color: "#0b1220" }}>
        {name}
      </h3>
      <p style={{ margin: "0 0 10px", fontSize: 13, color: "#45464d" }}>{role}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <StatusPill tone="year" dot={false}>Class of '{year}</StatusPill>
        <span style={{ fontSize: 12, color: "#76777d", display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon name="location_on" size={14} />
          {location}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Button size="sm" variant="primary" iconLeft="handshake">Connect</Button>
        <Button size="sm" variant="outline" iconLeft="mail">Message</Button>
      </div>
    </div>
  </Card>
);

Object.assign(window, { Directory, FilterPill, DirectoryCard });
