const jwt = require("jsonwebtoken");
const Session = require("../models/session");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Access Denied",
    });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const session = await Session.findOne({
      sessionId: decoded.sessionId,
      userId: decoded.id,
    }); 
    if (!session) {
      return res.status(401).json({
        message: "Session expired. Please login again.",
      });
    }
    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid Token",
    });
  }
};

module.exports = verifyToken;
