// frontend/src/config.ts
export const getApiUrl = () => {
  //return "http://localhost:5000";
  if (import.meta.env.DEV) {
    return "http://localhost:5000";
  }
  // Replace this with your actual Render backend URL
  return "https://voterz-pyg4.onrender.com";
};

export const API_URL = getApiUrl();
