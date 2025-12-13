import { useEffect } from "react";
import "./Modal.css";

export default function Modal({ isOpen, onClose, title, children, size = "medium" }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className={`modal-content modal-${size}`} 
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "default" }) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const buttonClass = type === "danger" ? "btn-danger" : "btn-primary";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
      <p style={{ marginBottom: "2rem", color: "var(--text-main)", fontSize: "1rem", lineHeight: "1.6" }}>
        {message}
      </p>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
        <button className="btn btn-secondary" onClick={onClose}>
          {cancelText}
        </button>
        <button className={`btn ${buttonClass}`} onClick={handleConfirm}>
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
