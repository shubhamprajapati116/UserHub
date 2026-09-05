/**
 * ════════════════════════════════════════════════════════════════
 * ✉️ UserHub Enterprise Email Template System
 * Responsive, Modern, Clean HTML Email Templates matching
 * industry standards (Stripe, GitHub, Google Workspace).
 * ════════════════════════════════════════════════════════════════
 */

function baseLayout({ title, badge, badgeColor = "#2563eb", contentHtml }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased; color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9; padding:40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px; background-color:#ffffff; border-radius:14px; border:1px solid #e2e8f0; box-shadow:0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.04); overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 20px; border-bottom:1px solid #f1f5f9; background:linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="display:inline-flex; align-items:center;">
                      <div style="width:34px; height:34px; background:linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); border-radius:8px; display:inline-block; text-align:center; line-height:34px; color:#ffffff; font-weight:800; font-size:18px; margin-right:10px; vertical-align:middle;">
                        U
                      </div>
                      <span style="font-size:20px; font-weight:800; color:#0f172a; letter-spacing:-0.02em; vertical-align:middle;">UserHub</span>
                    </div>
                  </td>
                  <td align="right">
                    <span style="display:inline-block; padding:4px 10px; background-color:${badgeColor}15; color:${badgeColor}; border:1px solid ${badgeColor}30; border-radius:9999px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em;">
                      ${badge}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px 32px 28px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 32px; background-color:#f8fafc; border-top:1px solid #e2e8f0; text-align:center;">
              <p style="margin:0 0 6px; font-size:12px; color:#64748b; line-height:1.5;">
                This is an automated security message from <strong>UserHub</strong>. Please do not reply directly to this email.
              </p>
              <p style="margin:0; font-size:11px; color:#94a3b8;">
                © ${new Date().getFullYear()} UserHub Inc. • Enterprise Account Security & Identity Management
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ── 1. Registration Account Verification Email ──
function registerVerificationEmail({ name, verifyUrl }) {
  const contentHtml = `
    <h1 style="margin:0 0 12px; font-size:22px; font-weight:700; color:#0f172a; letter-spacing:-0.02em;">
      Welcome to UserHub, ${name || "there"}! 🎉
    </h1>
    <p style="margin:0 0 20px; font-size:14.5px; color:#475569; line-height:1.6;">
      Thank you for creating your account. To activate your account and start using UserHub, please confirm your email address by clicking the button below:
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0 24px;">
      <tr>
        <td align="center">
          <a href="${verifyUrl}" style="display:inline-block; padding:13px 32px; background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px; box-shadow:0 4px 12px rgba(37, 99, 235, 0.35);">
            Verify Email Address →
          </a>
        </td>
      </tr>
    </table>

    <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 14px; margin-top:24px;">
      <p style="margin:0 0 6px; font-size:12px; color:#64748b; font-weight:600;">Button not working? Copy and paste this link into your browser:</p>
      <p style="margin:0; font-size:12px; color:#2563eb; word-break:break-all; font-family:monospace;">${verifyUrl}</p>
    </div>

    <p style="margin:20px 0 0; font-size:13px; color:#94a3b8; line-height:1.5;">
      If you did not register for a UserHub account, please ignore this email.
    </p>
  `;

  return baseLayout({
    title: "Verify Your UserHub Account",
    badge: "Account Activation",
    badgeColor: "#2563eb",
    contentHtml,
  });
}

// ── 2. Login Security 6-Digit OTP Email (Unknown Device / 2FA) ──
function loginOtpEmail({ name, otp, deviceDesc, timeStr }) {
  const contentHtml = `
    <h1 style="margin:0 0 10px; font-size:22px; font-weight:700; color:#0f172a; letter-spacing:-0.02em;">
      Login Verification Code
    </h1>
    <p style="margin:0 0 18px; font-size:14.5px; color:#475569; line-height:1.6;">
      Hello ${name || "User"}, we detected a sign-in attempt to your UserHub account from <strong>${deviceDesc || "a new device/browser"}</strong>.
    </p>

    <!-- OTP Display Box -->
    <div style="background:linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border:1.5px dashed #cbd5e1; border-radius:12px; padding:22px 16px; text-align:center; margin:22px 0;">
      <div style="font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px;">
        Your 6-Digit Verification Code
      </div>
      <div style="font-size:38px; font-weight:800; letter-spacing:10px; color:#0f172a; font-family:'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; line-height:1;">
        ${otp}
      </div>
      <div style="margin-top:10px; font-size:12px; color:#64748b;">
        ⏱️ Expires in <strong>10 minutes</strong>
      </div>
    </div>

    <!-- Security Info Box -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:12px 16px; margin:20px 0;">
      <tr>
        <td style="font-size:13px; color:#1e40af; line-height:1.5;">
          <strong>Security Notice:</strong> Never share this code with anyone. UserHub staff will never ask for your verification code.
        </td>
      </tr>
    </table>

    <p style="margin:16px 0 0; font-size:12.5px; color:#94a3b8; line-height:1.5;">
      If you did not attempt to sign in, someone else may have your password. Please reset your password immediately to secure your account.
    </p>
  `;

  return baseLayout({
    title: "UserHub Login Verification Code",
    badge: "Security Code",
    badgeColor: "#4f46e5",
    contentHtml,
  });
}

// ── 3. Password Reset Email ──
function passwordResetEmail({ name, resetUrl }) {
  const contentHtml = `
    <h1 style="margin:0 0 12px; font-size:22px; font-weight:700; color:#0f172a; letter-spacing:-0.02em;">
      Reset Your Password
    </h1>
    <p style="margin:0 0 18px; font-size:14.5px; color:#475569; line-height:1.6;">
      Hello ${name || "there"}, we received a request to reset the password for your UserHub account. Click the button below to choose a new password:
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0 24px;">
      <tr>
        <td align="center">
          <a href="${resetUrl}" style="display:inline-block; padding:13px 32px; background:linear-gradient(135deg, #d97706 0%, #b45309 100%); color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px; box-shadow:0 4px 12px rgba(217, 119, 6, 0.35);">
            Reset Password →
          </a>
        </td>
      </tr>
    </table>

    <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 14px; margin-top:24px;">
      <p style="margin:0 0 6px; font-size:12px; color:#64748b; font-weight:600;">Button not working? Copy and paste this link:</p>
      <p style="margin:0; font-size:12px; color:#d97706; word-break:break-all; font-family:monospace;">${resetUrl}</p>
    </div>

    <p style="margin:20px 0 0; font-size:12.5px; color:#94a3b8; line-height:1.5;">
      This password reset link will expire in <strong>15 minutes</strong>. If you did not request a password reset, you can safely ignore this email.
    </p>
  `;

  return baseLayout({
    title: "Reset Your Password - UserHub",
    badge: "Password Reset",
    badgeColor: "#d97706",
    contentHtml,
  });
}

// ── 4. Self Profile Email Change 6-Digit OTP Email (Sent to NEW Email) ──
function selfEmailChangeOtpEmail({ name, newEmail, otp }) {
  const contentHtml = `
    <h1 style="margin:0 0 10px; font-size:22px; font-weight:700; color:#0f172a; letter-spacing:-0.02em;">
      Verify Your New Email Address
    </h1>
    <p style="margin:0 0 16px; font-size:14.5px; color:#475569; line-height:1.6;">
      Hello ${name || "User"}, you requested to change your UserHub account email to <strong>${newEmail}</strong>.
    </p>
    <p style="margin:0 0 18px; font-size:14px; color:#475569; line-height:1.6;">
      Please enter the 6-digit confirmation code below in your Edit Profile modal to confirm that you own this email address:
    </p>

    <!-- OTP Box -->
    <div style="background:linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border:1.5px dashed #3b82f6; border-radius:12px; padding:22px 16px; text-align:center; margin:22px 0;">
      <div style="font-size:12px; font-weight:700; color:#2563eb; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px;">
        Email Verification Code
      </div>
      <div style="font-size:38px; font-weight:800; letter-spacing:10px; color:#0f172a; font-family:'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; line-height:1;">
        ${otp}
      </div>
      <div style="margin-top:10px; font-size:12px; color:#64748b;">
        ⏱️ Code valid for <strong>10 minutes</strong>
      </div>
    </div>

    <p style="margin:16px 0 0; font-size:12.5px; color:#94a3b8; line-height:1.5;">
      If you did not request this email change, please ignore this email. Your existing email address will remain unchanged.
    </p>
  `;

  return baseLayout({
    title: "Verify New Email - UserHub",
    badge: "Email Verification",
    badgeColor: "#2563eb",
    contentHtml,
  });
}

// ── 5. Admin Edit User: Pending Email Change Verification Link (Sent to NEW Email) ──
function adminEmailChangePendingVerificationEmail({ name, oldEmail, newEmail, verifyUrl }) {
  const contentHtml = `
    <h1 style="margin:0 0 12px; font-size:22px; font-weight:700; color:#0f172a; letter-spacing:-0.02em;">
      Confirm Your New Email Address
    </h1>
    <p style="margin:0 0 16px; font-size:14.5px; color:#475569; line-height:1.6;">
      Hello ${name || "User"}, an administrator has initiated a request to update your UserHub account email from <span style="text-decoration:line-through; color:#94a3b8;">${oldEmail}</span> to <strong>${newEmail}</strong>.
    </p>
    <p style="margin:0 0 20px; font-size:14px; color:#475569; line-height:1.6;">
      To complete this update and activate this email on your account, please click the button below:
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0 24px;">
      <tr>
        <td align="center">
          <a href="${verifyUrl}" style="display:inline-block; padding:13px 32px; background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px; box-shadow:0 4px 12px rgba(37, 99, 235, 0.35);">
            Confirm & Activate New Email →
          </a>
        </td>
      </tr>
    </table>

    <div style="background-color:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:14px 16px; margin:22px 0;">
      <p style="margin:0; font-size:13px; color:#1e40af; line-height:1.5;">
        🔒 <strong>Your account is safe:</strong> Until you confirm this link, your previous email (${oldEmail}) remains fully active. If this change was not expected, please contact your administrator.
      </p>
    </div>

    <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 14px; margin-top:20px;">
      <p style="margin:0 0 6px; font-size:12px; color:#64748b; font-weight:600;">Button not working? Copy and paste this link:</p>
      <p style="margin:0; font-size:12px; color:#2563eb; word-break:break-all; font-family:monospace;">${verifyUrl}</p>
    </div>
  `;

  return baseLayout({
    title: "Confirm Email Address Update - UserHub",
    badge: "Admin Action",
    badgeColor: "#2563eb",
    contentHtml,
  });
}

// ── 6. Security Alert Notice to OLD Email (ZERO OTP in message) ──
function oldEmailChangeNoticeTemplate({ name, oldEmail, newEmail, changedBy = "you" }) {
  const contentHtml = `
    <h1 style="margin:0 0 12px; font-size:22px; font-weight:700; color:#0f172a; letter-spacing:-0.02em;">
      Security Notice: Email Change Requested
    </h1>
    <p style="margin:0 0 16px; font-size:14.5px; color:#475569; line-height:1.6;">
      Hello ${name || "User"}, a request was initiated by <strong>${changedBy}</strong> to update your UserHub account email address:
    </p>

    <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px 18px; margin:18px 0;">
      <div style="font-size:13px; color:#64748b; margin-bottom:6px;">Current Active Email: <strong style="color:#0f172a;">${oldEmail}</strong></div>
      <div style="font-size:13px; color:#64748b;">Requested New Email: <strong style="color:#2563eb;">${newEmail}</strong></div>
    </div>

    <div style="background-color:#fff1f2; border:1px solid #fecdd3; border-radius:8px; padding:14px 16px; margin:20px 0;">
      <p style="margin:0; font-size:13px; color:#9f1239; line-height:1.5;">
        ⚠️ <strong>Did not request this change?</strong><br/>
        If you did not authorize this change, please change your password immediately in your account settings and notify support.
      </p>
    </div>

    <p style="margin:16px 0 0; font-size:12.5px; color:#94a3b8; line-height:1.5;">
      Your current email address (${oldEmail}) remains active until the verification code/link is confirmed from the new email address.
    </p>
  `;

  return baseLayout({
    title: "Security Notice: Email Change Requested",
    badge: "Security Alert",
    badgeColor: "#e11d48",
    contentHtml,
  });
}

// ── 7. Email Change Completed Success Email (Sent to NEW Email) ──
function emailChangeSuccessTemplate({ name, newEmail }) {
  const contentHtml = `
    <h1 style="margin:0 0 12px; font-size:22px; font-weight:700; color:#0f172a; letter-spacing:-0.02em;">
      Email Update Completed ✅
    </h1>
    <p style="margin:0 0 16px; font-size:14.5px; color:#475569; line-height:1.6;">
      Hello ${name || "User"}, your UserHub account email address has been successfully verified and updated to:
    </p>

    <div style="background-color:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:16px 20px; text-align:center; margin:20px 0;">
      <span style="font-size:16px; font-weight:700; color:#166534; font-family:monospace;">${newEmail}</span>
    </div>

    <p style="margin:0 0 16px; font-size:14px; color:#475569; line-height:1.6;">
      You can now use this email address for all future logins, account notifications, and password resets.
    </p>

    <p style="margin:20px 0 0; font-size:12.5px; color:#94a3b8; line-height:1.5;">
      If you did not perform this change, please contact our support team immediately.
    </p>
  `;

  return baseLayout({
    title: "Email Address Updated - UserHub",
    badge: "Update Completed",
    badgeColor: "#16a34a",
    contentHtml,
  });
}

module.exports = {
  registerVerificationEmail,
  loginOtpEmail,
  passwordResetEmail,
  selfEmailChangeOtpEmail,
  adminEmailChangePendingVerificationEmail,
  oldEmailChangeNoticeTemplate,
  emailChangeSuccessTemplate,
};
