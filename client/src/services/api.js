
import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "";

    if (
      status === 401 &&
      (
        message.toLowerCase().includes("token") ||
        message.toLowerCase().includes("authorized") ||
        message.toLowerCase().includes("authentication") ||
        message.toLowerCase().includes("session")
      )
    ) {
      localStorage.removeItem("token");

      const currentPath = window.location.pathname;

      const authPages = [
        "/",
        "/login",
        "/forgot-password",
        "/reset-password",
        "/signup",
      ];

      const isAuthPage =
        authPages.includes(currentPath) ||
        currentPath.startsWith("/reset-password/");

      if (!isAuthPage) {
        const redirectPath =
          `${currentPath}${window.location.search}`;

        window.location.href =
          `/?sessionExpired=true&redirect=${encodeURIComponent(
            redirectPath
          )}`;
      }
    }

    return Promise.reject(error);
  }
);

export default api;