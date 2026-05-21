// Top navigation bar — midnight, sticky, sapphire active underline.
const TopNav = ({ active = "Network", onNavigate = () => {} }) => {
  const links = ["Network", "Mentorship", "Events", "Inbox"];
  return (
    <header
      style={{
        background: "#0b1220",
        borderBottom: "1px solid #1e293b",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 32px",
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <Wordmark size={22} dark={true} mark={true} />
          <nav style={{ display: "flex", gap: 28 }}>
            {links.map((l) => {
              const isActive = l === active;
              return (
                <a
                  key={l}
                  onClick={() => onNavigate(l)}
                  style={{
                    color: isActive ? "#b4c5ff" : "#cbd5e1",
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                    paddingBottom: 4,
                    borderBottom: `2px solid ${isActive ? "#316bf3" : "transparent"}`,
                    cursor: "pointer",
                    transition: "color 200ms",
                  }}
                  onMouseEnter={(e) => !isActive && (e.target.style.color = "#fff")}
                  onMouseLeave={(e) => !isActive && (e.target.style.color = "#cbd5e1")}
                >
                  {l}
                </a>
              );
            })}
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#cbd5e1" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 9999,
              padding: "7px 16px",
            }}
          >
            <Icon name="search" size={18} style={{ color: "#64748b" }} />
            <input
              placeholder="Search the circle…"
              style={{
                background: "transparent",
                border: 0,
                outline: 0,
                color: "#cbd5e1",
                fontFamily: "inherit",
                fontSize: 13,
                width: 180,
              }}
            />
          </div>
          <Icon name="notifications" size={22} style={{ cursor: "pointer" }} />
          <Icon name="settings" size={22} style={{ cursor: "pointer" }} />
          <Avatar initials="SK" size={32} color="#316bf3" textColor="#fff" />
        </div>
      </div>
    </header>
  );
};

const Footer = () => (
  <footer
    style={{
      background: "#fff",
      borderTop: "1px solid #e2e8f0",
      marginTop: 64,
    }}
  >
    <div
      style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "40px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Wordmark size={18} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: ".18em",
            color: "#76777d",
          }}
        >
          © 2026 BridgeCircle Alumni Network · Excellence in Connection
        </span>
      </div>
      <nav style={{ display: "flex", gap: 28 }}>
        {["Privacy Policy", "Terms of Service", "Alumni Directory", "Contact Support"].map((l) => (
          <a
            key={l}
            style={{
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: ".18em",
              color: "#76777d",
              cursor: "pointer",
            }}
          >
            {l}
          </a>
        ))}
      </nav>
    </div>
  </footer>
);

Object.assign(window, { TopNav, Footer });
