import { Link } from "react-router-dom";
import "./App.css";

export default function App() {
  return (
    <div className="app-container" style={{ animation: "fadeIn 0.5s ease" }}>
      <div className="hero" style={{ animation: "slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1)", position: "relative", overflow: "visible" }}>
        {/* Floating badges */}
        <div style={{ position: "absolute", top: "20px", right: "20px", display: "flex", gap: "0.75rem", animation: "fadeIn 1s ease 0.5s both" }}>
          <span style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", padding: "0.5rem 1rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "600", border: "1px solid rgba(255,255,255,0.3)" }}>
            🔒 Secure
          </span>
          <span style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", padding: "0.5rem 1rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "600", border: "1px solid rgba(255,255,255,0.3)" }}>
            ⚡ Fast
          </span>
        </div>
        
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", padding: "0.5rem 1.25rem", borderRadius: "999px", fontSize: "0.875rem", fontWeight: "600", marginBottom: "1.5rem", border: "1px solid rgba(255,255,255,0.3)", animation: "fadeIn 0.8s ease 0.1s both" }}>
            ✨ Professional Certificate Platform
          </div>
          <h1 style={{ animation: "fadeIn 0.8s ease 0.2s both", fontSize: "3.5rem", lineHeight: "1.1", marginBottom: "1.25rem" }}>
            Digital Certificate Management
          </h1>
          <p style={{ animation: "fadeIn 0.8s ease 0.3s both", fontSize: "1.25rem", opacity: "0.95", maxWidth: "600px", margin: "0 auto 2.5rem" }}>
            Create Events, Upload Participants, Generate Certificate Links with ease
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", animation: "fadeIn 0.8s ease 0.4s both" }}>
            <Link to="/admin" className="btn btn-primary" style={{ fontSize: "1.125rem", padding: "1rem 2.5rem", boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 17 18 12 13 7"></polyline>
                <polyline points="6 17 11 12 6 7"></polyline>
              </svg>
              Get Started
            </Link>
            <Link to="/verify" className="btn" style={{ fontSize: "1.125rem", padding: "1rem 2.5rem", background: "rgba(255,255,255,0.15)", color: "white", border: "2px solid rgba(255,255,255,0.3)", backdropFilter: "blur(10px)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Verify Certificate
            </Link>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        <div className="card">
          <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-lg)", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <h2>1. Upload Participants</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>Simply upload your participant list using CSV, Excel, or Google Sheets. The system automatically detects all columns.</p>
        </div>

        <div className="card">
          <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-lg)", background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </div>
          <h2>2. Choose Template</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>Select from pre-configured professional certificate templates designed for your event type.</p>
        </div>

        <div className="card">
          <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-lg)", background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </div>
          <h2>3. Generate Links</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>Get unique certificate links for each participant. Share via email or your preferred channel.</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: "2rem", background: "linear-gradient(135deg, var(--bg-subtle) 0%, rgba(99, 102, 241, 0.05) 100%)", border: "2px solid var(--border-light)" }}>
        <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, var(--secondary) 0%, #059669 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 style={{ marginBottom: "0.75rem" }}>Certificate Verification</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>Recipients can verify their certificates instantly using our secure verification portal. All certificates are cryptographically signed and tamper-proof.</p>
          <Link to="/verify" className="btn btn-secondary">
            Verify Certificate
          </Link>
        </div>
      </div>
    </div>
  );
}

