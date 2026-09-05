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
          message: "Session expired or revoked. Please login again.",
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
