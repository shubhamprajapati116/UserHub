import { useState, useRef, useEffect } from "react";
import "./imagecropper.css";

function Spinner() {
  return (
    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function ImageCropperModal({ imageSrc, onCropComplete, onClose, loading }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);

  const maskRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setImgLoaded(false);
  }, [imageSrc]);

  const handleImageLoad = () => {
    setImgLoaded(true);
    setOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prevZoom) => Math.min(Math.max(1, prevZoom + delta), 3.5));
  };

  const handleSaveCrop = () => {
    if (!imgRef.current || !maskRef.current) return;

    const img = imgRef.current;
    if (!img.naturalWidth || !img.naturalHeight) return;

    const maskRect = maskRef.current.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();

    const canvas = document.createElement("canvas");
    const cropSize = 320; // High resolution 320x320 output
    canvas.width = cropSize;
    canvas.height = cropSize;
    const ctx = canvas.getContext("2d");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Fill white background to prevent black pixels on transparent images
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cropSize, cropSize);

    // Precise scaling factors between rendered screen image and natural image file
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;

    // Calculate exact crop coordinates relative to the natural image
    const cropX = Math.max(0, (maskRect.left - imgRect.left) * scaleX);
    const cropY = Math.max(0, (maskRect.top - imgRect.top) * scaleY);
    const cropWidth = Math.min(img.naturalWidth - cropX, maskRect.width * scaleX);
    const cropHeight = Math.min(img.naturalHeight - cropY, maskRect.height * scaleY);

    // Draw circular clip path on canvas
    ctx.beginPath();
    ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Draw exact cropped portion of image
    ctx.drawImage(
      img,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropSize,
      cropSize
    );

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
      >
        <div className="cropper-header">
          <h3>Crop Profile Photo</h3>
          <button
            type="button"
            className="cropper-close-btn"
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="cropper-body">
          <p className="cropper-instruction">
            Drag image to position & use slider to zoom
          </p>

          <div
            className="cropper-stage"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {/* The circular crop ring */}
            <div className="cropper-circle-ring" ref={maskRef}></div>

            {/* Target image */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop area"
              className={`cropper-target-img ${imgLoaded ? "loaded" : ""}`}
              onLoad={handleImageLoad}
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                cursor: isDragging ? "grabbing" : "grab",
              }}
            />
          </div>

          <div className="cropper-controls">
            <button
              type="button"
              className="zoom-btn"
              onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
              disabled={loading}
            >
              -
            </button>
            <input
              type="range"
              min="1"
              max="3.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="cropper-zoom-range"
              disabled={loading}
            />
            <button
              type="button"
              className="zoom-btn"
              onClick={() => setZoom((z) => Math.min(3.5, z + 0.2))}
              disabled={loading}
            >
              +
            </button>
          </div>
        </div>

        <div className="cropper-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveCrop}
            disabled={loading}
          >
            {loading ? <><Spinner /> Saving...</> : "Apply & Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropperModal;
