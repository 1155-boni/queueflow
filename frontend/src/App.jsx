import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import UserDashboard from './components/UserDashboard.jsx';
import StaffDashboard from './components/StaffDashboard.jsx';
import BankDashboard from './components/BankDashboard.jsx';
import GovernmentDashboard from './components/GovernmentDashboard.jsx';
import HospitalDashboard from './components/HospitalDashboard.jsx';
import Settings from './components/Settings.jsx';

// Configure axios to send credentials with all requests
axios.defaults.withCredentials = true;

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if we have access token in cookies
        const accessToken = document.cookie.split(';').find(c => c.trim().startsWith('access_token='));
        if (!accessToken) {
          setUser(null);
          setView('login');
          return;
        }

        // Try to get user profile or make authenticated request
        const response = await axios.get('http://localhost:8000/api/auth/profile/', { withCredentials: true });
        setUser(response.data);
        setView('dashboard');
      } catch (error) {
        // If token is invalid or expired, try to refresh
        try {
          await axios.post('http://localhost:8000/api/auth/refresh/', {}, { withCredentials: true });
          // If refresh successful, retry the profile request
          const response = await axios.get('http://localhost:8000/api/auth/profile/', { withCredentials: true });
          setUser(response.data);
          setView('dashboard');
        } catch (refreshError) {
          // If refresh fails, user is not authenticated
          setUser(null);
          setView('login');
        }
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setView('dashboard');
  };

  const handleRegister = (userData) => {
    setUser(userData);
    setView('dashboard');
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:8000/api/auth/logout/', {}, { withCredentials: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    setView('login');
  };

  const handleDeleteAccount = () => {
    setUser(null);
    setView('login');
  };

  const handleSettings = () => {
    setView('settings');
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
  };

  return (
    <div className="App">
      <header>
        <h1>LineHub - The Hub of Effortless Service</h1>
        {user && (
          <nav>
            <span>Welcome, {user.username}</span>
            <button onClick={handleSettings} className="settings-btn">Settings</button>
          </nav>
        )}
      </header>
      <main>
        {!user ? (
          view === 'login' ? (
            <Login onLogin={handleLogin} onSwitchToRegister={() => setView('register')} />
          ) : (
            <Register onRegister={handleRegister} onSwitchToLogin={() => setView('login')} />
          )
        ) : view === 'settings' ? (
          <Settings user={user} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} onBackToDashboard={handleBackToDashboard} />
        ) : (
          <div>
            {user.role === 'customer' ? (
              <UserDashboard user={user} />
            ) : user.organization_type === 'bank' ? (
              <BankDashboard user={user} />
            ) : user.organization_type === 'government' ? (
              <GovernmentDashboard user={user} />
            ) : user.organization_type === 'hospital' ? (
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
