jest.mock("../../../models/user");

const User = require("../../../models/user");
const verifyAdmin = require("../../../middleware/VerifyAdmin");

describe("verifyAdmin Middleware Unit Tests (middleware/VerifyAdmin.js)", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: "670ca812f8a49c3e98123456" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  test("TC_01: Database me user na milne par 404 'User not found' return hona chahiye", async () => {
    User.findById.mockResolvedValue(null);

    await verifyAdmin(req, res, next);

    expect(User.findById).toHaveBeenCalledWith("670ca812f8a49c3e98123456");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    expect(next).not.toHaveBeenCalled();
  });

  test("TC_02: Normal user (role !== 'admin') hone par 403 'Access denied. Admin only.' aana chahiye", async () => {
    User.findById.mockResolvedValue({
      _id: "670ca812f8a49c3e98123456",
      role: "user",
    });

    await verifyAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Access denied. Admin only.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("TC_03: Admin user (role === 'admin') hone par next() call hona chahiye", async () => {
    User.findById.mockResolvedValue({
      _id: "670ca812f8a49c3e98123456",
      role: "admin",
    });

    await verifyAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("TC_04: Database query fail hone ya req.user missing hone par 500 Internal Error aana chahiye", async () => {
    User.findById.mockRejectedValue(new Error("Database connection error"));

    await verifyAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Database connection error",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
