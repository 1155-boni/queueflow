import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import UserDashboard from './components/UserDashboard';
import StaffDashboard from './components/StaffDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleRegister = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setView('login');
  };

  return (
    <div className="App">
      {!user ? (
        <div>
          {view === 'login' ? (
            <Login onLogin={handleLogin} />
          ) : (
            <Register onRegister={handleRegister} />
          )}
          <button onClick={() => setView(view === 'login' ? 'register' : 'login')}>
            Switch to {view === 'login' ? 'Register' : 'Login'}
          </button>
        </div>
      ) : (
        <div>
          <button onClick={handleLogout}>Logout</button>
          {user.role === 'customer' ? (
            <UserDashboard user={user} />
          ) : (
            <StaffDashboard user={user} />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
