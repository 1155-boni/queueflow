import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App.jsx';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import axios from 'axios';

// Configure axios to send credentials with requests
axios.defaults.withCredentials = true;

// Add response interceptor to handle token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post('http://localhost:8000/api/auth/refresh/');
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear local storage and redirect to login
        console.error('Token refresh failed:', refreshError);
        // Clear any local state and redirect to login
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/'; // Redirect to root which should show login
      }
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </React.StrictMode>
);
