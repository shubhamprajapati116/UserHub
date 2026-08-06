const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Access Denied",
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Decoded Token:", decoded); // Log the decoded token for debugging
    req.user = decoded;

    next();
  } catch (error) {
   
    res.status(401).json({
      message: "Invalid Token",
    });
  }
};

module.exports = verifyToken;
