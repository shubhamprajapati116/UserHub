const mockSendMail = jest.fn();

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
  })),
}));

const sendEmail = require("../../../utils/sendEmail");

describe("sendEmail Utility Unit Tests (utils/sendEmail.js)", () => {
  let originalEnv;
  let consoleErrorSpy;
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = { ...process.env };
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  test("TC_01: EMAIL_USER ya EMAIL_PASS missing hone par error log karke safely return hona chahiye", async () => {
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;

    const res = await sendEmail(
      "test@example.com",
      "Test Subject",
      "<p>Hello</p>",
    );

    expect(res).toBeUndefined();
    expect(mockSendMail).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "EMAIL_USER or EMAIL_PASS not configured in .env",
      ),
    );
  });

  test("TC_02: Valid credentials hone par transporter.sendMail call hona chahiye aur info return hona chahiye", async () => {
    process.env.EMAIL_USER = "userhub.system@gmail.com";
    process.env.EMAIL_PASS = "app_secret_pass";

    const fakeInfo = { messageId: "<msg-12345@gmail.com>" };
    mockSendMail.mockResolvedValue(fakeInfo);

    const res = await sendEmail(
      "recipient@domain.com",
      "Welcome to UserHub",
      "<h1>Welcome</h1>",
    );

    expect(mockSendMail).toHaveBeenCalledWith({
      from: '"UserHub" <userhub.system@gmail.com>',
      to: "recipient@domain.com",
      subject: "Welcome to UserHub",
      html: "<h1>Welcome</h1>",
    });
    expect(res).toEqual(fakeInfo);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Email Sent"),
    );
  });

  test("TC_03: transporter.sendMail fail hone par error log hona chahiye aur error throw hona chahiye", async () => {
    process.env.EMAIL_USER = "userhub.system@gmail.com";
    process.env.EMAIL_PASS = "app_secret_pass";

    mockSendMail.mockRejectedValue(new Error("SMTP server connection timeout"));

    await expect(
      sendEmail("fail@domain.com", "Subject", "<p>Content</p>"),
    ).rejects.toThrow("SMTP server connection timeout");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("sendEmail Failed for fail@domain.com"),
      "SMTP server connection timeout",
    );
  });
});
