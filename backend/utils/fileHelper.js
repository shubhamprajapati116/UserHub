const fs = require("fs");
const path = require("path");

const deleteFile = (filename) => {
  if (!filename || typeof filename !== "string") return;

  if (
    filename.startsWith("http://") ||
    filename.startsWith("https://") ||
    filename.startsWith("data:")
  ) {
    return;
  }

  const safeFilename = path.basename(filename.trim());
  if (!safeFilename) return;

  const filePath = path.join(__dirname, "../uploads", safeFilename);

  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error(
        `⚠️ [File Cleanup Error for ${safeFilename}]:`,
        err.message,
      );
    }
  });
};

const deleteMultipleFiles = (filenames = []) => {
  if (!Array.isArray(filenames)) return;
  filenames.forEach((file) => deleteFile(file));
};

module.exports = {
  deleteFile,
  deleteMultipleFiles,
};
