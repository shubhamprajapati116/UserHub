import { useState, useEffect } from "react";
import { BANNERS } from "./bannerData";
import { FiX, FiCheck, FiImage } from "react-icons/fi";

function ProfileBannerModal({ isOpen, onClose, currentBannerId, onSelectBanner, isSaving }) {
  const [selectedId, setSelectedId] = useState(currentBannerId || "banner_5");

  useEffect(() => {
    if (isOpen) {
      setSelectedId(currentBannerId || "banner_5");
    }
  }, [isOpen, currentBannerId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    onSelectBanner(selectedId);
  };

  const selectedBanner = BANNERS.find((b) => b.id === selectedId) || BANNERS[0];

  return (
    <div className="banner-modal-backdrop" onClick={onClose}>
      <div
        className="banner-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="banner-modal-title"
      >
        {/* Header */}
        <div className="banner-modal-header">
          <div className="banner-modal-header-text">
            <div className="banner-modal-badge">
              <FiImage size={13} />
              <span>Theme Gallery</span>
            </div>
            <h3 id="banner-modal-title">Customize Profile Cover</h3>
            <p>Choose a cover image from our curated collection to personalize your profile header.</p>
          </div>
          <button
            type="button"
            className="banner-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Banner Grid */}
        <div className="banner-modal-body">
          <div className="banner-gallery-grid">
            {BANNERS.map((banner) => {
              const isSelected = banner.id === selectedId;
              return (
                <div
                  key={banner.id}
                  className={`banner-gallery-card ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedId(banner.id)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(banner.id);
                    }
                  }}
                >
                  <div className="banner-card-img-wrap">
                    <img
                      src={banner.image}
                      alt={banner.name}
                      decoding="async"
                      className="banner-card-img"
                    />
                    <div className="banner-card-overlay"></div>
                    {isSelected && (
                      <div className="banner-card-selected-badge">
                        <FiCheck size={14} />
                      </div>
                    )}
                  </div>
                  <div className="banner-card-info">
                    <span className="banner-card-name">{banner.name}</span>
                    <span className="banner-card-category">{banner.category}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="banner-modal-footer">
          <div className="banner-footer-preview">
            <span className="banner-footer-label">Selected:</span>
            <strong className="banner-footer-selected-name">{selectedBanner.name}</strong>
          </div>
          <div className="banner-modal-footer-actions">
            <button
              type="button"
              className="banner-footer-cancel-btn"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="banner-footer-apply-btn"
              onClick={handleApply}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="banner-btn-spinner"></span>
                  Applying...
                </>
              ) : (
                "Save & Apply"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileBannerModal;
