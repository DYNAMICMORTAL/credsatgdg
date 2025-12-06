import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";

export default function StudentCertPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

  useEffect(() => {
    loadParticipantInfo();
  }, [token]);

  const loadParticipantInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Decode token and get participant info
      const response = await api.get(`/participants/decode_token/${token}`);
      setParticipant(response.data.participant);
      setEvent(response.data.event);
      
      // Check if certificate already exists
      if (response.data.certificate) {
        setCertificate(response.data.certificate);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid or expired link");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    if (!participant || !event) return;

    setGenerating(true);
    try {
      const response = await api.post(`/participants/generate_certificate/${token}`);
      setCertificate(response.data);
      alert("Certificate generated successfully! 🎉");
    } catch (err) {
      alert("Failed to generate certificate: " + (err.response?.data?.detail || err.message));
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <div className="loading-spinner" style={{ width: "48px", height: "48px", borderWidth: "4px" }}></div>
        <span style={{ marginTop: "1.5rem", color: "var(--text-muted)", fontSize: "1rem" }}>Loading your certificate...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container" style={{ maxWidth: "600px", margin: "4rem auto" }}>
        <div className="card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 1.5rem", color: "var(--danger)" }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "var(--danger)" }}>Invalid Link</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>{error}</p>
          <Link to="/" className="btn btn-primary">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ maxWidth: "800px", margin: "2rem auto" }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: "2rem", textAlign: "center", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎓</div>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", fontWeight: "800" }}>
          {certificate ? "Your Certificate" : "Generate Your Certificate"}
        </h1>
        <p style={{ fontSize: "1.125rem", opacity: 0.95 }}>
          {event?.name || "Event Certificate"}
        </p>
      </div>

      {/* Participant Info */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem", fontWeight: "700", paddingBottom: "1rem", borderBottom: "1px solid var(--border-light)" }}>
          Your Information
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div>
            <label style={{ fontSize: "0.875rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>Name</label>
            <p style={{ fontSize: "1.125rem", fontWeight: "600" }}>{participant?.name}</p>
          </div>
          {participant?.email && (
            <div>
              <label style={{ fontSize: "0.875rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>Email</label>
              <p style={{ fontSize: "1.125rem", fontWeight: "600" }}>{participant.email}</p>
            </div>
          )}
          {participant?.roll_no && (
            <div>
              <label style={{ fontSize: "0.875rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>Roll Number</label>
              <p style={{ fontSize: "1.125rem", fontWeight: "600" }}>{participant.roll_no}</p>
            </div>
          )}
          {participant?.department && (
            <div>
              <label style={{ fontSize: "0.875rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>Department</label>
              <p style={{ fontSize: "1.125rem", fontWeight: "600" }}>{participant.department}</p>
            </div>
          )}
          {event?.date && (
            <div>
              <label style={{ fontSize: "0.875rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>Event Date</label>
              <p style={{ fontSize: "1.125rem", fontWeight: "600" }}>{event.date}</p>
            </div>
          )}
        </div>
      </div>

      {/* Certificate Section */}
      {certificate ? (
        <div className="card">
          <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1.5rem", background: "var(--success-light)", color: "var(--success)", borderRadius: "var(--radius-lg)", marginBottom: "1rem" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span style={{ fontWeight: "700" }}>Certificate Generated Successfully!</span>
            </div>
          </div>

          {/* Certificate Preview */}
          <div style={{ background: "var(--bg-subtle)", padding: "2rem", borderRadius: "var(--radius-lg)", marginBottom: "2rem", textAlign: "center" }}>
            <img 
              src={`${apiBaseUrl}/${certificate.certificate_path}`} 
              alt="Your Certificate"
              style={{ maxWidth: "100%", height: "auto", borderRadius: "var(--radius-md)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}
            />
          </div>

          {/* Certificate Info */}
          <div style={{ marginBottom: "2rem", padding: "1.5rem", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div>
                <label style={{ fontSize: "0.875rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>Certificate Code</label>
                <code style={{ fontSize: "1rem", fontWeight: "700", background: "white", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-sm)", display: "inline-block" }}>
                  {certificate.certificate_code}
                </code>
              </div>
              <div>
                <label style={{ fontSize: "0.875rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>Issued On</label>
                <p style={{ fontSize: "1rem", fontWeight: "600" }}>
                  {new Date(certificate.issued_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <a
              href={`${apiBaseUrl}/${certificate.certificate_path}`}
              download
              className="btn btn-success"
              style={{ flex: 1, justifyContent: "center", minWidth: "200px" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download Certificate
            </a>
            <Link
              to={`/verify/${certificate.certificate_code}`}
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: "center", minWidth: "200px" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Verify Certificate
            </Link>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 1.5rem", color: "var(--primary)" }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <h2 style={{ fontSize: "1.75rem", marginBottom: "1rem", fontWeight: "700" }}>
            Ready to Generate Your Certificate
          </h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "1rem" }}>
            Click the button below to generate your personalized certificate
          </p>
          <button
            onClick={handleGenerateCertificate}
            className="btn btn-primary"
            disabled={generating}
            style={{ padding: "1rem 3rem", fontSize: "1.125rem", minWidth: "250px" }}
          >
            {generating ? (
              <>
                <div className="loading-spinner" style={{ width: "20px", height: "20px", borderWidth: "2px", margin: 0 }}></div>
                Generating Certificate...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
                Generate My Certificate
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
