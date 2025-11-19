import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";

const Login = ({ onLogin, onSwitchToRegister }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8000/api/auth/login/",
        {
          username,
          password,
        },
        { withCredentials: true }
      );
      onLogin(response.data.user);
    } catch (err) {
      setError(
        err.response?.data?.non_field_errors?.[0] || "Invalid credentials"
      );
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <div className="form-icon-left">💻</div>
        <h2 className="form-title">{t("login.title")}</h2>
        <div className="form-icon-right">▶</div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">{t("login.username")}</label>
          <input
            id="username"
            type="text"
            placeholder={`Enter ${t("login.username").toLowerCase()}`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">{t("login.password")}</label>
          <input
            id="password"
            type="password"
            placeholder={`Enter ${t("login.password").toLowerCase()}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">{t("login.submit")}</button>
        <a href="#" className="forgot-link">
          {t("login.forgotPassword")}
        </a>
      </form>
      {error && <p className="error">{error}</p>}
      <div className="switch-form">
        <p>
          {t("login.noAccount")}{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onSwitchToRegister();
            }}
          >
            {t("login.signUp")}
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
