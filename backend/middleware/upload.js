const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads");
console.log("Upload directory:", uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
  ];
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

  const ext = path.extname(file.originalname).toLowerCase();
  const isMimeValid = allowedMimeTypes.includes(file.mimetype);
  const isExtValid = allowedExtensions.includes(ext);

  if (isMimeValid && isExtValid) {
    cb(null, true);
  } else {
    const error = new Error(
      "Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed."
    );
    error.code = "INVALID_FILE_TYPE";
    cb(error, false);
  }
};

const multerUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter,
});

const upload = (fieldName) => {
  const uploadHandler = multerUpload.single(fieldName);

  return (req, res, next) => {
    uploadHandler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            field: fieldName,
            message: "File size exceeds the 5MB limit. Please upload a smaller image.",
          });
        }
        return res.status(400).json({
          field: fieldName,
          message: `Upload error: ${err.message}`,
        });
      } else if (err) {
        return res.status(400).json({
          field: fieldName,
          message: err.message || "Failed to process uploaded file.",
        });
      }
      next();
    });
  };
};

upload.single = upload;

module.exports = upload;