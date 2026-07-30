/* eslint-disable no-useless-assignment */
const apirequest = async (url, options = {}) => {
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
};

export default apirequest;