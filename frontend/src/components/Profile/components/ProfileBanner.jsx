import { useState, useEffect, useRef } from "react";
import { getBannerById, loadedImageUrls, preloadAllBanners } from "./bannerData";
import { FiCamera, FiLoader } from "react-icons/fi";

function ProfileBanner({ bannerId, onOpenEditModal, isUpdating, isLoading }) {
  const bannerObj = getBannerById(bannerId);
  const imgRef = useRef(null);

  const isCached = loadedImageUrls.has(bannerObj.image);
  const [imageLoaded, setImageLoaded] = useState(isCached);
  const prevImageRef = useRef(bannerObj.image);

  useEffect(() => {
    if (prevImageRef.current !== bannerObj.image) {
      prevImageRef.current = bannerObj.image;
      if (!loadedImageUrls.has(bannerObj.image)) {
        setImageLoaded(false);
      }
    }

    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setImageLoaded(true);
      loadedImageUrls.add(bannerObj.image);
    }

    const networkTimeout = setTimeout(() => {
      setImageLoaded(true);
    }, 12000);

    return () => clearTimeout(networkTimeout);
  }, [bannerObj.image]);

  const handleLoaded = () => {
    setImageLoaded(true);
    loadedImageUrls.add(bannerObj.image);
  };

  const handleError = () => {
    setImageLoaded(true);
  };

  const isBannerShimmering = isLoading || !imageLoaded;

  return (
    <div className="profile-banner">
      {isBannerShimmering && (
        <div className="profile-banner-skeleton" aria-hidden="true">
          <div className="banner-skeleton-shimmer"></div>
        </div>
      )}

      <img
        ref={imgRef}
        src={bannerObj.image}
        alt={bannerObj.name || "Profile Cover Banner"}
        className={`profile-banner-img ${imageLoaded ? "loaded" : "loading"}`}
        onLoad={handleLoaded}
        onError={handleError}
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />

      {isUpdating && (
        <div className="profile-banner-updating-badge">
          <FiLoader className="banner-skeleton-spinner" size={13} />
          <span>Updating banner...</span>
        </div>
      )}

      {!isLoading && (
        <button
          type="button"
          className="profile-banner-edit-btn"
          onClick={onOpenEditModal}
          onMouseEnter={preloadAllBanners}
          onFocus={preloadAllBanners}
          title="Change cover banner"
          aria-label="Edit Cover Banner"
        >
          <FiCamera size={14} className="banner-edit-icon" />
          <span className="banner-edit-text">Edit Banner</span>
        </button>
      )}
    </div>
  );
}

export default ProfileBanner;
