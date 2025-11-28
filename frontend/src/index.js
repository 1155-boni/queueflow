import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./i18n";
import App from "./App.jsx";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import axios from "axios";
import API_BASE_URL from "./config";


// Configure axios to send credentials with requests
axios.defaults.withCredentials = true;

// Add response interceptor to handle token refresh on 401
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        await axios.post(`${API_BASE_URL}/api/auth/refresh/`);
        // Retry the original request
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login or handle logout
        console.error('Token refresh failed:', refreshError);
        // Optionally, you can emit an event or call a logout function here
        // For now, just reject the error
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </React.StrictMode>
);
