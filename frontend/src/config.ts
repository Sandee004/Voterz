// frontend/src/config.ts
export const getApiUrl = () => {
  if (import.meta.env.DEV) {
    return "http://localhost:5000";
  }
  // Replace this with your actual Render backend URL
  return "https://hosting-jjjg.onrender.com";
};

export const API_URL = getApiUrl();
