const Session = require("../models/session");
const User = require("../models/user");

const getSessions = async (req, res) => {
  try {
    const currentSessionId = req.user.sessionId;

    const sessions = await Session.find({
      userId: req.user.id,
    }).sort({
      createdAt: -1,
    });

    const formattedSessions = sessions.map((s) => ({
      sessionId: s.sessionId,
      browser: s.browser,
      os: s.os,
      device: s.device,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      isCurrent: s.sessionId === currentSessionId,
    }));

    res.status(200).json(formattedSessions);
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

const logoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (sessionId === req.user.sessionId) {
      return res.status(400).json({
        message:
          "Cannot revoke your current active device session from here. Use the main Logout button.",
      });
    }

    const session = await Session.findOne({
      sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    if (session.deviceId) {
      await User.findByIdAndUpdate(req.user.id, {
        $pull: {
          trustedDevices: { deviceId: session.deviceId },
        },
      });
    }

    await Session.deleteOne({
      sessionId,
      userId: req.user.id,
    });

    return res.status(200).json({
      message: "Session revoked successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

const logoutCurrentDevice = async (req, res) => {
  try {
    await Session.deleteOne({
      sessionId: req.user.sessionId,
      userId: req.user.id,
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

const logoutOtherSessions = async (req, res) => {
  try {
    const otherSessions = await Session.find({
      userId: req.user.id,
      sessionId: {
        $ne: req.user.sessionId,
      },
    });

    const otherDeviceIds = otherSessions.map((s) => s.deviceId).filter(Boolean);

    if (otherDeviceIds.length > 0) {
      await User.findByIdAndUpdate(req.user.id, {
        $pull: {
          trustedDevices: { deviceId: { $in: otherDeviceIds } },
        },
      });
    }

    await Session.deleteMany({
      userId: req.user.id,
      sessionId: {
        $ne: req.user.sessionId,
      },
    });

    return res.status(200).json({
      message: "Other devices logged out and untrusted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

module.exports = {
  getSessions,
  logoutSession,
  logoutCurrentDevice,
  logoutOtherSessions,
};
