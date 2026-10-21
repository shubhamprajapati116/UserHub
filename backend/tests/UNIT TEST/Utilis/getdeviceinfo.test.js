const getDeviceInfo = require("../../../utils/getDeviceInfo");

describe("getDeviceInfo Utility Unit Tests", () => {
  test("TC_01: Windows Chrome Desktop user-agent sahi parse hona chahiye", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    const info = getDeviceInfo(ua);

    expect(info).toEqual({
      browser: "Chrome",
      os: "Windows",
      device: "Desktop",
    });
  });

  test("TC_02: Linux Firefox Desktop user-agent sahi parse hona chahiye", () => {
    const ua =
      "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0";

    const info = getDeviceInfo(ua);

    expect(info.browser).toBe("Firefox");
    expect(info.os).toBe("Ubuntu");
    expect(info.device).toBe("Desktop");
  });

  test("TC_03: Windows Microsoft Edge user-agent sahi parse hona chahiye", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";

    const info = getDeviceInfo(ua);

    expect(info).toEqual({
      browser: "Edge",
      os: "Windows",
      device: "Desktop",
    });
  });

  test("TC_04: Android Mobile Chrome user-agent par device 'mobile' aana chahiye", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36";

    const info = getDeviceInfo(ua);

    expect(info.browser).toContain("Chrome");
    expect(info.os).toBe("Android");
    expect(info.device).toBe("mobile");
  });

  test("TC_05: iPhone (iOS) Safari user-agent par os 'iOS' aur device 'mobile' aana chahiye", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1";

    const info = getDeviceInfo(ua);

    expect(info.browser).toBe("Mobile Safari");
    expect(info.os).toBe("iOS");
    expect(info.device).toBe("mobile");
  });

  test("TC_06: iPad user-agent par device 'tablet' aana chahiye", () => {
    const ua =
      "Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1";

    const info = getDeviceInfo(ua);

    expect(info.os).toBe("iOS");
    expect(info.device).toBe("tablet");
  });

  test("TC_07: macOS Safari user-agent par browser 'Safari' aur os 'macOS' aana chahiye", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

    const info = getDeviceInfo(ua);

    expect(info.browser).toBe("Safari");
    expect(info.os).toBe("macOS");
    expect(info.device).toBe("Macintosh");
  });

  test("TC_08: Empty string ('') pass karne par default fallback values aani chahiye", () => {
    const info = getDeviceInfo("");

    expect(info).toEqual({
      browser: "Unknown Browser",
      os: "Unknown OS",
      device: "Desktop",
    });
  });

  test("TC_09: undefined pass karne par bina crash huye fallback values dena chahiye", () => {
    const info = getDeviceInfo(undefined);

    expect(info).toHaveProperty("browser");
    expect(info).toHaveProperty("os");
    expect(info).toHaveProperty("device");
  });

  test("TC_10: null pass karne par fallback values aani chahiye", () => {
    const info = getDeviceInfo(null);

    expect(info).toEqual({
      browser: "Unknown Browser",
      os: "Unknown OS",
      device: "Desktop",
    });
  });

  test("TC_11: Unrecognized / Custom API client (jaise Postman) par fallback values aani chahiye", () => {
    const info = getDeviceInfo("PostmanRuntime/7.32.3");

    expect(info).toEqual({
      browser: "Unknown Browser",
      os: "Unknown OS",
      device: "Desktop",
    });
  });
});
