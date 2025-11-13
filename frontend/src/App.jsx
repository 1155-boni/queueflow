import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import UserDashboard from './components/UserDashboard.jsx';
import StaffDashboard from './components/StaffDashboard.jsx';
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
        // Try to make a simple authenticated request to check if user is logged in
        await axios.get('http://localhost:8000/api/queues/service-points/');
        // If successful, user is authenticated, but we don't have user data
        // This is a problem - we need to get user data or redirect to login
        setUser(null); // Force login since we don't have user data
        setView('login');
      } catch (error) {
        // If 401, user is not authenticated
        setUser(null);
        setView('login');
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
        <h1>KCB QueueFlow - The Pride of Africa</h1>
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
