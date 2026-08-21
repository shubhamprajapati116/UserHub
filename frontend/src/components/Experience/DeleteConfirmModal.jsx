import { useEffect } from "react";
import "./deleteconfirm.css";

function DeleteConfirmModal({ title, subtitle, onConfirm, onCancel, loading }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="del-modal-overlay" onClick={onCancel}>
      <div className="del-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="del-modal-icon-wrap">
          <div className="del-modal-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>
        </div>

        <h3 className="del-modal-title">Delete Work Experience?</h3>
        
        <p className="del-modal-desc">
          Are you sure you want to delete this work experience entry? This action cannot be undone.
        </p>

        {title && (
          <div className="del-item-preview">
            <span className="del-item-title">{title}</span>
            {subtitle && <span className="del-item-sub">@ {subtitle}</span>}
          </div>
        )}

        <div className="del-modal-actions">
          <button
            type="button"
            className="btn btn-secondary del-cancel-btn"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn del-confirm-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: "6px", flexShrink: 0 }}
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            <span>{loading ? "Deleting..." : "Delete Experience"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
