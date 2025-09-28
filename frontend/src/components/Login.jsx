import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin, onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login/', {
        username,
        password,
      });
      localStorage.setItem('token', response.data.access);
      onLogin(response.data.user);
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Invalid credentials');
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <div className="form-icon-left">💻</div>
        <h2 className="form-title">Member Login</h2>
        <div className="form-icon-right">▶</div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
        <a href="#" className="forgot-link">Forgot Login/Password?</a>
      </form>
      {error && <p className="error">{error}</p>}
      <div className="switch-form">
        <p>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToRegister(); }}>Create your account</a></p>
      </div>
    </div>
  );
};

export default Login;
