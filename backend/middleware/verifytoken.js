const jwt = require("jsonwebtoken");
const Session = require("../models/session");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access Denied: No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token || token === "null" || token === "undefined") {
    return res.status(401).json({
      message: "Access Denied: Invalid token format.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // If token includes sessionId, verify active session
    if (decoded.sessionId) {
      const session = await Session.findOne({
        sessionId: decoded.sessionId,
        userId: decoded.id || decoded._id,
      });

      if (!session) {
        return res.status(401).json({
          message:
            "Session expired or revoked by administrator. Please login again.",
        });
      }
    }

    // Security check: Unverified users cannot use protected endpoints
    // Security check: Unverified, Suspended, or Banned users cannot use protected endpoints
    const User = require("../models/user");
    const userDoc = await User.findById(decoded.id || decoded._id).select(
      "isVerified status",
    );
    if (userDoc) {
      if (userDoc.status === "suspended") {
        await Session.deleteMany({ userId: userDoc._id }).catch(() => {});
        return res.status(403).json({
          message:
            "Your account has been suspended by administration. Contact support.",
        });
      }
      if (userDoc.status === "banned") {
        await Session.deleteMany({ userId: userDoc._id }).catch(() => {});
        return res.status(403).json({
          message:
            "Your account has been permanently banned by administration.",
        });
      }
      if (userDoc.isVerified === false) {
        await Session.deleteMany({ userId: userDoc._id }).catch(() => {});
        return res.status(401).json({
          message:
            "Your account is unverified. Access is revoked until email verification.",
        });
      }
    }
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Your session has expired. Please log in again.",
      });
    }
    return res.status(401).json({
      message: "Invalid authentication token. Please login again.",
    });
  }
};

module.exports = verifyToken;
