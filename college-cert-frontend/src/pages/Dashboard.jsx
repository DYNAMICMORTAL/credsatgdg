import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, certificates: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const res = await api.get("/events/");
      setEvents(res.data);
      
      const total = res.data.length;
      const active = res.data.filter(e => e.is_active).length;
      const inactive = total - active;
      
      setStats({ total, active, inactive, certificates: 0 });
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <div className="loading-spinner" style={{ width: "48px", height: "48px" }}></div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Hero Section */}
      <div style={{ 
        background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
        color: "white",
        padding: "2.5rem 2rem",
        borderRadius: "var(--radius-xl)",
        marginBottom: "2.5rem",
        position: "relative",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.1)"
      }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: "400px", height: "400px", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", pointerEvents: "none" }}></div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "600", opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Admin Dashboard</div>
          <h1 style={{ fontSize: "2.25rem", marginBottom: "0.5rem", fontWeight: "800", letterSpacing: "-0.02em" }}>
            Certificate Management Platform
          </h1>
          <p style={{ fontSize: "1rem", opacity: 0.9, marginBottom: "2rem", maxWidth: "600px" }}>
            Streamline your certificate issuance process with automated generation, participant management, and secure verification
          </p>
          <Link to="/admin/events" className="btn" style={{ 
            background: "white", 
            color: "var(--text-main)",
            fontWeight: "700",
            padding: "0.875rem 2rem",
            fontSize: "0.9375rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            Create New Event
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
        <div className="card" style={{ background: "white", border: "1px solid var(--border-color)", padding: "1.75rem", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div style={{ background: "#eef2ff", padding: "0.75rem", borderRadius: "var(--radius-lg)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
          </div>
          <div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.25rem", fontWeight: "500" }}>Total Events</p>
            <h2 style={{ fontSize: "2.25rem", fontWeight: "800", marginBottom: "0", color: "var(--text-main)" }}>{stats.total}</h2>
          </div>
        </div>

        <div className="card" style={{ background: "white", border: "1px solid var(--border-color)", padding: "1.75rem", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div style={{ background: "#d1fae5", padding: "0.75rem", borderRadius: "var(--radius-lg)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
          </div>
          <div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.25rem", fontWeight: "500" }}>Active Events</p>
            <h2 style={{ fontSize: "2.25rem", fontWeight: "800", marginBottom: "0", color: "var(--text-main)" }}>{stats.active}</h2>
          </div>
        </div>

        <div className="card" style={{ background: "white", border: "1px solid var(--border-color)", padding: "1.75rem", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div style={{ background: "#f1f5f9", padding: "0.75rem", borderRadius: "var(--radius-lg)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          <div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.25rem", fontWeight: "500" }}>Completed</p>
            <h2 style={{ fontSize: "2.25rem", fontWeight: "800", marginBottom: "0", color: "var(--text-main)" }}>{stats.inactive}</h2>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="card" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", paddingBottom: "1.25rem", borderBottom: "2px solid var(--border-light)" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.25rem" }}>Recent Events</h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>Manage your events and certificates</p>
          </div>
          <Link to="/admin/events" className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            New Event
          </Link>
        </div>

        {events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <div style={{ background: "var(--bg-subtle)", width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem", fontWeight: "700" }}>No Events Created Yet</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.9375rem" }}>Get started by creating your first event and issuing certificates</p>
            <Link to="/admin/events" className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {events.slice(0, 5).map((event) => (
              <Link
                key={event.id}
                to={`/admin/events/${event.id}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{
                  padding: "1.5rem",
                  background: "white",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-color)",
                  transition: "all 0.2s ease",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 16px rgba(99,102,241,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                        <h3 style={{ fontSize: "1.125rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
                          {event.name}
                        </h3>
                        <span className={`badge ${event.is_active ? "badge-success" : "badge-secondary"}`} style={{ fontSize: "0.6875rem" }}>
                          {event.is_active ? "Active" : "Completed"}
                        </span>
                      </div>
                      {event.description && (
                        <p style={{ color: "var(--text-muted)", marginBottom: "0.75rem", fontSize: "0.875rem", lineHeight: "1.5" }}>
                          {event.description}
                        </p>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
