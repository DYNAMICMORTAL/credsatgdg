import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import Loading from "../components/Loading";
import StatusBanner from "../components/StatusBanner";

export default function EventsList() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", date: "" });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ message: "", type: "" });

  const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/events/");
      // Ensure we always set an array
      setEvents(Array.isArray(res.data) ? res.data : []);
      setStatusMessage({ message: "", type: "" });
    } catch (err) {
      setStatusMessage({ message: "Failed to load events. Please try again.", type: "error" });
      console.error(err);
      setEvents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const createEvent = async (e) => {
    e.preventDefault();
    
    if (!form.name || !form.date) {
      setStatusMessage({ message: "Please fill in event name and date", type: "warning" });
      return;
    }

    try {
      setCreating(true);
      setStatusMessage({ message: "", type: "" });
      await api.post(`/events/?admin_secret=${adminSecret}`, form);
      setForm({ name: "", description: "", date: "" });
      setStatusMessage({ message: "Event created successfully!", type: "success" });
      loadEvents();
    } catch (err) {
      setStatusMessage({ message: "Failed to create event: " + (err.response?.data?.detail || err.message), type: "error" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="app-container" style={{ animation: "fadeIn 0.5s ease" }}>
      {/* Header Section */}
      <div style={{ marginBottom: "2.5rem", animation: "slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <Link to="/" className="btn btn-secondary" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Dashboard
        </Link>
        
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "0.75rem", fontWeight: "800", background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Events Management</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.125rem" }}>Create and manage certificate events for your organization</p>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage.message && (
        <StatusBanner
          message={statusMessage.message}
          type={statusMessage.type}
          onDismiss={() => setStatusMessage({ message: "", type: "" })}
        />
      )}

      {/* Create Event Form */}
      <div className="card" style={{ marginBottom: "2.5rem", padding: "2.5rem", border: "2px solid var(--primary)", animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both", background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, white 100%)", boxShadow: "0 4px 20px rgba(99, 102, 241, 0.1)" }}>
        <div style={{ marginBottom: "2rem", paddingBottom: "1.25rem", borderBottom: "3px solid var(--primary)", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-lg)", background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "0.25rem", fontWeight: "700" }}>Create New Event</h2>
            <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9375rem" }}>Set up event details to begin issuing certificates</p>
          </div>
        </div>
        
        <form onSubmit={createEvent}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="name" style={{ fontWeight: "600", fontSize: "0.875rem", marginBottom: "0.5rem", display: "block" }}>Event Name *</label>
              <input
                id="name"
                type="text"
                placeholder="Web Development Workshop 2025"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                style={{ width: "100%" }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="date" style={{ fontWeight: "600", fontSize: "0.875rem", marginBottom: "0.5rem", display: "block" }}>Event Date *</label>
              <input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="description" style={{ fontWeight: "600", fontSize: "0.875rem", marginBottom: "0.5rem", display: "block" }}>Event Description</label>
            <textarea
              id="description"
              placeholder="Brief description of the event and what participants will receive certificates for..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows="3"
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: "0.75rem 2rem" }} disabled={creating}>
            {creating ? (
              <>
                <div className="loading-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", margin: 0 }}></div>
                Creating...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
                Create Event
              </>
            )}
          </button>
        </form>
      </div>

      {/* All Events Section */}
      <div className="card" style={{ padding: "2.5rem", border: "2px solid var(--border-color)", animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both", background: "white" }}>
        <div style={{ marginBottom: "2rem", paddingBottom: "1.25rem", borderBottom: "3px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--secondary)", display: "inline-block" }}></span>
              All Events
              {events.length > 0 && <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: "500" }}>({events.length})</span>}
            </h2>
            <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9375rem" }}>Manage your created events and their certificates</p>
          </div>
        </div>
        
        {loading && (
          <div style={{ padding: "4rem" }}>
            <Loading size="default" text="Loading events..." />
          </div>
        )}

        {!loading && events.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <div style={{ background: "var(--bg-subtle)", width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <p style={{ fontSize: "1.125rem", marginBottom: "0.5rem", fontWeight: "600" }}>No Events Created</p>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Create your first event using the form above</p>
          </div>
        )}

        {!loading && events.length > 0 && (
          <div style={{ display: "grid", gap: "1.25rem" }}>
            {events.map((ev, index) => (
              <div
                key={ev.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "2rem",
                  background: "linear-gradient(135deg, white 0%, var(--bg-subtle) 100%)",
                  border: "2px solid var(--border-color)",
                  borderRadius: "var(--radius-xl)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  gap: "2rem",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.15)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Event number badge */}
                <div style={{
                  position: "absolute",
                  top: "-10px",
                  left: "20px",
                  background: ev.is_active ? "linear-gradient(135deg, var(--secondary) 0%, #059669 100%)" : "linear-gradient(135deg, var(--text-muted) 0%, #64748b 100%)",
                  color: "white",
                  padding: "0.375rem 1rem",
                  borderRadius: "999px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}>
                  #{index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: "700", margin: 0 }}>{ev.name}</h3>
                    <span className={ev.is_active ? "badge badge-success" : "badge badge-secondary"} style={{ fontSize: "0.6875rem" }}>
                      {ev.is_active ? "Active" : "Completed"}
                    </span>
                  </div>
                  
                  {ev.description && (
                    <p style={{ margin: "0 0 0.75rem 0", color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: "1.5" }}>
                      {ev.description}
                    </p>
                  )}
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    {new Date(ev.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                
                <Link to={`/admin/events/${ev.id}`} className="btn btn-primary" style={{ flexShrink: 0 }}>
                  Manage Event
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
