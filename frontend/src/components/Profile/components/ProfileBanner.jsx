import { useState, useEffect, useRef } from "react";
import { getBannerById, loadedImageUrls } from "./bannerData";
import { FiCamera, FiLoader } from "react-icons/fi";

function ProfileBanner({ bannerId, onOpenEditModal, isUpdating }) {
  const bannerObj = getBannerById(bannerId);
  const imgRef = useRef(null);

  // If already loaded in memory cache, initialize as loaded immediately (0ms delay)
  const isCached = loadedImageUrls.has(bannerObj.image);
  const [imageLoaded, setImageLoaded] = useState(isCached);
  const prevImageRef = useRef(bannerObj.image);

  useEffect(() => {
    // If the banner image actually changed
    if (prevImageRef.current !== bannerObj.image) {
      prevImageRef.current = bannerObj.image;
      if (!loadedImageUrls.has(bannerObj.image)) {
        setImageLoaded(false);
      }
    }

    // Check if DOM image is already complete (browser cache)
    if (imgRef.current && (imgRef.current.complete || imgRef.current.naturalWidth > 0)) {
      setImageLoaded(true);
      loadedImageUrls.add(bannerObj.image);
    }

    // Failsafe safety timeout: ensure loading never hangs
    const safetyTimer = setTimeout(() => {
      setImageLoaded(true);
      loadedImageUrls.add(bannerObj.image);
    }, 450);

    return () => clearTimeout(safetyTimer);
  }, [bannerObj.image]);

  const handleLoaded = () => {
    setImageLoaded(true);
    loadedImageUrls.add(bannerObj.image);
  };

  // Only show loading if actively updating or image genuinely not loaded yet
  const showLoading = isUpdating || (!imageLoaded && !loadedImageUrls.has(bannerObj.image));

  return (
    <div className="profile-banner">
      {/* Shimmer / Skeleton Loader ONLY when actively changing or first loading */}
      {showLoading && (
        <div className="profile-banner-skeleton">
          <div className="banner-skeleton-shimmer"></div>
          <div className="banner-skeleton-badge">
            <FiLoader className="banner-skeleton-spinner" size={14} />
            <span>Updating banner...</span>
          </div>
        </div>
      )}

      {/* Actual Banner Image */}
      <img
        ref={imgRef}
        src={bannerObj.image}
        alt={bannerObj.name || "Profile Cover Banner"}
        className={`profile-banner-img ${!showLoading ? "loaded" : "loading"}`}
        onLoad={handleLoaded}
        onError={handleLoaded}
        decoding="async"
      />

      {/* Bottom Subtle Gradient Fade */}
      <div className="banner-overlay-fade"></div>

      {/* Small Edit Banner Button */}
      <button
        type="button"
        className="profile-banner-edit-btn"
        onClick={onOpenEditModal}
        title="Change cover banner"
        aria-label="Edit Cover Banner"
      >
        <FiCamera size={14} className="banner-edit-icon" />
        <span className="banner-edit-text">Edit Banner</span>
      </button>
    </div>
  );
}

export default ProfileBanner;
