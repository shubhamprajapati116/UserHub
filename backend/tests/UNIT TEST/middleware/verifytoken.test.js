jest.mock("jsonwebtoken");
jest.mock("../../../models/session");
jest.mock("../../../models/user");

const jwt = require("jsonwebtoken");
const Session = require("../../../models/session");
const User = require("../../../models/user");
const verifyToken = require("../../../middleware/verifytoken");

describe("verifyToken Middleware Unit Tests (middleware/verifytoken.js)", () => {
  let req;
  let res;
  let next;

  const mockUserLookup = (userDoc) => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(userDoc),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test_secret_key";
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    Session.deleteMany.mockResolvedValue({ deletedCount: 1 });
  });

  test("TC_01: Authorization header missing hone par 401 'No token provided' aana chahiye", async () => {
    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Access Denied: No token provided.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("TC_02: Header 'Bearer ' se start na hone par 401 'No token provided' aana chahiye", async () => {
    req.headers.authorization = "Basic some_token_value";

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Access Denied: No token provided.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("TC_03: Token 'null', 'undefined', ya empty ('Bearer ') hone par 401 'Invalid token format' aana chahiye", async () => {
    for (const invalidHeader of ["Bearer ", "Bearer null", "Bearer undefined"]) {
      res.status.mockClear();
      res.json.mockClear();
      req.headers.authorization = invalidHeader;

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Access Denied: Invalid token format.",
      });
    }
    expect(next).not.toHaveBeenCalled();
  });

  test("TC_04: Expired JWT token (TokenExpiredError) par 401 'Your session has expired' aana chahiye", async () => {
    req.headers.authorization = "Bearer expired.jwt.token";
    const expiredErr = new Error("jwt expired");
    expiredErr.name = "TokenExpiredError";
    jwt.verify.mockImplementation(() => {
      throw expiredErr;
    });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Your session has expired. Please log in again.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("TC_05: Invalid/corrupted JWT token par 401 'Invalid authentication token' aana chahiye", async () => {
    req.headers.authorization = "Bearer corrupted.jwt.token";
    jwt.verify.mockImplementation(() => {
      throw new Error("invalid signature");
    });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid authentication token. Please login again.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("TC_06: Token me sessionId ho lekin DB me session na mile (revoked) to 401 aana chahiye", async () => {
    req.headers.authorization = "Bearer valid.jwt.token";
    jwt.verify.mockReturnValue({
      id: "user_123",
      sessionId: "revoked_session_999",
    });
    Session.findOne.mockResolvedValue(null);

    await verifyToken(req, res, next);

    expect(Session.findOne).toHaveBeenCalledWith({
      sessionId: "revoked_session_999",
      userId: "user_123",
    });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "Session expired or revoked by administrator. Please login again.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("TC_07: User database se delete ho chuka ho (!userDoc) to sessions clean karke 401 dena chahiye", async () => {
    req.headers.authorization = "Bearer valid.jwt.token";
    jwt.verify.mockReturnValue({ id: "deleted_user_123" });
    mockUserLookup(null);

    await verifyToken(req, res, next);

    expect(Session.deleteMany).toHaveBeenCalledWith({
      userId: "deleted_user_123",
    });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "User account no longer exists. Please register or log in again.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("TC_08: Suspended user (status === 'suspended') hone par sessions delete karke 403 dena chahiye", async () => {
    req.headers.authorization = "Bearer valid.jwt.token";
    jwt.verify.mockReturnValue({ id: "suspended_user_123" });
    mockUserLookup({
      _id: "suspended_user_123",
      status: "suspended",
      isVerified: true,
    });

    await verifyToken(req, res, next);

    expect(Session.deleteMany).toHaveBeenCalledWith({
      userId: "suspended_user_123",
    });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "Your account has been suspended by administration. Contact support.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("TC_09: Banned user (status === 'banned') hone par sessions delete karke 403 dena chahiye", async () => {
    req.headers.authorization = "Bearer valid.jwt.token";
    jwt.verify.mockReturnValue({ id: "banned_user_123" });
    mockUserLookup({
      _id: "banned_user_123",
      status: "banned",
      isVerified: true,
    });

    await verifyToken(req, res, next);

    expect(Session.deleteMany).toHaveBeenCalledWith({
      userId: "banned_user_123",
    });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Your account has been permanently banned by administration.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("TC_10: Unverified user (isVerified === false) hone par sessions delete karke 401 dena chahiye", async () => {
    req.headers.authorization = "Bearer valid.jwt.token";
    jwt.verify.mockReturnValue({ id: "unverified_user_123" });
    mockUserLookup({
      _id: "unverified_user_123",
      status: "active",
      isVerified: false,
    });

    await verifyToken(req, res, next);

    expect(Session.deleteMany).toHaveBeenCalledWith({
      userId: "unverified_user_123",
    });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "Your account is unverified. Access is revoked until email verification.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("TC_11: Valid active & verified user (with active sessionId) hone par req.user set karke next() call hona chahiye", async () => {
    req.headers.authorization = "Bearer valid.jwt.token";
    const decodedPayload = {
      id: "active_user_123",
      role: "user",
      sessionId: "active_session_001",
    };
    jwt.verify.mockReturnValue(decodedPayload);
    Session.findOne.mockResolvedValue({ sessionId: "active_session_001" });
    mockUserLookup({
      _id: "active_user_123",
      status: "active",
      isVerified: true,
    });

    await verifyToken(req, res, next);

    expect(req.user).toEqual(decodedPayload);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
