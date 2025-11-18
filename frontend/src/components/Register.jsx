import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const Register = ({ onRegister, onSwitchToLogin }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [organizationType, setOrganizationType] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/auth/register/', {
        username,
        email,
        password,
        role,
        organization_type: role === 'staff' ? organizationType : undefined,
      });
      onRegister(response.data.user);
    } catch (err) {
      setError(err.response?.data?.username?.[0] || err.response?.data?.non_field_errors?.[0] || 'Registration failed');
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <div className="form-icon-left">👤</div>
        <h2 className="form-title">{t('register.title')}</h2>
        <div className="form-icon-right">▶</div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">{t('register.username')}</label>
          <input
            id="username"
            type="text"
            placeholder={`Enter ${t('register.username').toLowerCase()}`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">{t('register.email')}</label>
          <input
            id="email"
            type="email"
            placeholder={`Enter ${t('register.email').toLowerCase()}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">{t('register.password')}</label>
          <input
            id="password"
            type="password"
            placeholder={`Enter ${t('register.password').toLowerCase()}`}
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
        {role === 'staff' && (
          <div className="form-group">
            <label htmlFor="organizationType">Organization Type</label>
            <select id="organizationType" value={organizationType} onChange={(e) => setOrganizationType(e.target.value)} required>
              <option value="">Select Organization Type</option>
              <option value="bank">Bank</option>
              <option value="government">Government Official</option>
              <option value="hospital">Hospital</option>
            </select>
          </div>
        )}
        <button type="submit">{t('register.submit')}</button>
      </form>
      {error && <p className="error">{error}</p>}
      <div className="switch-form">
        <p>{t('register.haveAccount')} <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>{t('register.login')}</a></p>
      </div>
    </div>
  );
};

export default Register;
