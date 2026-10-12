const User = require("../models/user");
const Session = require("../models/session");
const sendEmail = require("../utils/sendEmail");
const emailTemplates = require("../utils/emailTemplates");
const adminController = require("./adminController");

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({
        message: "Invalid verification link. Please request a new one.",
      });
    }

    if (
      user.verificationTokenExpire &&
      user.verificationTokenExpire < new Date()
    ) {
      return res.status(410).json({
        message:
          "This verification link has expired (valid for 72 hours).",
        isExpired: true,
        hasPendingEmail: !!user.pendingEmail,
      });
    }

    const previousEmail = user.email;
    const isPendingEmailUpdate = !!user.pendingEmail;
    const confirmedNewEmail = user.pendingEmail;

    if (isPendingEmailUpdate) {
      user.email = confirmedNewEmail;
      user.pendingEmail = null;
      user.emailChangeOtp = null;
      user.emailChangeOtpExpire = null;

      await Session.deleteMany({ userId: user._id }).catch(() => {});
    }

    user.isVerified = true;
    if (!user.status) {
      user.status = "active";
    }
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    if (isPendingEmailUpdate) {
      sendEmail(
        confirmedNewEmail,
        "Email Address Successfully Updated - UserHub",
        emailTemplates.emailChangeSuccessTemplate({
          name: user.name,
          newEmail: confirmedNewEmail,
        }),
      ).catch((err) =>
        console.error("Error sending update success notice:", err.message),
      );

      sendEmail(
        previousEmail,
        "[Security Notice] Your UserHub account email has been changed",
        emailTemplates.oldEmailChangeNoticeTemplate({
          name: user.name,
          oldEmail: previousEmail,
          newEmail: confirmedNewEmail,
          changedBy: "an Administrator",
        }),
      ).catch((err) =>
        console.error("Error sending old email notice:", err.message),
      );
    }

    return res.status(200).json({
      message: isPendingEmailUpdate
        ? `Your email address has been successfully verified and updated to ${confirmedNewEmail}!`
        : "Email verified successfully!",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  verifyEmail,

  ...adminController,
};
