import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function EventsList() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", date: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/events/");
      // Ensure we always set an array
      setEvents(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      setError("Failed to load events");
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
      alert("Please fill in event name and date");
      return;
    }

    try {
      await api.post(`/events/?admin_secret=${adminSecret}`, form);
      setForm({ name: "", description: "", date: "" });
      loadEvents();
      alert("Event created successfully!");
    } catch (err) {
      alert("Failed to create event: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="app-container">
      {/* Header Section */}
      <div style={{ marginBottom: "2.5rem" }}>
        <Link to="/" className="btn btn-secondary" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Dashboard
        </Link>
        
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", fontWeight: "800" }}>Events Management</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>Create and manage certificate events for your organization</p>
        </div>
      </div>

      {/* Create Event Form */}
      <div className="card" style={{ marginBottom: "2.5rem", padding: "2rem", border: "1px solid var(--border-color)" }}>
        <div style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "2px solid var(--border-light)" }}>
          <h2 style={{ fontSize: "1.375rem", marginBottom: "0.25rem", fontWeight: "700" }}>Create New Event</h2>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.875rem" }}>Set up event details to begin issuing certificates</p>
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

          <button type="submit" className="btn btn-primary" style={{ padding: "0.75rem 2rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            Create Event
          </button>
        </form>
      </div>

      {/* All Events Section */}
      <div className="card" style={{ padding: "2rem", border: "1px solid var(--border-color)" }}>
        <div style={{ marginBottom: "2rem", paddingBottom: "1rem", borderBottom: "2px solid var(--border-light)" }}>
          <h2 style={{ fontSize: "1.375rem", marginBottom: "0.25rem", fontWeight: "700" }}>All Events</h2>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.875rem" }}>Manage your created events and their certificates</p>
        </div>
        
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", flexDirection: "column", gap: "1rem" }}>
            <div className="loading-spinner" style={{ width: "40px", height: "40px", borderWidth: "3px" }}></div>
            <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading events...</span>
          </div>
        )}
        
        {error && (
          <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
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
          <div style={{ display: "grid", gap: "1rem" }}>
            {events.map((ev) => (
              <div
                key={ev.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1.5rem",
                  background: "white",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-lg)",
                  transition: "all 0.2s ease",
                  gap: "1.5rem"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(99,102,241,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
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
