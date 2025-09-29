import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Settings = ({ user, onLogout, onDeleteAccount, onBackToDashboard }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    localStorage.setItem('language', e.target.value);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await axios.delete('http://localhost:8000/api/auth/delete-user/', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        onDeleteAccount();
      } catch (err) {
        console.error(err);
        alert('Failed to delete account.');
      }
    }
  };

  return (
    <div className="settings">
      <h2>Settings</h2>
      <div className="setting-group">
        <button onClick={onBackToDashboard} className="btn-primary">Back to Dashboard</button>
      </div>
      <div className="setting-group">
        <label htmlFor="theme">Theme:</label>
        <select id="theme" value={theme} onChange={handleThemeChange}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div className="setting-group">
        <label htmlFor="language">Language:</label>
        <select id="language" value={language} onChange={handleLanguageChange}>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>
      </div>
      <div className="setting-group">
        <button onClick={onLogout} className="btn-logout">Logout</button>
      </div>
      <div className="setting-group">
        <button onClick={handleDeleteAccount} className="btn-delete">Delete Account</button>
      </div>
    </div>
  );
};

export default Settings;
