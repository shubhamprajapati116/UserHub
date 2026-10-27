jest.mock("../../../models/notification");

const Notification = require("../../../models/notification");
const createNotification = require("../../../utils/createNotification");

describe("createNotification Utility Unit Tests (utils/createNotification.js)", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("TC_01: userId missing hone par null return hona chahiye aur Notification.create call nahi hona chahiye", async () => {
    const res = await createNotification({
      type: "security_alert",
      message: "Password changed",
    });

    expect(res).toBeNull();
    expect(Notification.create).not.toHaveBeenCalled();
  });

  test("TC_02: type missing hone par null return hona chahiye", async () => {
    const res = await createNotification({
      userId: "usr_123",
      message: "Password changed",
    });

    expect(res).toBeNull();
    expect(Notification.create).not.toHaveBeenCalled();
  });
  
  test("TC_03: message missing hone par null return hona chahiye", async () => {
    const res = await createNotification({
      userId: "usr_123",
      type: "security_alert",
    });

    expect(res).toBeNull();
    expect(Notification.create).not.toHaveBeenCalled();
  });

  test("TC_04: Valid payload with custom title aur metadata hone par notification create hokar return hona chahiye", async () => {
    const fakeCreatedDoc = {
      _id: "notif_999",
      userId: "usr_123",
      type: "login_alert",
      title: "New Device Login",
      message: "Chrome on Windows logged into your account.",
      metadata: { ip: "192.168.1.1" },
    };

    Notification.create.mockResolvedValue(fakeCreatedDoc);

    const res = await createNotification({
      userId: "usr_123",
      type: "login_alert",
      title: "New Device Login",
      message: "Chrome on Windows logged into your account.",
      metadata: { ip: "192.168.1.1" },
    });

    expect(Notification.create).toHaveBeenCalledWith({
      userId: "usr_123",
      type: "login_alert",
      title: "New Device Login",
      message: "Chrome on Windows logged into your account.",
      metadata: { ip: "192.168.1.1" },
    });
    expect(res).toEqual(fakeCreatedDoc);
  });

 test("TC_05: Title na provide karne par default 'Notification' set hona chahiye aur default metadata {} hona chahiye", async () => {
    Notification.create.mockResolvedValue({ _id: "notif_default" });

    await createNotification({
      userId: "usr_456",
      type: "system_info",
      message: "Maintenance scheduled.",
    });

    await createNotification({
      userId: "usr_456",
      type: "system_info",
      message: "Maintenance scheduled.",
    });
    expect(Notification.create).toHaveBeenCalledWith({
      userId: "usr_456",
      type: "system_info",
      title: "Notification",
      message: "Maintenance scheduled.",
      metadata: {},
    });
  });

  test("TC_06: Database create query fail hone par error catch hona chahiye, console.error call hona chahiye aur null return hona chahiye", async () => {
    Notification.create.mockRejectedValue(
      new Error("Mongo connection dropped"),
    );

    const res = await createNotification({
      userId: "usr_123",
      type: "alert",
      message: "Test message",
    });

    expect(res).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "❌ Failed to create in-app notification:",
      "Mongo connection dropped",
    );
  });
});
