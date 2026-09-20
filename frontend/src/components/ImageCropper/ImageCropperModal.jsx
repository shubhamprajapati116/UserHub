import { useState, useRef, useEffect, useCallback } from "react";
import "./imagecropper.css";

function Spinner() {
  return (
    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const CROP_DIAMETER = 240; // 240px circular mask diameter on screen
const OUTPUT_SIZE = 512;   // 512x512 high-res HD output avatar
const PREVIEW_SIZE = 52;   // 52px live avatar thumbnail

function ImageCropperModal({ imageSrc, onCropComplete, onClose, loading }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270 deg
  const [flipH, setFlipH] = useState(false);
  const [baseSize, setBaseSize] = useState({ width: CROP_DIAMETER, height: CROP_DIAMETER });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const imgRef = useRef(null);
  const touchDistanceRef = useRef(null);
  const initialZoomRef = useRef(1);

  // Lock body scroll while modal is active & listen to Escape key
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [loading, onClose]);

  // Clamp pan offset so the circular crop area is NEVER empty in any rotation
  const clampOffset = useCallback((x, y, currentZoom, currentBaseSize, currentRotation = rotation) => {
    if (!currentBaseSize.width || !currentBaseSize.height) return { x: 0, y: 0 };
    const isRotated90or270 = currentRotation === 90 || currentRotation === 270;
    const effW = isRotated90or270 ? currentBaseSize.height : currentBaseSize.width;
    const effH = isRotated90or270 ? currentBaseSize.width : currentBaseSize.height;

    const dispW = effW * currentZoom;
    const dispH = effH * currentZoom;

    const maxDragX = Math.max(0, (dispW - CROP_DIAMETER) / 2);
    const maxDragY = Math.max(0, (dispH - CROP_DIAMETER) / 2);

    return {
      x: Math.min(maxDragX, Math.max(-maxDragX, x)),
      y: Math.min(maxDragY, Math.max(-maxDragY, y)),
    };
  }, [rotation]);

  const handleImageLoad = useCallback((e) => {
    const img = e?.target || imgRef.current;
    if (!img || !img.naturalWidth || !img.naturalHeight) return;

    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const aspect = nw / nh;

    let bw, bh;
    if (aspect >= 1) {
      bh = CROP_DIAMETER;
      bw = Math.round(CROP_DIAMETER * aspect);
    } else {
      bw = CROP_DIAMETER;
      bh = Math.round(CROP_DIAMETER / aspect);
    }

    setBaseSize({ width: bw, height: bh });
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
    setFlipH(false);
    setImgLoaded(true);
    setLoadError(false);
  }, []);

  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
    setFlipH(false);
    setImgLoaded(false);
    setLoadError(false);

    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      handleImageLoad({ target: imgRef.current });
    }
  }, [imageSrc, handleImageLoad]);

  const handleZoomChange = (newZoom) => {
    const clampedZoom = Math.min(3.5, Math.max(1, Number(newZoom.toFixed(2))));
    setZoom(clampedZoom);
    setOffset((prev) => clampOffset(prev.x, prev.y, clampedZoom, baseSize, rotation));
  };

  const handleRotate = () => {
    const nextRotation = (rotation + 90) % 360;
    setRotation(nextRotation);
    setOffset((prev) => clampOffset(prev.x, prev.y, zoom, baseSize, nextRotation));
  };

  const handleFlip = () => {
    setFlipH((prev) => !prev);
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
    setFlipH(false);
  };

  const handleDoubleClick = () => {
    const nextZoom = zoom > 1.2 ? 1 : 2;
    handleZoomChange(nextZoom);
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseMove = (e) => {
      const rawX = e.clientX - dragStart.x;
      const rawY = e.clientY - dragStart.y;
      setOffset(clampOffset(rawX, rawY, zoom, baseSize, rotation));
    };

    const handleWindowMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [isDragging, dragStart, zoom, baseSize, rotation, clampOffset]);

  // Touch handlers with Pinch-to-Zoom support
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
      touchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
      initialZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      const rawX = e.touches[0].clientX - dragStart.x;
      const rawY = e.touches[0].clientY - dragStart.y;
      setOffset(clampOffset(rawX, rawY, zoom, baseSize, rotation));
    } else if (e.touches.length === 2 && touchDistanceRef.current) {
      e.preventDefault();
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = currentDist / touchDistanceRef.current;
      const newZoom = initialZoomRef.current * factor;
      handleZoomChange(newZoom);
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length === 0) {
      setIsDragging(false);
      touchDistanceRef.current = null;
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
      touchDistanceRef.current = null;
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    handleZoomChange(zoom + delta);
  };

  // High-Res Canvas Crop Export
  const handleSaveCrop = () => {
    if (!imgRef.current || !imgRef.current.naturalWidth) return;
    const img = imgRef.current;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);

    const scale = OUTPUT_SIZE / CROP_DIAMETER;
    ctx.translate(offset.x * scale, offset.y * scale);

    ctx.scale(zoom, zoom);
    ctx.rotate((rotation * Math.PI) / 180);

    if (flipH) {
      ctx.scale(-1, 1);
    }

    const drawW = baseSize.width * scale;
    const drawH = baseSize.height * scale;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedFile = new File([blob], "profilephoto.jpg", {
            type: "image/jpeg",
          });
          onCropComplete(croppedFile);
        }
      },
      "image/jpeg",
      0.95
    );
  };

  return (
    <div className="cropper-modal-overlay" onClick={onClose}>
      <div
        className="cropper-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cropper-modal-title"
      >
        {/* Header */}
        <div className="cropper-header">
          <div className="cropper-header-title-group">
            <h3 id="cropper-modal-title">Crop & Adjust Photo</h3>
            <span className="cropper-header-badge">Profile Avatar</span>
          </div>
          <button
            type="button"
            className="cropper-close-btn"
            onClick={onClose}
            disabled={loading}
            aria-label="Close cropper"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="cropper-body">
          <p className="cropper-instruction">
            Drag to position photo • Pinch or use slider to zoom • Double-click to toggle zoom
          </p>

          {/* Stage Container */}
          <div
            className={`cropper-stage ${isDragging ? "is-dragging" : ""}`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
            title="Drag to reposition, double-click to toggle zoom"
          >
            {/* Screen-Anchored Translation Wrapper */}
            <div
              className="cropper-transform-wrapper"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
                pointerEvents: "none",
                willChange: "transform",
              }}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop area"
                className="cropper-target-img"
                onLoad={handleImageLoad}
                onError={() => {
                  setLoadError(true);
                  setImgLoaded(false);
                }}
                style={{
                  width: `${baseSize.width}px`,
                  height: `${baseSize.height}px`,
                  transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
                  transformOrigin: "center center",
                  display: loadError ? "none" : "block",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              />
            </div>

            {/* Circular Crop Mask Ring with Rule-of-Thirds Grid */}
            <div className="cropper-circle-ring">
              <div className={`cropper-grid-overlay ${isDragging ? "active" : ""}`}>
                <div className="cropper-grid-line cropper-grid-h1" />
                <div className="cropper-grid-line cropper-grid-h2" />
                <div className="cropper-grid-line cropper-grid-v1" />
                <div className="cropper-grid-line cropper-grid-v2" />
              </div>
            </div>

            {/* Loading state indicator */}
            {!imgLoaded && !loadError && (
              <div className="cropper-loading-state">
                <Spinner />
                <span>Loading photo...</span>
              </div>
            )}

            {/* Error state indicator */}
            {loadError && (
              <div className="cropper-error-state">
                <span>Failed to load selected photo</span>
              </div>
            )}
          </div>

          {/* Quick Adjustment Toolbar: Rotate, Flip, Reset */}
          <div className="cropper-toolbar">
            <button
              type="button"
              className="cropper-tool-btn"
              onClick={handleRotate}
              disabled={loading || !imgLoaded}
              title="Rotate 90° Clockwise"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>Rotate 90°</span>
            </button>

            <button
              type="button"
              className={`cropper-tool-btn ${flipH ? "active" : ""}`}
              onClick={handleFlip}
              disabled={loading || !imgLoaded}
              title="Flip Horizontally"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3m8-18h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3M12 2v20" />
              </svg>
              <span>Flip</span>
            </button>

            <button
              type="button"
              className="cropper-tool-btn"
              onClick={handleReset}
              disabled={loading || !imgLoaded}
              title="Reset Position & Zoom"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>Reset</span>
            </button>
          </div>

          {/* Zoom Slider Bar & Live Avatar Preview */}
          <div className="cropper-adjustment-row">
            <div className="cropper-zoom-section">
              <div className="cropper-zoom-header">
                <span className="cropper-zoom-label">Zoom</span>
                <span className="cropper-zoom-badge">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="cropper-zoom-bar">
                <button
                  type="button"
                  className="zoom-btn"
                  onClick={() => handleZoomChange(zoom - 0.15)}
                  disabled={loading || !imgLoaded || zoom <= 1}
                  aria-label="Zoom out"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>

                <input
                  type="range"
                  min="1"
                  max="3.5"
                  step="0.02"
                  value={zoom}
                  onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                  className="cropper-zoom-range"
                  disabled={loading || !imgLoaded}
                  aria-label="Zoom slider"
                />

                <button
                  type="button"
                  className="zoom-btn"
                  onClick={() => handleZoomChange(zoom + 0.15)}
                  disabled={loading || !imgLoaded || zoom >= 3.5}
                  aria-label="Zoom in"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Live Avatar Preview Pill */}
            <div className="cropper-preview-section">
              <div className="cropper-preview-circle">
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: 0,
                    height: 0,
                    transform: `translate(${offset.x * (PREVIEW_SIZE / CROP_DIAMETER)}px, ${offset.y * (PREVIEW_SIZE / CROP_DIAMETER)}px)`,
                  }}
                >
                  <img
                    src={imageSrc}
                    alt="Preview"
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: `${baseSize.width * (PREVIEW_SIZE / CROP_DIAMETER)}px`,
                      height: `${baseSize.height * (PREVIEW_SIZE / CROP_DIAMETER)}px`,
                      transform: `translate(-50%, -50%) scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
                      transformOrigin: "center center",
                      maxWidth: "none",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  />
                </div>
              </div>
              <div className="cropper-preview-meta">
                <span className="cropper-preview-title">Live Preview</span>
                <span className="cropper-preview-dim">{OUTPUT_SIZE} × {OUTPUT_SIZE} HD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="cropper-actions">
          <button
            type="button"
            className="btn btn-secondary cropper-cancel-btn"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-primary cropper-apply-btn"
            onClick={handleSaveCrop}
            disabled={loading || !imgLoaded || loadError}
          >
            {loading ? (
              <>
                <Spinner /> Saving Photo...
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Apply & Save Photo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropperModal;
