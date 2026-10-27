jest.mock("fs");

const fs = require("fs");
const path = require("path");
const {
  deleteFile,
  deleteMultipleFiles,
} = require("../../../utils/fileHelper");

describe("fileHelper Utility Unit Tests (utils/fileHelper.js)", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("deleteFile", () => {
    test("TC_01: filename null, undefined, number ya non-string hone par unlink call nahi hona chahiye", () => {
      deleteFile(null);
      deleteFile(undefined);
      deleteFile(12345);
      deleteFile({});
      deleteFile("");

      expect(fs.unlink).not.toHaveBeenCalled();
    });

    test("TC_02: Remote URLs (http, https) aur data URLs (base64) ignore hone chahiye", () => {
      deleteFile("http://res.cloudinary.com/image.jpg");
      deleteFile("https://example.com/avatar.png");
      deleteFile("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...");

      expect(fs.unlink).not.toHaveBeenCalled();
    });

    test("TC_03: Valid local filename hone par uploads directory ke path ke sath fs.unlink call hona chahiye", () => {
      fs.unlink.mockImplementation((filePath, cb) => cb(null));

      deleteFile("avatar-12345.png");

      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringMatching(/[\\/]uploads[\\/]avatar-12345\.png$/),
        expect.any(Function),
      );
    });

    test("TC_04: Directory traversal attempt (../../file.png) basename sanitize hona chahiye", () => {
      fs.unlink.mockImplementation((filePath, cb) => cb(null));

      deleteFile("../../etc/passwd");

      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringMatching(/[\\/]uploads[\\/]passwd$/),
        expect.any(Function),
      );
    });

    test("TC_05: fs.unlink error 'ENOENT' (file already not found) hone par console.error nahi chalna chahiye", () => {
      fs.unlink.mockImplementation((filePath, cb) => {
        const err = new Error("File not found");
        err.code = "ENOENT";
        cb(err);
      });

      deleteFile("missing-file.jpg");

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test("TC_06: fs.unlink me other error (jaise EPERM/EACCES) aane par console.error call hona chahiye", () => {
      fs.unlink.mockImplementation((filePath, cb) => {
        const err = new Error("Permission denied");
        err.code = "EPERM";
        cb(err);
      });

      deleteFile("locked-file.jpg");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("File Cleanup Error for locked-file.jpg"),
        "Permission denied",
      );
    });
  });

  describe("deleteMultipleFiles", () => {
    test("TC_07: non-array input (null, undefined, string, object) par safely return hona chahiye", () => {
      deleteMultipleFiles(null);
      deleteMultipleFiles(undefined);
      deleteMultipleFiles("single-string");
      deleteMultipleFiles({ file: "test.png" });

      expect(fs.unlink).not.toHaveBeenCalled();
    });

    test("TC_08: Array of filenames pass karne par har file ke liye deleteFile call hona chahiye", () => {
      fs.unlink.mockImplementation((filePath, cb) => cb(null));

      const files = [
        "avatar1.jpg",
        "https://remote.com/pic.png",
        "avatar2.png",
      ];
      deleteMultipleFiles(files);

      expect(fs.unlink).toHaveBeenCalledTimes(2);
      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringMatching(/[\\/]uploads[\\/]avatar1\.jpg$/),
        expect.any(Function),
      );
      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringMatching(/[\\/]uploads[\\/]avatar2\.png$/),
        expect.any(Function),
      );
    });
  });
});
