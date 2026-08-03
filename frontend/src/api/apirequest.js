import { toast } from "react-toastify";

const apirequest = async (url, options = {}) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}${url}`,
      options
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
        message: "Unable to connect to the server. Please try again in a few moments.",
        isNetworkError: true,
      };
      toast.error(networkError.message, { toastId: "server-unreachable" });
      throw networkError;
    }
    throw error;
  }
};

export default apirequest;