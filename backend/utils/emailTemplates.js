/**
 * ════════════════════════════════════════════════════════════════
 * ✉️ UserHub Enterprise Email Template System
 * Responsive, Modern, Clean HTML Email Templates matching
 * industry standards (Stripe, GitHub, Google Workspace, AWS).
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Common Responsive Base Layout for all emails
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

/**
 * ════════════════════════════════════════════════════════════════
 * 📌 TEMPLATE 1: Registration Account Verification Email
 * ────────────────────────────────────────────────────────────────
 * • Kiske Liye Hai (Purpose):
 *   Naye register hone wale user ke email address ko verify aur account ko
 *   activate karne ke liye.
 * • Trigger Point:
 *   - Authcontroller.js -> register()
 *   - Authcontroller.js -> resendVerificationEmail()
 * • Recipient:
 *   Naye user ka registered email address.
 * • Functionality:
 *   Isme ek secure time-limited verification link button hota hai. Jab user
 *   is link par click karta hai, to uska account 'isVerified: true' mark
 *   ho jaata hai.
 * ════════════════════════════════════════════════════════════════
 */
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

/**
 * ════════════════════════════════════════════════════════════════
 * 📌 TEMPLATE 2: Login Security 6-Digit OTP Email (2FA / New Device)
 * ────────────────────────────────────────────────────────────────
 * • Kiske Liye Hai (Purpose):
 *   Jab user kisi naye device, unrecognized browser ya IP se login karta
 *   hai to identity verify karne ke liye 6-digit OTP code bheja jaata hai.
 * • Trigger Point:
 *   - Authcontroller.js -> login()
 *   - Authcontroller.js -> resendLoginOtp()
 * • Recipient:
 *   User ka registered email address.
 * • Functionality:
 *   Large font 6-digit OTP box jo 10 minutes me expire hota hai.
 *   Saath me security warning ki ye code kisi ke saath share na karein.
 * ════════════════════════════════════════════════════════════════
 */
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

/**
 * ════════════════════════════════════════════════════════════════
 * 📌 TEMPLATE 3: Password Reset Link Email
 * ────────────────────────────────────────────────────────────────
 * • Kiske Liye Hai (Purpose):
 *   Jab user apna password bhool jaata hai aur "Forgot Password" form se
 *   reset link request karta hai.
 * • Trigger Point:
 *   - Authcontroller.js -> forgotpassword()
 * • Recipient:
 *   User ka registered email address.
 * • Functionality:
 *   15 minutes valid cryptographic reset token link. Is par click karke
 *   user seedhe "Reset Password" page par pahunch kar naya password set karta hai.
 * ════════════════════════════════════════════════════════════════
 */
function passwordResetEmail({ name, resetUrl, verifyUrl }) {
  const url = resetUrl || verifyUrl;
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
          <a href="${url}" style="display:inline-block; padding:13px 32px; background:linear-gradient(135deg, #d97706 0%, #b45309 100%); color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px; box-shadow:0 4px 12px rgba(217, 119, 6, 0.35);">
            Reset Password →
          </a>
        </td>
      </tr>
    </table>

    <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 14px; margin-top:24px;">
      <p style="margin:0 0 6px; font-size:12px; color:#64748b; font-weight:600;">Button not working? Copy and paste this link:</p>
      <p style="margin:0; font-size:12px; color:#d97706; word-break:break-all; font-family:monospace;">${url}</p>
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

/**
 * ════════════════════════════════════════════════════════════════
 * 📌 TEMPLATE 4: Self Profile Email Change - 6-Digit OTP Email
 * ────────────────────────────────────────────────────────────────
 * • Kiske Liye Hai (Purpose):
 *   Jab user khud apni profile ya Security settings me jaakar apna
 *   email address change karne ki request daalta hai.
 * • Trigger Point:
 *   - profileController.js -> requestEmailChange()
 *   - profileController.js -> resendEmailChangeOtp()
 *   - profileController.js -> changeEmail()
 * • Recipient:
 *   User ka NAYA (NEW) requested email address (inbox ownership confirm karne ke liye).
 * • Functionality:
 *   6-digit verification code jo 10 minutes tak valid rehta hai. User is
 *   code ko Edit Profile modal me submit karke email change finalize karta hai.
 * ════════════════════════════════════════════════════════════════
 */
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

/**
 * ════════════════════════════════════════════════════════════════
 * 📌 TEMPLATE 5: Admin-Initiated Email Change Pending Verification Link
 * ────────────────────────────────────────────────────────────────
 * • Kiske Liye Hai (Purpose):
 *   Jab Administrator Admin Panel se kisi user ka email change karta hai,
 *   to bina verification ke user ka purana access band nahi hota. Naye email
 *   par verification link bheja jaata hai.
 * • Trigger Point:
 *   - usercontroller.js -> updateUser()
 *   - usercontroller.js -> resendPendingEmailVerification()
 *   - Authcontroller.js -> resendVerificationEmail() (agar pendingEmail exist karta ho)
 * • Recipient:
 *   User ka NAYA (NEW / Requested) email address.
 * • Functionality:
 *   Naye email par click-to-confirm link provide karta hai. Jab tak user is
 *   link ko click karke confirm nahi karta, uska purana email active rehta hai.
 * ════════════════════════════════════════════════════════════════
 */
function adminEmailChangePendingVerificationEmail({
  name,
  oldEmail,
  newEmail,
  verifyUrl,
}) {
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

/**
 * ════════════════════════════════════════════════════════════════
 * 📌 TEMPLATE 6: Security Notice to OLD Email Address (ZERO OTP in message)
 * ────────────────────────────────────────────────────────────────
 * • Kiske Liye Hai (Purpose):
 *   Jab bhi account ka email address change karne ki request create hoti hai ya
 *   complete hoti hai, to purane email inbox par instant security alert bheja jaata hai.
 * • Trigger Point:
 *   - profileController.js -> requestEmailChange()
 *   - profileController.js -> verifyEmailChangeOtp()
 *   - profileController.js -> changeEmail()
 *   - usercontroller.js -> updateUser()
 *   - usercontroller.js -> completePendingEmailVerification()
 *   - Authcontroller.js -> resendVerificationEmail()
 * • Recipient:
 *   User ka PURANA / CURRENT ACTIVE email address.
 * • Security Rule:
 *   Is email me KABHI BHI OTP ya confirmation link NAHI hota. Agar purana
 *   inbox hack bhi hua ho, to attacker verification code intercept nahi kar
 *   sakta. Isme user ko password change karne aur support se contact karne ki
 *   warning hoti hai.
 * ════════════════════════════════════════════════════════════════
 */
function oldEmailChangeNoticeTemplate({
  name,
  oldEmail,
  newEmail,
  changedBy = "you",
}) {
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

/**
 * ════════════════════════════════════════════════════════════════
 * 📌 TEMPLATE 7: Email Change Completed Success Notice
 * ────────────────────────────────────────────────────────────────
 * • Kiske Liye Hai (Purpose):
 *   Naye email address ki verification successfully complete hone ke baad
 *   user ko final success confirmation bhejne ke liye.
 * • Trigger Point:
 *   - profileController.js -> verifyEmailChangeOtp()
 *   - usercontroller.js -> completePendingEmailVerification()
 * • Recipient:
 *   NAYA (Successfully Updated Primary) email address.
 * • Functionality:
 *   User ko confirm karta hai ki ab unka naya email officially account ka
 *   primary login aur communication email ban chuka hai.
 * ════════════════════════════════════════════════════════════════
 */
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

/**
 * ════════════════════════════════════════════════════════════════
 * 📌 TEMPLATE 8: Admin Global Session Revocation Security Alert Email
 * ────────────────────────────────────────────────────────────────
 * • Kiske Liye Hai (Purpose):
 *   Jab administrator kisi user ke sabhi active device sessions ko ek sath
 *   terminate (force logout) kar deta hai (e.g. security breach suspicion).
 * • Trigger Point:
 *   - usercontroller.js -> revokeAllUserSessions()
 * • Recipient:
 *   User ka registered email address.
 * • Security Rule:
 *   Is email me ZERO expiring login tokens ya password bypass links hote hain.
 *   User ko kewal standard login page ka link milta hai taaki wo secure tarike
 *   se login credentials enter karke dubara authenticate kare.
 * ════════════════════════════════════════════════════════════════
 */
function sessionRevocationAlertEmail({ name, loginUrl, sessionCount = 0 }) {
  const contentHtml = `
    <h1 style="margin:0 0 12px; font-size:22px; font-weight:700; color:#0f172a; letter-spacing:-0.02em;">
      Security Alert: Active Sessions Revoked 🔒
    </h1>
    <p style="margin:0 0 16px; font-size:14.5px; color:#475569; line-height:1.6;">
      Hello ${name || "User"}, an administrator has revoked all active sessions for your UserHub account. As a security precaution, you have been <strong>logged out of all connected browsers and devices</strong>.
    </p>

    <div style="background-color:#fff1f2; border:1px solid #fecdd3; border-radius:10px; padding:16px 18px; margin:20px 0;">
      <div style="display:flex; align-items:flex-start;">
        <span style="font-size:18px; margin-right:10px; line-height:1;">⚠️</span>
        <div>
          <strong style="font-size:13.5px; color:#9f1239; display:block; margin-bottom:4px;">All Active Devices Terminated</strong>
          <p style="margin:0; font-size:13px; color:#be123c; line-height:1.5;">
            ${sessionCount > 0 ? `${sessionCount} active session(s) were closed.` : "Your active device sessions have been closed."} Any access tokens stored in your browser are no longer valid.
          </p>
        </div>
      </div>
    </div>

    <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px 18px; margin:20px 0;">
      <h3 style="margin:0 0 8px; font-size:14px; font-weight:700; color:#0f172a;">How to Access Your Account:</h3>
      <ol style="margin:0; padding-left:18px; font-size:13.5px; color:#475569; line-height:1.6;">
        <li style="margin-bottom:6px;">Visit the UserHub login page using the button below.</li>
        <li style="margin-bottom:6px;">Enter your registered email and password.</li>
        <li>Complete identity verification (such as email OTP or account verification) directly during your login process.</li>
      </ol>
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0 24px;">
      <tr>
        <td align="center">
          <a href="${loginUrl}" style="display:inline-block; padding:13px 32px; background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px; box-shadow:0 4px 12px rgba(37, 99, 235, 0.35);">
            Go to Login Page →
          </a>
        </td>
      </tr>
    </table>

    <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 14px; margin-top:22px;">
      <p style="margin:0 0 6px; font-size:12px; color:#64748b; font-weight:600;">Button not working? Copy and paste this link:</p>
      <p style="margin:0; font-size:12px; color:#2563eb; word-break:break-all; font-family:monospace;">${loginUrl}</p>
    </div>

    <p style="margin:22px 0 0; font-size:12.5px; color:#94a3b8; line-height:1.5;">
      If you did not expect this or believe your account has been compromised, please contact your administrator or support team immediately.
    </p>
  `;

  return baseLayout({
    title: "Security Alert: Active Sessions Revoked - UserHub",
    badge: "Security Alert",
    badgeColor: "#e11d48",
    contentHtml,
  });
}

/**
 * ════════════════════════════════════════════════════════════════
 * 📌 TEMPLATE 9: Unrecognized / New Device Login Security Alert (Out-of-Band)
 * ────────────────────────────────────────────────────────────────
 * • Kiske Liye Hai (Purpose):
 *   Jab user kisi naye device, unrecognized browser ya IP se OTP verify karke
 *   successfully sign-in karta hai, to real user ke inbox me instant out-of-band
 *   security notification alert bheja jaata hai.
 * • Trigger Point:
 *   - Authcontroller.js -> verifyLoginOtp()
 * • Recipient:
 *   User ka registered email address (Personal Inbox).
 * • Functionality:
 *   Device name, IP address aur timestamp clearly display karta hai, aur
 *   sath me "Review & Revoke Sessions" button provide karta hai jo user ko
 *   seedhe Settings/Sessions page par le jaata hai taaki unknown session ko
 *   turant revoke kiya ja sake.
 * ════════════════════════════════════════════════════════════════
 */
function newDeviceLoginAlertEmail({
  name,
  deviceDesc,
  currentIp,
  loginTime,
  securityUrl,
}) {
  const contentHtml = `
    <h1 style="margin:0 0 12px; font-size:22px; font-weight:700; color:#0f172a; letter-spacing:-0.02em;">
      Security Alert: New Sign-in Detected 🛡️
    </h1>
    <p style="margin:0 0 18px; font-size:14.5px; color:#475569; line-height:1.6;">
      Hello ${name || "User"}, we detected a successful sign-in to your UserHub account from an unrecognized device or browser.
    </p>

    <!-- Sign-in Details Box -->
    <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:18px 20px; margin:20px 0; font-size:14px; line-height:1.8;">
      <div style="margin-bottom:8px;">
        <span style="color:#64748b; font-weight:600; display:inline-block; width:90px;">💻 Device:</span>
        <strong style="color:#0f172a;">${deviceDesc || "Unrecognized Device"}</strong>
      </div>
      <div style="margin-bottom:8px;">
        <span style="color:#64748b; font-weight:600; display:inline-block; width:90px;">🌐 IP Address:</span>
        <code style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-family:monospace; color:#0f172a;">${currentIp || "Unknown IP"}</code>
      </div>
      <div>
        <span style="color:#64748b; font-weight:600; display:inline-block; width:90px;">🕒 Time:</span>
        <span style="color:#0f172a;">${loginTime || new Date().toLocaleString("en-IN")}</span>
      </div>
    </div>

    <!-- Warning Box -->
    <div style="background-color:#fff1f2; border:1px solid #fecdd3; border-radius:8px; padding:14px 16px; margin:20px 0;">
      <p style="margin:0; font-size:13px; color:#9f1239; line-height:1.5;">
        ⚠️ <strong>Don't recognize this activity?</strong><br/>
        If this wasn't you, your account credentials might be compromised. Click the button below immediately to review and revoke all active sessions.
      </p>
    </div>

    <!-- Action Button -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0 20px;">
      <tr>
        <td align="center">
          <a href="${securityUrl}" style="display:inline-block; padding:13px 32px; background:linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px; box-shadow:0 4px 12px rgba(220, 38, 38, 0.35);">
            Review & Revoke Sessions →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:16px 0 0; font-size:12.5px; color:#94a3b8; line-height:1.5;">
      If this was you signing in from this device, you can safely disregard this email.
    </p>
  `;

  return baseLayout({
    title: "Security Alert: New Sign-in to Your Account",
    badge: "Security Alert",
    badgeColor: "#dc2626",
    contentHtml,
  });
}

module.exports = {
  baseLayout,
  registerVerificationEmail,
  loginOtpEmail,
  passwordResetEmail,
  selfEmailChangeOtpEmail,
  adminEmailChangePendingVerificationEmail,
  oldEmailChangeNoticeTemplate,
  emailChangeSuccessTemplate,
  sessionRevocationAlertEmail,
  newDeviceLoginAlertEmail,
};
