import { useState, useEffect } from "react";
import { BANNERS, preloadAllBanners } from "./bannerData";
import { FiX, FiCheck, FiImage } from "react-icons/fi";

function ProfileBannerModal({
  isOpen,
  onClose,
  currentBannerId,
  onSelectBanner,
  isSaving,
}) {
  const [selectedId, setSelectedId] = useState(currentBannerId || "banner_11");
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedId(currentBannerId || "banner_11");
      setIsClosing(false);
      setIsRendered(true);
      preloadAllBanners();
    } else if (isRendered) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
      }, 160);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentBannerId, isRendered]);

  const handleSmoothClose = () => {
    if (isSaving || isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 150);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isClosing) {
        handleSmoothClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isClosing, isSaving]);

  useEffect(() => {
    if (isRendered) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isRendered]);

  if (!isRendered) return null;

  const handleApply = () => {
    if (isSaving || isClosing) return;
    onSelectBanner(selectedId);
  };

  const selectedBanner = BANNERS.find((b) => b.id === selectedId) || BANNERS[0];

  return (
    <div
      className={`banner-modal-backdrop ${isClosing ? "closing" : ""}`}
      onClick={handleSmoothClose}
    >
      <div
        className={`banner-modal-dialog ${isClosing ? "closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="banner-modal-title"
      >
        <div className="banner-modal-header">
          <div className="banner-modal-header-text">
            <div className="banner-modal-badge">
              <FiImage size={13} />
              <span>Theme Gallery</span>
            </div>
            <h3 id="banner-modal-title">Customize Profile Cover</h3>
            <p>
              Choose a cover image from our curated collection to personalize
              your profile header.
            </p>
          </div>
          <button
            type="button"
            className="banner-modal-close-btn"
            onClick={handleSmoothClose}
            aria-label="Close"
            disabled={isSaving}
          >
            <FiX size={18} />
          </button>
        </div>

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
                      loading="lazy"
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
                    <span className="banner-card-name" title={banner.name}>{banner.name}</span>
                    <span className="banner-card-category">
                      {banner.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="banner-modal-footer">
          <div className="banner-footer-preview">
            <span className="banner-footer-label">Selected:</span>
            <strong className="banner-footer-selected-name">
              {selectedBanner.name}
            </strong>
          </div>
          <div className="banner-modal-footer-actions">
            <button
              type="button"
              className="banner-footer-cancel-btn"
              onClick={handleSmoothClose}
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
