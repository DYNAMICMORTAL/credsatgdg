import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import api from "../api";
import StatusBanner from "../components/StatusBanner";

export default function VerifyPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputCode, setInputCode] = useState(code ?? "");
  const [formError, setFormError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    setInputCode(code ?? "");
    if (!code) {
      setData(null);
      setLoading(false);
      return;
    }

    const verify = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/certificates/verify/${code}`);
        setData(res.data);
      } catch (err) {
        console.error("Verification failed:", err);
        setData({
          status: "error",
          message: "Failed to verify certificate. Please try again."
        });
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [code]);

  const submitCode = (event) => {
    event.preventDefault();
    const normalized = (inputCode || "").trim().toUpperCase();
    if (!normalized) {
      setFormError("Please enter the certificate code.");
      return;
    }
    setFormError("");
    navigate(`/verify/${normalized}`);
  };

  const shareUrl = useMemo(() => {
    if (!code) return "";
    if (typeof window === "undefined") return `/verify/${code}`;
    return `${window.location.origin}/verify/${code}`;
  }, [code]);

  const renderStatusCard = () => {
    if (!code) return null;

    if (loading) {
      return (
        <div className="verify-result-card">
          <div className="verification-loading">
            <div className="loading-spinner" style={{ width: "48px", height: "48px", borderWidth: "4px" }}></div>
            <p style={{ marginTop: "1.5rem", color: "var(--text-muted)", fontSize: "1rem" }}>Verifying certificate authenticity...</p>
            <p style={{ marginTop: "0.5rem", color: "var(--text-light)", fontSize: "0.875rem" }}>Please wait while we validate the credentials</p>
          </div>
        </div>
      );
    }

    if (!data) return null;

    if (data.status === "valid") {
      return (
        <div className="verify-result-card verify-success">
          <div className="verification-header">
            <div className="status-icon status-valid">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 className="verification-title">Certificate Verified</h2>
            <p className="verification-subtitle">This is an authentic certificate issued by our institution</p>
            <div className="trust-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>Verified & Trusted</span>
            </div>
          </div>
          
          <div className="certificate-details">
            <div className="detail-section">
              <h3>Recipient Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{data.name}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>Certificate Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Event Name</span>
                  <span className="detail-value">{data.event_name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Event Date</span>
                  <span className="detail-value">{new Date(data.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                {data.issued_at && (
                  <div className="detail-item">
                    <span className="detail-label">Issue Date</span>
                    <span className="detail-value">{new Date(data.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">Certificate ID</span>
                  <span className="detail-value certificate-code">{data.certificate_code}</span>
                </div>
              </div>
            </div>

            <div className="security-section">
              <h3>Security & Authenticity</h3>
              <div className="security-grid">
                <div className="security-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <div>
                    <strong>Digitally Secured</strong>
                    <p>Protected by cryptographic verification</p>
                  </div>
                </div>
                <div className="security-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                  <div>
                    <strong>Real-time Verification</strong>
                    <p>Instantly validated against our database</p>
                  </div>
                </div>
                <div className="security-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <div>
                    <strong>Tamper-proof</strong>
                    <p>Cannot be forged or duplicated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {!!shareUrl && (
            <div className="share-section">
              <label>Shareable Verification Link</label>
              {copySuccess && (
                <StatusBanner
                  message="Verification link copied to clipboard!"
                  type="success"
                  onDismiss={() => setCopySuccess(false)}
                  autoDismiss={true}
                  duration={3000}
                />
              )}
              <div className="share-input-group">
                <input readOnly value={shareUrl} className="share-input" />
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 3000);
                  }}
                  style={{ position: "relative" }}
                >
                  {copySuccess ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (data.status === "revoked") {
      return (
        <div className="verify-result-card verify-revoked">
          <div className="verification-header">
            <div className="status-icon status-revoked">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h2 className="verification-title">Certificate Revoked</h2>
            <p className="verification-subtitle">This certificate has been revoked and is no longer valid</p>
          </div>
          <div className="revoked-info">
            <p><strong>Certificate ID:</strong> <code className="certificate-code">{data.certificate_code}</code></p>
            <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>
              This certificate was previously issued but has been revoked by the issuing authority. 
              Please contact the institution for more information.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="verify-result-card verify-invalid">
        <div className="verification-header">
          <div className="status-icon status-invalid">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h2 className="verification-title">Certificate Not Found</h2>
          <p className="verification-subtitle">We could not find a certificate with the provided code</p>
        </div>
        <div className="invalid-info">
          <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
            Please verify that you have entered the correct certificate code and try again.
          </p>
          <div className="help-tips">
            <h4>Common Issues:</h4>
            <ul>
              <li>Check for typos in the certificate code</li>
              <li>Ensure all characters are correctly entered</li>
              <li>Verify the code from your official certificate document</li>
              <li>Contact the issuing institution if the problem persists</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="verify-page" style={{ animation: "fadeIn 0.5s ease", minHeight: "100vh", background: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)" }}>
      {/* Enhanced Hero Section */}
      <div className="verify-hero-official" style={{ 
        animation: "slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1)", 
        position: "relative", 
        overflow: "hidden",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "4rem 2rem",
        boxShadow: "0 20px 60px rgba(102, 126, 234, 0.3)"
      }}>
        {/* Enhanced Decorative elements */}
        <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)", pointerEvents: "none" }}></div>
        <div style={{ position: "absolute", bottom: "-50px", left: "-50px", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)", pointerEvents: "none" }}></div>
        <div style={{ position: "absolute", top: "50%", left: "10%", width: "100px", height: "100px", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }}></div>
        
        {/* Floating badges */}
        <div style={{ position: "absolute", top: "30px", right: "30px", display: "flex", gap: "0.75rem", flexWrap: "wrap", animation: "fadeIn 1s ease 0.5s both" }}>
          <span style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(10px)", padding: "0.5rem 1rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "600", border: "1px solid rgba(255,255,255,0.3)", color: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            🔒 Blockchain Verified
          </span>
          <span style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(10px)", padding: "0.5rem 1rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "600", border: "1px solid rgba(255,255,255,0.3)", color: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            ⚡ Instant
          </span>
        </div>
        
        <div className="official-header" style={{ textAlign: "center", maxWidth: "900px", margin: "0 auto" }}>
          <div className="institution-badge" style={{ 
            boxShadow: "0 12px 32px rgba(0,0,0,0.25)", 
            width: "100px", 
            height: "100px", 
            margin: "0 auto 2rem",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(20px)",
            border: "3px solid rgba(255,255,255,0.3)",
            animation: "float 3s ease-in-out infinite"
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
          </div>
          <div className="official-title">
            <div style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", padding: "0.5rem 1.5rem", borderRadius: "999px", fontSize: "0.875rem", fontWeight: "600", marginBottom: "1.5rem", border: "1px solid rgba(255,255,255,0.3)" }}>
              ✨ Official Verification System
            </div>
            <h1 style={{ fontSize: "3.5rem", marginBottom: "1rem", fontWeight: "900", letterSpacing: "-0.02em", textShadow: "0 4px 12px rgba(0,0,0,0.2)", lineHeight: "1.1" }}>
              Certificate Verification Portal
            </h1>
            <p style={{ fontSize: "1.375rem", opacity: "0.95", maxWidth: "700px", margin: "0 auto" }}>
              Verify the authenticity of digital certificates instantly with our secure authentication system
            </p>
          </div>
        </div>
        
        {/* Enhanced stats with better styling */}
        <div className="verification-stats" style={{ 
          marginTop: "3rem", 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "1.5rem",
          maxWidth: "900px",
          margin: "3rem auto 0"
        }}>
          <div className="stat-item" style={{ 
            background: "rgba(255,255,255,0.15)", 
            backdropFilter: "blur(20px)", 
            padding: "1.5rem",
            borderRadius: "var(--radius-xl)",
            border: "1px solid rgba(255,255,255,0.3)",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.25)";
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.15)";
            e.currentTarget.style.transform = "translateY(0)";
          }}>
            <div style={{ width: "48px", height: "48px", background: "rgba(255,255,255,0.2)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div>
              <strong style={{ display: "block", fontSize: "1.125rem", marginBottom: "0.25rem" }}>Secure</strong>
              <span style={{ opacity: "0.9", fontSize: "0.875rem" }}>256-bit SSL Encrypted</span>
            </div>
          </div>
          <div className="stat-item" style={{ 
            background: "rgba(255,255,255,0.15)", 
            backdropFilter: "blur(20px)", 
            padding: "1.5rem",
            borderRadius: "var(--radius-xl)",
            border: "1px solid rgba(255,255,255,0.3)",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.25)";
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.15)";
            e.currentTarget.style.transform = "translateY(0)";
          }}>
            <div style={{ width: "48px", height: "48px", background: "rgba(255,255,255,0.2)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <div>
              <strong style={{ display: "block", fontSize: "1.125rem", marginBottom: "0.25rem" }}>Real-time</strong>
              <span style={{ opacity: "0.9", fontSize: "0.875rem" }}>Instant Verification</span>
            </div>
          </div>
          <div className="stat-item" style={{ 
            background: "rgba(255,255,255,0.15)", 
            backdropFilter: "blur(20px)", 
            padding: "1.5rem",
            borderRadius: "var(--radius-xl)",
            border: "1px solid rgba(255,255,255,0.3)",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.25)";
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.15)";
            e.currentTarget.style.transform = "translateY(0)";
          }}>
            <div style={{ width: "48px", height: "48px", background: "rgba(255,255,255,0.2)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <div>
              <strong style={{ display: "block", fontSize: "1.125rem", marginBottom: "0.25rem" }}>Authentic</strong>
              <span style={{ opacity: "0.9", fontSize: "0.875rem" }}>Tamper-proof Records</span>
            </div>
          </div>
        </div>
      </div>

      <div className="verify-content" style={{ maxWidth: "900px", margin: "-60px auto 0", position: "relative", zIndex: "10", padding: "0 1.5rem 3rem" }}>
        {!code && (
          <div className="verify-input-card" style={{ 
            animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both",
            background: "white",
            borderRadius: "var(--radius-2xl)",
            padding: "3rem",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
            border: "2px solid #e2e8f0"
          }}>
            <div className="input-card-header" style={{ marginBottom: "2.5rem", textAlign: "center" }}>
              <div style={{ width: "80px", height: "80px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: "var(--radius-2xl)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4"></path>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
              </div>
              <h2 style={{ fontSize: "2rem", marginBottom: "0.75rem", fontWeight: "800", color: "var(--text-main)" }}>Verify Certificate</h2>
              <p style={{ fontSize: "1.125rem", color: "var(--text-muted)" }}>Enter the unique certificate code to verify authenticity and view details</p>
            </div>
            
            <form onSubmit={submitCode}>
              <div className="form-group" style={{ marginBottom: "2rem" }}>
                <label htmlFor="code" style={{ 
                  fontWeight: "700", 
                  fontSize: "0.9375rem", 
                  marginBottom: "0.75rem", 
                  display: "block",
                  color: "var(--text-main)"
                }}>Certificate Verification Code</label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <input
                    id="code"
                    type="text"
                    placeholder="Enter certificate code (e.g., CERT-2025-ABC123)"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    className="verify-input"
                    style={{
                      paddingLeft: "3rem",
                      fontSize: "1.125rem",
                      fontWeight: "500",
                      height: "60px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "var(--radius-lg)",
                      transition: "all 0.2s ease",
                      textTransform: "uppercase"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#667eea";
                      e.target.style.boxShadow = "0 0 0 4px rgba(102, 126, 234, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
                {formError && <p className="input-error" style={{ 
                  color: "var(--danger)", 
                  fontSize: "0.875rem", 
                  marginTop: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  {formError}
                </p>}
              </div>
              <button type="submit" className="btn btn-primary w-full verify-btn" style={{
                height: "60px",
                fontSize: "1.125rem",
                fontWeight: "700",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(102, 126, 234, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(102, 126, 234, 0.3)";
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                Verify Certificate Now
              </button>
            </form>
            
            {/* How it works section */}
            <div style={{ marginTop: "3rem", padding: "2rem", background: "var(--bg-subtle)", borderRadius: "var(--radius-xl)", border: "2px dashed #cbd5e1" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "700", marginBottom: "1.5rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                How Verification Works
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <div style={{ 
                    width: "40px", 
                    height: "40px", 
                    borderRadius: "50%", 
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
                    color: "white", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontWeight: "800",
                    fontSize: "1.125rem",
                    flexShrink: 0
                  }}>1</div>
                  <div>
                    <h4 style={{ fontSize: "0.9375rem", fontWeight: "700", marginBottom: "0.25rem", color: "var(--text-main)" }}>Enter Code</h4>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>Input your unique certificate code</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <div style={{ 
                    width: "40px", 
                    height: "40px", 
                    borderRadius: "50%", 
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
                    color: "white", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontWeight: "800",
                    fontSize: "1.125rem",
                    flexShrink: 0
                  }}>2</div>
                  <div>
                    <h4 style={{ fontSize: "0.9375rem", fontWeight: "700", marginBottom: "0.25rem", color: "var(--text-main)" }}>Verify</h4>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>System checks authenticity instantly</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <div style={{ 
                    width: "40px", 
                    height: "40px", 
                    borderRadius: "50%", 
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
                    color: "white", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontWeight: "800",
                    fontSize: "1.125rem",
                    flexShrink: 0
                  }}>3</div>
                  <div>
                    <h4 style={{ fontSize: "0.9375rem", fontWeight: "700", marginBottom: "0.25rem", color: "var(--text-main)" }}>View Details</h4>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>See complete certificate information</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="verification-help">
              <div className="help-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <strong>How to verify?</strong>
              </div>
              <ul className="help-list">
                <li>Locate the unique certificate code on your digital certificate</li>
                <li>Enter the complete code in the field above</li>
                <li>Click "Verify Certificate" to check authenticity</li>
                <li>Or scan the QR code on your certificate with your mobile device</li>
              </ul>
            </div>
          </div>
        )}

        {renderStatusCard()}
        
        {code && (
           <div style={{ textAlign: "center", marginTop: "2rem" }}>
             <Link to="/verify" className="btn btn-secondary">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <polyline points="15 18 9 12 15 6"></polyline>
               </svg>
               Verify Another Certificate
             </Link>
           </div>
        )}
      </div>
      
      <div className="verify-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>About This Service</h4>
            <p>This is an official certificate verification portal. All certificates issued by our institution can be verified here in real-time.</p>
          </div>
          <div className="footer-section">
            <h4>Security Notice</h4>
            <p>This verification system uses advanced cryptographic methods to ensure the authenticity of certificates. Any tampering will be detected.</p>
          </div>
          <div className="footer-section">
            <h4>Need Help?</h4>
            <p>For assistance or questions about certificate verification, please contact our support team.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Digital Certificate Platform. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <span>•</span>
            <a href="#privacy">Privacy Policy</a>
            <span>•</span>
            <a href="#terms">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );
}
