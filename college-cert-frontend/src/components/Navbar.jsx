import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{
      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      color: "white",
      padding: "1rem 1.5rem",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <Link to="/" style={{ 
          fontSize: "1.25rem", 
          margin: 0,
          fontWeight: "700",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          textDecoration: "none"
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
          </svg>
          Certificate Platform
        </Link>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <Link to="/" style={{ 
            color: "white", 
            textDecoration: "none",
            fontWeight: "500",
            transition: "opacity 0.2s",
            opacity: 0.9
          }}
          onMouseEnter={(e) => e.target.style.opacity = "1"}
          onMouseLeave={(e) => e.target.style.opacity = "0.9"}
          >
            Home
          </Link>
          <Link to="/admin" style={{ 
            color: "white", 
            textDecoration: "none",
            fontWeight: "500",
            transition: "opacity 0.2s",
            opacity: 0.9
          }}
          onMouseEnter={(e) => e.target.style.opacity = "1"}
          onMouseLeave={(e) => e.target.style.opacity = "0.9"}
          >
            Dashboard
          </Link>
          <Link to="/admin/events" style={{ 
            color: "white", 
            textDecoration: "none",
            fontWeight: "500",
            transition: "opacity 0.2s",
            opacity: 0.9
          }}
          onMouseEnter={(e) => e.target.style.opacity = "1"}
          onMouseLeave={(e) => e.target.style.opacity = "0.9"}
          >
            Events
          </Link>
          <Link to="/verify" style={{
            background: "rgba(255, 255, 255, 0.2)",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            textDecoration: "none",
            fontWeight: "600",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.3)";
            e.target.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.2)";
            e.target.style.transform = "translateY(0)";
          }}
          >
            Verify
          </Link>
        </div>
      </div>
    </nav>
  );
}

