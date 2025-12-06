import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import api from "../api";

export default function VerifyPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputCode, setInputCode] = useState(code ?? "");
  const [formError, setFormError] = useState("");

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
              <div className="share-input-group">
                <input readOnly value={shareUrl} className="share-input" />
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    alert('Verification link copied to clipboard!');
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  Copy Link
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
    <div className="verify-page">
      <div className="verify-hero-official">
        <div className="official-header">
          <div className="institution-badge">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
              <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
            </svg>
          </div>
          <div className="official-title">
            <h1>Official Certificate Verification Portal</h1>
            <p>Secure credential authentication system</p>
          </div>
        </div>
        
        <div className="verification-stats">
          <div className="stat-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <div>
              <strong>Secure</strong>
              <span>SSL Encrypted</span>
            </div>
          </div>
          <div className="stat-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            <div>
              <strong>Real-time</strong>
              <span>Instant Verification</span>
            </div>
          </div>
          <div className="stat-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <div>
              <strong>Authentic</strong>
              <span>Tamper-proof</span>
            </div>
          </div>
        </div>
      </div>

      <div className="verify-content">
        {!code && (
          <div className="verify-input-card">
            <div className="input-card-header">
              <h2>Verify Certificate</h2>
              <p>Enter the unique certificate code to verify authenticity</p>
            </div>
            
            <form onSubmit={submitCode}>
              <div className="form-group">
                <label htmlFor="code">Certificate Verification Code</label>
                <input
                  id="code"
                  type="text"
                  placeholder="Enter certificate code (e.g., APSIT-2025-ABC123)"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="verify-input"
                />
                {formError && <p className="input-error">{formError}</p>}
              </div>
              <button type="submit" className="btn btn-primary w-full verify-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                Verify Certificate
              </button>
            </form>
            
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
