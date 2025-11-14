import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const Settings = ({ user, onLogout, onDeleteAccount, onBackToDashboard }) => {
  const { t, i18n } = useTranslation();
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
    const selectedLanguage = e.target.value;
    setLanguage(selectedLanguage);
    localStorage.setItem('language', selectedLanguage);
    i18n.changeLanguage(selectedLanguage);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm(t('settings.confirmDelete'))) {
      try {
        await axios.delete('http://localhost:8000/api/auth/delete-user/');
        onDeleteAccount();
      } catch (err) {
        console.error(err);
        // Show error message instead of alert
        console.error(t('messages.deleteAccountError'));
      }
    }
  };

  return (
    <div className="settings">
      <h2>{t('settings.title')}</h2>
      <div className="setting-group">
        <button onClick={onBackToDashboard} className="btn-primary">{t('settings.backToDashboard')}</button>
      </div>
      <div className="setting-group">
        <label htmlFor="theme">{t('settings.theme')}:</label>
        <select id="theme" value={theme} onChange={handleThemeChange}>
          <option value="light">{t('settings.light')}</option>
          <option value="dark">{t('settings.dark')}</option>
        </select>
      </div>
      <div className="setting-group">
        <label htmlFor="language">{t('settings.language')}:</label>
        <select id="language" value={language} onChange={handleLanguageChange}>
          <option value="en">{t('settings.english')}</option>
          <option value="es">{t('settings.spanish')}</option>
          <option value="fr">{t('settings.french')}</option>
          <option value="sw">{t('settings.swahili')}</option>
        </select>
      </div>
      <div className="setting-group">
        <button onClick={onLogout} className="btn-logout">{t('settings.logout')}</button>
      </div>
      <div className="setting-group">
        <button onClick={handleDeleteAccount} className="btn-delete">{t('settings.deleteAccount')}</button>
      </div>
    </div>
  );
};

export default Settings;
