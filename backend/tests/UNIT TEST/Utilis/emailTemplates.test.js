const emailTemplates = require("../../../utils/emailTemplates");

describe("emailTemplates Utility Unit Tests (utils/emailTemplates.js)", () => {
  const {
    baseLayout,
    registerVerificationEmail,
    loginOtpEmail,
    passwordResetEmail,
    selfEmailChangeOtpEmail,
    authorizeEmailChangeEmail,
    emergencyLockNoticeEmail,
    adminEmailChangePendingVerificationEmail,
    oldEmailChangeNoticeTemplate,
    emailChangeSuccessTemplate,
    sessionRevocationAlertEmail,
    newDeviceLoginAlertEmail,
    adminInvitationEmail,
    inviteAcceptedWelcomeEmail,
  } = emailTemplates;

  test("TC_01: baseLayout complete HTML document generate karta hai with title, badge aur content", () => {
    const html = baseLayout({
      title: "Test Email Title",
      badge: "Security",
      badgeColor: "#ef4444",
      contentHtml: "<p>Test Content Body</p>",
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>Test Email Title</title>");
    expect(html).toContain("Security");
    expect(html).toContain("Test Content Body");
    expect(html).toContain("UserHub");
  });

  test("TC_02: registerVerificationEmail me user name aur verifyUrl embed hone chahiye with fallback name", () => {
    const htmlWithName = registerVerificationEmail({
      name: "Rahul Sharma",
      verifyUrl: "https://userhub.com/verify?token=abc",
    });
    expect(htmlWithName).toContain("Rahul Sharma");
    expect(htmlWithName).toContain("https://userhub.com/verify?token=abc");
    expect(htmlWithName).toContain("Verify Email Address");

    const htmlFallback = registerVerificationEmail({
      verifyUrl: "https://userhub.com/verify?token=abc",
    });
    expect(htmlFallback).toContain("Welcome to UserHub, there!");
  });

  test("TC_03: loginOtpEmail me 6-digit OTP code aur device description render hona chahiye", () => {
    const html = loginOtpEmail({
      name: "Aman",
      otp: "847291",
      deviceDesc: "Chrome on Windows 11",
    });

    expect(html).toContain("847291");
    expect(html).toContain("Chrome on Windows 11");
    expect(html).toContain("Aman");
    expect(html).toContain("Your 6-Digit Verification Code");
  });

  test("TC_04: passwordResetEmail me resetUrl aur reset button render hona chahiye", () => {
    const html = passwordResetEmail({
      name: "Suresh",
      resetUrl: "https://userhub.com/reset-password?token=xyz",
    });

    expect(html).toContain("Suresh");
    expect(html).toContain("https://userhub.com/reset-password?token=xyz");
    expect(html).toContain("Reset Your Password");
  });

  test("TC_05: selfEmailChangeOtpEmail aur authorizeEmailChangeEmail me newEmail aur action targets render hone chahiye", () => {
    const otpEmail = selfEmailChangeOtpEmail({
      name: "Pooja",
      otp: "654321",
      newEmail: "pooja.new@gmail.com",
    });
    expect(otpEmail).toContain("654321");
    expect(otpEmail).toContain("pooja.new@gmail.com");

    const authEmail = authorizeEmailChangeEmail({
      name: "Pooja",
      currentEmail: "pooja.old@gmail.com",
      newEmail: "pooja.new@gmail.com",
      otp: "987654",
      emergencyRevokeUrl: "https://userhub.com/emergency-revoke?token=em123",
    });
    expect(authEmail).toContain("pooja.old@gmail.com");
    expect(authEmail).toContain("pooja.new@gmail.com");
    expect(authEmail).toContain("987654");
    expect(authEmail).toContain("https://userhub.com/emergency-revoke?token=em123");
  });

  test("TC_06: emergencyLockNoticeEmail me resetUrl render hona chahiye", () => {
    const html = emergencyLockNoticeEmail({
      name: "Vikram",
      resetUrl: "https://userhub.com/reset-password?token=lockReset",
    });

    expect(html).toContain("Vikram");
    expect(html).toContain("https://userhub.com/reset-password?token=lockReset");
    expect(html).toContain("Emergency Account Lockdown Activated");
  });

  test("TC_07: sessionRevocationAlertEmail aur newDeviceLoginAlertEmail security alerts sahi details render karte hain", () => {
    const revokeHtml = sessionRevocationAlertEmail({
      name: "Admin",
      loginUrl: "https://userhub.com/login",
      sessionCount: 3,
    });
    expect(revokeHtml).toContain("3 active session(s) were closed.");
    expect(revokeHtml).toContain("https://userhub.com/login");

    const deviceHtml = newDeviceLoginAlertEmail({
      name: "Dev",
      deviceDesc: "Safari on iPhone",
      currentIp: "49.36.12.8",
      securityUrl: "https://userhub.com/security",
    });
    expect(deviceHtml).toContain("Safari on iPhone");
    expect(deviceHtml).toContain("49.36.12.8");
    expect(deviceHtml).toContain("https://userhub.com/security");
  });

  test("TC_08: adminInvitationEmail aur inviteAcceptedWelcomeEmail me acceptUrl aur loginUrl render hone chahiye", () => {
    const inviteHtml = adminInvitationEmail({
      name: "New Member",
      invitedByName: "Super Admin",
      acceptUrl: "https://userhub.com/accept-invite?token=invite123",
    });
    expect(inviteHtml).toContain("https://userhub.com/accept-invite?token=invite123");
    expect(inviteHtml).toContain("Super Admin");

    const welcomeHtml = inviteAcceptedWelcomeEmail({
      name: "New Member",
      loginUrl: "https://userhub.com/login",
    });
    expect(welcomeHtml).toContain("Account Activated");
    expect(welcomeHtml).toContain("https://userhub.com/login");
  });

  test("TC_09: oldEmailChangeNoticeTemplate, adminEmailChangePendingVerificationEmail aur emailChangeSuccessTemplate templates me email updates reflect hone chahiye", () => {
    const noticeHtml = oldEmailChangeNoticeTemplate({
      name: "User1",
      oldEmail: "old@domain.com",
      newEmail: "changed@domain.com",
    });
    expect(noticeHtml).toContain("changed@domain.com");

    const pendingHtml = adminEmailChangePendingVerificationEmail({
      name: "User1",
      oldEmail: "old@domain.com",
      newEmail: "changed@domain.com",
      verifyUrl: "https://userhub.com/verify-email-change?token=ch123",
    });
    expect(pendingHtml).toContain("changed@domain.com");
    expect(pendingHtml).toContain("https://userhub.com/verify-email-change?token=ch123");

    const successHtml = emailChangeSuccessTemplate({
      name: "User1",
      newEmail: "changed@domain.com",
    });
    expect(successHtml).toContain("changed@domain.com");
  });
});
