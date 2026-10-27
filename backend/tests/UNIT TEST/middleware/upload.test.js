let capturedMulterConfig = null;
let singleHandlerFn = null;

const mockSingle = jest.fn((fieldName) => {
  return (req, res, cb) => {
    if (singleHandlerFn) {
      singleHandlerFn(req, res, cb);
    } else {
      cb(null);
    }
  };
});

jest.mock("multer", () => {
  const multerMock = jest.fn((config) => {
    capturedMulterConfig = config;
    return {
      single: mockSingle,
    };
  });

  multerMock.diskStorage = jest.fn((opts) => opts);

  class MulterError extends Error {
    constructor(code, message) {
      super(message || code);
      this.name = "MulterError";
      this.code = code;
    }
  }

  multerMock.MulterError = MulterError;
  return multerMock;
});

const multer = require("multer");
const upload = require("../../../middleware/upload");

describe("upload Middleware Unit Tests (middleware/upload.js)", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    singleHandlerFn = null;
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  test("TC_01: upload function aur upload.single export hone chahiye aur middleware return karna chahiye", () => {
    expect(typeof upload).toBe("function");
    expect(upload.single).toBe(upload);

    const middleware = upload("profilephoto");
    expect(typeof middleware).toBe("function");
    expect(mockSingle).toHaveBeenCalledWith("profilephoto");
  });

  test("TC_02: Successful file upload hone par next() call hona chahiye aur koi error response nahi jaana chahiye", () => {
    singleHandlerFn = (req, res, cb) => {
      req.file = { filename: "avatar-123456.png" };
      cb(null);
    };

    const middleware = upload("profilephoto");
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test("TC_03: MulterError LIMIT_FILE_SIZE aane par 400 aur 5MB limit ka error message aana chahiye", () => {
    singleHandlerFn = (req, res, cb) => {
      const err = new multer.MulterError("LIMIT_FILE_SIZE", "File too large");
      cb(err);
    };

    const middleware = upload("profilephoto");
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      field: "profilephoto",
      message: "File size exceeds the 5MB limit. Please upload a smaller image.",
    });
  });

  test("TC_04: Other MulterError (e.g. LIMIT_UNEXPECTED_FILE) par 400 aur 'Upload error: <msg>' aana chahiye", () => {
    singleHandlerFn = (req, res, cb) => {
      const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Unexpected field");
      cb(err);
    };

    const middleware = upload("avatar");
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      field: "avatar",
      message: "Upload error: Unexpected field",
    });
  });

  test("TC_05: Non-multer Error (jaise invalid file type) aane par 400 status aur error.message aana chahiye", () => {
    singleHandlerFn = (req, res, cb) => {
      const err = new Error("Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed.");
      cb(err);
    };

    const middleware = upload("profilephoto");
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      field: "profilephoto",
      message: "Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed.",
    });
  });

  test("TC_06: Error without message aane par fallback 'Failed to process uploaded file.' aana chahiye", () => {
    singleHandlerFn = (req, res, cb) => {
      const err = new Error("");
      cb(err);
    };

    const middleware = upload("profilephoto");
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      field: "profilephoto",
      message: "Failed to process uploaded file.",
    });
  });

  describe("fileFilter Unit Tests", () => {
    test("TC_07: Valid image types (jpeg, png, webp, jpg) filter me pass hone chahiye", () => {
      const fileFilter = capturedMulterConfig.fileFilter;
      const validFiles = [
        { originalname: "photo.jpg", mimetype: "image/jpeg" },
        { originalname: "photo.jpeg", mimetype: "image/jpeg" },
        { originalname: "graphic.PNG", mimetype: "image/png" },
        { originalname: "banner.webp", mimetype: "image/webp" },
      ];

      validFiles.forEach((file) => {
        const cb = jest.fn();
        fileFilter({}, file, cb);
        expect(cb).toHaveBeenCalledWith(null, true);
      });
    });

    test("TC_08: Invalid file extensions ya invalid mime types (pdf, exe, text/plain) reject hone chahiye", () => {
      const fileFilter = capturedMulterConfig.fileFilter;
      const invalidFiles = [
        { originalname: "document.pdf", mimetype: "application/pdf" },
        { originalname: "script.exe", mimetype: "application/x-msdownload" },
        { originalname: "malicious.jpg.exe", mimetype: "image/jpeg" }, // ext .exe
        { originalname: "image.png", mimetype: "text/plain" }, // mime mismatch
      ];

      invalidFiles.forEach((file) => {
        const cb = jest.fn();
        fileFilter({}, file, cb);
        expect(cb).toHaveBeenCalledWith(
          expect.objectContaining({
            code: "INVALID_FILE_TYPE",
            message: "Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed.",
          }),
          false
        );
      });
    });
  });

  describe("storage filename & destination Unit Tests", () => {
    test("TC_09: destination callback uploads directory provide karta hai", () => {
      const destination = capturedMulterConfig.storage.destination;
      const cb = jest.fn();
      destination({}, {}, cb);
      expect(cb).toHaveBeenCalledWith(null, expect.stringContaining("uploads"));
    });

    test("TC_10: filename generator avatar-{timestamp}-{random}.ext format me unique filename banata hai", () => {
      const filenameFn = capturedMulterConfig.storage.filename;
      const cb = jest.fn();
      filenameFn({}, { originalname: "My Photo.PNG" }, cb);

      expect(cb).toHaveBeenCalledWith(null, expect.stringMatching(/^avatar-\d+-\d+\.png$/));
    });
  });
});
