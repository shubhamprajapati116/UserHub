import { toast } from "react-toastify";

const apirequest = async (url, options = {}) => {
  try {
    const headers = { ...(options.headers || {}) };
    const hasContentType = Object.keys(headers).some(
      (k) => k.toLowerCase() === "content-type",
    );
    if (
      !hasContentType &&
      options.body &&
      typeof options.body === "string" &&
      !(options.body instanceof FormData)
    ) {
      headers["Content-Type"] = "application/json";
    }

    const token = localStorage.getItem("token");
    if (token && !headers.Authorization && !headers.authorization) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const deviceId = localStorage.getItem("deviceId");
    if (deviceId && !headers["x-device-id"] && !headers["X-Device-Id"]) {
      headers["x-device-id"] = deviceId;
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}${url}`,
      {
        ...options,
        headers,
      },
    );

    const text = await response.text();

    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {
        message: "Invalid server response",
      };
    }
    if (response.status === 401) {
      const publicPaths = [
        "/login",
        "/register",
        "/forgotpassword",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/accept-invite",
      ];
      const isPublicPath =
        window.location.pathname === "/" ||
        publicPaths.some((p) => window.location.pathname.startsWith(p));
      const isPublicApi =
        url.includes("/login") ||
        url.includes("/register") ||
        url.includes("/check-email") ||
        url.includes("/invite");

      if (!isPublicApi && !data?.field) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        if (!isPublicPath) {
          toast.error(data?.message || "Session expired. Please login again.", {
            toastId: "session-expired",
          });

          setTimeout(() => {
            window.location.href = "/login";
          }, 1000);
        }
      }
    }

    if (!response.ok) {
      throw data;
    }

    return data;
  } catch (error) {
    if (
      error instanceof TypeError ||
      error.name === "TypeError" ||
      error?.message === "Failed to fetch" ||
      error?.message?.includes("fetch")
    ) {
      const networkError = {
        message:
          "Unable to connect to the server. Please try again in a few moments.",
        isNetworkError: true,
      };
      toast.error(networkError.message, { toastId: "server-unreachable" });
      throw networkError;
    }
    throw error;
  }
};

export default apirequest;
