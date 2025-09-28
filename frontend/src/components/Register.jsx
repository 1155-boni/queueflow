import React, { useState } from 'react';
import axios from 'axios';

const Register = ({ onRegister, onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/auth/register/', {
        username,
        email,
        password,
        role,
      });
      localStorage.setItem('token', response.data.access);
      onRegister(response.data.user);
    } catch (err) {
      setError(err.response?.data?.username?.[0] || err.response?.data?.non_field_errors?.[0] || 'Registration failed');
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <div className="form-icon-left">👤</div>
        <h2 className="form-title">Sign Up</h2>
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
          <label htmlFor="email">Email (optional)</label>
          <input
            id="email"
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
        <div className="form-group">
          <label htmlFor="role">Role</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="customer">Customer</option>
            <option value="staff">Staff</option>
          </select>
        </div>
        <button type="submit">Register</button>
      </form>
      {error && <p className="error">{error}</p>}
      <div className="switch-form">
        <p>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>Login here</a></p>
      </div>
    </div>
  );
};

export default Register;
