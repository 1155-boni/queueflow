import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import API_BASE_URL from "./config";
import LandingPage from "./components/LandingPage.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import UserDashboard from "./components/UserDashboard.jsx";
import StaffDashboard from "./components/StaffDashboard.jsx";
import BankDashboard from "./components/BankDashboard.jsx";
import GovernmentDashboard from "./components/GovernmentDashboard.jsx";
import HospitalDashboard from "./components/HospitalDashboard.jsx";
import Settings from "./components/Settings.jsx";

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;

// Axios interceptor for handling 401 errors by refreshing tokens via cookies
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh the token (backend handles cookies)
        await axios.post(`${API_BASE_URL}/api/auth/refresh/`);
        // Retry the original request
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("landing");
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  // Apply dark mode on mount and when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Try to get user profile - if access token is valid, it will succeed
        const response = await axios.get(`${API_BASE_URL}/api/auth/profile/`);
        setUser(response.data);
        setView("dashboard");
      } catch (error) {
        // If token is invalid or expired, try to refresh
        try {
          await axios.post(`${API_BASE_URL}/api/auth/refresh/`);
          // If refresh successful, retry the profile request
          const response = await axios.get(`${API_BASE_URL}/api/auth/profile/`);
          setUser(response.data);
          setView("dashboard");
        } catch (refreshError) {
          // If refresh fails, user is not authenticated - keep landing page
          setUser(null);
          // Keep landing page as default view
        }
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setView("dashboard");
  };

  const handleRegister = (userData) => {
    setUser(userData);
    setView("dashboard");
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout/`);
      setUser(null);
      setView("landing");
    } catch (err) {
      console.error("Logout error:", err);
      setUser(null);
      setView("landing");
    }
  };

  const handleDeleteAccount = () => {
    setUser(null);
    setView("landing");
  };

  const handleSettings = () => {
    setView("settings");
  };

  const handleBackToDashboard = () => {
    setView("dashboard");
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="App">
      <header>
        <h1>LineHub - The Hub of Effortless Service</h1>
        {user && (
          <nav>
            <span>Welcome, {user.username}</span>
            <button onClick={handleSettings} className="settings-btn">
              Settings
            </button>
          </nav>
        )}
      </header>
      <main>
        {!user ? (
          view === "landing" ? (
            <LandingPage
              onSwitchToLogin={() => setView("login")}
              onSwitchToRegister={() => setView("register")}
            />
          ) : view === "login" ? (
            <Login
              onLogin={handleLogin}
              onSwitchToRegister={() => setView("register")}
            />
          ) : (
            <Register
              onRegister={handleRegister}
              onSwitchToLogin={() => setView("login")}
            />
          )
        ) : view === "settings" ? (
          <Settings
            user={user}
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteAccount}
            onBackToDashboard={handleBackToDashboard}
          />
        ) : (
          <div>
            {user.role === "customer" ? (
              <UserDashboard user={user} />
            ) : user.organization_type === "bank" ? (
              <BankDashboard user={user} />
            ) : user.organization_type === "government" ? (
              <GovernmentDashboard user={user} />
            ) : user.organization_type === "hospital" ? (
              <HospitalDashboard user={user} />
            ) : (
              <StaffDashboard user={user} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
