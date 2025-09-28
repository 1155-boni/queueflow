import React, { useState } from 'react';
import './App.css';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import UserDashboard from './components/UserDashboard.jsx';
import StaffDashboard from './components/StaffDashboard.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');

  const handleLogin = (userData) => {
    setUser(userData);
    setView('dashboard');
  };

  const handleRegister = (userData) => {
    setUser(userData);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setView('login');
  };

  return (
    <div className="App">
      <header>
        <h1>QueueFlow</h1>
        {user && (
          <nav>
            <span>Welcome, {user.username}</span>
            <button onClick={handleLogout} className="logout">Logout</button>
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
